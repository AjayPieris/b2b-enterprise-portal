<p align="center">
  <img src="public/Readme Images/hero-banner.png" alt="B2B Enterprise Identity Portal" width="100%" />
</p>

<p align="center">
  <strong>A production-grade, multi-tenant B2B enterprise portal built with Next.js and WSO2 Asgardeo — demonstrating real-world Identity & Access Management (IAM) at scale.</strong>
</p>

<p align="center">
  <a href="https://wso2.com/asgardeo/"><img src="https://img.shields.io/badge/WSO2-Asgardeo-FF7300?style=for-the-badge&logo=wso2&logoColor=white" alt="WSO2 Asgardeo" /></a>
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" /></a>
  <a href="https://oauth.net/2/"><img src="https://img.shields.io/badge/OAuth-2.0-4285F4?style=for-the-badge" alt="OAuth 2.0" /></a>
  <a href="https://scim.cloud/"><img src="https://img.shields.io/badge/SCIM-2.0-6366F1?style=for-the-badge" alt="SCIM 2.0" /></a>
  <a href="#"><img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="#"><img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" /></a>
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-screenshots">Screenshots</a> •
  <a href="#-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-wso2-asgardeo-integration">Asgardeo Integration</a> •
  <a href="#-project-structure">Project Structure</a>
</p>

---

## 📸 Screenshots

<table>
  <tr>
    <td width="50%">
      <img src="public/Readme Images/1.png" alt="Landing Page" />
      <p align="center"><strong>🏠 Landing Page</strong><br/>Enterprise SSO gateway with Asgardeo authentication</p>
    </td>
    <td width="50%">
      <img src="public/Readme Images/2.0.png" alt="Asgardeo Sign In" />
      <p align="center"><strong>🔐 Asgardeo SSO</strong><br/>OAuth 2.0 + PKCE hosted login page</p>
    </td>
  </tr>
</table>

### 👑 Admin Flow

<table>
  <tr>
    <td width="50%">
      <img src="public/Readme Images/3.png" alt="Admin Login" />
      <p align="center"><strong>Admin Login</strong><br/>Admin credentials entered via Asgardeo SSO</p>
    </td>
    <td width="50%">
      <img src="public/Readme Images/4.png" alt="Admin Dashboard" />
      <p align="center"><strong>Admin Dashboard</strong><br/>Full access — metrics, revenue, team, settings, API gateway</p>
    </td>
  </tr>
</table>

### 👤 Member Flow

<table>
  <tr>
    <td width="50%">
      <img src="public/Readme Images/5.png" alt="Member Login" />
      <p align="center"><strong>Member Login</strong><br/>Member credentials entered via Asgardeo SSO</p>
    </td>
    <td width="50%">
      <img src="public/Readme Images/6.png" alt="Member Dashboard" />
      <p align="center"><strong>Member Dashboard</strong><br/>Restricted view — no Team, Settings, or API Gateway access</p>
    </td>
  </tr>
</table>

---

## 🌍 The Problem This Solves

**Who needs this?**

A SaaS company (e.g. a cloud ERP vendor) that sells its product to other businesses. Each customer has:

- 🏢 Multiple employees needing secure platform access
- 👤 Administrators who manage their team's identities and permissions
- 📋 Compliance requirements (SOC 2, ISO 27001, GDPR) demanding audit trails
- 🔒 Security ops teams needing real-time alerting for suspicious activity

**Why WSO2 Asgardeo?**

Instead of building authentication from scratch (insecure, expensive, slow), the company delegates identity management to WSO2 Asgardeo — a production-grade cloud Identity Provider. This is exactly how real enterprise SaaS products work: Stripe, Notion, Figma, and thousands of B2B companies use a dedicated IdP.

---

## ✨ Features

<p align="center">
  <img src="public/Readme Images/features.png" alt="Features Overview" width="100%" />
</p>

| Feature | Description | Status |
|---------|-------------|--------|
| **OAuth 2.0 + PKCE** | Secure Authorization Code Flow with Proof Key for Code Exchange | ✅ Live |
| **Dual Token Validation** | Supports both JWT and Opaque access tokens from Asgardeo | ✅ Live |
| **SCIM 2.0 User Management** | Full CRUD on users via Machine-to-Machine client credentials | ✅ Live |
| **Real-Time Webhooks** | HMAC-SHA256 verified webhook receiver for Asgardeo events | ✅ Live |
| **Security Rules Engine** | SIEM-style automated alert rules (brute force, privilege escalation, etc.) | ✅ Live |
| **Admin Alert Bell** | Actionable notifications with inline SCIM operations (delete/unlock user) | ✅ Live |
| **Compliance Audit Logs** | Filterable, immutable event trail with full metadata | ✅ Live |
| **Role-Based Access (RBAC)** | Admin vs Member views driven by Asgardeo token claims | ✅ Live |
| **Multi-Tenant Dashboard** | Revenue, organizations, API metrics across all tenants | ✅ Live |
| **API Gateway Monitor** | Real-time API traffic, latency, and health monitoring | ✅ Live |

---

## 🏗 Architecture

<p align="center">
  <img src="public/Readme Images/architecture.png" alt="Architecture Diagram" width="100%" />
</p>

> **How it works:** The browser authenticates via OAuth 2.0 and sends Bearer tokens to Next.js API routes. The server validates tokens using Asgardeo's JWKS endpoint, calls SCIM 2.0 APIs with M2M credentials for user management, and receives real-time webhook events signed with HMAC-SHA256.

---

## 🔑 WSO2 Asgardeo Integration

> Every feature below makes **live API calls** to WSO2 Asgardeo. This is not mocked.

### 1. OAuth 2.0 + OpenID Connect Authentication

```
User clicks "Sign in"
  → Redirected to Asgardeo's hosted login page
  → Enters credentials / MFA
  → Asgardeo issues an ID Token + Access Token (JWT or Opaque)
  → User is redirected back to the portal, authenticated
```

📁 `app/components/AsgardeoProvider.tsx` · `app/lib/auth.ts`

---

### 2. Dual Token Validation (JWT + Opaque)

Every protected API route validates the Asgardeo-issued token before responding.

| Token Type | How It's Validated |
|:-----------|:------------------|
| **JWT Access Token** | JWKS endpoint → verify signature + issuer + expiry |
| **Opaque Access Token** | `/oauth2/userinfo` introspection endpoint |

```typescript
const jwks = createRemoteJWKSet(new URL(`${ASGARDEO_BASE_URL}/oauth2/jwks`));
const { payload } = await jwtVerify(token, jwks, { issuer: EXPECTED_ISSUER });
```

📁 `app/lib/auth.ts`

---

### 3. SCIM 2.0 User Management

Uses **Machine-to-Machine (M2M) Client Credentials** to call Asgardeo's SCIM 2.0 API.

| Operation | SCIM Call | Portal Feature |
|:----------|:---------|:--------------|
| List all users | `GET /scim2/Users` | Team Management |
| Count users | `GET /scim2/Users?count=1` | Dashboard stats |
| Find by username | `GET /scim2/Users?filter=userName eq "..."` | Alert actions |
| Delete a user | `DELETE /scim2/Users/{id}` | Admin: Delete user |
| Unlock a user | `PATCH /scim2/Users/{id}` | Admin: Allow login |

📁 `app/api/team/route.ts` · `app/api/admin/user-action/route.ts`

---

### 4. Real-Time Webhook Event Processing

Asgardeo pushes events to the portal in real-time via HMAC-SHA256 signed webhooks.

| Asgardeo Event | Mapped Action | Result |
|:--------------|:-------------|:-------|
| `login.failure` | `user.login.failed` | Security alert |
| `login.success` | `user.login.success` | Audit log entry |
| `user.delete` | `user.deleted` | Admin audit trail |
| `role.update` | `user.role.updated` | Privilege change alert |
| `user.create` | `user.created` | Onboarding entry |
| `password.update` | `user.password.changed` | Security entry |

```typescript
const expected = `sha256=${createHmac("sha256", SECRET).update(rawBody).digest("hex")}`;
return timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
```

📁 `app/api/webhooks/asgardeo/route.ts`

---

### 5. Automated Security Rules Engine

A server-side rules engine evaluates every incoming event against configurable security policies.

| Rule | Trigger | Severity |
|:-----|:--------|:---------|
| **Brute Force Detection** | 3+ failed logins in 2 min | 🔴 High |
| **Login Failure** | Any single failed login | 🟡 Medium |
| **After-Hours Access** | Login outside 9 AM – 6 PM | 🟡 Medium |
| **Privilege Escalation** | User granted Admin role | 🔴 Critical |
| **Bulk User Deletion** | 3+ users deleted in 5 min | 🔴 Critical |
| **API Abuse Detection** | 10+ security events/min | 🔴 High |

📁 `app/lib/alertRules.ts`

---

### 6. Admin Alert Bell with Live SCIM Actions

```
Bell icon shows red badge (9)
  → Admin opens notification panel
  → Sees: "Login Failure — john@company.com from IP 192.168.1.42"
  → Clicks [Delete User] → SCIM DELETE → User removed from Asgardeo
  → OR clicks [Allow Login] → SCIM PATCH active:true → Account unlocked
```

📁 `app/components/Header.tsx` · `app/api/admin/user-action/route.ts`

---

### 7. Role-Based Access Control (RBAC)

Portal reads group/role claims from the Asgardeo token to enforce access.

| Role | Sidebar Access | Alert Actions |
|:-----|:--------------|:-------------|
| **Admin** | Full dashboard + Team + Settings + API Gateway | ✅ Delete / Allow |
| **Member** | Dashboard + Analytics + Audit Logs + Profile | ❌ Read-only |

📁 `app/components/AuthGuard.tsx` · `app/components/Sidebar.tsx`

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and **npm**
- A **WSO2 Asgardeo** account ([sign up free](https://wso2.com/asgardeo/))

### 1. Clone & Install

```bash
git clone https://github.com/AjayPieris/b2b-enterprise-portal.git
cd b2b-enterprise-portal
npm install
```

### 2. Configure Environment

Create a `.env.local` file in the project root:

```env
# ── Asgardeo SPA Application (OAuth 2.0) ──
NEXT_PUBLIC_ASGARDEO_BASE_URL=https://api.asgardeo.io/t/YOUR_ORG
NEXT_PUBLIC_ASGARDEO_CLIENT_ID=your_spa_client_id
NEXT_PUBLIC_ASGARDEO_SIGN_IN_REDIRECT_URL=http://localhost:3000
NEXT_PUBLIC_ASGARDEO_SIGN_OUT_REDIRECT_URL=http://localhost:3000

# ── M2M Application (Client Credentials — SCIM 2.0 admin operations) ──
ASGARDEO_M2M_CLIENT_ID=your_m2m_client_id
ASGARDEO_M2M_CLIENT_SECRET=your_m2m_client_secret

# ── Webhook secret (from Asgardeo webhook subscription) ──
ASGARDEO_WEBHOOK_SECRET=your_webhook_secret
```

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll see the enterprise landing page.

### 4. Test the Alert System (no webhook needed)

```bash
# Single failed login alert
curl http://localhost:3000/api/test-alert?scenario=login_failed

# Brute force detection (3 failed logins)
curl http://localhost:3000/api/test-alert?scenario=brute_force

# Privilege escalation alert
curl http://localhost:3000/api/test-alert?scenario=privilege

# Bulk user deletion alert
curl http://localhost:3000/api/test-alert?scenario=bulk_delete
```

---

## 🔌 WSO2 APIs Used

| API | Endpoint | Purpose |
|:----|:---------|:--------|
| OAuth 2.0 Authorization | `/oauth2/authorize` | Login redirect |
| OAuth 2.0 Token | `/oauth2/token` | Token exchange + M2M |
| OIDC UserInfo | `/oauth2/userinfo` | Opaque token validation |
| JWKS | `/oauth2/jwks` | JWT signature verification |
| SCIM 2.0 Users List | `GET /scim2/Users` | User directory |
| SCIM 2.0 User Delete | `DELETE /scim2/Users/{id}` | Remove user |
| SCIM 2.0 User Update | `PATCH /scim2/Users/{id}` | Unlock account |
| Webhooks | Event subscription | Real-time identity events |

---

## 📁 Project Structure

```
b2b-enterprise-portal/
│
├── app/
│   ├── api/                              # Server-side API routes
│   │   ├── admin/user-action/route.ts    ← SCIM 2.0 Delete/Unlock via M2M
│   │   ├── admin-data/route.ts           ← Dashboard stats via SCIM 2.0
│   │   ├── alerts/route.ts               ← Security alert store API
│   │   ├── analytics/route.ts            ← Auth metrics for charts
│   │   ├── audit-logs/route.ts           ← Immutable audit event trail
│   │   ├── gateway/route.ts              ← API gateway monitoring
│   │   ├── team/route.ts                 ← SCIM 2.0 user directory
│   │   ├── test-alert/route.ts           ← Dev simulation endpoint
│   │   └── webhooks/asgardeo/route.ts    ← HMAC-verified webhook receiver
│   │
│   ├── components/                       # Shared UI components
│   │   ├── AsgardeoProvider.tsx          ← OAuth 2.0 context provider
│   │   ├── AuthGuard.tsx                 ← Route protection + RBAC
│   │   ├── ClientProviders.tsx           ← Client-side provider wrapper
│   │   ├── Header.tsx                    ← Notification bell + admin actions
│   │   ├── Sidebar.tsx                   ← Role-aware navigation
│   │   └── StatsCard.tsx                 ← Reusable metrics card
│   │
│   ├── dashboard/                        # Protected dashboard pages
│   │   ├── page.tsx                      ← Main overview with charts
│   │   ├── analytics/                    ← Auth metrics & charts
│   │   ├── api-gateway/                  ← API traffic monitoring
│   │   ├── audit-logs/                   ← Compliance audit trail
│   │   ├── companies/                    ← Multi-tenant management
│   │   ├── profile/                      ← User identity profile
│   │   ├── security/                     ← Security posture dashboard
│   │   ├── settings/                     ← Organisation settings
│   │   └── team/                         ← SCIM 2.0 user directory UI
│   │
│   └── lib/                              # Core business logic
│       ├── alertRules.ts                 ← Security rules engine (SIEM)
│       ├── alertStore.ts                 ← In-memory alert store
│       ├── auth.ts                       ← JWT + Opaque token validation
│       ├── auditTypes.ts                 ← Shared type definitions
│       ├── mockData.ts                   ← Realistic demo data
│       └── mockSeed.ts                   ← Seed data on first boot
│
├── public/                               # Static assets
│   └── Readme Images/                    ← Screenshots for docs
│
├── .env.local                            # Environment variables (not committed)
├── next.config.ts                        # Next.js configuration
├── tsconfig.json                         # TypeScript configuration
└── package.json                          # Dependencies & scripts
```

---

## 🛠 Tech Stack

| Layer | Technology |
|:------|:----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **UI** | React 19 + Tailwind CSS 4 |
| **Identity Provider** | WSO2 Asgardeo |
| **Auth Protocol** | OAuth 2.0 + OpenID Connect |
| **User Provisioning** | SCIM 2.0 |
| **Token Validation** | `jose` (JWKS + JWT verification) |
| **Webhook Security** | HMAC-SHA256 with `crypto` |

---

## 🔐 Security Highlights

- ✅ **No passwords stored** — all authentication delegated to Asgardeo
- ✅ **PKCE flow** — protects against authorization code interception
- ✅ **HMAC-SHA256** — webhook payloads verified with timing-safe comparison
- ✅ **M2M isolation** — admin SCIM operations use separate server-side credentials
- ✅ **RBAC enforcement** — every route and UI element respects token role claims
- ✅ **Audit trail** — all identity events logged with full metadata (actor, IP, user agent)

---

## 📄 License

This project is for educational and demonstration purposes.

---

<p align="center">
  <strong>Built with ❤️ using WSO2 Asgardeo</strong><br />
  <sub>A production-grade demonstration of B2B Identity and Access Management</sub>
</p>