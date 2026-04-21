require('dotenv').config();
const { Client, Events, GatewayIntentBits } = require('discord.js');
const { google } = require('googleapis');

const { handleAdminCommands } = require('./commands/admin');
const { handleUserCommands } = require('./commands/user');
const { handleButton } = require('./handlers/buttons');
const { setupCronJobs } = require('./handlers/cron');

const { TOKEN, SHEET_ID, GOOGLE_PROJECT_ID, GOOGLE_PRIVATE_KEY, GOOGLE_CLIENT_EMAIL } = process.env;

let credentials;
// Reconstruct credentials from environment variables if they exist
if (GOOGLE_PROJECT_ID && GOOGLE_PRIVATE_KEY && GOOGLE_CLIENT_EMAIL) {
    console.log("Reconstruction des crédentials depuis les variables d'environnement GOOGLE_*.");
    credentials = {
        type: process.env.GOOGLE_TYPE || 'service_account',
        project_id: GOOGLE_PROJECT_ID,
        private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
        // Replace escaped newlines from env var with actual newlines
        private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: GOOGLE_CLIENT_EMAIL,
        client_id: process.env.GOOGLE_CLIENT_ID,
        auth_uri: process.env.GOOGLE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
        token_uri: process.env.GOOGLE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL
    };
}

const authConfig = credentials 
    ? { credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] }
    : { keyFile: './credentials.json', scopes: ['https://www.googleapis.com/auth/spreadsheets'] };

const auth = new google.auth.GoogleAuth(authConfig);
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

        const adminCommands = ['rappel-list', 'rappel-alert', 'ajouter-membre', 'supprimer-membre', 'sync-membres'];
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
