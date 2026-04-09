# WWB Investissement SCI

Plateforme de gestion d'investissement immobilier pour SCI. Application web moderne avec Next.js, base de données PostgreSQL, et authentification intégrée.

## Stack technique

- **Next.js 14+** (App Router, Server Components, API Routes)
- **TypeScript** (strict mode)
- **Tailwind CSS v4** + **shadcn/ui**
- **Prisma** ORM + **Neon PostgreSQL** (serverless)
- **NextAuth.js v5** (email/password auth)
- **Recharts** (graphiques)
- **lucide-react** (icônes)
- **PWA** installable sur mobile

## Modules

| Module | Description |
|---|---|
| Dashboard | KPIs, tâches récentes, deals récents, graphique cash flow |
| Tâches | Todo list avec vue liste et kanban, priorités, catégories |
| Calculateur | Simulateur de coût projet immobilier en temps réel |
| Deals | Suivi des opportunités immobilières avec fiche détaillée |
| Finance | Apport, capacité d'emprunt, contacts banques, checklist documents |
| SCI | Infos juridiques SCI et checklist de création |
| Contacts | CRM simple (agents, notaires, courtiers, comptables, artisans) |
| Paramètres | Export/Import JSON, infos compte |

## Prérequis

- Node.js 18+
- Un compte [Neon](https://neon.tech) (gratuit)

## Installation

```bash
# 1. Cloner le repo
git clone <url> && cd "WWB invest"

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
```

Éditez `.env` avec vos valeurs :

```
DATABASE_URL="postgresql://<user>:<password>@<host>/wwb?sslmode=require"
AUTH_SECRET="<openssl rand -base64 32>"
AUTH_URL="http://localhost:3000"
```

Pour obtenir la `DATABASE_URL` :
1. Créez un projet sur [neon.tech](https://neon.tech)
2. Copiez la connection string depuis le dashboard Neon

Pour générer `AUTH_SECRET` :
```bash
openssl rand -base64 32
```

```bash
# 4. Générer le client Prisma et appliquer les migrations
npx prisma generate
npx prisma db push

# 5. (Optionnel) Peupler avec des données d'exemple
npx prisma db seed

# 6. Lancer le serveur de développement
npm run dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000).

### Compte par défaut (après seed)

- Email : `admin@wwb.fr`
- Mot de passe : `admin123`

## Build production

```bash
npm run build
npm start
```

## Déploiement sur Vercel

1. Poussez votre code sur GitHub
2. Importez le repo sur [vercel.com](https://vercel.com)
3. Ajoutez les variables d'environnement dans les settings Vercel :
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `AUTH_URL` (= l'URL de votre déploiement Vercel)
4. Vercel détectera automatiquement Next.js et déploiera

> Neon + Vercel fonctionnent parfaitement ensemble. Les deux offrent des tiers gratuits suffisants pour ce projet.

## Structure du projet

```
app/
  (auth)/          → Pages login / register (layout sans sidebar)
  (app)/           → Pages protégées (layout avec sidebar + mobile nav)
  api/             → API Route Handlers (CRUD)
components/
  ui/              → Composants shadcn/ui
  layout/          → Sidebar, MobileNav, Header, AppShell
  shared/          → KpiCard, EmptyState, ConfirmDialog, SearchInput
  providers/       → SessionProvider (NextAuth)
features/
  tasks/           → Composants spécifiques aux tâches
  deals/           → Composants spécifiques aux deals
lib/
  auth.ts          → Config NextAuth
  prisma.ts        → Client Prisma singleton
  calculations.ts  → Logique de calcul financier
  constants.ts     → Constantes et options
  utils.ts         → Utilitaires (cn, formatDate, formatCurrency)
prisma/
  schema.prisma    → Schéma de base de données
  seed.ts          → Script de peuplement
types/
  index.ts         → Types TypeScript partagés
```

## PWA

L'application est installable sur mobile :
1. Ouvrez l'app dans Chrome/Safari
2. Utilisez "Ajouter à l'écran d'accueil"

## Licence

Projet privé — WWB Investissement SCI
