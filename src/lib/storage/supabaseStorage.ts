/**
 * Supabase Storage Integration Module
 *
 * Implements server-side operations for private evidence assets in Supabase Storage.
 * Uses native fetch with standard Supabase Storage REST API v1.
 * Service role credentials NEVER leak to client-side code.
 */

const getSupabaseConfig = () => {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "railguard-evidence";

  return {
    url,
    serviceRoleKey,
    bucket,
    isConfigured: Boolean(url && serviceRoleKey),
  };
};

export function isSupabaseStorageConfigured(): boolean {
  return getSupabaseConfig().isConfigured;
}

export function getSupabaseBucketName(): string {
  return getSupabaseConfig().bucket;
}

/**
 * Uploads an evidence file buffer to the private Supabase Storage bucket.
 */
export async function uploadEvidenceToSupabase(
  storagePath: string,
  buffer: Buffer,
  mimeType: string
): Promise<{ success: boolean; error?: string }> {
  const config = getSupabaseConfig();
  if (!config.isConfigured || !config.url || !config.serviceRoleKey) {
    return { success: false, error: "Supabase Storage is not configured" };
  }

  // Clean relative path e.g. "uploads/uuid.jpg"
  const cleanPath = storagePath.replace(/^\/+/, "");
  const endpoint = `${config.url}/storage/v1/object/${config.bucket}/${cleanPath}`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.serviceRoleKey}`,
        "Content-Type": mimeType,
        "x-upsert": "false",
      },
      body: new Uint8Array(buffer),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      console.error(`[SupabaseStorage] Upload failed (${res.status}): ${errText}`);
      return {
        success: false,
        error: `Supabase upload failed (${res.status}): ${errText}`,
      };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[SupabaseStorage] Network upload error: ${message}`);
    return { success: false, error: message };
  }
}

/**
 * Downloads an evidence file from the private Supabase Storage bucket.
 * Returned as a raw buffer for secure server-side streaming to authorized clients.
 */
export async function downloadEvidenceFromSupabase(
  storagePath: string
): Promise<{ success: boolean; buffer?: Buffer; mimeType?: string; error?: string }> {
  const config = getSupabaseConfig();
  if (!config.isConfigured || !config.url || !config.serviceRoleKey) {
    return { success: false, error: "Supabase Storage is not configured" };
  }

  const cleanPath = storagePath.replace(/^\/+/, "");
  const endpoint = `${config.url}/storage/v1/object/authenticated/${config.bucket}/${cleanPath}`;

  try {
    const res = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.serviceRoleKey}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      return {
        success: false,
        error: `Supabase retrieval failed (${res.status}): ${errText}`,
      };
    }

    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const arrayBuffer = await res.arrayBuffer();
    return {
      success: true,
      buffer: Buffer.from(arrayBuffer),
      mimeType: contentType,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Generates a short-lived signed URL for a specific evidence asset.
 * Default expiration: 900 seconds (15 minutes).
 */
export async function createSignedEvidenceUrl(
  storagePath: string,
  expiresInSeconds: number = 900
): Promise<{ success: boolean; signedUrl?: string; error?: string }> {
  const config = getSupabaseConfig();
  if (!config.isConfigured || !config.url || !config.serviceRoleKey) {
    return { success: false, error: "Supabase Storage is not configured" };
  }

  const cleanPath = storagePath.replace(/^\/+/, "");
  const endpoint = `${config.url}/storage/v1/object/sign/${config.bucket}/${cleanPath}`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: expiresInSeconds }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      return { success: false, error: `Failed to sign URL (${res.status}): ${errText}` };
    }

    const data = (await res.json()) as { signedURL?: string };
    if (!data.signedURL) {
      return { success: false, error: "No signedURL returned from Supabase" };
    }

    // signedURL is typically returned as `/storage/v1/object/sign/...`
    const absoluteSignedUrl = data.signedURL.startsWith("http")
      ? data.signedURL
      : `${config.url}${data.signedURL}`;

    return { success: true, signedUrl: absoluteSignedUrl };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Deletes objects from the private Supabase Storage bucket.
 * Used during demo reset or failed transaction cleanups.
 */
export async function deleteEvidenceFromSupabase(
  storagePaths: string[]
): Promise<{ success: boolean; deletedCount: number; errors?: string[] }> {
  const config = getSupabaseConfig();
  if (!config.isConfigured || !config.url || !config.serviceRoleKey || storagePaths.length === 0) {
    return { success: true, deletedCount: 0 };
  }

  const cleanPaths = storagePaths.map((p) => p.replace(/^\/+/, ""));
  const endpoint = `${config.url}/storage/v1/object/${config.bucket}`;

  try {
    const res = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${config.serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prefixes: cleanPaths }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      return { success: false, deletedCount: 0, errors: [errText] };
    }

    return { success: true, deletedCount: cleanPaths.length };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, deletedCount: 0, errors: [message] };
  }
}
