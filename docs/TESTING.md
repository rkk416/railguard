# RailGuard — Testing Specification & Strategy

---

## 1. Testing Framework & Philosophy

RailGuard uses **Vitest** for fast unit and integration testing.

Testing follows these core guidelines:
1. **Never mock away critical security checks**: Authorization, status state-machine transitions, and Zod input validators must be tested with realistic payloads.
2. **Deterministic execution**: Tests must run quickly in CI/local terminal without reliance on external network access.
3. **Report actual results**: Never document a test as passing without having run it and verified its exit code.

---

## 2. Test Execution Commands

```bash
# Run entire test suite once
npm test

# Run Vitest in interactive watch mode
npm run test:watch

# Run linter
npm run lint

# Verify full production build and TypeScript types
npm run build
```

---

## 3. Critical Test Coverage Plan (12 Key Test Areas)

| Test Area | Description | Target Suite |
|---|---|---|
| **1. Valid QR Identifier Lookup** | Verifies active packaging records return correct vendor, product, and batch information | `src/tests/product.test.ts` |
| **2. Invalid/Inactive QR Handling** | Verifies unregistered, expired, or recalled batch codes trigger appropriate handling | `src/tests/product.test.ts` |
| **3. Complaint Submission Validation** | Verifies Zod schemas reject invalid inputs (e.g. empty descriptions, invalid train formats) | `src/tests/complaintValidation.test.ts` |
| **4. File Upload Validation** | Enforces allowed mime-types (`image/jpeg`, `image/png`, `image/webp`), size limits ($\le 5\text{MB}$), and file count ($\le 3$) | `src/tests/storage.test.ts` |
| **5. Unauthorized Dashboard Access** | Confirms unauthenticated or passenger users cannot access reviewer API endpoints or dashboard pages | `src/tests/auth.test.ts` |
| **6. Complaint Access Restrictions** | Verifies tracking endpoint rejects attempts to access complaints without matching `trackingToken` | `src/tests/tracking.test.ts` |
| **7. Role-Based Permissions (RBAC)** | Confirms Quality Reviewers cannot perform Admin-only actions (e.g., managing user accounts or vendors) | `src/tests/rbac.test.ts` |
| **8. Valid Status Transitions** | Verifies valid state progression (`SUBMITTED` -> `UNDER_REVIEW` -> `INVESTIGATION` -> `RESOLVED`) | `src/tests/stateMachine.test.ts` |
| **9. Invalid Status Transitions** | Ensures illegal jumps (e.g., `SUBMITTED` directly to `RESOLVED` without review) throw validation errors | `src/tests/stateMachine.test.ts` |
| **10. Recurring-Issue Detection** | Validates rule engine triggers alerts when complaint thresholds are reached within configured time windows | `src/tests/recurringAlerts.test.ts` |
| **11. Duplicate Complaint Detection** | Verifies duplicate complaints for same passenger/journey/batch are flagged | `src/tests/duplicates.test.ts` |
| **12. Multi-Step Transaction Rollback** | Verifies that failures in evidence registration safely rollback complaint database transactions | `src/tests/transactions.test.ts` |

---

## 4. Current Test Results (Milestone 0)

```text
 RUN  v5.0.5 C:/Users/ramkr/Documents/railguard

 ✓ src/tests/smoke.test.ts (2 tests) 7ms

 Test Files  1 passed (1)
      Tests  2 passed (2)
   Start at  19:14:32
   Duration  408ms
```
