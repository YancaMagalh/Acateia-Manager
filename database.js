const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "database.json");

const DEFAULT_DB = {
    membros: {},
    farmTotal: {},
    logsAcoes: []
};

function getDB() {

    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(
            DB_PATH,
            JSON.stringify(DEFAULT_DB, null, 2)
        );
    }

    return JSON.parse(
        fs.readFileSync(DB_PATH, "utf8")
    );

}

function saveDB(data) {

    fs.writeFileSync(
        DB_PATH,
        JSON.stringify(data, null, 2)
    );

}

module.exports = {
    getDB,
    saveDB
};
