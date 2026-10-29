# RailGuard — Security & Privacy Architecture

---

## 1. Security Architecture Principles

RailGuard adheres to zero-trust principles for all external inputs and client-side requests:
1. **Server-Enforced RBAC**: User identity and permissions are verified on the server for every protected operation. Client UI state only controls presentation, never authorization.
2. **Private Evidence Storage**: No uploaded evidence is stored in public directories or served via predictable, static URLs.
3. **Defense Against Enumeration**: Complaints are tracked via dual-key validation (`complaintRef` + random `trackingToken`). Sequential ID harvesting is blocked.
4. **Strict Input Sanitization**: All incoming payloads are validated via Zod schemas with length limits, format checks, and character sanitization.
5. **No Secret Commits**: All secrets reside in `.env.local` or host environment variables. `.env.example` contains only non-sensitive placeholders.

---

## 2. Role-Based Access Control (RBAC) Matrix

| Resource / Capability | Passenger (Public) | Quality Reviewer | Administrator |
|---|---|---|---|
| Scan / Lookup Packaging Unit | Yes | Yes | Yes |
| Submit Complaint & Upload Photos | Yes | Yes | Yes |
| Track Complaint (with `trackingToken`) | Yes (Own Case Only) | Yes (All Permitted) | Yes (All) |
| Access Dashboard Metrics | No (401/403) | Yes | Yes |
| Inspect Photographic Evidence | No (401/403) | Yes (Via Presigned URL) | Yes (Via Presigned URL) |
| Assign Investigation | No (401/403) | Yes | Yes |
| Record Findings & Update Status | No (401/403) | Yes | Yes |
| Mandate Corrective Actions | No (401/403) | Yes | Yes |
| Manage User Roles & Vendors | No (401/403) | No (403 Forbidden) | Yes |
| Generate Packaging QR Codes | No (401/403) | No (403 Forbidden) | Yes |

---

## 3. Evidence Protection & Upload Restrictions

- **File Type Validation**: Only `image/jpeg`, `image/png`, and `image/webp` are permitted. MIME types supplied in HTTP headers are validated.
- **Size Quota**: Maximum 5MB per individual photograph; maximum 3 photographs per complaint submission.
- **Storage Isolation**: Files are assigned random UUID paths in private storage buckets.
- **Signed URL Expiration**: Presigned read URLs expire after 15 minutes, preventing cached public link leakage.

---

## 4. Rate Limiting & Abuse Prevention

- **Submission Throttling**: Public complaint submission endpoints should be rate-limited per IP (e.g., maximum 5 submissions per hour) to prevent spam attacks.
- **Payload Size Limits**: Next.js route handlers enforce body size restrictions to mitigate Denial of Service (DoS) attacks via oversized multipart requests.

---

## 5. Passenger Privacy & Regulatory Disclaimers

- **Optional Contact Information**: Contact email and phone number are optional; passengers may file reports anonymously.
- **Simulated Demonstration Data**: To avoid misrepresentation, all vendors, pantry operators, and packaging identifiers in the prototype are simulated demonstration records.
- **No Official IRCTC Claims**: The platform explicitly disclaims official Indian Railways integration, serving as an independent audit prototype.
