const fs = require("fs");
const path = require("path");
const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const config = require("./config");

const modulesPath = path.join(__dirname, "modules");
const modules = fs.readdirSync(modulesPath)
    .filter(f => f.endsWith(".js"))
    .map(f => require(path.join(modulesPath, f)));

const commands = [];

for (const mod of modules) {
    if (!mod.commandDescriptions) continue;

    for (const [nome, descricao] of Object.entries(mod.commandDescriptions)) {
        commands.push(
            new SlashCommandBuilder()
                .setName(nome)
                .setDescription(descricao)
                .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
                .toJSON()
        );
    }
}

const rest = new REST({ version: "10" }).setToken(config.token);

(async () => {
    try {
        console.log(`⏳ Registrando ${commands.length} comando(s) de barra...`);
        commands.forEach(c => console.log(`   • /${c.name}`));

        await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
            { body: commands }
        );

        console.log("✅ Comandos registrados com sucesso!");
    } catch (error) {
        console.error("❌ Erro ao registrar comandos:", error);
    }
})();
