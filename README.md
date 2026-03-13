# Estate Vault v3.0

A secure digital legacy platform that stores and delivers your most important digital assets to trusted nominees after your passing.

---

## What Changed in v3

| Feature | Before (v2) | After (v3) |
|---|---|---|
| Registration verification | None | Email OTP (6-digit, 10 min expiry) |
| Login security | Password only | Password + Email OTP every login |
| 2FA method | Authenticator app (TOTP/QR) | Removed — replaced by email OTP |
| Admin access | Same portal as users | Completely separate `/admin/login` + admin JWT |
| Death cert upload | Required login as deceased's nominee account | Public **Nominee Portal** — token-based, no login |
| Nominee invitation | Invite only | Invite → Accept/Decline (owner notified either way) |
| Admin notification | Manual | Email sent to all admins on every new submission |
| Nominee notification on approval | Email sent | Email with portal link + vault access |
| Nominee notification on rejection | None | Email sent with admin notes/reason |

---

## Architecture

```
/backend
  /models        User, Admin, Nominee, Vault, DeadmanSwitch, DeathRequest, AuditLog
  /controllers   auth, admin, nominees, death, vault, deadman
  /routes        /api/auth  /api/nominees  /api/death (public)  /api/admin  /api/vault  /api/deadman
  /middleware    auth.js (user + admin), validators, upload, rateLimiter
  /config        db, email (templates), encryption, logger, audit
  /jobs          scheduler (dead man's switch cron)

/frontend/src
  /pages         Login, Register, Vault, Nominees, DeadmanSwitch
                 AdminLogin, AdminPanel
                 NomineePortal (public), AcceptNomination (public)
  /components    UI, Layout (user + admin), ProtectedRoute
  /context       AuthContext (user + admin)
  /utils         api.js (user + admin axios instances)
```

---

## Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in MONGO_URI, JWT_SECRET, GMAIL_USER, GMAIL_APP_PASSWORD, VAULT_ENCRYPTION_KEY, ADMIN_SETUP_KEY
npm run dev
```

### Create First Admin (one-time)

```bash
curl -X POST http://localhost:5000/api/admin/auth/create \
  -H "Content-Type: application/json" \
  -H "x-setup-key: your_secure_admin_setup_key_here" \
  -d '{"email":"admin@yourdomain.com","password":"StrongPassword123!","fullName":"Admin Name"}'
```

> Change or remove `ADMIN_SETUP_KEY` from `.env` after creating the admin.

### Frontend

```bash
cd frontend
npm install
npm start
```

---

## Email Flows

| Trigger | Who receives email |
|---|---|
| User registers | User — 6-digit verification OTP |
| User logs in | User — 6-digit login OTP |
| Admin logs in | Admin — 6-digit login OTP |
| User adds nominee | Nominee — Accept/Decline invitation email |
| Nominee accepts | Vault owner — confirmation |
| Nominee declines | Vault owner — notification |
| Dead man's switch warning | Vault owner |
| Dead man's switch triggered | All accepted nominees — link to Nominee Portal |
| Nominee uploads death cert | All active admins — review notification |
| Admin approves death cert | Nominee — vault access granted with portal link |
| Admin rejects death cert | Nominee — rejection with reason |

---

## User Flows

### Registration
1. Fill form → POST `/api/auth/register`
2. Receive 6-digit OTP via email
3. Enter OTP → POST `/api/auth/verify-email`
4. Account activated, JWT issued

### Login (every time)
1. Enter email + password → POST `/api/auth/login`
2. Receive 6-digit OTP via email
3. Enter OTP → POST `/api/auth/verify-login-otp`
4. JWT issued, session starts

### Admin Login
1. Go to `/admin/login`
2. Enter admin email + password
3. Receive OTP via email
4. Verify OTP → JWT issued (8h expiry, `role: 'admin'`)

### Nominee Accepting Invitation
1. Vault owner adds nominee
2. Nominee receives email with Accept/Decline links
3. Nominee clicks link → `/accept-nomination?token=xxx`
4. Page shows confirm screen, nominee clicks Accept
5. Owner receives email: "Nominee accepted"

### Nominee Submitting Death Certificate
1. Dead man's switch triggers → nominee receives email with portal link
2. Nominee visits `/nominee-portal?token=xxx&owner=email@example.com`
3. Nominee uploads death certificate PDF/image
4. Admins receive email notification
5. Admin reviews in `/admin/panel`, approves or rejects
6. Nominee receives email with outcome

---

## Environment Variables

```
MONGO_URI              MongoDB connection string
PORT                   Server port (default: 5000)
FRONTEND_URL           Frontend URL for email links (e.g. http://localhost:3000)
JWT_SECRET             Secret for signing user + admin JWTs
JWT_EXPIRES_IN         User JWT expiry (default: 7d)
GMAIL_USER             Gmail address for sending emails
GMAIL_APP_PASSWORD     Gmail 16-char app password
VAULT_ENCRYPTION_KEY   32-char key for AES-256 vault encryption
UPLOAD_PATH            Path to store uploaded files (default: ./uploads)
MAX_FILE_SIZE_MB        Max upload size (default: 10)
ADMIN_SETUP_KEY        One-time key to create first admin — remove after use
```
