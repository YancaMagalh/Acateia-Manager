require("dotenv").config();

module.exports = {
    // Credenciais do bot (definidas no arquivo .env)
    token: process.env.TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID,

    // Cargos usados nas permissões
    cargos: {
        staff: process.env.CARGO_STAFF_ID,   // quem pode aprovar/reprovar e usar o painel admin
        membro: process.env.CARGO_MEMBRO_ID  // cargo dado quando o registro é aprovado
    },

    // Canais usados pelo bot
    canais: {
        painel: process.env.CANAL_PAINEL_ID,
        aprovacaoRegistro: process.env.CANAL_APROVACAO_ID,
        logRegistro: process.env.CANAL_LOG_REGISTRO_ID,
        logSaida: process.env.CANAL_LOG_SAIDA_ID,
        logAcoes: process.env.CANAL_LOG_ACOES_ID,
        logFarm: process.env.CANAL_LOG_FARM_ID,
        logAusencia: process.env.CANAL_LOG_AUSENCIA_ID
    },

    // Tipos de ação disponíveis no menu "Ações"
    tiposAcao: [
        { label: "Patrulha", value: "patrulha", emoji: "🚓" },
        { label: "Abordagem", value: "abordagem", emoji: "🛑" },
        { label: "Prisão", value: "prisao", emoji: "🚔" },
        { label: "Apreensão", value: "apreensao", emoji: "📦" },
        { label: "Confronto", value: "confronto", emoji: "⚔️" },
        { label: "Outra", value: "outra", emoji: "📋" }
    ],

    // Itens disponíveis no menu "Farm"
    itensFarm: [
        { label: "Maconha", value: "maconha", emoji: "🌿" },
        { label: "Cocaína", value: "cocaina", emoji: "❄️" },
        { label: "Munição", value: "municao", emoji: "🔫" },
        { label: "Armas", value: "armas", emoji: "🔪" },
        { label: "Componentes", value: "componentes", emoji: "⚙️" }
    ],

    // Pontuação por ação (usada no ranking)
    pontos: {
        acao: 2,
        farm: 1
    },

    // Formato do apelido aplicado ao aprovar um registro.
    // Variáveis disponíveis: {nome} e {passaporte}
    formatoApelido: "{nome} | {passaporte}",

    cores: {
        principal: "#2b2d31",
        sucesso: "Green",
        erro: "Red",
        aviso: "Yellow",
        info: "Blue"
    }
};
