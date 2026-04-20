require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
    new SlashCommandBuilder()
        .setName('declarer')
        .setDescription('Déclarer un paiement de cotisation pour validation.')
        .addIntegerOption(option =>
            option.setName('montant')
                .setDescription('Le montant que vous avez versé en jeu')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('mois')
                .setDescription('Le mois pour lequel vous payez')
                .setRequired(true)
                .addChoices(
                    { name: 'Janvier', value: 1 },
                    { name: 'Février', value: 2 },
                    { name: 'Mars', value: 3 },
                    { name: 'Avril', value: 4 },
                    { name: 'Mai', value: 5 },
                    { name: 'Juin', value: 6 },
                    { name: 'Juillet', value: 7 },
                    { name: 'Août', value: 8 },
                    { name: 'Septembre', value: 9 },
                    { name: 'Octobre', value: 10 },
                    { name: 'Novembre', value: 11 },
                    { name: 'Décembre', value: 12 }
                )),
    new SlashCommandBuilder()
        .setName('rappel-list')
        .setDescription('[Officier] Affiche la liste des cotisations en retard et en attente.')
        .addIntegerOption(option =>
            option.setName('mois')
                .setDescription('Le mois que vous souhaitez vérifier (par défaut, le mois en cours)')
                .setRequired(false)
                .addChoices(
                    { name: 'Janvier', value: 1 },
                    { name: 'Février', value: 2 },
                    { name: 'Mars', value: 3 },
                    { name: 'Avril', value: 4 },
                    { name: 'Mai', value: 5 },
                    { name: 'Juin', value: 6 },
                    { name: 'Juillet', value: 7 },
                    { name: 'Août', value: 8 },
                    { name: 'Septembre', value: 9 },
                    { name: 'Octobre', value: 10 },
                    { name: 'Novembre', value: 11 },
                    { name: 'Décembre', value: 12 }
                )),
    new SlashCommandBuilder()
        .setName('rappel-alert')
        .setDescription('[Officier] Lance manuellement l\'alerte pour les cotisations impayées.'),
    new SlashCommandBuilder()
        .setName('ajouter-membre')
        .setDescription('[Officier] Ajoute un nouveau membre au suivi des cotisations.')
        .addUserOption(option =>
            option.setName('membre')
                .setDescription('Le nouveau membre à ajouter')
                .setRequired(true)),
    new SlashCommandBuilder()
        .setName('sync-membres')
        .setDescription('[Officier] Synchronise le tableau avec les membres ayant le rôle "Membre".'),
    new SlashCommandBuilder()
        .setName('ma-cotisation')
        .setDescription('Consulter le statut de votre cotisation pour un mois donné.')
        .addIntegerOption(option =>
            option.setName('mois')
                .setDescription('Le mois que vous souhaitez vérifier (par défaut, le mois en cours)')
                .setRequired(false)
                .addChoices(
                    { name: 'Janvier', value: 1 },
                    { name: 'Février', value: 2 },
                    { name: 'Mars', value: 3 },
                    { name: 'Avril', value: 4 },
                    { name: 'Mai', value: 5 },
                    { name: 'Juin', value: 6 },
                    { name: 'Juillet', value: 7 },
                    { name: 'Août', value: 8 },
                    { name: 'Septembre', value: 9 },
                    { name: 'Octobre', value: 10 },
                    { name: 'Novembre', value: 11 },
                    { name: 'Décembre', value: 12 }
                )),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Déploiement des commandes sur le serveur...');

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        );

        console.log('Commandes déployées instantanément sur le serveur !');
    } catch (error) {
        console.error(error);
    }
})();