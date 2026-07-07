const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
, MessageFlags } = require("discord.js");

const config = require("../config");
const { getDB, saveDB } = require("../database");
const { baseEmbed, isStaff, semPermissao } = require("../utils/helpers");

// ---------------------------------------------------------
//  Painel (fixo no canal de administração)
//  Vai direto ao ponto: os botões de ação já ficam no painel.
//  Qualquer clique é validado por cargo de staff.
// ---------------------------------------------------------

async function sendPanel(interaction, opcoes = {}) {
    const embed = baseEmbed(config.cores.principal)
        .setAuthor({ name: "Alcateia • Administração", iconURL: interaction.guild?.iconURL() ?? undefined })
        .setTitle("⚙️ Painel de Administração")
        .setDescription(
            "Ferramentas exclusivas para a **staff da Alcateia**. 🐺\n\n" +
            "━━━━━━━━━━━━━━━━━━━━━━\n\n" +
            "🔍 **Buscar Membro** — consulta a ficha completa pelo passaporte\n" +
            "📊 **Estatísticas** — membros aprovados, pendentes, saídas e totais de farm\n" +
            "🗑️ **Resetar Ranking** — zera pontos de farm e ações (com confirmação)\n\n" +
            "━━━━━━━━━━━━━━━━━━━━━━\n\n" +
            "⚠️ Apenas membros com cargo de staff conseguem usar estes botões."
        )
        .setThumbnail(interaction.guild?.iconURL() ?? null)
        .setFooter({ text: "Sistema de Administração da Alcateia" })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("admin_buscar").setLabel("Buscar Membro").setEmoji("🔍").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("admin_estatisticas").setLabel("Estatísticas").setEmoji("📊").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("admin_reset_ranking").setLabel("Resetar Ranking").setEmoji("🗑️").setStyle(ButtonStyle.Danger)
    );

    return interaction.reply({ embeds: [embed], components: [row], ...opcoes });
}

// ---------------------------------------------------------
//  Buscar membro
// ---------------------------------------------------------

async function abrirModalBusca(interaction) {
    if (!isStaff(interaction.member)) return semPermissao(interaction);

    const modal = new ModalBuilder().setCustomId("modal_admin_buscar").setTitle("Buscar Membro");
    const passaporte = new TextInputBuilder().setCustomId("passaporte").setLabel("Passaporte").setStyle(TextInputStyle.Short).setRequired(true);
    modal.addComponents(new ActionRowBuilder().addComponents(passaporte));

    return interaction.showModal(modal);
}

async function processarModalBusca(interaction) {
    const passaporte = interaction.fields.getTextInputValue("passaporte").trim();
    const db = getDB();
    const membro = db.membros[passaporte];

    if (!membro) return interaction.reply({ content: "❌ Nenhum membro encontrado com esse passaporte.", flags: MessageFlags.Ephemeral });

    const embed = baseEmbed(config.cores.info)
        .setTitle(`🔍 Ficha de ${membro.nome}`)
        .addFields(
            { name: "🪪 Passaporte", value: membro.passaporte, inline: true },
            { name: "📱 Telefone", value: membro.telefone, inline: true },
            { name: "🤝 Recrutado por", value: membro.recrutador, inline: true },
            { name: "📌 Status", value: membro.status, inline: true },
            { name: "📦 Pontos Farm", value: `${membro.pontosFarm || 0}`, inline: true },
            { name: "⚔️ Ações", value: `${membro.acoes || 0}`, inline: true },
            { name: "👮 Discord", value: `<@${membro.discordId}>` }
        );

    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

// ---------------------------------------------------------
//  Estatísticas
// ---------------------------------------------------------

async function exibirEstatisticas(interaction) {
    if (!isStaff(interaction.member)) return semPermissao(interaction);

    const db = getDB();
    const membros = Object.values(db.membros);

    const aprovados = membros.filter(m => m.status === "aprovado").length;
    const pendentes = membros.filter(m => m.status === "pendente").length;
    const saidas = membros.filter(m => m.status === "saiu").length;

    const farmTexto = Object.entries(db.farmTotal)
        .map(([item, qtd]) => `• **${item}**: ${qtd}`)
        .join("\n") || "Nenhuma entrega registrada.";

    const embed = baseEmbed(config.cores.info)
        .setTitle("📊 Estatísticas Gerais")
        .addFields(
            { name: "🟢 Aprovados", value: `${aprovados}`, inline: true },
            { name: "🟡 Pendentes", value: `${pendentes}`, inline: true },
            { name: "🔴 Saídas", value: `${saidas}`, inline: true },
            { name: "📦 Totais de Farm", value: farmTexto }
        );

    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

// ---------------------------------------------------------
//  Reset de ranking (com confirmação)
// ---------------------------------------------------------

async function confirmarResetRanking(interaction) {
    if (!isStaff(interaction.member)) return semPermissao(interaction);

    const embed = baseEmbed(config.cores.erro)
        .setTitle("⚠️ Confirmar Reset")
        .setDescription("Isso vai zerar **todos** os pontos de farm e ações de **todos** os membros. Deseja continuar?");

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("confirmar_reset_ranking").setLabel("Confirmar").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("cancelar_reset_ranking").setLabel("Cancelar").setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
}

async function executarResetRanking(interaction) {
    if (!isStaff(interaction.member)) return semPermissao(interaction);

    const db = getDB();
    for (const passaporte in db.membros) {
        db.membros[passaporte].pontosFarm = 0;
        db.membros[passaporte].acoes = 0;
    }
    db.farmTotal = {};
    saveDB(db);

    return interaction.update({ content: "✅ Ranking resetado com sucesso.", embeds: [], components: [] });
}

async function cancelarResetRanking(interaction) {
    return interaction.update({ content: "❌ Reset cancelado.", embeds: [], components: [] });
}

// ---------------------------------------------------------
//  Exports — contrato usado pelo roteador central (index.js)
// ---------------------------------------------------------

module.exports = {
    commandDescriptions: {
        "painel-admin": "Envia o painel de Administração neste canal"
    },
    commands: {
        "painel-admin": sendPanel
    },
    buttons: {
        "admin_buscar": abrirModalBusca,
        "admin_estatisticas": exibirEstatisticas,
        "admin_reset_ranking": confirmarResetRanking,
        "confirmar_reset_ranking": executarResetRanking,
        "cancelar_reset_ranking": cancelarResetRanking
    },
    modals: {
        "modal_admin_buscar": processarModalBusca
    },
    sendPanel
};
