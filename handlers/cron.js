const cron = require('node-cron');
const { getMonthName, mapSheetData } = require('../utils');
const { CONTRIBUTION_MINIMUM, MAIN_SHEET_TITLE } = require('../config');

function setupCronJobs(client, sheets) {
    cron.schedule('0 18 * * *', async () => {
        const today = new Date();
        const dayOfMonth = today.getDate();
        const totalDaysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        if (dayOfMonth === 15 || dayOfMonth > totalDaysInMonth - 5) {
            console.log('Envoi des rappels de paiement...');
            await sendPaymentReminder(client, { sheets, sheetId: process.env.SHEET_ID });
        }
    }, { scheduled: true, timezone: "Europe/Paris" });
}

async function sendPaymentReminder(client, context) {
    try {
        const { sheets, sheetId } = context;
        const reminderChannel = await client.channels.fetch(process.env.REMINDER_CHANNEL_ID);
        if (!reminderChannel) {
            console.error("Erreur: Canal de rappel non trouvé.");
            return;
        }

        const mainData = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: MAIN_SHEET_TITLE });
        const mappedMain = mapSheetData(mainData.data.values);
        const currentMonth = (new Date().getMonth() + 1).toString();
        
        const lateMembers = mappedMain.filter(row => {
            const amount = parseInt(row.data[currentMonth] || '0', 10);
            return row.data['ID Discord'] && amount < CONTRIBUTION_MINIMUM;
        }).map(row => row.data['ID Discord']);

        if (lateMembers.length > 0) {
            const mentions = lateMembers.map(id => `<@${id}>`).join(', ');
            await reminderChannel.send(`**Rappel de Cotisation** ⏰\nLes membres suivants sont des petites vauriens et ne sont pas à jour: ${mentions}.\n\nVeuillez payer via \`/declarer\`.`);
        }
    } catch (error) {
        console.error("Erreur rappels:", error);
    }
}
module.exports = { setupCronJobs, sendPaymentReminder };
