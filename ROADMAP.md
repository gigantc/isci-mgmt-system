# ISCI Management System — Roadmap

Under-the-hood improvements identified 2026-07-13. Ordered by impact. Check off as completed.

---

## 🔴 Critical — Security

These are the top priority. The app currently trusts the client for authentication and authorization.

- [ ] **1. Add server-side auth to all API routes.** `api.isci.js`, `api.brands.js`, `api.users.js`, `api.user.js`, `api.isci.import.js`, `api.agencies.js` do not verify sessions. Any unauthenticated request can read, mutate, or wipe data. Add a `requireAuth()` / `requireAdmin()` helper and gate every loader/action.
- [ ] **2. Hash passwords.** `api.auth.js:29` compares plain-text. Move to bcrypt or argon2. Migrate existing users on next login or via a one-time script.
- [ ] **3. Strip `password` from user responses.** `GET /api/users` currently returns it. Use Prisma `select` to whitelist fields.
- [ ] **4. Replace sessionStorage session with signed httpOnly cookies.** Client-side role checks in `app/utils/auth.js` are trivially bypassed via DevTools. Server middleware should be the source of truth.
- [ ] **5. Sanitize profile image uploads.** `api.user.js:86-92` uses the client-supplied filename extension. Derive extension from MIME, allowlist a small set (jpg/png/webp), and generate the filename server-side.
- [ ] **6. Gate mass-assignable fields.** `PUT /api/users/:id` accepts `userType` and `active` from the body. Separate self-profile edits from admin-only fields.

## 🟠 Data Integrity

- [ ] **7. Move ISCI number sequencing to the server.** `ISCIForm.jsx` picks the next number client-side from a stale list, so concurrent creates for the same brand/year collide on the unique constraint. Wrap in `prisma.$transaction` with retry, or maintain a per-brand counter row.
- [ ] **8. Make CSV import transactional.** `api.isci.import.js` does per-row `findUnique` + `create/update` outside a transaction. Wrap each mode in `$transaction`, or use `upsert` / `createMany` where possible. Partial failures currently leave mixed state.
- [ ] **9. Fix edit-history race in `api.isci.js:184-203`.** Read-modify-write on the history JSON drops entries under concurrent PUTs. Wrap in a transaction, or move history to its own related table.
- [ ] **10. Stop accepting client-supplied `id`, `createdAt`, `updatedAt` on create routes.** Clients can backdate records or overwrite existing rows by id. Generate server-side.

## 🟡 Performance / Schema

- [ ] **11. Add indexes on `ISCICode`.** Only `brandId` is indexed. Dashboard filters/sorts on `createdAt`, `updatedAt`, `channel`, `language`. Add `@@index([createdAt])`, `@@index([updatedAt])`, and consider indexes for the fields used in search.
- [ ] **12. Change `airDate` to `DateTime`.** Currently stored as `String` in Postgres. The "SQLite compatibility" comment is stale.

## 🟢 Code Health / DX

- [ ] **13. Wire up or remove `useFormState`.** 170 lines in `app/hooks/useFormState.js`, documented as unused. `ISCIForm` is the obvious candidate.
- [ ] **14. Add ESLint + Prettier.** No lint config today. Start with `eslint:recommended` + `react-hooks`.
- [ ] **15. Add a test harness.** Vitest + a smoke test per API route asserting the auth check (worth writing once #1 lands).
- [ ] **16. Add a root `ErrorBoundary`.** `root.jsx` has none. A render error currently kills the SSR response.
- [ ] **17. Gate PII logs.** `console.log` in auth/user routes prints emails and ids unconditionally. Wrap in `NODE_ENV !== "production"` or use a leveled logger.
- [ ] **18. Fix action return types.** `api.user.recently-viewed.js` returns bare objects from actions instead of `Response.json`. Works accidentally but skips status codes on error paths.

---

## Suggested Order

1. **Auth pass (#1–#4, #6).** Do these together — hashing, httpOnly cookies, `requireAuth`/`requireAdmin` helper, strip passwords from responses. Everything downstream depends on trusting the server.
2. **Data integrity (#7–#10).** Cheaper to fix once auth is in place and tests can cover them.
3. **Schema (#11–#12).** Single migration.
4. **DX (#14–#15).** Lint + a small test suite around the auth boundary.
5. **Polish (#5, #13, #16–#18).**
