const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require("discord.js");

const config = require("../config");
const { baseEmbed, enviarLog } = require("../utils/helpers");

// ---------------------------------------------------------
//  Painel (fixo no canal de ausências)
// ---------------------------------------------------------

async function sendPanel(interaction, opcoes = {}) {
    const embed = baseEmbed(config.cores.principal)
        .setAuthor({ name: "Alcateia • Ausências", iconURL: interaction.guild?.iconURL() ?? undefined })
        .setTitle("🏖️ Sistema de Ausências")
        .setDescription(
            "Precisa se ausentar da Alcateia por um tempo? 🐾\n\n" +
            "Use este sistema para avisar a liderança e evitar penalidades por inatividade.\n\n" +
            "━━━━━━━━━━━━━━━━━━━━━━\n\n" +
            "📝 **Como solicitar uma ausência?**\n\n" +
            "1. Clique no botão abaixo\n" +
            "2. Informe seu passaporte, o período e o motivo\n" +
            "3. Aguarde a análise da staff\n\n" +
            "━━━━━━━━━━━━━━━━━━━━━━\n\n" +
            "⚠️ Ausências não avisadas podem resultar em advertência ou remoção da matilha."
        )
        .setThumbnail(interaction.guild?.iconURL() ?? null)
        .setFooter({ text: "Sistema de Ausências da Alcateia" })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("menu_ausencia").setLabel("Solicitar Ausência").setEmoji("🏖️").setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({ embeds: [embed], components: [row], ...opcoes });
}

// ---------------------------------------------------------
//  Fluxo de solicitação
// ---------------------------------------------------------

async function abrirModalAusencia(interaction) {
    const modal = new ModalBuilder().setCustomId("modal_ausencia").setTitle("Solicitação de Ausência");

    const passaporte = new TextInputBuilder().setCustomId("passaporte").setLabel("Seu passaporte").setStyle(TextInputStyle.Short).setRequired(true);
    const periodo = new TextInputBuilder().setCustomId("periodo").setLabel("Período (ex: 10/07 até 17/07)").setStyle(TextInputStyle.Short).setRequired(true);
    const motivo = new TextInputBuilder().setCustomId("motivo").setLabel("Motivo").setStyle(TextInputStyle.Paragraph).setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(passaporte),
        new ActionRowBuilder().addComponents(periodo),
        new ActionRowBuilder().addComponents(motivo)
    );

    return interaction.showModal(modal);
}

async function processarModalAusencia(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const passaporte = interaction.fields.getTextInputValue("passaporte").trim();
    const periodo = interaction.fields.getTextInputValue("periodo").trim();
    const motivo = interaction.fields.getTextInputValue("motivo").trim();

    const embed = baseEmbed(config.cores.aviso)
        .setTitle("🏖️ Solicitação de Ausência")
        .addFields(
            { name: "🪪 Passaporte", value: passaporte, inline: true },
            { name: "🗓️ Período", value: periodo, inline: true },
            { name: "👮 Discord", value: `<@${interaction.user.id}>` },
            { name: "📄 Motivo", value: motivo }
        );

    await enviarLog(interaction.client, config.canais.logAusencia, embed);
    return interaction.editReply({ content: "✅ Solicitação de ausência enviada." });
}

// ---------------------------------------------------------
//  Exports — contrato usado pelo roteador central (index.js)
// ---------------------------------------------------------

module.exports = {
    commandDescriptions: {
        "painel-ausencia": "Envia o painel de Ausências neste canal"
    },
    commands: {
        "painel-ausencia": sendPanel
    },
    buttons: {
        "menu_ausencia": abrirModalAusencia
    },
    modals: {
        "modal_ausencia": processarModalAusencia
    },
    sendPanel
};
