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
//  Painel (fixo no canal de farm)
// ---------------------------------------------------------

async function sendPanel(interaction, opcoes = {}) {
    const select = new StringSelectMenuBuilder()
        .setCustomId("select_farm_item")
        .setPlaceholder("Selecione o item entregue")
        .addOptions(config.itensFarm.map(i => ({ label: i.label, value: i.value, emoji: i.emoji })));

    const embed = baseEmbed(config.cores.principal)
        .setAuthor({ name: "Alcateia • Produção", iconURL: interaction.guild?.iconURL() ?? undefined })
        .setTitle("📦 Sistema de Farm")
        .setDescription(
            "Entregue aqui o que foi produzido para a Alcateia! 🐺\n\n" +
            "Todas as entregas contam pontos no seu ranking dentro da matilha.\n\n" +
            "━━━━━━━━━━━━━━━━━━━━━━\n\n" +
            "📝 **Como registrar uma entrega?**\n\n" +
            "1. Selecione o item entregue no menu abaixo\n" +
            "2. Informe seu passaporte e a quantidade entregue\n" +
            "3. O total é somado automaticamente ao estoque da Alcateia\n\n" +
            "━━━━━━━━━━━━━━━━━━━━━━\n\n" +
            "⚠️ Informe apenas quantidades reais — entregas falsas serão auditadas."
        )
        .setThumbnail(interaction.guild?.iconURL() ?? null)
        .setFooter({ text: "Sistema de Farm da Alcateia" })
        .setTimestamp();

    return interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(select)], ...opcoes });
}

// ---------------------------------------------------------
//  Fluxo de entrega
// ---------------------------------------------------------

async function abrirModalFarm(interaction) {
    const item = interaction.values[0];
    const itemInfo = config.itensFarm.find(i => i.value === item);

    const modal = new ModalBuilder().setCustomId(`modal_farm_${item}`).setTitle(`Entrega: ${itemInfo.label}`);

    const passaporte = new TextInputBuilder().setCustomId("passaporte").setLabel("Seu passaporte").setStyle(TextInputStyle.Short).setRequired(true);
    const quantidade = new TextInputBuilder().setCustomId("quantidade").setLabel("Quantidade entregue").setPlaceholder("Ex: 50").setStyle(TextInputStyle.Short).setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(passaporte),
        new ActionRowBuilder().addComponents(quantidade)
    );

    return interaction.showModal(modal);
}

async function processarModalFarm(interaction) {
    const item = interaction.customId.replace("modal_farm_", "");
    const itemInfo = config.itensFarm.find(i => i.value === item) || { label: item, emoji: "📦" };

    const passaporte = interaction.fields.getTextInputValue("passaporte").trim();
    const quantidadeTexto = interaction.fields.getTextInputValue("quantidade").trim();
    const quantidade = parseInt(quantidadeTexto, 10);

    if (isNaN(quantidade) || quantidade <= 0) {
        return interaction.reply({ content: "❌ Quantidade inválida. Informe um número maior que zero.", ephemeral: true });
    }

    const db = getDB();

    db.farmTotal[item] = (db.farmTotal[item] || 0) + quantidade;

    const membro = db.membros[passaporte];
    if (membro) {
        membro.pontosFarm = (membro.pontosFarm || 0) + quantidade;
    }
    saveDB(db);

    const embed = baseEmbed(config.cores.sucesso)
        .setTitle(`${itemInfo.emoji} Entrega Registrada: ${itemInfo.label}`)
        .addFields(
            { name: "🪪 Passaporte", value: passaporte, inline: true },
            { name: "📦 Quantidade", value: `${quantidade}`, inline: true },
            { name: "📊 Total acumulado", value: `${db.farmTotal[item]}`, inline: true },
            { name: "👮 Discord", value: `<@${interaction.user.id}>` },
            { name: "📅 Data", value: `<t:${Math.floor(Date.now() / 1000)}:F>` }
        );

    await enviarLog(interaction.client, config.canais.logFarm, embed);
    return interaction.reply({ content: "✅ Entrega registrada com sucesso.", ephemeral: true });
}

// ---------------------------------------------------------
//  Exports — contrato usado pelo roteador central (index.js)
// ---------------------------------------------------------

module.exports = {
    commandDescriptions: {
        "painel-farm": "Envia o painel de Farm neste canal"
    },
    commands: {
        "painel-farm": sendPanel
    },
    selects: {
        "select_farm_item": abrirModalFarm
    },
    modalPrefixes: [
        ["modal_farm_", processarModalFarm]
    ],
    sendPanel
};
