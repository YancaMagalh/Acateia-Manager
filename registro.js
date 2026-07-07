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
const { baseEmbed, enviarLog, isStaff, semPermissao } = require("../utils/helpers");

// ---------------------------------------------------------
//  Painel (fixo no canal de registro)
// ---------------------------------------------------------

async function sendPanel(interaction, opcoes = {}) {
    const embed = baseEmbed(config.cores.principal)
        .setAuthor({ name: "Alcateia • Recrutamento", iconURL: interaction.guild?.iconURL() ?? undefined })
        .setTitle("📋 Sistema de Registro")
        .setDescription(
            "Seja muito bem-vindo(a) à Alcateia! 👋\n\n" +
            "Para liberar seu acesso total e interagir na matilha, você precisa realizar o seu registro.\n\n" +
            "━━━━━━━━━━━━━━━━━━━━━━\n\n" +
            "📝 **Como realizar o registro?**\n\n" +
            "1. Clique no botão verde **Entrada** abaixo\n" +
            "2. Preencha o formulário com seu nome, passaporte, telefone e quem te recrutou\n" +
            "3. Aguarde a aprovação de um recrutador\n\n" +
            "━━━━━━━━━━━━━━━━━━━━━━\n\n" +
            "⚠️ Certifique-se de preencher as informações corretamente para evitar reprovação.\n\n" +
            "Já faz parte da Alcateia e vai sair? Use o botão vermelho **Saída**."
        )
        .setThumbnail(interaction.guild?.iconURL() ?? null)
        .setFooter({ text: "Sistema de Whitelist e Recrutamento" })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("reg_entrada").setLabel("Entrada").setEmoji("🟢").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("reg_saida").setLabel("Saída").setEmoji("🔴").setStyle(ButtonStyle.Danger)
    );

    return interaction.reply({ embeds: [embed], components: [row], ...opcoes });
}

// ---------------------------------------------------------
//  Entrada
// ---------------------------------------------------------

async function abrirModalEntrada(interaction) {
    const modal = new ModalBuilder().setCustomId("modal_entrada").setTitle("Registro de Entrada");

    const nome = new TextInputBuilder().setCustomId("nome").setLabel("Nome RP").setPlaceholder("Ex: Kaleesi").setStyle(TextInputStyle.Short).setRequired(true);
    const passaporte = new TextInputBuilder().setCustomId("passaporte").setLabel("Passaporte").setPlaceholder("Ex: 4521").setStyle(TextInputStyle.Short).setRequired(true);
    const telefone = new TextInputBuilder().setCustomId("telefone").setLabel("Telefone In-Game").setPlaceholder("Ex: 8256").setStyle(TextInputStyle.Short).setRequired(true);
    const recrutador = new TextInputBuilder().setCustomId("recrutador").setLabel("Quem recrutou?").setPlaceholder("Nome RP de quem indicou").setStyle(TextInputStyle.Short).setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(nome),
        new ActionRowBuilder().addComponents(passaporte),
        new ActionRowBuilder().addComponents(telefone),
        new ActionRowBuilder().addComponents(recrutador)
    );

    return interaction.showModal(modal);
}

async function processarModalEntrada(interaction) {
    // Confirma o envio imediatamente para não estourar o prazo de 3s
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const nome = interaction.fields.getTextInputValue("nome").trim();
    const passaporte = interaction.fields.getTextInputValue("passaporte").trim();
    const telefone = interaction.fields.getTextInputValue("telefone").trim();
    const recrutador = interaction.fields.getTextInputValue("recrutador").trim();

    const db = getDB();

    const existente = db.membros[passaporte];
    if (existente && existente.status === "pendente") {
        return interaction.editReply({ content: "⚠️ Já existe um registro **pendente** com esse passaporte." });
    }
    if (existente && existente.status === "aprovado") {
        return interaction.editReply({ content: "⚠️ Esse passaporte já está **registrado e aprovado**." });
    }

    db.membros[passaporte] = {
        nome,
        passaporte,
        telefone,
        recrutador,
        discordId: interaction.user.id,
        status: "pendente",
        entradaEm: Date.now(),
        saidaEm: null,
        pontosFarm: 0,
        acoes: 0
    };
    saveDB(db);

    const embed = baseEmbed(config.cores.aviso)
        .setTitle("🟡 Novo Registro de Entrada — Pendente")
        .addFields(
            { name: "👤 Nome", value: nome, inline: true },
            { name: "🪪 Passaporte", value: passaporte, inline: true },
            { name: "📱 Telefone", value: telefone, inline: true },
            { name: "🤝 Recrutado por", value: recrutador, inline: true },
            { name: "👮 Discord", value: `<@${interaction.user.id}>`, inline: true },
            { name: "📅 Data", value: `<t:${Math.floor(Date.now() / 1000)}:F>` }
        )
        .setFooter({ text: "Acateia Manager • Aguardando aprovação" });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`aprovar_${passaporte}`).setLabel("Aprovar").setEmoji("✅").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`reprovar_${passaporte}`).setLabel("Reprovar").setEmoji("❌").setStyle(ButtonStyle.Danger)
    );

    await enviarLog(interaction.client, config.canais.aprovacaoRegistro, embed, [row]);

    return interaction.editReply({ content: "✅ Registro enviado! Aguarde a aprovação da staff." });
}

// ---------------------------------------------------------
//  Aprovação / Reprovação
// ---------------------------------------------------------

/**
 * Reconstrói o registro a partir dos campos do embed de aprovação.
 * Útil quando o data.json foi apagado (ex: redeploy da hospedagem):
 * o embed pendente já contém todos os dados necessários.
 */
function reconstruirDoEmbed(message, passaporte) {
    const embed = message?.embeds?.[0];
    if (!embed || !embed.fields) return null;

    const campo = (parte) => embed.fields.find(f => f.name.includes(parte))?.value ?? "n/a";

    const discordRaw = campo("Discord");
    const discordId = (discordRaw.match(/\d{15,}/) || [null])[0];
    if (!discordId) return null;

    return {
        nome: campo("Nome"),
        passaporte,
        telefone: campo("Telefone"),
        recrutador: campo("Recrutado"),
        discordId,
        status: "pendente",
        entradaEm: Date.now(),
        saidaEm: null,
        pontosFarm: 0,
        acoes: 0
    };
}

async function aprovarRegistro(interaction) {
    if (!isStaff(interaction.member)) return semPermissao(interaction);

    // Confirma o clique IMEDIATAMENTE (evita "Esta interação falhou"
    // se as etapas seguintes demorarem mais de 3 segundos)
    await interaction.deferUpdate();

    const passaporte = interaction.customId.replace("aprovar_", "");
    const db = getDB();
    let membro = db.membros[passaporte];

    // Fallback: se o banco foi apagado (redeploy), reconstrói do próprio embed
    if (!membro) {
        membro = reconstruirDoEmbed(interaction.message, passaporte);
        if (membro) db.membros[passaporte] = membro;
    }

    if (!membro) {
        return interaction.followUp({ content: "❌ Registro não encontrado e não foi possível recuperar os dados do embed. Peça para a pessoa refazer o registro.", flags: MessageFlags.Ephemeral });
    }

    membro.status = "aprovado";
    saveDB(db);

    if (config.cargos.membro) {
        const guildMember = await interaction.guild.members.fetch(membro.discordId).catch(() => null);
        if (guildMember) {
            const ok = await guildMember.roles.add(config.cargos.membro).then(() => true).catch(() => false);
            if (!ok) {
                await interaction.followUp({ content: "⚠️ Registro aprovado, mas não consegui adicionar o cargo. Verifique se o cargo do bot está ACIMA do cargo de membro e se ele tem a permissão 'Gerenciar Cargos'.", flags: MessageFlags.Ephemeral }).catch(() => {});
            }
        }
    }

    const embedAtualizado = baseEmbed(config.cores.sucesso)
        .setTitle("🟢 Registro Aprovado")
        .addFields(
            { name: "👤 Nome", value: membro.nome, inline: true },
            { name: "🪪 Passaporte", value: membro.passaporte, inline: true },
            { name: "🤝 Recrutado por", value: membro.recrutador, inline: true },
            { name: "✅ Aprovado por", value: `<@${interaction.user.id}>` }
        );

    await interaction.editReply({ embeds: [embedAtualizado], components: [] });
    await enviarLog(interaction.client, config.canais.logRegistro, embedAtualizado);

    const usuario = await interaction.client.users.fetch(membro.discordId).catch(() => null);
    if (usuario) usuario.send({ content: `✅ Seu registro na Alcateia foi **aprovado**! Bem-vindo(a), ${membro.nome}.` }).catch(() => {});
}

async function abrirModalReprovacao(interaction) {
    if (!isStaff(interaction.member)) return semPermissao(interaction);

    const passaporte = interaction.customId.replace("reprovar_", "");
    const modal = new ModalBuilder().setCustomId(`modal_reprovar_${passaporte}`).setTitle("Motivo da Reprovação");

    const motivo = new TextInputBuilder().setCustomId("motivo").setLabel("Motivo").setStyle(TextInputStyle.Paragraph).setRequired(true);
    modal.addComponents(new ActionRowBuilder().addComponents(motivo));

    return interaction.showModal(modal);
}

async function processarModalReprovacao(interaction) {
    await interaction.deferUpdate();

    const passaporte = interaction.customId.replace("modal_reprovar_", "");
    const motivo = interaction.fields.getTextInputValue("motivo").trim();

    const db = getDB();
    let membro = db.membros[passaporte];

    // Fallback: se o banco foi apagado (redeploy), reconstrói do próprio embed
    if (!membro) {
        membro = reconstruirDoEmbed(interaction.message, passaporte);
        if (membro) db.membros[passaporte] = membro;
    }

    if (!membro) return interaction.followUp({ content: "❌ Registro não encontrado e não foi possível recuperar os dados do embed.", flags: MessageFlags.Ephemeral });

    membro.status = "reprovado";
    saveDB(db);

    const embedAtualizado = baseEmbed(config.cores.erro)
        .setTitle("🔴 Registro Reprovado")
        .addFields(
            { name: "👤 Nome", value: membro.nome, inline: true },
            { name: "🪪 Passaporte", value: membro.passaporte, inline: true },
            { name: "❌ Reprovado por", value: `<@${interaction.user.id}>` },
            { name: "📄 Motivo", value: motivo }
        );

    await interaction.editReply({ embeds: [embedAtualizado], components: [] });
    await enviarLog(interaction.client, config.canais.logRegistro, embedAtualizado);

    const usuario = await interaction.client.users.fetch(membro.discordId).catch(() => null);
    if (usuario) usuario.send({ content: `❌ Seu registro na Alcateia foi **reprovado**.\n**Motivo:** ${motivo}` }).catch(() => {});
}

// ---------------------------------------------------------
//  Saída
// ---------------------------------------------------------

async function abrirModalSaida(interaction) {
    const modal = new ModalBuilder().setCustomId("modal_saida").setTitle("Registro de Saída");

    const passaporte = new TextInputBuilder().setCustomId("passaporte").setLabel("Passaporte").setStyle(TextInputStyle.Short).setRequired(true);
    const motivo = new TextInputBuilder().setCustomId("motivo").setLabel("Motivo da saída").setStyle(TextInputStyle.Paragraph).setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(passaporte),
        new ActionRowBuilder().addComponents(motivo)
    );

    return interaction.showModal(modal);
}

async function processarModalSaida(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const passaporte = interaction.fields.getTextInputValue("passaporte").trim();
    const motivo = interaction.fields.getTextInputValue("motivo").trim();

    const db = getDB();
    const membro = db.membros[passaporte];

    if (!membro || membro.status !== "aprovado") {
        return interaction.editReply({ content: "❌ Nenhum membro **aprovado** encontrado com esse passaporte." });
    }

    membro.status = "saiu";
    membro.saidaEm = Date.now();
    saveDB(db);

    if (config.cargos.membro) {
        const guildMember = await interaction.guild.members.fetch(membro.discordId).catch(() => null);
        if (guildMember) await guildMember.roles.remove(config.cargos.membro).catch(() => {});
    }

    const embed = baseEmbed(config.cores.erro)
        .setTitle("🔴 Registro de Saída")
        .addFields(
            { name: "👤 Nome", value: membro.nome, inline: true },
            { name: "🪪 Passaporte", value: membro.passaporte, inline: true },
            { name: "📄 Motivo", value: motivo },
            { name: "👮 Registrado por", value: `<@${interaction.user.id}>` },
            { name: "📅 Data", value: `<t:${Math.floor(Date.now() / 1000)}:F>` }
        );

    await enviarLog(interaction.client, config.canais.logSaida, embed);
    return interaction.editReply({ content: "✅ Saída registrada com sucesso." });
}

// ---------------------------------------------------------
//  Exports — contrato usado pelo roteador central (index.js)
// ---------------------------------------------------------

module.exports = {
    commandDescriptions: {
        "painel-registro": "Envia o painel de Registro (Entrada/Saída) neste canal"
    },
    commands: {
        "painel-registro": sendPanel
    },
    buttons: {
        "reg_entrada": abrirModalEntrada,
        "reg_saida": abrirModalSaida
    },
    buttonPrefixes: [
        ["aprovar_", aprovarRegistro],
        ["reprovar_", abrirModalReprovacao]
    ],
    modals: {
        "modal_entrada": processarModalEntrada,
        "modal_saida": processarModalSaida
    },
    modalPrefixes: [
        ["modal_reprovar_", processarModalReprovacao]
    ],
    sendPanel
};
