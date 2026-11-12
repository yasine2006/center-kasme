# Gestion Scolaire

Plateforme web de gestion pour écoles et centres de soutien : élèves, matières, groupes, inscriptions, présences, paiements mensuels, reçus PDF et rapports PDF / Excel.

Trois espaces selon le rôle :

- **Administrateur** : gestion complète du centre.
- **Enseignant** : ses groupes et la saisie des présences.
- **Élève / Parent** : ses matières, son emploi du temps, ses présences et ses paiements.

**Stack** : Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Prisma 6 + `@prisma/adapter-pg` · PostgreSQL · JWT + bcryptjs · Recharts · jsPDF · ExcelJS.

> Ce projet est livré **sans données de démonstration**. Après installation, la base contient uniquement l'école et le compte administrateur créés par le bootstrap.

---

## 1. Prérequis

- Node.js **>= 20.9** (22 LTS recommandé)
- npm
- Docker (PostgreSQL local) ou une base PostgreSQL / Neon

---

## 2. Installation locale

```bash
npm install
```

Créer `.env` à partir de `.env.example` :

```bash
cp .env.example .env
```

Sous PowerShell :

```powershell
Copy-Item .env.example .env
```

Générer les secrets :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Mettre la valeur dans `AUTH_SECRET`, puis relancer la commande pour `CRON_SECRET`.

Démarrer PostgreSQL local (port **5434**, isolé du projet principal) :

```bash
docker compose up -d
```

Appliquer les migrations :

```bash
npm run db:deploy
```

Créer l'école et le compte administrateur :

```bash
npm run db:bootstrap
```

Variables utilisées par le bootstrap (à mettre dans `.env`) :

```env
SCHOOL_NAME="Nom du centre"
SCHOOL_EMAIL="contact@exemple.ma"
SCHOOL_PHONE="0522 00 00 00"
SCHOOL_ADDRESS="Adresse, Ville"
ADMIN_NAME="Administrateur"
ADMIN_EMAIL="admin@exemple.ma"
ADMIN_PASSWORD="MotDePasseFort123!"
```

Vérifier que la base est bien vide :

```bash
npm run db:blank-check
```

Lancer l'application :

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) et se connecter avec `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

---

## 3. Déploiement production (Neon + Vercel)

### 3.1 Neon

1. Créer un projet sur [neon.tech](https://neon.tech).
2. Récupérer deux URLs :
   - **Direct** (sans `-pooler`) : pour les migrations.
   - **Pooled** (avec `-pooler`) : pour Vercel (runtime).

### 3.2 Migrations + bootstrap

En local, avec l'URL **direct** :

```powershell
$env:DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
npm run db:deploy
npm run db:bootstrap
npm run db:blank-check
```

### 3.3 Vercel

1. Importer le repo GitHub dans Vercel.
2. Framework : **Next.js**.
3. Node.js : **22.x**.
4. Variables d'environnement :

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | URL **pooled** Neon |
| `AUTH_SECRET` | secret aléatoire |
| `CRON_SECRET` | secret aléatoire |

5. Déployer.
6. Vérifier `GET /api/health` → `{"status":"ok","db":"up",...}`.

### 3.4 Tâches planifiées

Les endpoints sont en **POST** :

- `POST /api/cron/monthly-invoices` — le 1er de chaque mois à 01:00.
- `POST /api/cron/payment-reminders` — tous les jours à 09:00.

Header obligatoire :

```text
Authorization: Bearer <CRON_SECRET>
```

Exemple :

```bash
curl -fsS -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://<domaine>/api/cron/monthly-invoices
```

> Vercel Cron envoie des requêtes **GET**. Les routes actuelles n'acceptent que POST : utiliser un cron externe (crontab, cron-job.org, GitHub Actions) ou ajouter des handlers GET.

---

## 4. Règles métier

| Règle | Détail |
|---|---|
| **Mensualités** | Une facture par élève et par mois. Chaque ligne correspond à une inscription active. Mois entier, sans prorata. |
| **Échéance** | Le 5 de chaque mois. |
| **Relances** | Notification in-app + lien WhatsApp (`wa.me`), une fois par jour et par facture. |
| **Paiement par matière** | Un encaissement peut être affecté à une ligne de facture précise. |
| **Retirer / réactiver une matière** | `STOPPED` / `ACTIVE` sans supprimer l'historique. |
| **Inscriptions** | Ouvertes si `maintenant ∈ [début, fin]` et non clôturées. |
| **Sécurité** | `requireRole()` sur chaque page/action, filtrage par `schoolId`, journal d'audit. |
| **Absences** | Notification automatique au compte élève/parent. |
| **Présence enseignants** | Saisie par l'administrateur. |

---

## 5. Scripts

| Commande | Usage |
|---|---|
| `npm run dev` | Développement |
| `npm run build` | Build production |
| `npm run start` | Démarrage production |
| `npm run lint` | Linting |
| `npm run typecheck` | Vérification TypeScript |
| `npm run db:generate` | Générer le client Prisma |
| `npm run db:migrate` | Migrations en développement |
| `npm run db:deploy` | Migrations en production |
| `npm run db:bootstrap` | Créer l'école + l'admin (première installation) |
| `npm run db:blank-check` | Vérifier que la base est vide |
| `npm run db:check` | Contrôle d'intégrité relationnelle |
| `npm run db:studio` | Prisma Studio |

---

## 6. Structure

```text
src/
├── proxy.ts              # middleware Next 16 : JWT + redirections
├── app/
│   ├── admin/            # espace administrateur
│   ├── teacher/          # espace enseignant
│   ├── student/          # espace élève / parent
│   ├── api/              # health, receipts, reports, cron
│   └── login/
├── components/           # UI partagée
└── lib/                  # logique métier (session, facturation, PDF…)
prisma/                   # schema + migrations
scripts/                  # bootstrap, db-check, blank-check
```

---

## 7. Sécurité

- Ne jamais committer `.env`.
- Utiliser des secrets différents par environnement.
- `AUTH_SECRET` et `CRON_SECRET` sont obligatoires.
- En production, utiliser uniquement `prisma migrate deploy`.
- Sauvegarder la base (Neon PITR ou `pg_dump`).
- HTTPS obligatoire (Vercel le fournit).

---

## 8. Documentation

- Déploiement client : [`docs/deploiement-client.md`](docs/deploiement-client.md)
