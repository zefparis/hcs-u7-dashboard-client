# 📊 Rapport Technique Complet - HCS-U7 Dashboard

## 🎯 Vue d'Ensemble

**HCS-U7 Dashboard** est une console client SaaS permettant aux tenants de gérer leur intégration avec l'API HCS-U7 (Human Cognitive Signature). L'application est construite avec Next.js 14+ (App Router), utilise NextAuth pour l'authentification et se connecte à une base PostgreSQL via Prisma/pg.

| Élément | Technologie |
|---------|-------------|
| **Framework** | Next.js 14+ (App Router, RSC) |
| **Auth** | NextAuth.js v4 (JWT Strategy) |
| **ORM** | Prisma + pg Pool |
| **Base de données** | PostgreSQL (Supabase) |
| **UI** | TailwindCSS + shadcn/ui |
| **Déploiement** | Vercel |
| **Backend API** | Fastify (Railway) |

---

## 📁 Arborescence du Projet

```
hcs-u7-dashboard/
├── prisma/
│   ├── schema.prisma          # Schéma de la base de données
│   └── seed.cjs               # Script de seed pour les données initiales
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts   # Handler NextAuth
│   │   │   ├── debug-auth/route.ts           # [TEMP] Debug endpoint
│   │   │   └── test-auth/route.ts            # [TEMP] Test endpoint
│   │   │
│   │   ├── dashboard/
│   │   │   ├── layout.tsx                    # Layout dashboard avec sidebar
│   │   │   ├── page.tsx                      # Redirect vers /overview
│   │   │   ├── overview/page.tsx             # Vue d'ensemble
│   │   │   ├── api-keys/page.tsx             # Gestion des clés API
│   │   │   ├── usage/
│   │   │   │   ├── page.tsx                  # Logs d'utilisation (SSR)
│   │   │   │   └── usage-client.tsx          # Client component filtres
│   │   │   ├── billing/page.tsx              # Facturation
│   │   │   ├── security/page.tsx             # Cognitive Firewall
│   │   │   ├── sca/page.tsx                  # SCA PSD2
│   │   │   ├── integration/page.tsx          # Exemples de code
│   │   │   ├── docs/page.tsx                 # Documentation API
│   │   │   ├── settings/page.tsx             # Paramètres compte
│   │   │   └── account/page.tsx              # Profil tenant
│   │   │
│   │   ├── login/page.tsx                    # Page de connexion
│   │   ├── layout.tsx                        # Root layout
│   │   ├── page.tsx                          # Landing (redirect)
│   │   ├── globals.css                       # Styles Tailwind
│   │   └── theme-provider.tsx                # Dark/Light mode
│   │
│   ├── components/
│   │   ├── shared/
│   │   │   ├── dashboard-shell.tsx           # Shell avec sidebar
│   │   │   ├── login-form.tsx                # Formulaire de login
│   │   │   ├── logout-button.tsx             # Bouton déconnexion
│   │   │   ├── copy-button.tsx               # Copier dans presse-papier
│   │   │   └── theme-toggle.tsx              # Toggle dark/light
│   │   │
│   │   ├── ui/                               # shadcn/ui components
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   └── table.tsx
│   │   │
│   │   └── usage/
│   │       └── usage-filters.tsx             # Filtres pour logs
│   │
│   └── lib/
│       ├── auth.ts                           # Configuration NextAuth
│       ├── api.ts                            # Fonctions API (requêtes DB)
│       ├── db.ts                             # Pool PostgreSQL
│       ├── prisma.ts                         # Client Prisma
│       ├── hcs-backend.ts                    # Client API backend HCS
│       ├── stripe.ts                         # Configuration Stripe
│       ├── validation.ts                     # Schémas Zod
│       └── utils.ts                          # Utilitaires (cn, etc.)
│
├── middleware.ts                             # Protection routes NextAuth
├── next.config.ts                            # Configuration Next.js
├── tailwind.config.ts                        # Configuration Tailwind
├── tsconfig.json                             # Configuration TypeScript
└── package.json                              # Dépendances
```

---

## 🔐 Système d'Authentification

### Flux de Connexion

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FLUX D'AUTHENTIFICATION                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. Utilisateur → /login                                                │
│         │                                                               │
│         ▼                                                               │
│  2. LoginForm (Client Component)                                        │
│         │ email + password + hcsCode                                    │
│         ▼                                                               │
│  3. signIn("credentials", { redirect: false, ... })                     │
│         │                                                               │
│         ▼                                                               │
│  4. NextAuth authorize() [src/lib/auth.ts]                              │
│         │                                                               │
│         ├─► Validation Zod (loginSchema)                                │
│         │                                                               │
│         ├─► prisma.tenant.findUnique({ email })                         │
│         │                                                               │
│         ├─► Vérification statut (ACTIVE, TRIAL)                         │
│         │                                                               │
│         ├─► bcrypt.compare(password, passwordHash)                      │
│         │                                                               │
│         ├─► bcrypt.compare(hcsCode, hcsCodeHash)                        │
│         │                                                               │
│         ▼                                                               │
│  5. JWT Token créé avec { id, email, company, plan, mustChangePassword }│
│         │                                                               │
│         ▼                                                               │
│  6. Cookie session créé (__Secure-next-auth.session-token)              │
│         │                                                               │
│         ▼                                                               │
│  7. Redirect → /dashboard/overview                                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Configuration NextAuth (`src/lib/auth.ts`)

```typescript
authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  cookies: {
    sessionToken: {
      name: "__Secure-next-auth.session-token" (prod),
      options: { httpOnly: true, sameSite: "lax", secure: true }
    }
  },
  providers: [CredentialsProvider],
  callbacks: { jwt, session },
  pages: { signIn: "/login" }
}
```

### Middleware de Protection (`middleware.ts`)

```typescript
// Protège toutes les routes /dashboard/*
export const config = { matcher: ["/dashboard/:path*"] };

// Vérifie mustChangePassword → redirect /dashboard/settings
```

### Schémas de Validation (`src/lib/validation.ts`)

| Schéma | Champs | Validation |
|--------|--------|------------|
| `loginSchema` | email, password, hcsCode | email valide, password ≥8 chars, hcsCode ≥50 chars + regex `^HCS-U7\|` |
| `changePasswordSchema` | currentPassword, newPassword, confirmPassword | password ≥8 chars, regex complexité, match confirmation |
| `changeHcsCodeSchema` | currentHcsCode, newHcsCode, confirmHcsCode | hcsCode ≥50 chars + regex, match confirmation |

---

## 🗄️ Modèle de Données (Prisma)

### Entités Principales

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SCHÉMA BASE DE DONNÉES                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐                                                    │
│  │     Tenant      │ ←──────────────────────────────────────────────┐   │
│  ├─────────────────┤                                                │   │
│  │ id              │                                                │   │
│  │ email (unique)  │                                                │   │
│  │ fullName        │                                                │   │
│  │ company         │                                                │   │
│  │ website         │                                                │   │
│  │ passwordHash    │ ◄── bcrypt hash                                │   │
│  │ hcsCodeHash     │ ◄── bcrypt hash                                │   │
│  │ mustChangePassword │                                             │   │
│  │ plan            │ ◄── ENUM: FREE|STARTER|PRO|BUSINESS|ENTERPRISE │   │
│  │ status          │ ◄── ENUM: TRIAL|ACTIVE|SUSPENDED|CANCELLED     │   │
│  │ monthlyQuota    │                                                │   │
│  │ currentUsage    │                                                │   │
│  │ trialEndsAt     │                                                │   │
│  │ subscriptionStartedAt │                                          │   │
│  │ createdAt       │                                                │   │
│  │ updatedAt       │                                                │   │
│  └────────┬────────┘                                                │   │
│           │                                                         │   │
│           │ 1:N                                                     │   │
│           ▼                                                         │   │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │   │
│  │     ApiKey      │    │    UsageLog     │    │  BillingEvent   │  │   │
│  ├─────────────────┤    ├─────────────────┤    ├─────────────────┤  │   │
│  │ id              │    │ id              │    │ id              │  │   │
│  │ keyHash         │    │ tenantId ───────┼────│ tenantId ───────┼──┘   │
│  │ keyPrefix       │    │ endpoint        │    │ type            │      │
│  │ lastFourChars   │    │ method          │    │ amount          │      │
│  │ environment     │    │ statusCode      │    │ currency        │      │
│  │ tenantId ───────┼────│ cost            │    │ periodStart     │      │
│  │ isActive        │    │ ipAddress       │    │ periodEnd       │      │
│  │ scopes[]        │    │ responseTime    │    │ stripeInvoiceId │      │
│  │ rateLimit       │    │ createdAt       │    │ stripePaid      │      │
│  │ expiresAt       │    └─────────────────┘    │ createdAt       │      │
│  └─────────────────┘                           └─────────────────┘      │
│                                                                         │
│  ┌─────────────────┐    ┌─────────────────┐                             │
│  │   AdminUser     │    │    AuditLog     │                             │
│  ├─────────────────┤    ├─────────────────┤                             │
│  │ id              │    │ id              │                             │
│  │ email           │    │ adminUserId     │                             │
│  │ passwordHash    │    │ action          │                             │
│  │ role            │    │ entityType      │                             │
│  │ fullName        │    │ entityId        │                             │
│  │ lastLoginAt     │    │ changes (JSON)  │                             │
│  └─────────────────┘    │ createdAt       │                             │
│                         └─────────────────┘                             │
└─────────────────────────────────────────────────────────────────────────┘
```

### Enums

| Enum | Valeurs |
|------|---------|
| `TenantPlan` | FREE, STARTER, PRO, BUSINESS, ENTERPRISE |
| `TenantStatus` | TRIAL, ACTIVE, SUSPENDED, CANCELLED, CHURNED |
| `Environment` | PRODUCTION, STAGING, DEVELOPMENT |
| `AdminRole` | SUPER_ADMIN, ADMIN, SUPPORT, VIEWER |
| `BillingEventType` | SUBSCRIPTION_CREATED, SUBSCRIPTION_RENEWED, OVERAGE_CHARGE, PLAN_UPGRADED, PLAN_DOWNGRADED, REFUND, PAYMENT_FAILED, TRIAL_STARTED, TRIAL_ENDED |

---

## 🛣️ Routes et Pages

### Routes Publiques

| Route | Fichier | Description |
|-------|---------|-------------|
| `/` | `src/app/page.tsx` | Landing page (redirect vers /login) |
| `/login` | `src/app/login/page.tsx` | Page de connexion |

### Routes Protégées (Dashboard)

| Route | Fichier | Description | Données |
|-------|---------|-------------|---------|
| `/dashboard` | `page.tsx` | Redirect → /overview | - |
| `/dashboard/overview` | `overview/page.tsx` | Vue d'ensemble | `getOverview()` |
| `/dashboard/api-keys` | `api-keys/page.tsx` | Gestion clés API | `getApiKeys()` |
| `/dashboard/usage` | `usage/page.tsx` | Logs d'utilisation | `getUsageLogs()` |
| `/dashboard/billing` | `billing/page.tsx` | Facturation | `getBillingInfo()` |
| `/dashboard/security` | `security/page.tsx` | Cognitive Firewall | `getSecurityData()` |
| `/dashboard/sca` | `sca/page.tsx` | SCA PSD2 | `getSCAData()` |
| `/dashboard/integration` | `integration/page.tsx` | Exemples de code | `getIntegrationExamples()` |
| `/dashboard/docs` | `docs/page.tsx` | Documentation API | `getApiKeys()` |
| `/dashboard/settings` | `settings/page.tsx` | Paramètres sécurité | Prisma direct |
| `/dashboard/account` | `account/page.tsx` | Profil tenant | `getTenantProfile()` |

### Routes API

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/auth/[...nextauth]` | GET/POST | Handler NextAuth |
| `/api/debug-auth` | GET/POST/PUT | [TEMP] Debug authentification |
| `/api/test-auth` | GET | [TEMP] Test session |

---

## 📊 Fonctions API (`src/lib/api.ts`)

### Fonctions de Lecture

| Fonction | Paramètres | Retour | Description |
|----------|------------|--------|-------------|
| `getOverview(tenantId)` | string | `OverviewResponse` | Quota, usage 7/30j, appels récents, health backend |
| `getApiKeys(tenantId)` | string | `ApiKeysResponse` | Liste des clés API actives |
| `getUsageLogs(tenantId)` | string | `UsageResponse` | Logs d'utilisation + agrégats quotidiens |
| `getIntegrationExamples(tenantId)` | string | `IntegrationExamples` | Exemples de code avec clé API |
| `getTenantProfile(tenantId)` | string | `TenantProfile` | Profil complet du tenant |
| `getSecurityData(tenantId)` | string | `SecurityData` | Score sécurité + presets |
| `getSCAData(tenantId)` | string | `SCAData` | Config SCA + stats + décisions |
| `getBillingInfo(tenantId)` | string | `BillingInfo` | Plan actuel + factures |

### Fonctions d'Écriture

| Fonction | Paramètres | Retour | Description |
|----------|------------|--------|-------------|
| `rotateApiKey(tenantId, { type })` | string, { type: "test" \| "live" } | `RotateApiKeyResult` | Génère nouvelle clé, désactive ancienne |
| `updateTenantProfile(tenantId, data)` | string, { fullName?, company?, website? } | `TenantProfile` | Met à jour le profil |

### Server Actions (dans les pages)

| Action | Page | Description |
|--------|------|-------------|
| `changePasswordAction` | settings | Change le mot de passe (bcrypt) |
| `changeHcsCodeAction` | settings | Change le code HCS (bcrypt) |
| `updateProfileAction` | account | Met à jour le profil |
| `rotateTestKeyAction` | api-keys | Rotation clé TEST |
| `rotateLiveKeyAction` | api-keys | Rotation clé LIVE |

---

## 🔌 Client Backend HCS (`src/lib/hcs-backend.ts`)

### Configuration

```typescript
const HCS_BACKEND_URL = process.env.HCS_BACKEND_URL || "http://localhost:4000";
// Production: https://hcs-u7-backend-production.up.railway.app
```

### Endpoints Backend

| Fonction | Endpoint | Description |
|----------|----------|-------------|
| `checkBackendHealth()` | GET /health | Vérifie la santé du backend |
| `verifyHuman(apiKey, request)` | POST /api/verify-human | Vérifie si l'utilisateur est humain |
| `adaptiveVerify(apiKey, request)` | POST /api/adaptive-verify | Décision adaptative multi-signaux |
| `quickAuth(apiKey, request)` | POST /api/quick-auth | Génère un token JWT rapide |
| `secureLogin(apiKey, request)` | POST /api/secure-login | Décision de login sécurisé |
| `evaluateSCA(apiKey, request)` | POST /api/sca/evaluate | Évaluation SCA PSD2 |
| `getSCAConfig(apiKey)` | GET /api/sca/config | Configuration SCA |
| `updateSCAConfig(apiKey, config)` | PATCH /api/sca/config | Mise à jour config SCA |
| `getSCADecisions(apiKey, params)` | GET /api/sca/decisions | Historique décisions SCA |

---

## 🛡️ Sécurité

### Cognitive Firewall (Page Security)

```
┌─────────────────────────────────────────────────────────────────┐
│  HCS-U7 COGNITIVE FIREWALL                                      │
│                                                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │   HCS   │ │ Device  │ │ Network │ │Behavior │ │ Trust   │   │
│  │  Score  │ │  Risk   │ │  Risk   │ │ Anomaly │ │ Graph   │   │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘   │
│       │          │          │          │          │            │
│       └──────────┴──────────┴──────────┴──────────┘            │
│                           │                                     │
│                    ┌──────▼──────┐                              │
│                    │   COMBINER  │                              │
│                    │  + SCA PSD2 │                              │
│                    └──────┬──────┘                              │
│                           │                                     │
│              ┌────────────┼────────────┐                        │
│              ▼            ▼            ▼                        │
│           ALLOW      CHALLENGE       DENY                       │
└─────────────────────────────────────────────────────────────────┘
```

### Signaux de Sécurité

| Signal | Détections |
|--------|------------|
| **Device Risk** | WebDriver, Headless Browser, Emulator, VM, Fingerprint Anomalies |
| **Network Risk** | VPN, Tor, Proxy, Datacenter IPs, High-Risk Countries |
| **Behavior Anomaly** | Keystroke Dynamics, Mouse Velocity, Instant Form Fill, Copy-Paste |
| **Trust Graph** | Account Age, Device History, Chargeback History, Fraud Ring |
| **HCS Score** | Quick-Auth Token, Rotating Code, Vocal Metrics, Cognitive Profile |
| **Celestial Entropy** | Planetary Positions, Lunar Phase, Celestial Nonce |

### Presets Combiner

| Preset | Description |
|--------|-------------|
| `strict` | Seuils bas, plus restrictif (transactions haute valeur) |
| `lenient` | Seuils hauts, plus permissif (opérations faible risque) |
| `hcsFocused` | HCS score pondéré à 50% |
| `behaviorFocused` | Analyse comportementale pondérée à 40% |
| `noHardRules` | Moyenne pondérée pure, pas de blocages automatiques |

---

## 💳 SCA PSD2 (Page SCA)

### Configuration

| Paramètre | Valeur par défaut | Description |
|-----------|-------------------|-------------|
| `lowValueThreshold` | 30€ | Seuil exemption faible valeur |
| `lowValueCumulativeMax` | 100€ | Maximum cumulatif |
| `lowValueMaxOperations` | 5 | Nombre max d'opérations |
| `traEnabled` | true | TRA activé |
| `traThresholds.low` | 500€ | Seuil risque faible |
| `traThresholds.medium` | 250€ | Seuil risque moyen |
| `traThresholds.high` | 100€ | Seuil risque élevé |
| `hardBlockAmount` | 10000€ | Blocage dur |

### Types d'Exemption

| Type | Article RTS | Description |
|------|-------------|-------------|
| `LOW_VALUE` | Article 11 | Transactions < 30€ |
| `TRA` | Article 18 | Transaction Risk Analysis |
| `TRUSTED_BENEFICIARY` | Article 13 | Bénéficiaire de confiance |
| `RECURRING` | Article 14 | Transactions récurrentes |

---

## 🔑 Gestion des Clés API

### Format des Clés

```
hcs_sk_{env}_{random_base64url}
│    │   │    │
│    │   │    └── 24 bytes random (base64url)
│    │   └── "test" ou "live"
│    └── "sk" = secret key
└── préfixe HCS
```

### Exemple

```
hcs_sk_test_abc123xyz789...
hcs_sk_live_def456uvw012...
```

### Stockage

- **keyHash**: bcrypt hash de la clé complète
- **keyPrefix**: `hcs_sk_test` ou `hcs_sk_live`
- **lastFourChars**: 4 derniers caractères pour identification

---

## 📈 Variables d'Environnement

### Requises

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DATABASE_URL` | URL PostgreSQL Supabase | `postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres` |
| `NEXTAUTH_SECRET` | Secret JWT (≥32 chars) | `eb6e532f46326089e5310cabca2780b3e43f768b1e8f0c833c01828cf0bc669e` |
| `NEXTAUTH_URL` | URL de l'application | `https://www.hcs-u7.online` |

### Optionnelles

| Variable | Description | Défaut |
|----------|-------------|--------|
| `HCS_BACKEND_URL` | URL du backend Fastify | `http://localhost:4000` |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe | - |
| `STRIPE_WEBHOOK_SECRET` | Secret webhook Stripe | - |

---

## 🚀 Déploiement

### Vercel

1. **Build Command**: `next build`
2. **Output Directory**: `.next`
3. **Install Command**: `npm install`
4. **Node.js Version**: 18.x

### Variables à configurer dans Vercel

```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://www.hcs-u7.online
HCS_BACKEND_URL=https://hcs-u7-backend-production.up.railway.app
```

---

## ⚠️ Points d'Attention

### À Supprimer en Production

1. `src/app/api/debug-auth/route.ts` - Endpoint de debug temporaire
2. `src/app/api/test-auth/route.ts` - Endpoint de test temporaire

### Problème Connu

Le hash du code HCS stocké en base ne correspond pas toujours au code envoyé par email. Cela provient du dashboard admin qui doit être vérifié pour s'assurer que le code HCS est hashé correctement avant stockage.

### Sécurité

- Les clés LIVE ne sont jamais affichées en clair après création
- Les mots de passe et codes HCS sont hashés avec bcrypt (cost 10)
- Les sessions JWT expirent après 30 jours
- Le middleware protège toutes les routes `/dashboard/*`

---

## 📞 Support

- **Email**: contact@ia-solution.fr
- **Site**: https://www.hcs-u7.com
- **Dashboard**: https://www.hcs-u7.online

---

*Rapport généré le 5 décembre 2025*
