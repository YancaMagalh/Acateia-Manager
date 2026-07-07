const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits } = require("discord.js");
const config = require("./config");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// =========================================================
//  CARREGAMENTO DINÂMICO DOS MÓDULOS (um arquivo = um painel)
// =========================================================
// Cada arquivo em /modules exporta seu próprio contrato:
//   commandDescriptions → { "painel-x": "descrição" }
//   commands            → { "painel-x": fn(interaction) }
//   buttons             → { "customId": fn(interaction) }
//   buttonPrefixes      → [["prefixo_", fn(interaction)], ...]
//   selects             → { "customId": fn(interaction) }
//   modals              → { "customId": fn(interaction) }
//   modalPrefixes       → [["prefixo_", fn(interaction)], ...]
// Basta adicionar um novo arquivo em /modules para criar um novo painel —
// nada aqui precisa ser alterado.

const modulesPath = path.join(__dirname, "modules");

if (!fs.existsSync(modulesPath)) {
    console.error("❌ Pasta 'modules' não encontrada em: " + modulesPath);
    console.error("   O bot precisa das pastas 'modules/' e 'utils/' junto com o index.js.");
    console.error("   Ao hospedar, envie o projeto COMPLETO (todas as pastas), não só os arquivos da raiz.");
    process.exit(1);
}

const modules = fs.readdirSync(modulesPath)
    .filter(f => f.endsWith(".js"))
    .map(f => require(path.join(modulesPath, f)));

console.log(`🧩 ${modules.length} módulo(s) carregado(s) de /modules`);

// =========================================================
//  ROTEAMENTO GENÉRICO
// =========================================================

function encontrarHandler(tipo, customId) {
    // 1) match exato
    for (const mod of modules) {
        if (mod[tipo] && mod[tipo][customId]) return mod[tipo][customId];
    }
    // 2) match por prefixo (para customIds dinâmicos, ex: aprovar_<passaporte>)
    const chavePrefixos = `${tipo}Prefixes`;
    for (const mod of modules) {
        if (!mod[chavePrefixos]) continue;
        for (const [prefixo, handler] of mod[chavePrefixos]) {
            if (customId.startsWith(prefixo)) return handler;
        }
    }
    return null;
}

client.on("interactionCreate", async (interaction) => {
    try {
        if (interaction.isChatInputCommand()) {
            for (const mod of modules) {
                if (mod.commands && mod.commands[interaction.commandName]) {
                    return mod.commands[interaction.commandName](interaction);
                }
            }
            return;
        }

        if (interaction.isButton()) {
            const handler = encontrarHandler("buttons", interaction.customId);
            if (handler) return handler(interaction);
            return;
        }

        if (interaction.isStringSelectMenu()) {
            const handler = encontrarHandler("selects", interaction.customId);
            if (handler) return handler(interaction);
            return;
        }

        if (interaction.isModalSubmit()) {
            const handler = encontrarHandler("modals", interaction.customId);
            if (handler) return handler(interaction);
            return;
        }
    } catch (error) {
        const origem = interaction.customId || interaction.commandName || "desconhecida";
        console.error(`❌ Erro ao processar interação [${origem}]:`, error);

        const msgErro = { content: "❌ Ocorreu um erro ao processar essa ação.", ephemeral: true };
        if (interaction.isRepliable()) {
            if (interaction.deferred || interaction.replied) {
                interaction.followUp(msgErro).catch(() => {});
            } else {
                interaction.reply(msgErro).catch(() => {});
            }
        }
    }
});

client.once("clientReady", () => {
    console.log(`🐺 Bot online como ${client.user.tag}`);
});

client.login(config.token);
