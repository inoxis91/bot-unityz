/**
 * @param {number} monthNumber Le numéro du mois (1-12)
 * @returns {string} Le nom du mois en français.
 */
function getMonthName(monthNumber) {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return months[monthNumber - 1] || 'Mois inconnu';
}

/**
 * Découpe un texte long en plusieurs champs d'embed Discord.
 * @param {string} title Le titre du premier champ.
 * @param {string[]} lines Un tableau de lignes de texte à assembler.
 * @returns {import('discord.js').EmbedField[]}
 */
const createFields = (title, lines) => {
    if (lines.length === 0) return [{ name: title, value: 'Aucun', inline: false }];
    const fields = [];
    let currentChunk = '';
    for (const line of lines) {
        if (currentChunk.length + line.length + 1 > 1024) {
            fields.push({ name: fields.length === 0 ? title : `${title} (suite)`, value: currentChunk, inline: false });
            currentChunk = '';
        }
        currentChunk += line + '\n';
    }
    fields.push({ name: fields.length === 0 ? title : `${title} (suite)`, value: currentChunk, inline: false });
    return fields;
};

/**
 * Transforme les données brutes de l'API Google Sheets en un tableau d'objets.
 * La première ligne est utilisée pour les clés.
 * @param {any[][]} data - Les données brutes (tableau de tableaux).
 * @returns {{row: object, index: number}[]} Un tableau d'objets, chacun avec ses données et son index de ligne original.
 */
const mapSheetData = (data) => {
    if (!data || data.length < 2) return [];
    const headers = data[0];
    const rows = data.slice(1);
    return rows.map((row, i) => {
        const rowData = {};
        headers.forEach((header, j) => {
            rowData[header] = row[j];
        });
        return { data: rowData, index: i + 2 }; // L'index est 1-based et on saute l'en-tête
    });
};

module.exports = {
    getMonthName,
    createFields,
    mapSheetData,
};
