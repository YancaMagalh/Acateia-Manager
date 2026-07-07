const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits } = require("discord.js");
const config = require("./config");

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// =========================================================
// Carregamento dos módulos
// =========================================================

const modulesPath = path.join(__dirname, "modules");

if (!fs.existsSync(modulesPath)) {
    console.error("❌ Pasta modules não encontrada.");
    process.exit(1);
}

const modules = fs.readdirSync(modulesPath)
    .filter(file => file.endsWith(".js"))
    .map(file => {
        console.log(`📦 Carregando módulo: ${file}`);
        return require(path.join(modulesPath, file));
    });

console.log(`🧩 ${modules.length} módulo(s) carregado(s).`);

// =========================================================
// Localiza o handler
// =========================================================

function encontrarHandler(tipo, customId) {

    for (const mod of modules) {
        if (mod[tipo]?.[customId]) {
            return mod[tipo][customId];
        }
    }

    const prefixKey = `${tipo}Prefixes`;

    for (const mod of modules) {

        if (!mod[prefixKey]) continue;

        for (const [prefixo, handler] of mod[prefixKey]) {

            if (customId.startsWith(prefixo)) {
                return handler;
            }

        }

    }

    return null;
}

// =========================================================
// Eventos
// =========================================================

client.once("clientReady", () => {
    console.log(`🐺 Bot online como ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {

    try {

        console.log("=================================");
        console.log("Nova interação");

        if (interaction.isChatInputCommand()) {

            console.log("Slash:", interaction.commandName);

            for (const mod of modules) {

                if (mod.commands?.[interaction.commandName]) {

                    console.log("Executando comando");

                    return await mod.commands[interaction.commandName](interaction);

                }

            }

            return;
        }

        if (interaction.isButton()) {

            console.log("Botão:", interaction.customId);

            const handler = encontrarHandler(
                "buttons",
                interaction.customId
            );

            if (!handler) {

                console.log("Nenhum handler encontrado.");

                return;

            }

            console.log("Handler encontrado.");

            return await handler(interaction);

        }

        if (interaction.isStringSelectMenu()) {

            console.log("Select:", interaction.customId);

            const handler = encontrarHandler(
                "selects",
                interaction.customId
            );

            if (handler) {
                return await handler(interaction);
            }

            return;

        }

        if (interaction.isModalSubmit()) {

            console.log("Modal:", interaction.customId);

            const handler = encontrarHandler(
                "modals",
                interaction.customId
            );

            if (handler) {
                return await handler(interaction);
            }

            return;

        }

    } catch (err) {

        console.error("=================================");
        console.error("ERRO AO PROCESSAR INTERAÇÃO");
        console.error(err);
        console.error(err.stack);

        try {

            if (interaction.deferred || interaction.replied) {

                await interaction.followUp({
                    content: "❌ Ocorreu um erro interno.",
                    ephemeral: true
                });

            } else {

                await interaction.reply({
                    content: "❌ Ocorreu um erro interno.",
                    ephemeral: true
                });

            }

        } catch {}

    }

});

client.login(config.token);
