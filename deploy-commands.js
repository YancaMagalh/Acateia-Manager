const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const config = require("./config");

const commands = [
    new SlashCommandBuilder()
        .setName("painel")
        .setDescription("Envia o painel principal (hub) do sistema da Alcateia")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName("painel-registro")
        .setDescription("Envia o painel de Registro (Entrada/Saída) neste canal")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName("painel-acoes")
        .setDescription("Envia o painel de Ações neste canal")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName("painel-farm")
        .setDescription("Envia o painel de Farm neste canal")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName("painel-ausencia")
        .setDescription("Envia o painel de Ausências neste canal")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName("painel-ranking")
        .setDescription("Envia o painel de Ranking neste canal")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    new SlashCommandBuilder()
        .setName("painel-admin")
        .setDescription("Envia o painel de Administração neste canal")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(config.token);

(async () => {
    try {
        console.log("⏳ Registrando comandos de barra...");
        await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
            { body: commands }
        );
        console.log("✅ Comandos registrados com sucesso!");
    } catch (error) {
        console.error("❌ Erro ao registrar comandos:", error);
    }
})();