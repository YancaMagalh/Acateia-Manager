const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../config");
const { baseEmbed } = require("../utils/helpers");

const registro = require("./registro");
const acoes = require("./acoes");
const farm = require("./farm");
const ausencia = require("./ausencia");
const ranking = require("./ranking");
const admin = require("./admin");

// ---------------------------------------------------------
//  Painel principal (hub) — opcional, reúne atalhos para
//  todos os módulos em um único canal (ex: #geral).
//  Cada painel individual (painel-registro, painel-acoes...)
//  continua funcionando de forma independente no seu canal.
// ---------------------------------------------------------

async function sendPanel(interaction, opcoes = {}) {
    const embed = baseEmbed(config.cores.principal)
        .setTitle("🐺 Central da Alcateia")
        .setDescription(
            "### Bem-vindo ao sistema da Alcateia\n" +
            "Escolha um módulo abaixo para continuar.\n\n" +
            "━━━━━━━━━━━━━━━━━━━━━━"
        )
        .setFooter({ text: "Acateia Manager" });

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("hub_registro").setLabel("Registro").setEmoji("📝").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("hub_acoes").setLabel("Ações").setEmoji("⚔️").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("hub_farm").setLabel("Farm").setEmoji("📦").setStyle(ButtonStyle.Success)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("hub_ausencia").setLabel("Ausências").setEmoji("🏖️").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("hub_ranking").setLabel("Ranking").setEmoji("🏆").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("hub_admin").setLabel("Administração").setEmoji("⚙️").setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({ embeds: [embed], components: [row1, row2], ...opcoes });
}

// Cada botão do hub só abre o painel do módulo de forma ephemeral,
// reaproveitando a MESMA função sendPanel de cada módulo — zero duplicação de lógica.
module.exports = {
    commandDescriptions: {
        "painel": "Envia o painel principal (hub) com atalhos para todos os módulos"
    },
    commands: {
        "painel": sendPanel
    },
    buttons: {
        "hub_registro": (i) => registro.sendPanel(i, { ephemeral: true }),
        "hub_acoes": (i) => acoes.sendPanel(i, { ephemeral: true }),
        "hub_farm": (i) => farm.sendPanel(i, { ephemeral: true }),
        "hub_ausencia": (i) => ausencia.sendPanel(i, { ephemeral: true }),
        "hub_ranking": (i) => ranking.sendPanel(i, { ephemeral: true }),
        "hub_admin": (i) => admin.sendPanel(i, { ephemeral: true })
    },
    sendPanel
};
