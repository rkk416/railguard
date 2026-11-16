"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { BrowserQRCodeReader, BrowserCodeReader, IScannerControls } from "@zxing/browser";
import { parseQrContent } from "@/lib/qr/parser";
import {
  Camera,
  X,
  FlipHorizontal,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Lock,
  Keyboard,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

export interface CameraQrScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (identifier: string) => void;
  title?: string;
  description?: string;
}

type CameraErrorCode =
  | "PERMISSION_DENIED"
  | "NOT_FOUND"
  | "IN_USE"
  | "INSECURE_CONTEXT"
  | "UNSUPPORTED"
  | "UNKNOWN";

export function CameraQrScanner({
  isOpen,
  onClose,
  onScanSuccess,
  title = "Railway Packaging Scanner",
  description = "Align packaging QR code or batch token within the inspection frame",
}: CameraQrScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
  const isProcessingRef = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [errorCode, setErrorCode] = useState<CameraErrorCode | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scannedIdentifier, setScannedIdentifier] = useState<string | null>(null);

  // Device switching state
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceIndex, setActiveDeviceIndex] = useState(0);

  // Manual fallback state
  const [showManualFallback, setShowManualFallback] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);

  // Complete teardown of all media tracks & scanner controls
  const stopAllCameraTracks = useCallback(() => {
    if (controlsRef.current) {
      try {
        controlsRef.current.stop();
      } catch (err) {
        console.warn("[CameraQrScanner] controls.stop error:", err);
      }
      controlsRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (err) {
          console.warn("[CameraQrScanner] track.stop error:", err);
        }
      });
      videoRef.current.srcObject = null;
    }
  }, []);

  // Initialize camera and start scanning loop
  const startScanner = useCallback(
    async (deviceId?: string) => {
      stopAllCameraTracks();
      setIsLoading(true);
      setErrorCode(null);
      setErrorMessage(null);
      setWarningMsg(null);
      setScanSuccess(false);
      setScannedIdentifier(null);
      isProcessingRef.current = false;

      // 1. Security Context Validation
      if (typeof window !== "undefined" && !window.isSecureContext && window.location.hostname !== "localhost") {
        setIsLoading(false);
        setErrorCode("INSECURE_CONTEXT");
        setErrorMessage("Camera access requires a secure HTTPS connection.");
        return;
      }

      // 2. Hardware API Support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setIsLoading(false);
        setErrorCode("UNSUPPORTED");
        setErrorMessage("Your browser does not support camera media streaming. Please use manual entry.");
        return;
      }

      if (!videoRef.current) {
        setIsLoading(false);
        return;
      }

      try {
        if (!codeReaderRef.current) {
          codeReaderRef.current = new BrowserQRCodeReader();
        }

        // Enumerate video devices if not already retrieved
        try {
          const devices = await BrowserCodeReader.listVideoInputDevices();
          setVideoDevices(devices);
        } catch {
          // Device enumeration failure is non-fatal
        }

        // Constraints: Prefer environment-facing mobile camera
        const constraints: MediaStreamConstraints = deviceId
          ? {
              audio: false,
              video: {
                deviceId: { exact: deviceId },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
            }
          : {
              audio: false,
              video: {
                facingMode: { ideal: "environment" },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
            };

        // Start scanning
        const controls = await codeReaderRef.current.decodeFromConstraints(
          constraints,
          videoRef.current,
          (result, error) => {
            if (result && !isProcessingRef.current) {
              const text = result.getText();
              const parsed = parseQrContent(text);

              if (parsed.valid && parsed.identifier) {
                // Prevent duplicate trigger events
                isProcessingRef.current = true;
                setScanSuccess(true);
                setScannedIdentifier(parsed.identifier);

                // Stop camera stream immediately
                stopAllCameraTracks();

                // Brief visual confirmation before passing to caller
                setTimeout(() => {
                  onScanSuccess(parsed.identifier!);
                  onClose();
                }, 500);
              } else {
                setWarningMsg(parsed.error || "Unrecognized QR code format.");
                // Clear warning after 2.5s
                setTimeout(() => setWarningMsg(null), 2500);
              }
            }

            // Note: error callback continuously reports NotFoundException while looking for QR, which is normal.
            if (error && error.name !== "NotFoundException") {
              // Non-critical decoding error ignored while frame scanning continues
            }
          }
        );

        controlsRef.current = controls;
        setIsLoading(false);
      } catch (err: unknown) {
        setIsLoading(false);
        const error = err as Error;
        const name = error.name || "";

        if (name === "NotAllowedError" || name === "PermissionDeniedError") {
          setErrorCode("PERMISSION_DENIED");
          setErrorMessage(
            "Camera permission was denied. Please allow camera access in your browser settings to scan packaging QR codes."
          );
        } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
          setErrorCode("NOT_FOUND");
          setErrorMessage("No camera hardware detected on this device. Please use manual identifier entry.");
        } else if (name === "NotReadableError" || name === "TrackStartError") {
          setErrorCode("IN_USE");
          setErrorMessage("Camera is currently in use by another application or browser tab.");
        } else {
          setErrorCode("UNKNOWN");
          setErrorMessage(error.message || "Failed to initialize device camera.");
        }
      }
    },
    [onClose, onScanSuccess, stopAllCameraTracks]
  );

  // Switch between available cameras (e.g. front / back)
  const handleFlipCamera = () => {
    if (videoDevices.length < 2) return;
    const nextIndex = (activeDeviceIndex + 1) % videoDevices.length;
    setActiveDeviceIndex(nextIndex);
    const nextDevice = videoDevices[nextIndex];
    startScanner(nextDevice.deviceId);
  };

  // Handle manual input submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);

    const parsed = parseQrContent(manualInput);
    if (!parsed.valid || !parsed.identifier) {
      setManualError(parsed.error || "Please enter a valid packaging QR identifier.");
      return;
    }

    stopAllCameraTracks();
    onScanSuccess(parsed.identifier);
    onClose();
  };

  // Lifecycle control: Start on open, stop on close / unmount
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isOpen) {
      timer = setTimeout(() => {
        startScanner();
      }, 0);
    } else {
      stopAllCameraTracks();
    }

    return () => {
      if (timer) clearTimeout(timer);
      stopAllCameraTracks();
    };
  }, [isOpen, startScanner, stopAllCameraTracks]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-scanner-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-lg rounded-xl overflow-hidden border shadow-2xl flex flex-col"
        style={{
          backgroundColor: "var(--rail-ink)",
          borderColor: "rgba(240, 237, 228, 0.2)",
          color: "var(--archive-paper)",
        }}
      >
        {/* Modal Header */}
        <div
          className="p-4 border-b flex items-center justify-between"
          style={{ borderColor: "rgba(240, 237, 228, 0.12)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded border"
              style={{
                backgroundColor: "rgba(82, 124, 114, 0.25)",
                borderColor: "rgba(82, 124, 114, 0.5)",
                color: "var(--jade)",
              }}
            >
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="qr-scanner-title"
                className="text-sm font-bold tracking-wide"
                style={{ color: "var(--archive-paper)" }}
              >
                {title}
              </h2>
              <p
                className="text-[10px] font-mono uppercase tracking-wider"
                style={{ color: "var(--brass)" }}
              >
                Optical Register Verification
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {videoDevices.length > 1 && !errorCode && !showManualFallback && (
              <button
                type="button"
                onClick={handleFlipCamera}
                className="p-1.5 rounded border text-xs flex items-center gap-1 transition-colors hover:bg-white/10"
                style={{
                  borderColor: "rgba(240, 237, 228, 0.15)",
                  color: "var(--archive-paper)",
                }}
                title="Switch camera device"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[10px] font-mono">Flip</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                stopAllCameraTracks();
                onClose();
              }}
              className="p-1.5 rounded text-slate-400 hover:text-white transition-colors"
              aria-label="Close QR scanner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewfinder / Main Scanning Area */}
        <div className="relative p-4 sm:p-6 flex flex-col items-center">
          <p
            className="text-xs text-center mb-3 text-slate-300 max-w-sm"
            style={{ color: "rgba(240, 237, 228, 0.75)" }}
          >
            {description}
          </p>

          {!showManualFallback ? (
            <div
              className="relative w-full aspect-square max-w-[320px] rounded-lg overflow-hidden bg-black border flex items-center justify-center"
              style={{ borderColor: "rgba(240, 237, 228, 0.2)" }}
            >
              {/* Active Video Element */}
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  isLoading || errorCode || scanSuccess ? "opacity-30" : "opacity-100"
                }`}
              />

              {/* Viewfinder Target Frame (when active) */}
              {!isLoading && !errorCode && !scanSuccess && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                  <div
                    className="relative w-full h-full border border-dashed rounded-md flex items-center justify-center"
                    style={{ borderColor: "rgba(82, 124, 114, 0.8)" }}
                  >
                    {/* Viewfinder Corner Brackets */}
                    <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400 -mt-0.5 -ml-0.5" />
                    <span className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400 -mt-0.5 -mr-0.5" />
                    <span className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400 -mb-0.5 -ml-0.5" />
                    <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400 -mb-0.5 -mr-0.5" />

                    {/* Animated Scanning Line (supports prefers-reduced-motion) */}
                    <div
                      className="absolute left-2 right-2 h-0.5 bg-emerald-400/90 shadow-[0_0_8px_#34d399] animate-pulse motion-reduce:animate-none"
                      style={{ animationDuration: "2s" }}
                    />
                  </div>
                </div>
              )}

              {/* Loading State Overlay */}
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-black/60">
                  <Loader2 className="w-7 h-7 text-emerald-400 animate-spin mb-2" />
                  <span className="text-xs font-mono text-slate-200">
                    Initializing camera stream...
                  </span>
                </div>
              )}

              {/* Success State Overlay */}
              {scanSuccess && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-emerald-950/80 backdrop-blur-xs animate-in zoom-in-95 duration-200">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mb-2" />
                  <span className="text-sm font-bold text-white">QR Code Recognized</span>
                  <span className="text-xs font-mono text-emerald-200 mt-1 truncate max-w-[260px]">
                    {scannedIdentifier}
                  </span>
                </div>
              )}

              {/* Error State Overlay */}
              {errorCode && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/90">
                  {errorCode === "PERMISSION_DENIED" ? (
                    <Lock className="w-10 h-10 text-amber-400 mb-2" />
                  ) : errorCode === "INSECURE_CONTEXT" ? (
                    <ShieldAlert className="w-10 h-10 text-rose-400 mb-2" />
                  ) : (
                    <AlertTriangle className="w-10 h-10 text-rose-400 mb-2" />
                  )}
                  <div className="text-xs font-bold text-white mb-1">
                    {errorCode === "PERMISSION_DENIED"
                      ? "Camera Permission Required"
                      : errorCode === "NOT_FOUND"
                      ? "No Camera Detected"
                      : errorCode === "IN_USE"
                      ? "Camera In Use"
                      : "Camera Unavailable"}
                  </div>
                  <p className="text-[11px] text-slate-300 mb-4 max-w-xs leading-relaxed">
                    {errorMessage}
                  </p>
                  <div className="flex gap-2">
                    {errorCode === "PERMISSION_DENIED" || errorCode === "IN_USE" ? (
                      <button
                        type="button"
                        onClick={() => startScanner()}
                        className="px-3 py-1.5 rounded text-xs font-medium bg-slate-800 text-white hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        Try Again
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setShowManualFallback(true)}
                      className="px-3 py-1.5 rounded text-xs font-medium text-white transition-colors cursor-pointer"
                      style={{ backgroundColor: "var(--jade)" }}
                    >
                      Enter Code Manually
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Manual Input Fallback Form */
            <div
              className="w-full max-w-[320px] p-5 rounded-lg border bg-slate-950/70"
              style={{ borderColor: "rgba(240, 237, 228, 0.15)" }}
            >
              <div className="flex items-center gap-2 mb-3 text-xs font-mono" style={{ color: "var(--brass)" }}>
                <Keyboard className="w-4 h-4" />
                <span>Manual Token Entry</span>
              </div>
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-300 mb-1">
                    Packaging Identifier / Scanned URL
                  </label>
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="e.g. DEMO-THALI-ACTIVE-001"
                    autoFocus
                    className="w-full px-3 py-2 rounded text-xs font-mono bg-slate-900 border text-white focus:outline-none focus:border-emerald-500"
                    style={{ borderColor: "rgba(240, 237, 228, 0.2)" }}
                  />
                </div>

                {manualError && (
                  <div className="text-[11px] text-rose-300 bg-rose-950/60 border border-rose-900 p-2 rounded flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                    <span>{manualError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowManualFallback(false);
                      startScanner();
                    }}
                    className="text-[11px] font-mono text-slate-400 hover:text-white underline"
                  >
                    Use Camera
                  </button>
                  <button
                    type="submit"
                    disabled={!manualInput.trim()}
                    className="px-3.5 py-1.5 rounded text-xs font-semibold text-white transition-colors disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                    style={{ backgroundColor: "var(--jade)" }}
                  >
                    <span>Verify Code</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Warning Banner (e.g. scanned external or malformed QR) */}
          {warningMsg && (
            <div className="mt-3 text-xs text-amber-300 bg-amber-950/70 border border-amber-800 px-3 py-1.5 rounded flex items-center gap-2 max-w-sm animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{warningMsg}</span>
            </div>
          )}

          {/* Switcher & Footer Help */}
          <div className="mt-4 pt-3 border-t w-full flex items-center justify-between text-[11px] font-mono text-slate-400" style={{ borderColor: "rgba(240, 237, 228, 0.1)" }}>
            <span>Secure Optical Decoder</span>
            {!showManualFallback && (
              <button
                type="button"
                onClick={() => setShowManualFallback(true)}
                className="hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Keyboard className="w-3 h-3" />
                <span>Enter Code Manually</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
