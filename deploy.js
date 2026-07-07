require("dotenv").config();

const { REST, Routes } = require("discord.js");

const commands = [
    {
        name: "painel",
        description: "Enviar o painel principal da Acateia"
    }
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log("🔄 Registrando comandos...");

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID,
                process.env.GUILD_ID
            ),
            {
                body: commands
            }
        );

        console.log("✅ Slash Commands registrados com sucesso!");
    } catch (error) {
        console.error(error);
    }
})();