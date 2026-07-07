const {
    Client,
    GatewayIntentBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder,
    EmbedBuilder,
    PermissionFlagsBits
} = require("discord.js");

const config = require("./config");
const { getDB, saveDB } = require("./database");

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

// =========================================================
//  HELPERS
// =========================================================

function isStaff(member) {
    return member.permissions.has(PermissionFlagsBits.Administrator) ||
        (config.cargos.staff && member.roles.cache.has(config.cargos.staff));
}

function baseEmbed(cor) {
    return new EmbedBuilder().setColor(cor || config.cores.principal);
}

async function enviarLog(canalId, embed) {
    if (!canalId) return;
    const canal = await client.channels.fetch(canalId).catch(() => null);
    if (canal) canal.send({ embeds: [embed] }).catch(() => {});
}

function semPermissao(interaction) {
    return interaction.reply({
        content: "⛔ Você não tem permissão para usar esta ação.",
        ephemeral: true
    });
}

// =========================================================
//  PAINEL PRINCIPAL
// =========================================================

async function enviarPainelPrincipal(interaction) {
    const embed = baseEmbed(config.cores.principal)
        .setTitle("🐺 Central da Alcateia")
        .setDescription(
            "### Bem-vindo ao sistema da Alcateia\n" +
            "Escolha um módulo abaixo para continuar.\n\n" +
            "━━━━━━━━━━━━━━━━━━━━━━"
        )
        .setFooter({ text: "Acateia Manager" });

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("menu_registro").setLabel("Registro").setEmoji("📝").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("menu_acoes").setLabel("Ações").setEmoji("⚔️").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("menu_farm").setLabel("Farm").setEmoji("📦").setStyle(ButtonStyle.Success)
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("menu_ausencia").setLabel("Ausências").setEmoji("🏖️").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("menu_ranking").setLabel("Ranking").setEmoji("🏆").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("menu_admin").setLabel("Administração").setEmoji("⚙️").setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({ embeds: [embed], components: [row1, row2] });
}

// =========================================================
//  PAINÉIS INDIVIDUAIS (um por canal)
// =========================================================
// Diferente do painel principal, estes são feitos para ficar fixos
// em um canal específico (ex: #registro, #acoes, #farm...), com os
// botões/menus já prontos para uso — sem precisar passar pelo hub.

async function enviarPainelRegistro(interaction) {
    const embed = baseEmbed(config.cores.principal)
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
        .setFooter({ text: "Sistema de Whitelist e Recrutamento" })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("reg_entrada").setLabel("Entrada").setEmoji("🟢").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("reg_saida").setLabel("Saída").setEmoji("🔴").setStyle(ButtonStyle.Danger)
    );

    return interaction.reply({ embeds: [embed], components: [row] });
}

async function enviarPainelAcoes(interaction) {
    const select = new StringSelectMenuBuilder()
        .setCustomId("select_acao_tipo")
        .setPlaceholder("Selecione o tipo de ação")
        .addOptions(config.tiposAcao.map(t => ({ label: t.label, value: t.value, emoji: t.emoji })));

    const embed = baseEmbed(config.cores.principal)
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
        .setFooter({ text: "Sistema de Ações da Alcateia" })
        .setTimestamp();

    return interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(select)] });
}

async function enviarPainelFarm(interaction) {
    const select = new StringSelectMenuBuilder()
        .setCustomId("select_farm_item")
        .setPlaceholder("Selecione o item entregue")
        .addOptions(config.itensFarm.map(i => ({ label: i.label, value: i.value, emoji: i.emoji })));

    const embed = baseEmbed(config.cores.principal)
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
        .setFooter({ text: "Sistema de Farm da Alcateia" })
        .setTimestamp();

    return interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(select)] });
}

async function enviarPainelAusencia(interaction) {
    const embed = baseEmbed(config.cores.principal)
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
        .setFooter({ text: "Sistema de Ausências da Alcateia" })
        .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("menu_ausencia").setLabel("Solicitar Ausência").setEmoji("🏖️").setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({ embeds: [embed], components: [row] });
}

async function enviarPainelRanking(interaction) {
    const embed = baseEmbed(config.cores.info)
        .setTitle("🏆 Ranking da Alcateia")
        .setDescription("Clique no botão abaixo para ver o ranking atualizado (farm + ações).")
        .setFooter({ text: "Acateia Manager" });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("menu_ranking").setLabel("Ver Ranking").setEmoji("🏆").setStyle(ButtonStyle.Primary)
    );

    return interaction.reply({ embeds: [embed], components: [row] });
}

async function enviarPainelAdmin(interaction) {
    const embed = baseEmbed(config.cores.principal)
        .setTitle("⚙️ Administração")
        .setDescription("Ferramentas exclusivas para a staff da Alcateia. Clique abaixo para abrir o painel.")
        .setFooter({ text: "Acateia Manager" });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("menu_admin").setLabel("Abrir Painel Admin").setEmoji("⚙️").setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({ embeds: [embed], components: [row] });
}

// =========================================================
//  MÓDULO: REGISTRO (Entrada / Saída)
// =========================================================

async function abrirMenuRegistro(interaction) {
    const embed = baseEmbed(config.cores.info)
        .setTitle("📝 Sistema de Registro")
        .setDescription("Escolha uma opção abaixo.");

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("reg_entrada").setLabel("Entrada").setEmoji("🟢").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("reg_saida").setLabel("Saída").setEmoji("🔴").setStyle(ButtonStyle.Danger)
    );

    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

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
    const nome = interaction.fields.getTextInputValue("nome").trim();
    const passaporte = interaction.fields.getTextInputValue("passaporte").trim();
    const telefone = interaction.fields.getTextInputValue("telefone").trim();
    const recrutador = interaction.fields.getTextInputValue("recrutador").trim();

    const db = getDB();

    const existente = db.membros[passaporte];
    if (existente && existente.status === "pendente") {
        return interaction.reply({ content: "⚠️ Já existe um registro **pendente** com esse passaporte.", ephemeral: true });
    }
    if (existente && existente.status === "aprovado") {
        return interaction.reply({ content: "⚠️ Esse passaporte já está **registrado e aprovado**.", ephemeral: true });
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

    await enviarLog(config.canais.aprovacaoRegistro, embed);
    const canalAprovacao = await client.channels.fetch(config.canais.aprovacaoRegistro).catch(() => null);
    if (canalAprovacao) await canalAprovacao.send({ embeds: [embed], components: [row] });

    return interaction.reply({ content: "✅ Registro enviado! Aguarde a aprovação da staff.", ephemeral: true });
}

async function aprovarRegistro(interaction) {
    if (!isStaff(interaction.member)) return semPermissao(interaction);

    const passaporte = interaction.customId.replace("aprovar_", "");
    const db = getDB();
    const membro = db.membros[passaporte];

    if (!membro) return interaction.reply({ content: "❌ Registro não encontrado no banco de dados.", ephemeral: true });

    membro.status = "aprovado";
    saveDB(db);

    if (config.cargos.membro) {
        const guildMember = await interaction.guild.members.fetch(membro.discordId).catch(() => null);
        if (guildMember) await guildMember.roles.add(config.cargos.membro).catch(() => {});
    }

    const embedAtualizado = baseEmbed(config.cores.sucesso)
        .setTitle("🟢 Registro Aprovado")
        .addFields(
            { name: "👤 Nome", value: membro.nome, inline: true },
            { name: "🪪 Passaporte", value: membro.passaporte, inline: true },
            { name: "🤝 Recrutado por", value: membro.recrutador, inline: true },
            { name: "✅ Aprovado por", value: `<@${interaction.user.id}>` }
        );

    await interaction.update({ embeds: [embedAtualizado], components: [] });
    await enviarLog(config.canais.logRegistro, embedAtualizado);

    const usuario = await client.users.fetch(membro.discordId).catch(() => null);
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
    const passaporte = interaction.customId.replace("modal_reprovar_", "");
    const motivo = interaction.fields.getTextInputValue("motivo").trim();

    const db = getDB();
    const membro = db.membros[passaporte];
    if (!membro) return interaction.reply({ content: "❌ Registro não encontrado.", ephemeral: true });

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

    await interaction.update({ embeds: [embedAtualizado], components: [] });
    await enviarLog(config.canais.logRegistro, embedAtualizado);

    const usuario = await client.users.fetch(membro.discordId).catch(() => null);
    if (usuario) usuario.send({ content: `❌ Seu registro na Alcateia foi **reprovado**.\n**Motivo:** ${motivo}` }).catch(() => {});
}

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
    const passaporte = interaction.fields.getTextInputValue("passaporte").trim();
    const motivo = interaction.fields.getTextInputValue("motivo").trim();

    const db = getDB();
    const membro = db.membros[passaporte];

    if (!membro || membro.status !== "aprovado") {
        return interaction.reply({ content: "❌ Nenhum membro **aprovado** encontrado com esse passaporte.", ephemeral: true });
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

    await enviarLog(config.canais.logSaida, embed);
    return interaction.reply({ content: "✅ Saída registrada com sucesso.", ephemeral: true });
}

// =========================================================
//  MÓDULO: AÇÕES
// =========================================================

async function abrirMenuAcoes(interaction) {
    const select = new StringSelectMenuBuilder()
        .setCustomId("select_acao_tipo")
        .setPlaceholder("Selecione o tipo de ação")
        .addOptions(config.tiposAcao.map(t => ({ label: t.label, value: t.value, emoji: t.emoji })));

    const embed = baseEmbed(config.cores.erro)
        .setTitle("⚔️ Registro de Ações")
        .setDescription("Selecione abaixo o tipo de ação que deseja registrar.");

    return interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(select)], ephemeral: true });
}

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

    await enviarLog(config.canais.logAcoes, embed);
    return interaction.reply({ content: "✅ Ação registrada com sucesso.", ephemeral: true });
}

// =========================================================
//  MÓDULO: FARM
// =========================================================

async function abrirMenuFarm(interaction) {
    const select = new StringSelectMenuBuilder()
        .setCustomId("select_farm_item")
        .setPlaceholder("Selecione o item entregue")
        .addOptions(config.itensFarm.map(i => ({ label: i.label, value: i.value, emoji: i.emoji })));

    const embed = baseEmbed(config.cores.sucesso)
        .setTitle("📦 Entrega de Farm")
        .setDescription("Selecione abaixo o item que você está entregando.");

    return interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(select)], ephemeral: true });
}

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

    await enviarLog(config.canais.logFarm, embed);
    return interaction.reply({ content: "✅ Entrega registrada com sucesso.", ephemeral: true });
}

// =========================================================
//  MÓDULO: AUSÊNCIAS
// =========================================================

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

    await enviarLog(config.canais.logAusencia, embed);
    return interaction.reply({ content: "✅ Solicitação de ausência enviada.", ephemeral: true });
}

// =========================================================
//  MÓDULO: RANKING
// =========================================================

async function exibirRanking(interaction) {
    const db = getDB();

    const lista = Object.values(db.membros)
        .filter(m => m.status === "aprovado")
        .map(m => ({ ...m, total: (m.pontosFarm || 0) * config.pontos.farm + (m.acoes || 0) * config.pontos.acao }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

    if (lista.length === 0) {
        return interaction.reply({ content: "📉 Ainda não há dados suficientes para gerar o ranking.", ephemeral: true });
    }

    const medalhas = ["🥇", "🥈", "🥉"];
    const descricao = lista
        .map((m, i) => `${medalhas[i] || `**${i + 1}º**`} — **${m.nome}** (${m.passaporte}) | 📦 ${m.pontosFarm || 0} | ⚔️ ${m.acoes || 0} | 🏆 ${m.total} pts`)
        .join("\n");

    const embed = baseEmbed(config.cores.info)
        .setTitle("🏆 Ranking da Alcateia")
        .setDescription(descricao)
        .setFooter({ text: "Pontuação: farm + ações" });

    return interaction.reply({ embeds: [embed], ephemeral: true });
}

// =========================================================
//  MÓDULO: ADMINISTRAÇÃO
// =========================================================

async function abrirPainelAdmin(interaction) {
    if (!isStaff(interaction.member)) return semPermissao(interaction);

    const embed = baseEmbed(config.cores.principal)
        .setTitle("⚙️ Painel de Administração")
        .setDescription("Ferramentas exclusivas para a staff da Alcateia.");

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("admin_buscar").setLabel("Buscar Membro").setEmoji("🔍").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("admin_estatisticas").setLabel("Estatísticas").setEmoji("📊").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("admin_reset_ranking").setLabel("Resetar Ranking").setEmoji("🗑️").setStyle(ButtonStyle.Danger)
    );

    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

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

    if (!membro) return interaction.reply({ content: "❌ Nenhum membro encontrado com esse passaporte.", ephemeral: true });

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

    return interaction.reply({ embeds: [embed], ephemeral: true });
}

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

    return interaction.reply({ embeds: [embed], ephemeral: true });
}

async function confirmarResetRanking(interaction) {
    if (!isStaff(interaction.member)) return semPermissao(interaction);

    const embed = baseEmbed(config.cores.erro)
        .setTitle("⚠️ Confirmar Reset")
        .setDescription("Isso vai zerar **todos** os pontos de farm e ações de **todos** os membros. Deseja continuar?");

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("confirmar_reset_ranking").setLabel("Confirmar").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("cancelar_reset_ranking").setLabel("Cancelar").setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
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

    return interaction.update({
        content: "✅ Ranking resetado com sucesso.",
        embeds: [],
        components: []
    });
}

// =========================================================
//  ROTEAMENTO DE INTERAÇÕES
// =========================================================

client.on("interactionCreate", async (interaction) => {
    try {
        // ---- Slash Commands ----
        if (interaction.isChatInputCommand()) {
            const comando = interaction.commandName;

            if (comando === "painel") return enviarPainelPrincipal(interaction);
            if (comando === "painel-registro") return enviarPainelRegistro(interaction);
            if (comando === "painel-acoes") return enviarPainelAcoes(interaction);
            if (comando === "painel-farm") return enviarPainelFarm(interaction);
            if (comando === "painel-ausencia") return enviarPainelAusencia(interaction);
            if (comando === "painel-ranking") return enviarPainelRanking(interaction);
            if (comando === "painel-admin") return enviarPainelAdmin(interaction);
        }

        // ---- Botões ----
        if (interaction.isButton()) {
            const { customId } = interaction;

            if (customId === "menu_registro") return abrirMenuRegistro(interaction);
            if (customId === "menu_acoes") return abrirMenuAcoes(interaction);
            if (customId === "menu_farm") return abrirMenuFarm(interaction);
            if (customId === "menu_ausencia") return abrirModalAusencia(interaction);
            if (customId === "menu_ranking") return exibirRanking(interaction);
            if (customId === "menu_admin") return abrirPainelAdmin(interaction);

            if (customId === "reg_entrada") return abrirModalEntrada(interaction);
            if (customId === "reg_saida") return abrirModalSaida(interaction);

            if (customId.startsWith("aprovar_")) return aprovarRegistro(interaction);
            if (customId.startsWith("reprovar_")) return abrirModalReprovacao(interaction);

            if (customId === "admin_buscar") return abrirModalBusca(interaction);
            if (customId === "admin_estatisticas") return exibirEstatisticas(interaction);
            if (customId === "admin_reset_ranking") return confirmarResetRanking(interaction);
            if (customId === "confirmar_reset_ranking") return executarResetRanking(interaction);
            if (customId === "cancelar_reset_ranking") {
                return interaction.update({ content: "❌ Reset cancelado.", embeds: [], components: [] });
            }
        }

        // ---- Select Menus ----
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === "select_acao_tipo") return abrirModalAcao(interaction);
            if (interaction.customId === "select_farm_item") return abrirModalFarm(interaction);
        }

        // ---- Modais ----
        if (interaction.isModalSubmit()) {
            const { customId } = interaction;

            if (customId === "modal_entrada") return processarModalEntrada(interaction);
            if (customId === "modal_saida") return processarModalSaida(interaction);
            if (customId.startsWith("modal_reprovar_")) return processarModalReprovacao(interaction);
            if (customId.startsWith("modal_acao_")) return processarModalAcao(interaction);
            if (customId.startsWith("modal_farm_")) return processarModalFarm(interaction);
            if (customId === "modal_ausencia") return processarModalAusencia(interaction);
            if (customId === "modal_admin_buscar") return processarModalBusca(interaction);
        }
    } catch (error) {
        console.error("Erro ao processar interação:", error);
        if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
            interaction.reply({ content: "❌ Ocorreu um erro ao processar essa ação.", ephemeral: true }).catch(() => {});
        }
    }
});

client.once("ready", () => {
    console.log(`🐺 Bot online como ${client.user.tag}`);
});

client.login(config.token);