# 🚀 HCS-U7 Dashboard Client

Dashboard client moderne et sécurisé pour la gestion des API HCS-U7 (Human Cognitive Signature). Interface complète avec authentification 3-facteurs, gestion des API keys, monitoring d'usage, et documentation intégrée.

## ✨ Fonctionnalités

### 🔐 Authentification Sécurisée
- **Triple authentification** : Email + Password + Code HCS-U7 unique
- **Hashing bcrypt** pour passwords et codes HCS-U7
- **Sessions JWT** sécurisées via NextAuth v4
- **Protection middleware** sur toutes les routes dashboard
- **Redirection automatique** si changement de mot de passe requis

### 📊 Dashboard Complet
- **Overview** : Stats en temps réel, graphiques d'usage, health check backend
- **API Keys** : Génération, rotation, et gestion des clés test/live
- **Usage** : Logs détaillés avec filtres avancés, export CSV, pagination
- **Billing** : Plan actuel, historique factures, gestion subscription
- **Settings** : Change password, update HCS code, profil info
- **Documentation** : Exemples API personnalisés, rate limits, error handling

### 🎯 Fonctionnalités Avancées (Phase 3)
- **Filtres intelligents** : Date range, endpoint, status code, method
- **Export CSV** : Téléchargement direct des logs filtrés
- **Pagination** : 50 résultats par page avec navigation fluide
- **Stats temps réel** : Success rate, avg response time, total cost
- **UI/UX moderne** : Dark mode, composants réactifs, animations

## 🛠 Stack Technique

- **Framework** : Next.js 15 avec App Router
- **Auth** : NextAuth v4 (credentials provider)
- **Database** : PostgreSQL avec Prisma ORM v7.0.1
- **Styling** : Tailwind CSS v3.4 + shadcn/ui
- **TypeScript** : v5 avec type safety complet
- **Runtime** : React 19 avec Server Components

## 📦 Installation

### Prérequis
- Node.js 18+ 
- PostgreSQL database
- npm ou yarn

### Étapes d'installation

1. **Cloner le repository**
```bash
git clone [repository-url]
cd hcs-u7-dashboard
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer l'environnement**
```bash
cp .env.example .env
```

Éditer `.env` avec vos valeurs :
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/hcsu7_db"

# NextAuth
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-secret-key-min-32-chars"

# HCS Backend
HCS_BACKEND_URL="https://hcs-u7-backend-production.up.railway.app"

# Stripe (optional)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

4. **Générer le client Prisma**
```bash
npx prisma generate
```

Note : La configuration Prisma utilise `prisma.config.ts` pour la configuration personnalisée.

5. **Démarrer en développement**
```bash
npm run dev
```

Ouvrir [http://localhost:3001](http://localhost:3001)

## 🔑 Authentification

### Flow de connexion
1. **Page Login** : `/login`
2. **Champs requis** :
   - Email du tenant
   - Password (hashé bcrypt)
   - Code HCS-U7 (format : `HCS-U7|V:8.0|ALG:QS|...`)
3. **Vérification** : Direct via Prisma, pas d'endpoint backend
4. **Session créée** : JWT avec `id`, `company`, `plan`, `mustChangePassword`
5. **Redirection** : `/dashboard/overview` ou `/dashboard/settings` si mot de passe temporaire

### Structure de la session
```typescript
{
  user: {
    id: string;        // Tenant ID
    email: string;
    name: string;      // fullName ou company
    company?: string;
    plan: string;      // TRIAL, STANDARD, PROFESSIONAL, ENTERPRISE
    mustChangePassword: boolean;
  }
}
```

## 📁 Structure du Projet

```
hcs-u7-dashboard/
├── src/
│   ├── app/                    # App Router pages
│   │   ├── login/              # Page de connexion
│   │   └── dashboard/          # Pages dashboard
│   │       ├── overview/       # Vue d'ensemble
│   │       ├── api-keys/       # Gestion des clés
│   │       ├── usage/          # Logs et stats
│   │       ├── billing/        # Facturation
│   │       ├── settings/       # Paramètres
│   │       └── docs/           # Documentation
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── shared/             # Components partagés
│   │   └── usage/              # Components spécifiques usage
│   ├── lib/
│   │   ├── auth.ts            # Configuration NextAuth
│   │   ├── api.ts             # Fonctions API
│   │   ├── prisma.ts          # Client Prisma
│   │   └── validation.ts      # Schemas Zod
│   └── styles/
│       └── globals.css         # Tailwind CSS
├── prisma/
│   └── schema.prisma           # Schema database
├── middleware.ts               # Protection des routes
└── package.json
```

## 🗄 Base de Données

### Tables principales
- **tenants** : Comptes clients avec auth fields (Model: `Tenant`)
- **api_keys** : Clés API test/live (Model: `ApiKey`)
- **usage_logs** : Historique des appels API (Model: `UsageLog`)
- **billing_events** : Factures et paiements (Model: `BillingEvent`)
- **admin_users** : Utilisateurs admin (Model: `AdminUser`)
- **audit_logs** : Actions d'audit (Model: `AuditLog`)

⚠️ **Note importante** : Les models Prisma utilisent des noms au singulier (`Tenant`, pas `Tenants`) dans le code.

### Schema Tenant
```prisma
model Tenant {
  id                  String   @id @default(cuid())
  email              String   @unique
  fullName           String?
  company            String?
  passwordHash       String   // bcrypt hash
  hcsCodeHash        String   // bcrypt hash
  mustChangePassword Boolean  @default(false)
  plan               Plan     @default(TRIAL)
  status             TenantStatus @default(ACTIVE)
  // ... autres champs
}
```

## 🚀 Déploiement

### Build de production
```bash
npm run build
npm run start
```

### Variables d'environnement requises
- `DATABASE_URL` : URL PostgreSQL de production
- `NEXTAUTH_URL` : URL de production (https://your-domain.com)
- `NEXTAUTH_SECRET` : Clé secrète forte (32+ caractères)
- `HCS_BACKEND_URL` : URL du backend HCS-U7

### Plateformes recommandées
- **Vercel** : Déploiement Next.js optimisé
- **Railway** : PostgreSQL + Next.js intégré
- **Heroku** : Option classique avec add-ons
- **DigitalOcean App Platform** : Simplicité et contrôle

## 📈 Monitoring

### Métriques suivies
- **Quota usage** : Appels API par période
- **Success rate** : Pourcentage de requêtes réussies
- **Response time** : Latence moyenne
- **Billing** : Coûts et factures

### Logs disponibles
- Tous les appels API avec status, durée, coût
- Filtrage par date, endpoint, status code, method
- Export CSV pour analyse externe

## 🔒 Sécurité

- **Passwords** : Hashage bcrypt avec salt rounds 10
- **HCS Codes** : Hashage bcrypt séparé
- **Sessions** : JWT signés, expiration 30 jours
- **API Keys** : Génération sécurisée, masquage live keys
- **HTTPS** : Requis en production
- **CORS** : Configuré pour le backend uniquement
- **Rate limiting** : 100 req/min par API key

## 🧪 Tests & Validation

```bash
# Tests unitaires (à implémenter)
npm run test

# Tests E2E (à implémenter)
npm run test:e2e

# Linting
npm run lint

# Type checking TypeScript
npx tsc --noEmit
```

## 🐛 Troubleshooting

### Erreur "Cannot find module"
Si vous rencontrez des erreurs d'import TypeScript :
1. Redémarrez le serveur TypeScript dans votre IDE
2. Dans VS Code : `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
3. Ou redémarrez complètement votre IDE

### Erreur Prisma "Property does not exist"
Si Prisma ne trouve pas les modèles :
```bash
# Régénérer le client Prisma
npx prisma generate

# Effacer le cache
rm -rf node_modules/.cache
rm -rf .next
```

### Session NextAuth invalide
- Vérifiez que `NEXTAUTH_SECRET` est défini et a au moins 32 caractères
- Assurez-vous que `NEXTAUTH_URL` correspond à votre URL locale/production

## 📚 Documentation API

Le dashboard inclut une documentation complète accessible à `/dashboard/docs` avec :
- Exemples cURL, JavaScript, Python
- Tous les endpoints HCS-U7
- Gestion des erreurs
- Rate limits
- Formats de réponse

## 🤝 Support

- **Email** : contact@ia-solution.fr
- **Documentation** : https://www.hcs-u7.com
- **Issues** : Via GitHub/GitLab

## 🔄 Dernières mises à jour

- **4 Dec 2024** : Correction des références Prisma (singular models)
- **4 Dec 2024** : Mise à jour des types TypeScript
- **Nov 2024** : Phase 3 complète avec filtres avancés et export CSV

## 📄 License

Propriétaire - IA Solution © 2024

---

**Dashboard développé par IA Solution pour HCS-U7**  
**Version** : 3.1.0
