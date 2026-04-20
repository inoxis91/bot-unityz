require('dotenv').config();
const { Client, Events, GatewayIntentBits } = require('discord.js');
const { google } = require('googleapis');

const { handleAdminCommands } = require('./commands/admin');
const { handleUserCommands } = require('./commands/user');
const { handleButton } = require('./handlers/buttons');
const { setupCronJobs } = require('./handlers/cron');

const { TOKEN, SHEET_ID } = process.env;

const auth = new google.auth.GoogleAuth({ keyFile: './credentials.json', scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
const sheets = google.sheets({ version: 'v4', auth });
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

client.once(Events.ClientReady, () => {
    console.log(`✅ Loggé en tant que ${client.user.tag}`);
    setupCronJobs(client, sheets);
});

client.on(Events.InteractionCreate, async interaction => {
    const context = { sheets, sheetId: SHEET_ID };

    if (interaction.isButton()) {
        handleButton(interaction, context, client).catch(console.error);
        return;
    }
    if (!interaction.isChatInputCommand()) return;

    try {
        // On accuse réception une seule fois, ici.
        const isEphemeral = interaction.commandName !== 'rappel-list';
        await interaction.deferReply({ ephemeral: isEphemeral });

        const adminCommands = ['rappel-list', 'rappel-alert', 'ajouter-membre', 'sync-membres'];
        const userCommands = ['declarer', 'ma-cotisation'];

        if (adminCommands.includes(interaction.commandName)) {
            await handleAdminCommands(interaction, context);
        } else if (userCommands.includes(interaction.commandName)) {
            await handleUserCommands(interaction, context, client);
        }
    } catch (error) {
        console.error("Erreur non gérée pour l'interaction:", error);
        // On s'assure de répondre à l'utilisateur même en cas de crash
        if (interaction.replied || interaction.deferred) {
            await interaction.editReply({ content: '💥 Oups! Une erreur critique est survenue.' });
        }
    }
});

client.login(TOKEN);
