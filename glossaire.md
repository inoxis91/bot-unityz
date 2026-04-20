# Glossaire des Commandes du Bot Cotiz-Manager

Voici un guide sur l'utilisation des commandes du bot pour gérer les cotisations.

---

## 🌟 Commandes pour tous les membres

Ces commandes sont utilisables par tous les membres de la guilde.

### `/declarer`
Permet de déclarer un paiement de cotisation que vous avez effectué en jeu. Un officier devra ensuite valider ce paiement.

-   **Options :**
    -   `montant` (Requis) : Le montant exact que vous avez versé.
    -   `mois` (Requis) : Le mois pour lequel vous effectuez ce paiement.
-   **Exemple :** `/declarer montant: 2000 mois: Janvier`

### `/ma-cotisation`
Permet de vérifier le statut de votre propre cotisation pour un mois donné. Affiche ce qui a été validé et ce qui est encore en attente.

-   **Options :**
    -   `mois` (Optionnel) : Le mois que vous voulez vérifier. Si vous ne précisez rien, la commande affichera le statut pour le mois en cours.
-   **Exemple :** `/ma-cotisation mois: Mars` ou simplement `/ma-cotisation`

---

## 👑 Commandes pour les Officiers (Trésoriers)

Ces commandes sont réservées aux membres ayant le rôle d'officier/trésorier.

### `/rappel-list`
Affiche une liste complète des membres qui ne sont pas à jour dans leur cotisation pour un mois donné, ainsi que la liste de tous les paiements en attente de validation.

-   **Options :**
    -   `mois` (Optionnel) : Le mois pour lequel vous voulez la liste des retardataires. Par défaut, affiche le mois en cours.
-   **Exemple :** `/rappel-list mois: Février`

### `/rappel-alert`
Envoie manuellement et immédiatement un message de rappel public dans le canal de discussion prévu, en mentionnant tous les membres en retard pour le mois en cours.

-   **Options :** Aucune.

### `/ajouter-membre`
Ajoute un nouveau membre au système de suivi. Cette commande est utile si un nouveau membre rejoint la guilde et que vous voulez l'intégrer immédiatement. La cotisation pour le mois en cours est automatiquement validée pour ce membre.

-   **Options :**
    -   `membre` (Requis) : Le membre Discord à ajouter.
-   **Exemple :** `/ajouter-membre membre: @NouveauMembre`

### `/sync-membres`
Compare la liste des membres dans la base de données avec les membres du serveur Discord ayant le rôle "Membre". Tous les membres qui sont sur Discord mais pas encore dans le fichier de suivi seront automatiquement ajoutés. C'est un bon moyen de s'assurer que tout le monde est bien dans le système.

-   **Options :** Aucune.
