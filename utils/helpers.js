const { EmbedBuilder, PermissionFlagsBits , MessageFlags } = require("discord.js");
const config = require("../config");

/** Verifica se o membro é staff (cargo configurado ou Administrador) */
function isStaff(member) {
    return member.permissions.has(PermissionFlagsBits.Administrator) ||
        (config.cargos.staff && member.roles.cache.has(config.cargos.staff));
}

/** Cria um embed já com a cor padrão da Alcateia */
function baseEmbed(cor) {
    return new EmbedBuilder().setColor(cor || config.cores.principal);
}

/** Envia um embed de log para um canal configurado (ignora se o canal não existir) */
async function enviarLog(client, canalId, embed, components = []) {
    if (!canalId) return null;
    const canal = await client.channels.fetch(canalId).catch(() => null);
    if (!canal) return null;
    return canal.send({ embeds: [embed], components }).catch(() => null);
}

/** Resposta padrão para quando o usuário não tem permissão de staff */
function semPermissao(interaction) {
    return interaction.reply({
        content: "⛔ Você não tem permissão para usar esta ação.",
        flags: MessageFlags.Ephemeral
    });
}

module.exports = { isStaff, baseEmbed, enviarLog, semPermissao };
