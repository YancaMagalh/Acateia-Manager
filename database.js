const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "data.json");

const ESTRUTURA_PADRAO = {
    membros: {},   // chave = passaporte -> dados do membro
    farmTotal: {}, // chave = item -> quantidade total entregue
    logsAcoes: []  // histórico simples de ações
};

function garantirBanco() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify(ESTRUTURA_PADRAO, null, 2));
    }
}

function getDB() {
    garantirBanco();
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

function saveDB(data) {
    garantirBanco();
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = { getDB, saveDB };
