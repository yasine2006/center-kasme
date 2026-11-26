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

Elles sont déjà configurées dans `vercel.json` (Vercel Cron) :

| Endpoint | Planification (UTC) | Heure locale (UTC+1) |
|---|---|---|
| `/api/cron/monthly-invoices` | `0 0 * * *` | tous les jours à 01:00 |
| `/api/cron/payment-reminders` | `0 8 * * *` | tous les jours à 09:00 |

Vercel envoie automatiquement l'en-tête `Authorization: Bearer <CRON_SECRET>` dès que la variable `CRON_SECRET` existe sur le projet.

Les routes acceptent **GET** (Vercel Cron) et **POST** (test manuel / cron externe). Header obligatoire :

```text
Authorization: Bearer <CRON_SECRET>
```

Test manuel :

```bash
curl -fsS -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://<domaine>/api/cron/monthly-invoices
```

> Sur le plan Hobby, Vercel limite à 2 cron jobs et à une exécution par jour maximum : les deux planifications ci-dessus respectent ces limites.

---

## 4. Règles métier

| Règle | Détail |
|---|---|
| **Mensualités** | Une facture par élève et par cycle. Le cycle démarre le jour de la première inscription et dure un mois (jour identique le mois suivant, borné au dernier jour du mois). Premier cycle = mensualité complète, sans prorata. |
| **Échéance** | Anniversaire mensuel de l'inscription (UTC), ramené au dernier jour du mois si besoin. Ex. inscription le 15/10 → échéance le 15/11 puis le 15/12 ; inscription le 31/01 → 28/02 (29 les années bissextiles) puis 31/03. Aucun délai de grâce, retard remis à 0 chaque mois. |
| **Relances** | Notification in-app + lien WhatsApp (`wa.me`) ouvert manuellement, jamais d'envoi automatique. Le filtre « Échéances à ce jour » ne relance que le mois affiché ; « Tous les retardataires » couvre le mois affiché et le précédent. |
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
| `npm test` | Tests unitaires (Vitest) |
| `npm run test:watch` | Tests en mode watch |
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
tests/                    # tests unitaires Vitest
vitest.config.mts         # configuration des tests
```

---

## 7. Sécurité

- Ne jamais committer `.env`.
- Utiliser des secrets différents par environnement.
- `AUTH_SECRET` et `CRON_SECRET` sont obligatoires (32 caractères aléatoires minimum ; les valeurs d'`example` sont refusées).
- `NEXT_PUBLIC_SITE_URL` doit être l'URL publique (`https://www.elitekacemcenter.com`) pour les métadonnées, le sitemap et robots.txt.
- En production, utiliser uniquement `prisma migrate deploy`.
- Sauvegarder la base (Neon PITR ou `pg_dump`).
- HTTPS obligatoire (Vercel le fournit).

---

## 8. Documentation

- Déploiement client : [`docs/deploiement-client.md`](docs/deploiement-client.md)
