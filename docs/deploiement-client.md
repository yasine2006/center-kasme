# Déploiement client — Neon + GitHub + Vercel

Guide pas à pas pour mettre ce projet en production.
À la fin, la base contient **1 école + 1 compte administrateur**, et rien d'autre : 0 élève, 0 enseignant, 0 groupe, 0 facture.

> Le projet existant `school-management` (Centre Excellence) n'est **jamais** touché : ce dossier est une copie autonome, avec sa propre base et son propre dépôt Git.

---

## 0. Résumé du parcours

1. Créer une base **Neon** (production).
2. Appliquer les migrations + créer l'école et l'admin (bootstrap).
3. Créer un dépôt **GitHub** et pousser le code.
4. Importer le dépôt dans **Vercel**, configurer les variables d'environnement.
5. Vérifier le déploiement (`/api/health`, connexion admin).
6. Configurer les tâches planifiées (cron externe).
7. Sauvegarder la base.

---

## 1. Base de données Neon

1. Aller sur [https://neon.tech](https://neon.tech) et créer un compte.
2. **New Project** :
   - Nom : `gestion-scolaire` (ou le nom du client)
   - Region : la plus proche des utilisateurs (ex. `AWS eu-west-2` / `eu-central-1`)
   - Postgres : version 16 ou 17
3. Dans **Dashboard → Connection Details**, récupérer **deux** chaînes :

| Type | Aspect de l'URL | Usage |
|---|---|---|
| **Direct** | `...@ep-xxx.region.aws.neon.tech/neondb` (sans `-pooler`) | migrations, bootstrap |
| **Pooled** | `...@ep-xxx-pooler.region.aws.neon.tech/neondb` (avec `-pooler`) | runtime Vercel |

Les deux doivent finir par `?sslmode=require`.

> Important : les migrations Prisma passent par la connexion **directe**. L'application sur Vercel utilise la connexion **pooled**.

---

## 2. Migrations + école + admin

Depuis le dossier du projet, en PowerShell.

### 2.1 URL directe pour les migrations

```powershell
$env:DATABASE_URL="postgresql://USER:PASSWORD@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
npm run db:deploy
```

Cela crée toutes les tables (16 modèles, 7 enums) et l'extension `unaccent`. **Aucune donnée** n'est insérée.

### 2.2 Créer l'école et l'administrateur

Renseigner les variables du bootstrap (elles ne sont **pas** nécessaires sur Vercel) :

```powershell
$env:SCHOOL_NAME="Nom du centre"
$env:SCHOOL_EMAIL="contact@exemple.ma"
$env:SCHOOL_PHONE="0522 00 00 00"
$env:SCHOOL_ADDRESS="Adresse, Ville"
$env:ADMIN_NAME="Administrateur"
$env:ADMIN_EMAIL="admin@exemple.ma"
$env:ADMIN_PASSWORD="MotDePasseFort123!"
npm run db:bootstrap
```

Le script est **idempotent** : s'il existe déjà une école, il ne fait rien.

Résultat attendu :

```text
OK — school #1 (Nom du centre) + admin #1 (admin@exemple.ma)
Database is blank: 0 student, 0 teacher, 0 group, 0 invoice.
```

### 2.3 Vérifier que la base est vide

```powershell
npm run db:blank-check
```

Attendu : `=== OK: database is blank (only School + ADMIN allowed) ===`

Si le script signale des données, **ne pas déployer** : c'est probablement la mauvaise base (vérifier l'URL Neon).

> Conserver `ADMIN_EMAIL` / `ADMIN_PASSWORD` en lieu sûr : c'est le seul compte d'accès initial.

---

## 3. Dépôt GitHub

### 3.1 Initialiser le dépôt (première fois)

```powershell
git init
git add .
git commit -m "Initial commit - gestion scolaire (base vide)"
```

> Le fichier `.env` est ignoré par `.gitignore`. Ne jamais le committer.

### 3.2 Créer le dépôt distant

1. Sur [https://github.com/new](https://github.com/new), créer un dépôt **privé**, sans README ni `.gitignore`.
2. Pousser :

```powershell
git remote add origin https://github.com/<compte>/<repo>.git
git branch -M main
git push -u origin main
```

---

## 4. Vercel

1. [https://vercel.com/new](https://vercel.com/new) → **Import Git Repository** → choisir le dépôt.
2. Réglages :
   - **Framework Preset** : Next.js (détecté automatiquement)
   - **Root Directory** : `.` (racine)
   - **Build Command** : `npm run build` (par défaut)
   - **Install Command** : `npm install` (par défaut)
   - **Node.js Version** : `22.x`
3. **Environment Variables** (Production **et** Preview) :

| Variable | Valeur | Obligatoire |
|---|---|---|
| `DATABASE_URL` | URL Neon **pooled** (`-pooler`) | oui |
| `AUTH_SECRET` | secret aléatoire (32 octets base64) | oui |
| `CRON_SECRET` | autre secret aléatoire | oui |

Générer un secret :

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

4. **Deploy**.

> `DATABASE_URL` sur Vercel doit être l'URL **pooled**. Utiliser l'URL directe pour `npm run db:deploy` / `db:bootstrap` en local.

---

## 5. Vérifications après déploiement

| Test | Résultat attendu |
|---|---|
| `GET https://<domaine>/api/health` | `{"status":"ok","db":"up",...}` |
| `GET https://<domaine>/login` | page de connexion |
| Connexion avec `ADMIN_EMAIL` / `ADMIN_PASSWORD` | accès à l'espace admin |
| Listes élèves / enseignants / groupes | vides |
| Création d'une matière / d'un groupe | fonctionne |

Si `/api/health` renvoie une erreur `db: down` :

- vérifier que `DATABASE_URL` est bien l'URL **pooled** ;
- vérifier `?sslmode=require` ;
- vérifier que les migrations ont été appliquées sur **cette** base Neon.

---

## 6. Tâches planifiées (cron)

Deux endpoints existent :

| Endpoint | Quand | Rôle |
|---|---|---|
| `/api/cron/monthly-invoices` | tous les jours à 01:00 | génère les factures des cycles qui démarrent |
| `/api/cron/payment-reminders` | tous les jours à 09:00 | relances de paiement (tous les impayés) |

Ils exigent :

```text
Authorization: Bearer <CRON_SECRET>
```

### 6.1 Vercel Cron (déjà configuré)

Le fichier `vercel.json` déclare les deux jobs :

```json
{
  "crons": [
    { "path": "/api/cron/monthly-invoices", "schedule": "0 0 * * *" },
    { "path": "/api/cron/payment-reminders", "schedule": "0 8 * * *" }
  ]
}
```

Les horaires sont en **UTC** : `00:00 UTC` = `01:00` au Maroc (UTC+1), `08:00 UTC` = `09:00`.

Vercel envoie automatiquement `Authorization: Bearer <CRON_SECRET>` si la variable `CRON_SECRET` est définie sur le projet. Les routes acceptent **GET** (Vercel Cron) et **POST** (test / cron externe).

> Plan Hobby : maximum 2 cron jobs et une exécution par jour. Les planifications ci-dessus sont compatibles.

### 6.2 Alternative — cron externe

Si tu préfères un cron externe, appelle les routes en **POST** avec le header `Authorization: Bearer <CRON_SECRET>`.

**cron-job.org** : deux jobs, méthode POST, header `Authorization: Bearer <CRON_SECRET>`, fuseau `Africa/Casablanca`, planification `0 1 * * *` et `0 9 * * *`.

**crontab** :

```cron
0 1 * * * curl -fsS -X POST -H "Authorization: Bearer <CRON_SECRET>" https://<domaine>/api/cron/monthly-invoices
0 9 * * * curl -fsS -X POST -H "Authorization: Bearer <CRON_SECRET>" https://<domaine>/api/cron/payment-reminders
```

### 6.3 Test manuel

```powershell
curl.exe -i -X POST -H "Authorization: Bearer <CRON_SECRET>" https://<domaine>/api/cron/monthly-invoices
```

Attendu : `200` avec un résumé JSON (`{"ok":true,"generated":0,...}` tant qu'il n'y a pas d'élève). `401` = mauvais secret.

---

## 7. Sauvegarde et exploitation

- **Neon** : activer la restauration à un instant donné (PITR) si disponible sur le plan.
- **Dump manuel** :

```powershell
pg_dump "postgresql://USER:PASSWORD@ep-xxx.region.aws.neon.tech/neondb?sslmode=require" -Fc -f backup.dump
```

- **Rotation des secrets** : changer `AUTH_SECRET` déconnecte tous les utilisateurs (normal). Changer `CRON_SECRET` impose de mettre à jour le cron.
- **Mises à jour** : `npm run db:deploy` sur l'URL **directe** avant de redéployer sur Vercel.

---

## 8. Checklist finale

- [ ] Base Neon créée, URLs directe + pooled notées
- [ ] `npm run db:deploy` exécuté sur l'URL directe
- [ ] `npm run db:bootstrap` exécuté (1 école + 1 admin)
- [ ] `npm run db:blank-check` → OK
- [ ] Dépôt GitHub privé créé, code poussé (sans `.env`)
- [ ] Projet Vercel importé, Node 22.x
- [ ] `DATABASE_URL` = pooled, `AUTH_SECRET` et `CRON_SECRET` définis
- [ ] `/api/health` → `db: up`
- [ ] Connexion admin OK, listes vides
- [ ] Cron externe en POST avec `Authorization: Bearer`
- [ ] Sauvegarde / PITR activée
