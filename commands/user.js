const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getMonthName, mapSheetData } = require('../utils');
const { PENDING_SHEET_TITLE, MAIN_SHEET_TITLE, CONTRIBUTION_MINIMUM } = require('../config');

async function handleUserCommands(interaction, context, client) {
    if (interaction.commandName === 'declarer') await handleDeclarer(interaction, context, client);
    else if (interaction.commandName === 'ma-cotisation') await handleMaCotisation(interaction, context);
}

async function handleDeclarer(interaction, context, client) {
    // deferReply est maintenant dans index.js
    const { sheets, sheetId } = context;
    try {
        const montant = interaction.options.getInteger('montant');
        const mois = interaction.options.getInteger('mois');
        const transactionId = `${Date.now()}-${interaction.user.id}`;

        // Correction : On envoie 6 colonnes, sans le username, pour correspondre à la feuille
        const newRow = [[transactionId, interaction.user.id, interaction.user.tag, montant, mois, new Date().toISOString()]];
        
        await sheets.spreadsheets.values.append({ spreadsheetId: sheetId, range: PENDING_SHEET_TITLE, valueInputOption: 'USER_ENTERED', resource: { values: newRow } });
        
        const adminChannel = await client.channels.fetch(process.env.ADMIN_CHANNEL_ID);
        const embed = new EmbedBuilder().setTitle("🧾 Validation de Paiement Requise").setDescription(`**<@${interaction.user.id}>** a déclaré un paiement.`).addFields({ name: 'Montant', value: `**${montant}** po`, inline: true }, { name: 'Mois', value: getMonthName(mois), inline: true }).setColor('#ffa500');
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`approve_${transactionId}`).setLabel('Approuver').setStyle(ButtonStyle.Success), new ButtonBuilder().setCustomId(`reject_${transactionId}`).setLabel('Rejeter').setStyle(ButtonStyle.Danger));
        await adminChannel.send({ embeds: [embed], components: [row] });
        await interaction.editReply({ content: '✅ Votre déclaration a bien été envoyée.' });
    } catch (error) {
        console.error("Erreur /declarer:", error);
        throw error; // Fait remonter l'erreur au gestionnaire principal
    }
}

async function handleMaCotisation(interaction, context) {
    // deferReply est maintenant dans index.js
    const { sheets, sheetId } = context;
    try {
        const membre = interaction.user;
        const mois = interaction.options.getInteger('mois') || (new Date().getMonth() + 1);
        const moisNom = getMonthName(mois);
        let totalPendingAmount = 0, amountPaid = 0;

        const pendingData = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: PENDING_SHEET_TITLE });
        if (pendingData.data.values) {
            const mappedPending = mapSheetData(pendingData.data.values);
            const userPendingRows = mappedPending.filter(r => r.data.userId === membre.id && parseInt(r.data.mois, 10) === mois);
            if (userPendingRows.length > 0) totalPendingAmount = userPendingRows.reduce((sum, r) => sum + parseInt(r.data.montant, 10), 0);
        }
        
        const mainData = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: MAIN_SHEET_TITLE });
        if (mainData.data.values) {
            const mappedMain = mapSheetData(mainData.data.values);
            const userRow = mappedMain.find(r => r.data['ID Discord'] === membre.id);
            if (userRow) amountPaid = parseInt(userRow.data[mois.toString()] || '0', 10);
        }

        const embed = new EmbedBuilder().setTitle(`Statut pour ${moisNom}`).setDescription(`Bonjour <@${membre.id}>, voici votre statut.`).setTimestamp();
        embed.addFields({ name: 'Montants', value: `> **Validé :** ${amountPaid} po
> **En attente :** ${totalPendingAmount} po` });
        if (totalPendingAmount > 0) {
            embed.setColor('#ffa500').addFields({ name: 'Statut', value: `⏳ **En attente de validation**
> Total combiné: **${amountPaid + totalPendingAmount} / ${CONTRIBUTION_MINIMUM}** po`});
        } else {
            if (amountPaid >= CONTRIBUTION_MINIMUM) embed.setColor('#00ff00').addFields({ name: 'Statut', value: `✅ **À jour**`});
            else if (amountPaid > 0) embed.setColor('#ffcc00').addFields({ name: 'Statut', value: `⚠️ **Incomplet** (manque **${CONTRIBUTION_MINIMUM - amountPaid}** po)`});
            else embed.setColor('#ff0000').addFields({ name: 'Statut', value: `❌ **Non cotisé**`});
        }
        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error("Erreur /ma-cotisation:", error);
        throw error; // Fait remonter l'erreur au gestionnaire principal
    }
}
module.exports = { handleUserCommands };
