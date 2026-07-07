# Acateia Bot (v2 — arquitetura modular)

Cada painel agora é um **módulo independente**, num arquivo próprio. O `index.js`
não tem mais nenhuma lógica de painel — ele só carrega tudo de `/modules` e roteia
as interações para o módulo certo.

## Estrutura

```
acateia-bot/
├── index.js               → carrega os módulos e roteia interações (genérico)
├── deploy-commands.js      → registra os slash commands lidos de cada módulo
├── config.js               → IDs de cargos/canais e listas configuráveis
├── database.js             → persistência simples em data/data.json
├── utils/
│   └── helpers.js          → isStaff, baseEmbed, enviarLog, semPermissao
└── modules/
    ├── registro.js          → painel + entrada/saída + aprovação/reprovação
    ├── acoes.js             → painel + registro de ações
    ├── farm.js              → painel + registro de entregas
    ├── ausencia.js          → painel + solicitação de ausência
    ├── ranking.js           → painel + exibição do ranking
    ├── admin.js             → painel + busca/estatísticas/reset
    └── hub.js               → painel principal opcional (atalhos ephemeral)
```

## Como funciona o roteamento

Cada módulo em `/modules` exporta um "contrato" padrão:

```js
module.exports = {
    commandDescriptions: { "painel-x": "descrição do comando" },
    commands: { "painel-x": sendPanel },        // slash command → função
    buttons: { "custom_id": handler },           // botão → função
    buttonPrefixes: [["prefixo_", handler]],     // botões com id dinâmico (ex: aprovar_123)
    selects: { "custom_id": handler },           // select menu → função
    modals: { "custom_id": handler },            // modal → função
    modalPrefixes: [["prefixo_", handler]]       // modais com id dinâmico
};
```

O `index.js` lê todos os arquivos de `/modules` automaticamente e usa esse
contrato para rotear cada interação. **Para criar um painel novo, basta criar
um arquivo em `/modules` seguindo esse formato — nada em `index.js` precisa
mudar.**

## Instalação

1. Renomeie `.env.example` para `.env` e preencha:
   - `TOKEN`, `CLIENT_ID`, `GUILD_ID`
   - `CARGO_STAFF_ID`, `CARGO_MEMBRO_ID`
   - Os IDs dos canais (`CANAL_APROVACAO_ID`, `CANAL_LOG_*`, etc.)

2. Instale as dependências:
   ```
   npm install
   ```

3. Registre os comandos (lidos automaticamente de cada módulo):
   ```
   npm run deploy
   ```

4. Inicie o bot:
   ```
   npm start
   ```

5. Em **cada canal**, rode o comando do painel correspondente (precisa de
   permissão de Administrador para rodar o comando; os botões/menus ficam
   visíveis e utilizáveis por qualquer membro depois):

   | Canal          | Comando             |
   |----------------|----------------------|
   | #registro      | `/painel-registro`  |
   | #ações         | `/painel-acoes`     |
   | #farm          | `/painel-farm`      |
   | #ausências     | `/painel-ausencia`  |
   | #ranking       | `/painel-ranking`   |
   | #administração | `/painel-admin`     |
   | #geral (opcional) | `/painel` (hub com atalhos para tudo) |

## Módulos

- **Registro** → Entrada (nome, passaporte, telefone, quem recrutou) envia para
  o canal de aprovação com botões Aprovar/Reprovar. Aprovar dá o cargo de membro
  automaticamente; reprovar pede motivo e avisa por DM. Saída remove o cargo.
- **Ações** → menu de tipos (Patrulha, Abordagem, Prisão, Apreensão, Confronto,
  Outra) → modal de detalhes → log + pontos no ranking.
- **Farm** → menu de itens → modal de quantidade → total acumulado por item +
  pontos no ranking.
- **Ausências** → modal (passaporte, período, motivo) registrado em canal próprio.
- **Ranking** → top 10 por pontuação (farm + ações).
- **Administração** (somente staff) → buscar ficha por passaporte, estatísticas
  gerais e reset de ranking com confirmação.

## Observações de segurança

- Nunca coloque o `TOKEN` direto no código — ele fica isolado em `.env`
  (adicione ao `.gitignore`, não commite esse arquivo).
- Aprovar/reprovar registros e o painel de administração checam o cargo de
  staff (ou permissão de Administrador) antes de fazer qualquer coisa.
- Dados ficam em `data/data.json`. Para servidores grandes, migrar para um
  banco real (SQLite/PostgreSQL) é recomendado, mas essa estrutura atende bem
  servidores pequenos/médios.
