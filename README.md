# 🏢 B2B Enterprise Identity Portal

> **A production-grade, multi-tenant B2B enterprise portal built with Next.js 15 and WSO2 Asgardeo — demonstrating real-world Identity and Access Management (IAM) at scale.**

[![WSO2 Asgardeo](https://img.shields.io/badge/WSO2-Asgardeo-FF7300?style=for-the-badge&logo=wso2&logoColor=white)](https://wso2.com/asgardeo/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![OAuth 2.0](https://img.shields.io/badge/OAuth-2.0-4285F4?style=for-the-badge)](https://oauth.net/2/)
[![SCIM 2.0](https://img.shields.io/badge/SCIM-2.0-6366F1?style=for-the-badge)](https://scim.cloud/)

---

## 🌍 Real-World Business Scenario

**Who uses this?**  
A SaaS company (e.g., a cloud ERP vendor) that sells its software to other businesses (**B2B**). Each enterprise customer has:
- Multiple employees who need access to the platform
- Administrators who manage their team's identities and permissions
- Compliance requirements (SOC2, ISO 27001, GDPR) that demand audit trails
- Security operations teams that need real-time alerting for suspicious activity

**Why WSO2 Asgardeo?**  
Instead of building authentication from scratch (insecure, expensive, slow), the company delegates identity management to WSO2 Asgardeo — the industry-standard Cloud Identity Provider. This is exactly how real enterprise SaaS products work: Stripe, Notion, Figma, and thousands of other B2B companies use a dedicated IdP.

---

## 🔑 WSO2 Asgardeo Integration — What's Actually Connected

This is not a mock. Every feature below makes **live API calls** to WSO2 Asgardeo.

### 1. OAuth 2.0 + OpenID Connect Authentication
**File:** `app/components/AsgardeoProvider.tsx`, `app/lib/auth.ts`

The portal uses Asgardeo as its Identity Provider via the Authorization Code Flow with PKCE — the most secure OAuth 2.0 flow for SPAs.

```
User clicks "Sign in"
  → Redirected to Asgardeo's hosted login page
  → Enters credentials / MFA
  → Asgardeo issues an ID Token + Access Token (JWT or Opaque)
  → User is redirected back to the portal, authenticated
```

**Real-world relevance:** This is identical to how GitHub, Salesforce, and SAP handle B2B authentication. The portal never sees or stores passwords — Asgardeo does.

---

### 2. Dual Token Validation (JWT + Opaque Token Support)
**File:** `app/lib/auth.ts`

Every protected API route validates the Asgardeo-issued token before responding. The system supports both:

| Token Type | Validation Method |
|------------|-------------------|
| **JWT Access Token** | Fetches Asgardeo's JWKS endpoint → verifies signature + issuer + expiry |
| **Opaque Access Token** | Calls Asgardeo's `/oauth2/userinfo` endpoint to introspect |

```typescript
// Real JWKS validation — Asgardeo's public keys fetched live
const jwks = createRemoteJWKSet(new URL(`${ASGARDEO_BASE_URL}/oauth2/jwks`));
const { payload } = await jwtVerify(token, jwks, { issuer: EXPECTED_ISSUER });
```

**Real-world relevance:** Production API gateways (Kong, AWS API Gateway, Azure APIM) do exactly this to protect microservices.

---

### 3. SCIM 2.0 User Management
**Files:** `app/api/team/route.ts`, `app/api/admin-data/route.ts`, `app/api/admin/user-action/route.ts`

The portal uses **Machine-to-Machine (M2M) Client Credentials** to call Asgardeo's SCIM 2.0 API — the industry standard for cross-domain user provisioning.

| Operation | SCIM 2.0 Call | Feature |
|-----------|--------------|---------|
| List all users | `GET /scim2/Users` | Team Management page |
| Count users | `GET /scim2/Users?count=1` | Dashboard stats |
| Find user by username | `GET /scim2/Users?filter=userName eq "..."` | Admin alert actions |
| Delete a user | `DELETE /scim2/Users/{id}` | Admin: Delete from alert bell |
| Unlock a user | `PATCH /scim2/Users/{id}` (set `active: true`) | Admin: Allow login from alert bell |

**Real-world relevance:** SCIM 2.0 is the standard used by Okta, Azure AD, Google Workspace, and Salesforce for enterprise user provisioning.

---

### 4. Real-Time Webhook Event Processing
**File:** `app/api/webhooks/asgardeo/route.ts`

Asgardeo pushes events to the portal in real-time via HMAC-SHA256 signed webhooks.

| Asgardeo Event | Mapped To | Result |
|---------------|-----------|--------|
| `login.failure` | `user.login.failed` | Security alert created |
| `login.success` | `user.login.success` | Audit log entry |
| `user.delete` | `user.deleted` | Admin audit trail |
| `role.update` | `user.role.updated` | Privilege change alert |
| `user.create` | `user.created` | Onboarding audit entry |
| `password.update` | `user.password.changed` | Security audit entry |

```typescript
// Signature verification — HMAC-SHA256 prevents spoofed webhooks
const expected = `sha256=${createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex")}`;
return timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
```

**Real-world relevance:** This is the same pattern used by GitHub, Stripe, and PagerDuty for real-time event processing.

---

### 5. Automated Security Rules Engine
**File:** `app/lib/alertRules.ts`

A server-side rules engine evaluates every incoming Asgardeo event against configurable security policies:

| Rule | Trigger | Severity | Admin Action Available |
|------|---------|----------|----------------------|
| **Brute Force Detection** | 3+ failed logins in 2 min | 🔴 High | ✅ Delete / Allow |
| **Login Failure Detected** | Any failed login | 🟡 Medium | ✅ Delete / Allow |
| **After-Hours Access** | Login outside 9am–6pm | 🟡 Medium | — |
| **Privilege Escalation** | User granted Admin role | 🔴 Critical | — |
| **Bulk User Deletion** | 3+ users deleted in 5 min | 🔴 Critical | — |
| **API Abuse Detection** | 10+ security events/min | 🔴 High | — |

**Real-world relevance:** This is equivalent to SIEM rules at companies like CrowdStrike, Splunk, and Datadog.

---

### 6. Admin Alert Bell with Live SCIM Actions
**Files:** `app/components/Header.tsx`, `app/api/admin/user-action/route.ts`

When a login failure alert fires, the admin's notification bell shows actionable buttons:

```
Bell icon shows red badge
  → Admin opens panel
  → Sees: "Login Failure Detected — john@company.com from IP 192.168.1.42"
  → Clicks [Delete User] → SCIM DELETE /scim2/Users/{id} → User removed from Asgardeo
  → OR clicks [Allow Login] → SCIM PATCH active:true → Account unlocked in Asgardeo
```

**Real-world relevance:** This is how Okta's Admin Console and Azure AD's security center work — inline remediation without leaving the app.

---

### 7. Compliance-Grade Audit Logging
**File:** `app/dashboard/audit-logs/page.tsx`, `app/api/audit-logs/route.ts`

Every identity event from Asgardeo is stored with:
- Full metadata (actor, IP, user agent, timestamp, event ID)
- Filterable by event type and severity
- Expandable detail rows

**Real-world relevance:** SOC 2 Type II, ISO 27001, HIPAA, and GDPR all require audit trails of identity events.

---

### 8. Role-Based Access Control (RBAC)
**Files:** `app/components/AuthGuard.tsx`, `app/lib/auth.ts`

The portal reads group/role claims from the Asgardeo token to enforce access:

| Role | Access |
|------|--------|
| **Admin** | Full dashboard + admin alert actions + team management |
| **Member** | Dashboard + analytics + audit logs (read-only) |

**Real-world relevance:** RBAC driven by the IdP is the standard for enterprise software.

---

## 📐 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Next.js Client)                  │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌──────────┐  │
│  │  Login   │  │Dashboard │  │ Team Mgmt  │  │Audit Logs│  │
│  │  Page    │  │Overview  │  │ (SCIM 2.0) │  │(Webhook) │  │
│  └────┬─────┘  └────┬─────┘  └─────┬──────┘  └────┬─────┘  │
└───────┼─────────────┼──────────────┼───────────────┼────────┘
        │ OAuth 2.0   │ Bearer Token │ Bearer Token  │ Bearer Token
        ▼             ▼              ▼               ▼
┌─────────────────────────────────────────────────────────────┐
│                  Next.js API Routes (Server)                  │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌──────────┐  │
│  │/api/auth │  │/api/     │  │/api/team   │  │/api/     │  │
│  │(validate)│  │admin-data│  │(SCIM list) │  │webhooks/ │  │
│  └────┬─────┘  └────┬─────┘  └─────┬──────┘  │asgardeo  │  │
│       │             │               │          └────┬─────┘  │
│       └─────────────┴───────────────┴───────────────┘        │
│                        M2M Client Credentials                 │
└─────────────────────────────────────────────────────────────┘
        │ JWKS/UserInfo  │ SCIM 2.0 API    │ Webhook Events
        ▼                ▼                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    WSO2 Asgardeo Cloud                        │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌──────────┐  │
│  │  OAuth   │  │  SCIM    │  │  Webhook   │  │  JWKS    │  │
│  │  /token  │  │  /Users  │  │  Delivery  │  │ Endpoint │  │
│  └──────────┘  └──────────┘  └────────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 WSO2 APIs Used

| API | Endpoint | Purpose |
|-----|----------|---------|
| OAuth 2.0 Authorization | `/oauth2/authorize` | Login redirect |
| OAuth 2.0 Token | `/oauth2/token` | Token exchange + M2M |
| OIDC UserInfo | `/oauth2/userinfo` | Opaque token validation |
| JWKS | `/oauth2/jwks` | JWT signature verification |
| SCIM 2.0 Users List | `/scim2/Users` | User directory |
| SCIM 2.0 User Delete | `/scim2/Users/{id}` DELETE | Remove user |
| SCIM 2.0 User Update | `/scim2/Users/{id}` PATCH | Unlock account |
| Webhooks | Event subscription | Real-time identity events |

---

## ⚙️ Setup

### Environment Variables (`.env.local`)

```env
# Asgardeo SPA Application (OAuth 2.0)
NEXT_PUBLIC_ASGARDEO_BASE_URL=https://api.asgardeo.io/t/YOUR_ORG
NEXT_PUBLIC_ASGARDEO_CLIENT_ID=your_spa_client_id
NEXT_PUBLIC_ASGARDEO_SIGN_IN_REDIRECT_URL=http://localhost:3000
NEXT_PUBLIC_ASGARDEO_SIGN_OUT_REDIRECT_URL=http://localhost:3000

# M2M Application (Client Credentials — SCIM 2.0 admin operations)
ASGARDEO_M2M_CLIENT_ID=your_m2m_client_id
ASGARDEO_M2M_CLIENT_SECRET=your_m2m_client_secret

# Webhook secret (from Asgardeo webhook subscription)
ASGARDEO_WEBHOOK_SECRET=your_webhook_secret
```

### Run

```bash
npm install && npm run dev
# → http://localhost:3000
```

### Test Alert System (no webhook required)

```bash
# Single failed login alert
curl http://localhost:3000/api/test-alert?scenario=login_failed

# Brute force burst
curl http://localhost:3000/api/test-alert?scenario=brute_force

# Privilege escalation
curl http://localhost:3000/api/test-alert?scenario=privilege

# Bulk user deletion
curl http://localhost:3000/api/test-alert?scenario=bulk_delete
```

---

## 📁 Project Structure

```
app/
├── api/
│   ├── admin/user-action/route.ts   ← SCIM 2.0 Delete/Unlock via M2M
│   ├── admin-data/route.ts          ← Dashboard stats via SCIM 2.0
│   ├── alerts/route.ts              ← Security alert store API
│   ├── analytics/route.ts           ← Auth metrics
│   ├── audit-logs/route.ts          ← Immutable audit event trail
│   ├── team/route.ts                ← SCIM 2.0 user directory
│   ├── test-alert/route.ts          ← Dev simulation endpoint
│   └── webhooks/asgardeo/route.ts   ← HMAC-verified webhook receiver
├── components/
│   ├── AsgardeoProvider.tsx         ← OAuth 2.0 context provider
│   ├── AuthGuard.tsx                ← Route protection + RBAC
│   └── Header.tsx                   ← Notification bell + admin actions
├── dashboard/
│   ├── analytics/                   ← Auth metrics & charts
│   ├── api-gateway/                 ← API traffic monitoring
│   ├── audit-logs/                  ← Compliance audit trail
│   ├── profile/                     ← Identity profile (Asgardeo)
│   ├── security/                    ← Security posture dashboard
│   ├── settings/                    ← Organisation settings
│   └── team/                        ← SCIM 2.0 user directory UI
└── lib/
    ├── alertRules.ts                ← Security rules engine (SIEM-style)
    ├── alertStore.ts                ← In-memory alert store
    ├── auth.ts                      ← JWT + Opaque token validation
    └── auditTypes.ts                ← Shared type definitions
```

---

*Built with WSO2 Asgardeo — a production-grade demonstration of B2B Identity and Access Management.*