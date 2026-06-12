# BAH SERVICES TECH (BST)

Plateforme de gestion des comptes traducteurs, sociétés partenaires et paiements.

**Production** → [https://gestion-one-forma.vercel.app](https://gestion-one-forma.vercel.app)

## Fonctionnalités

- **Nouveau compte** : collage rapide des credentials WhatsApp (email, mot de passe, langue, clé auth) avec détection automatique de la société
- **Traducteurs** : gestion des traducteurs, leurs coordonnées et comptes assignés
- **Comptes** : suivi des comptes avec filtres par statut, société et traducteur — mise à jour du username après connexion
- **Sociétés** : gestion des sociétés partenaires avec mot de passe commun pour détection automatique — vue détaillée par société
- **Paiements** : enregistrement des paiements depuis Excel (.xlsx), calcul FCFA automatique (`$ × 95% × 500`), génération de reçus image
- **Dashboard** : KPIs et graphiques Recharts en temps réel

## Stack

- **Frontend** : React 19 + Vite
- **Base de données** : Supabase (PostgreSQL)
- **Déploiement** : Vercel
- **Icônes** : Lucide React
- **Graphiques** : Recharts
- **Excel** : SheetJS (xlsx)
- **Reçus** : html-to-image

## Lancer en local

```bash
npm install
npm run dev
```

Crée un fichier `.env` à la racine :

```
VITE_SUPABASE_URL=https://rbsuialcftowrjmjamcj.supabase.co
VITE_SUPABASE_ANON_KEY=ta_cle_anon
```

## Base de données

Le schéma SQL est dans [supabase_schema.sql](supabase_schema.sql).  
À exécuter une seule fois dans **Supabase → SQL Editor**.

Tables : `settings`, `companies`, `translators`, `accounts`, `payments`

## Build production

```bash
npm run build
```

Variables d'environnement à configurer dans Vercel :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
