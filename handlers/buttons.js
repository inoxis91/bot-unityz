const { EmbedBuilder } = require('discord.js');
const { getMonthName, mapSheetData } = require('../utils');
const { PENDING_SHEET_TITLE, MAIN_SHEET_TITLE } = require('../config');

async function handleButton(interaction, context, client) {
    const { sheets, sheetId } = context;
    const [action, transactionId] = interaction.customId.split('_');
    await interaction.deferUpdate();

    try {
        // Obtenir l'ID de la feuille "En attentes" pour l'opération de suppression
        const spreadsheetMeta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
        const pendingSheetId = spreadsheetMeta.data.sheets.find(s => s.properties.title === PENDING_SHEET_TITLE)?.properties.sheetId;

        const pendingData = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: PENDING_SHEET_TITLE });
        const mappedPending = mapSheetData(pendingData.data.values);
        const pendingRow = mappedPending.find(r => r.data.transactionId === transactionId);

        if (!pendingRow) {
            return interaction.editReply({ embeds: [EmbedBuilder.from(interaction.message.embeds[0]).setColor('#808080').setDescription("Transaction déjà traitée.")], components: [] });
        }
        
        const membre = await client.users.fetch(pendingRow.data.userId);

        if (action === 'approve') {
            const mainData = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: MAIN_SHEET_TITLE });
            const headers = mainData.data.values[0].map(h => h.toString());
            const mappedMain = mapSheetData(mainData.data.values);

            const mainRow = mappedMain.find(r => r.data['ID Discord'] === pendingRow.data.userId);
            const monthStr = pendingRow.data.mois.toString();
            const monthColumnIndex = headers.indexOf(monthStr);

            if (monthColumnIndex === -1) {
                console.error(`Erreur critique: La colonne pour le mois "${monthStr}" est introuvable dans la feuille "${MAIN_SHEET_TITLE}".`);
                throw new Error("Configuration de la feuille incorrecte.");
            }

            if (!mainRow) {
                const newRow = Array(headers.length).fill('');
                newRow[headers.indexOf('Nom IG')] = pendingRow.data.nomIG;
                newRow[headers.indexOf('Tag Discord')] = pendingRow.data.userTag;
                newRow[headers.indexOf('ID Discord')] = pendingRow.data.userId;
                newRow[monthColumnIndex] = pendingRow.data.montant;
                await sheets.spreadsheets.values.append({ spreadsheetId: sheetId, range: MAIN_SHEET_TITLE, valueInputOption: 'USER_ENTERED', resource: { values: [newRow] } });
            } else {
                const currentAmount = parseInt(mainRow.data[monthStr] || '0', 10);
                const newAmount = currentAmount + parseInt(pendingRow.data.montant, 10);
                const columnLetter = String.fromCharCode(65 + monthColumnIndex);
                const rangeToUpdate = `${MAIN_SHEET_TITLE}!${columnLetter}${mainRow.index}`;
                await sheets.spreadsheets.values.update({ spreadsheetId: sheetId, range: rangeToUpdate, valueInputOption: 'USER_ENTERED', resource: { values: [[newAmount]] } });
            }
            await membre.send(`✅ Votre paiement de **${pendingRow.data.montant} po** a été approuvé !`).catch(console.error);
        } else {
            await membre.send(`❌ Votre paiement de **${pendingRow.data.montant} po** a été rejeté.`).catch(console.error);
        }

        // Supprimer la ligne de la feuille "En attentes"
        if(pendingSheetId !== undefined) {
             await sheets.spreadsheets.batchUpdate({ spreadsheetId: sheetId, resource: { requests: [{ deleteDimension: { range: { sheetId: pendingSheetId, dimension: 'ROWS', startIndex: pendingRow.index - 1, endIndex: pendingRow.index }}}]}});
        }
       
        const newEmbed = EmbedBuilder.from(interaction.message.embeds[0]).setColor(action === 'approve' ? '#00ff00' : '#ff0000').setDescription(`Paiement de <@${pendingRow.data.userId}> traité par <@${interaction.user.id}>.`).setFields({ name: 'Montant', value: `**${pendingRow.data.montant}** po`, inline: true }, { name: 'Mois', value: getMonthName(parseInt(pendingRow.data.mois, 10)), inline: true }, { name: 'Statut', value: action === 'approve' ? '✅ Approuvé' : '❌ Rejeté', inline: false });
        await interaction.editReply({ embeds: [newEmbed], components: [] });
    } catch (error) {
        console.error("Erreur bouton:", error);
    }
}
module.exports = { handleButton };
