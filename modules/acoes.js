const {
    ActionRowBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder
} = require("discord.js");

const config = require("../config");
const { getDB, saveDB } = require("../database");
const { baseEmbed, enviarLog } = require("../utils/helpers");

// ---------------------------------------------------------
//  Painel (fixo no canal de ações)
// ---------------------------------------------------------

async function sendPanel(interaction, opcoes = {}) {
    const select = new StringSelectMenuBuilder()
        .setCustomId("select_acao_tipo")
        .setPlaceholder("Selecione o tipo de ação")
        .addOptions(config.tiposAcao.map(t => ({ label: t.label, value: t.value, emoji: t.emoji })));

    const embed = baseEmbed(config.cores.principal)
        .setAuthor({ name: "Alcateia • Operações", iconURL: interaction.guild?.iconURL() ?? undefined })
        .setTitle("⚔️ Sistema de Ações")
        .setDescription(
            "Registre aqui as ações realizadas em nome da Alcateia! 🐺\n\n" +
            "Manter o registro em dia ajuda a matilha a acompanhar patrulhas, abordagens e ocorrências.\n\n" +
            "━━━━━━━━━━━━━━━━━━━━━━\n\n" +
            "📝 **Como registrar uma ação?**\n\n" +
            "1. Selecione o tipo de ação no menu abaixo\n" +
            "2. Informe seu passaporte e descreva a ocorrência\n" +
            "3. Sua ação é enviada automaticamente para o canal de registros\n\n" +
            "━━━━━━━━━━━━━━━━━━━━━━\n\n" +
            "⚠️ Descreva a ocorrência com clareza — registros incompletos podem ser desconsiderados."
        )
        .setThumbnail(interaction.guild?.iconURL() ?? null)
        .setFooter({ text: "Sistema de Ações da Alcateia" })
        .setTimestamp();

    return interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(select)], ...opcoes });
}

// ---------------------------------------------------------
//  Fluxo de registro de ação
// ---------------------------------------------------------

async function abrirModalAcao(interaction) {
    const tipo = interaction.values[0];
    const tipoInfo = config.tiposAcao.find(t => t.value === tipo);

    const modal = new ModalBuilder().setCustomId(`modal_acao_${tipo}`).setTitle(`Ação: ${tipoInfo.label}`);

    const passaporte = new TextInputBuilder().setCustomId("passaporte").setLabel("Seu passaporte").setStyle(TextInputStyle.Short).setRequired(true);
    const descricao = new TextInputBuilder().setCustomId("descricao").setLabel("Descrição da ocorrência").setStyle(TextInputStyle.Paragraph).setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(passaporte),
        new ActionRowBuilder().addComponents(descricao)
    );

    return interaction.showModal(modal);
}

async function processarModalAcao(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const tipo = interaction.customId.replace("modal_acao_", "");
    const tipoInfo = config.tiposAcao.find(t => t.value === tipo) || { label: tipo, emoji: "📋" };

    const passaporte = interaction.fields.getTextInputValue("passaporte").trim();
    const descricao = interaction.fields.getTextInputValue("descricao").trim();

    const db = getDB();
    const membro = db.membros[passaporte];
    if (membro) {
        membro.acoes = (membro.acoes || 0) + 1;
        saveDB(db);
    }

    const embed = baseEmbed(config.cores.erro)
        .setTitle(`${tipoInfo.emoji} Ação Registrada: ${tipoInfo.label}`)
        .addFields(
            { name: "🪪 Passaporte", value: passaporte, inline: true },
            { name: "👮 Discord", value: `<@${interaction.user.id}>`, inline: true },
            { name: "📄 Descrição", value: descricao },
            { name: "📅 Data", value: `<t:${Math.floor(Date.now() / 1000)}:F>` }
        );

    await enviarLog(interaction.client, config.canais.logAcoes, embed);
    return interaction.editReply({ content: "✅ Ação registrada com sucesso." });
}

// ---------------------------------------------------------
//  Exports — contrato usado pelo roteador central (index.js)
// ---------------------------------------------------------

module.exports = {
    commandDescriptions: {
        "painel-acoes": "Envia o painel de Ações neste canal"
    },
    commands: {
        "painel-acoes": sendPanel
    },
    selects: {
        "select_acao_tipo": abrirModalAcao
    },
    modalPrefixes: [
        ["modal_acao_", processarModalAcao]
    ],
    sendPanel
};
