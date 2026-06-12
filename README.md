# Translator Account Manager (TAM)

App web React pour gérer les comptes traducteurs, usernames et paiements.

## Lancer l'app

```bash
npm install
npm run dev
```

Ouvre ensuite http://localhost:5173 dans ton navigateur.

## Build production

```bash
npm run build
npm run preview
```

## Structure

- **Nouveau compte** : saisir les infos reçues sur WhatsApp et assigner à un traducteur
- **Traducteurs** : gérer la liste des traducteurs et leurs paires de langues
- **Comptes** : suivre les comptes, assignations et usernames
- **Paiements** : enregistrer et suivre les paiements par traducteur (format compatible avec ton fichier Excel)

## Données

Toutes les données sont stockées dans le **localStorage** du navigateur.
Aucun serveur requis — l'app tourne entièrement en local.

## Stack

- React 18 + Vite
- Lucide React (icônes)
- localStorage (persistance)
