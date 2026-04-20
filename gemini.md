# Projet : Bot Discord "Cotiz-Manager"

Ce document sert de contexte et de documentation pour le bot Discord de gestion de cotisations.

## 1. Vue d'ensemble

Le bot a pour but de gérer les cotisations mensuelles d'une guilde de jeu. Il fait le pont entre Discord (interface utilisateur) et une base de données Google Sheets. Le système inclut un processus de validation manuelle pour les paiements et des rappels automatiques pour les retardataires.

## 2. Structure du Projet

Le code est organisé en plusieurs fichiers et dossiers pour une meilleure lisibilité et maintenance :

-   `index.js`: Point d'entrée principal du bot. Il initialise le client Discord, charge la configuration et agit comme un routeur pour les interactions.
-   `deploy.js`: Script à exécuter manuellement pour enregistrer ou mettre à jour les commandes slash sur Discord.
-   `config.js`: Fichier central pour les constantes du projet (noms des feuilles, etc.).
-   `utils.js`: Contient des fonctions utilitaires simples utilisées dans plusieurs parties du code (ex: `getMonthName`).
-   `commands/`: Dossier contenant la logique des commandes slash.
    -   `admin.js`: Gère les commandes réservées aux officiers (`/rappel-list`, `/sync-membres`, etc.).
    -   `user.js`: Gère les commandes accessibles à tous les membres (`/declarer`, `/ma-cotisation`).
-   `handlers/`: Dossier contenant la logique pour les événements autres que les commandes.
    -   `buttons.js`: Gère les clics sur les boutons "Approuver" et "Rejeter".
    -   `cron.js`: Contient toute la logique pour les rappels de paiement automatiques.

## 3. Structure de la Base de Données (Google Sheets)

Le document Google Sheets est composé de deux feuilles principales :

### Feuille : `Cotisations`
Contient le résumé des paiements validés pour chaque membre.
`Nom IG | Tag Discord | ID Discord | 1 | 2 | ... | 12`

-   **Règle métier :** Une cotisation est considérée comme payée pour un mois si le montant dans la colonne du mois correspondant est **≥ 2000**.

### Feuille : `En attentes`
Sert de file d'attente pour les paiements déclarés, en attente de validation.
`transactionId | userId | userTag | nomIG | montant | mois | timestamp`

## 4. Documentation des Commandes

### Commandes Utilisateur
#### `/declarer`
-   **Description :** Déclare un paiement pour validation par un officier.
-   **Options :** `montant` (requis), `mois` (requis).

#### `/ma-cotisation`
-   **Description :** Consulte votre statut de cotisation personnel. Affiche le montant validé et le montant en attente de validation.
-   **Options :** `mois` (optionnel, défaut: mois en cours).

### Commandes Administrateur (Réservées au rôle Trésorier)

#### `/ajouter-membre`
-   **Description :** Ajoute manuellement un nouveau membre au suivi, avec sa cotisation pour le mois en cours marquée comme payée.
-   **Options :** `membre` (requis).

#### `/sync-membres`
-   **Description :** Synchronise la feuille `Cotisations` avec le serveur Discord. Ajoute tous les utilisateurs ayant le rôle "Membre" qui ne seraient pas dans la feuille.
-   **Options :** Aucune.

#### `/rappel-list`
-   **Description :** Affiche un résumé des paiements en attente et des membres en retard pour un mois donné.
-   **Options :** `mois` (optionnel, défaut: mois en cours).

#### `/rappel-alert`
-   **Description :** Déclenche manuellement l'envoi du message public de rappel.
-   **Options :** Aucune.


## 5. Configuration

### a) Fichier `.env`
Le fichier `.env` doit contenir les variables suivantes :

```env
# --- Token et ID du Bot ---
TOKEN=VOTRE_TOKEN_DE_BOT_DISCORD
CLIENT_ID=L_ID_CLIENT_DE_VOTRE_BOT

# --- Google Sheets ---
SHEET_ID=L_ID_DE_VOTRE_DOCUMENT_GOOGLE_SHEETS

# --- IDs des Canaux ---
ADMIN_CHANNEL_ID=ID_DU_CANAL_POUR_LES_VALIDATIONS
REMINDER_CHANNEL_ID=ID_DU_CANAL_POUR_LES_RAPPELS_PUBLICS

# --- ID du Rôle Membre ---
MEMBRE_ROLE_ID=ID_DU_ROLE_PRINCIPAL_DES_MEMBRES_DE_LA_GUILDE
```

### b) Permissions des Commandes
Pour que les commandes administrateur soient invisibles pour les membres normaux, une configuration manuelle est **obligatoire** :

1.  Exécutez `node deploy.js` pour enregistrer les commandes.
2.  Allez dans **Paramètres du serveur > Intégrations > Cotiz-Manager**.
3.  Pour chaque commande d'officier (`/ajouter-membre`, `/sync-membres`, etc.) :
    -   Désactivez la permission pour le rôle `@everyone`.
    -   Cliquez sur **"Ajouter des rôles"** et sélectionnez le rôle `Trésorier` (ou le rôle de votre choix).
4.  Enregistrez les modifications.


INFO IA:
Tu me parlerais uniquement en Francais
Tu ne me demande pas de changer le code pour toi tu le ferais toi même