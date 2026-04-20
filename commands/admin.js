const { EmbedBuilder } = require('discord.js');
const { getMonthName, createFields, mapSheetData } = require('../utils');
const { sendPaymentReminder } = require('../handlers/cron');
const { PENDING_SHEET_TITLE, MAIN_SHEET_TITLE, CONTRIBUTION_MINIMUM } = require('../config');

async function handleAdminCommands(interaction, context) {
    try {
        if (interaction.commandName === 'rappel-alert') await handleRappelAlert(interaction, context);
        else if (interaction.commandName === 'rappel-list') await handleRappelList(interaction, context);
        else if (interaction.commandName === 'ajouter-membre') await handleAjouterMembre(interaction, context);
        else if (interaction.commandName === 'sync-membres') await handleSyncMembres(interaction, context);
    } catch (error) {
        console.error(`Erreur dans handleAdminCommands pour ${interaction.commandName}:`, error);
        throw error; // Fait remonter l'erreur au gestionnaire principal
    }
}

async function handleRappelAlert(interaction, context) {
    await sendPaymentReminder(interaction.client, context);
    await interaction.editReply({ content: "✅ Alerte de rappel envoyée." });
}

async function handleRappelList(interaction, context) {
    const { sheets, sheetId } = context;
    const mois = interaction.options.getInteger('mois') || (new Date().getMonth() + 1);
    const embed = new EmbedBuilder().setTitle(`📊 État des Cotisations pour ${getMonthName(mois)}`).setColor('#0099ff').setTimestamp();

    const pendingData = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: PENDING_SHEET_TITLE });
    const pendingLines = pendingData.data.values ? mapSheetData(pendingData.data.values).map(r => `- <@${r.data.userId}>: **${r.data.montant} po** (Mois: ${getMonthName(parseInt(r.data.mois, 10))})`) : [];
    
    const mainData = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: MAIN_SHEET_TITLE });
    const lateLines = mainData.data.values ? mapSheetData(mainData.data.values).filter(r => r.data['ID Discord'] && parseInt(r.data[mois.toString()] || '0') < CONTRIBUTION_MINIMUM).map(r => `- <@${r.data['ID Discord']}> (Total: **${r.data[mois.toString()] || '0'} po**)`) : [];
    
    embed.addFields(...createFields("⏳ Paiements en attente", pendingLines), ...createFields(`⏰ Cotisations en retard`, lateLines));
    await interaction.editReply({ embeds: [embed] });
}

async function handleAjouterMembre(interaction, context) {
    const { sheets, sheetId } = context;
    const membre = interaction.options.getUser('membre');
    const mainData = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: MAIN_SHEET_TITLE });
    const existing = mainData.data.values && mapSheetData(mainData.data.values).find(r => r.data['ID Discord'] === membre.id);
    if (existing) return interaction.editReply({ content: `❌ Ce membre est déjà dans la liste.` });
    
    const headers = mainData.data.values[0];
    const newRow = Array(headers.length).fill('');
    newRow[headers.indexOf('Nom IG')] = membre.username;
    newRow[headers.indexOf('Tag Discord')] = membre.tag;
    newRow[headers.indexOf('ID Discord')] = membre.id;
    newRow[headers.indexOf((new Date().getMonth() + 1).toString())] = CONTRIBUTION_MINIMUM;
    
    await sheets.spreadsheets.values.append({ spreadsheetId: sheetId, range: MAIN_SHEET_TITLE, valueInputOption: 'USER_ENTERED', resource: { values: [newRow] } });
    await interaction.editReply({ content: `✅ Le membre <@${membre.id}> a été ajouté.` });
}

async function handleSyncMembres(interaction, context) {
    const { sheets, sheetId } = context;
    await interaction.guild.members.fetch();
    const role = await interaction.guild.roles.fetch(process.env.MEMBRE_ROLE_ID);
    if (!role) return interaction.editReply({ content: `❌ Rôle de membre introuvable.` });

    const mainData = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: MAIN_SHEET_TITLE });
    const headers = mainData.data.values[0];
    const sheetMemberIds = new Set(mainData.data.values ? mapSheetData(mainData.data.values).map(r => r.data['ID Discord']) : []);
    
    const newMembersToAdd = [];
    for (const member of role.members.values()) {
        if (!sheetMemberIds.has(member.id)) {
            const newRow = Array(headers.length).fill('');
            newRow[headers.indexOf('Nom IG')] = member.user.username;
            newRow[headers.indexOf('Tag Discord')] = member.user.tag;
            newRow[headers.indexOf('ID Discord')] = member.id;
            newMembersToAdd.push(newRow);
        }
    }

    if (newMembersToAdd.length > 0) {
        await sheets.spreadsheets.values.append({ spreadsheetId: sheetId, range: MAIN_SHEET_TITLE, valueInputOption: 'USER_ENTERED', resource: { values: newMembersToAdd } });
        await interaction.editReply({ content: `✅ Synchronisation terminée. **${newMembersToAdd.length}** membre(s) ajoutés.` });
    } else {
        await interaction.editReply({ content: "✅ Synchronisation terminée. Aucun membre à ajouter." });
    }
}
module.exports = { handleAdminCommands };
