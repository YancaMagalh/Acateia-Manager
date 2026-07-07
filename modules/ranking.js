const { ActionRowBuilder, ButtonBuilder, ButtonStyle , MessageFlags } = require("discord.js");
const config = require("../config");
const { getDB } = require("../database");
const { baseEmbed } = require("../utils/helpers");

// ---------------------------------------------------------
//  Painel (fixo no canal de ranking)
// ---------------------------------------------------------

async function sendPanel(interaction, opcoes = {}) {
    const embed = baseEmbed(config.cores.principal)
        .setAuthor({ name: "Alcateia • Ranking", iconURL: interaction.guild?.iconURL() ?? undefined })
        .setTitle("🏆 Ranking da Alcateia")
        .setDescription(
            "Acompanhe aqui quem mais contribuiu com a matilha! 🐺\n\n" +
            "A pontuação é calculada com base nas entregas de **farm** e nas **ações** registradas.\n\n" +
            "Clique no botão abaixo para ver o ranking atualizado."
        )
        .setThumbnail(interaction.guild?.iconURL() ?? null)
        .setFooter({ text: "Sistema de Ranking da Alcateia" })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("menu_ranking").setLabel("Ver Ranking").setEmoji("🏆").setStyle(ButtonStyle.Primary)
    );

    return interaction.reply({ embeds: [embed], components: [row], ...opcoes });
}

// ---------------------------------------------------------
//  Exibição do ranking
// ---------------------------------------------------------

async function exibirRanking(interaction) {
    const db = getDB();

    const lista = Object.values(db.membros)
        .filter(m => m.status === "aprovado")
        .map(m => ({ ...m, total: (m.pontosFarm || 0) * config.pontos.farm + (m.acoes || 0) * config.pontos.acao }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

    if (lista.length === 0) {
        return interaction.reply({ content: "📉 Ainda não há dados suficientes para gerar o ranking.", flags: MessageFlags.Ephemeral });
    }

    const medalhas = ["🥇", "🥈", "🥉"];
    const descricao = lista
        .map((m, i) => `${medalhas[i] || `**${i + 1}º**`} — **${m.nome}** (${m.passaporte}) | 📦 ${m.pontosFarm || 0} | ⚔️ ${m.acoes || 0} | 🏆 ${m.total} pts`)
        .join("\n");

    const embed = baseEmbed(config.cores.info)
        .setTitle("🏆 Ranking da Alcateia")
        .setDescription(descricao)
        .setFooter({ text: "Pontuação: farm + ações" });

    return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

// ---------------------------------------------------------
//  Exports — contrato usado pelo roteador central (index.js)
// ---------------------------------------------------------

module.exports = {
    commandDescriptions: {
        "painel-ranking": "Envia o painel de Ranking neste canal"
    },
    commands: {
        "painel-ranking": sendPanel
    },
    buttons: {
        "menu_ranking": exibirRanking
    },
    sendPanel
};
