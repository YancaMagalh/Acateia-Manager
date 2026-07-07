# Acateia Bot

Bot de gerenciamento completo para a Alcateia: registro (entrada/saída com aprovação),
ações, farm/entregas, ausências, ranking e painel de administração.

## Estrutura

```
acateia-bot/
├── index.js             → lógica principal (painel, botões, modais, ações)
├── config.js             → IDs de cargos/canais e listas configuráveis
├── database.js           → persistência simples em data/data.json
├── deploy-commands.js    → registra o comando /painel no servidor
├── package.json
└── .env.example
```

## Instalação

1. Renomeie `.env.example` para `.env` e preencha:
   - `TOKEN` e `CLIENT_ID` (Discord Developer Portal → sua aplicação)
   - `GUILD_ID` (ID do seu servidor)
   - `CARGO_STAFF_ID` (cargo que pode aprovar/reprovar registros e usar o painel admin)
   - `CARGO_MEMBRO_ID` (cargo dado automaticamente quando um registro é aprovado)
   - Os IDs dos canais (`CANAL_PAINEL_ID`, `CANAL_APROVACAO_ID`, `CANAL_LOG_*`)

2. Instale as dependências:
   ```
   npm install
   ```

3. Registre o comando de barra:
   ```
   npm run deploy
   ```

4. Inicie o bot:
   ```
   npm start
   ```

5. Agora você tem dois jeitos de usar:

   - **Hub único:** use `/painel` em um canal para enviar o painel com todos os
     módulos juntos (Registro, Ações, Farm, Ausências, Ranking, Administração).

   - **Um painel por canal (recomendado se você já separou os canais):**
     rode o comando correspondente **dentro de cada canal**:
     - `/painel-registro` → botões Entrada/Saída fixos no canal
     - `/painel-acoes` → menu de tipos de ação fixo no canal
     - `/painel-farm` → menu de itens de farm fixo no canal
     - `/painel-ausencia` → botão "Solicitar Ausência" fixo no canal
     - `/painel-ranking` → botão "Ver Ranking" fixo no canal
     - `/painel-admin` → botão "Abrir Painel Admin" fixo no canal (só staff consegue usar)

   Todos exigem permissão de Administrador para serem executados, mas os
   botões/menus que eles enviam ficam visíveis e utilizáveis por qualquer
   membro no canal (as permissões internas de staff continuam sendo checadas
   normalmente, ex: aprovar registro, admin, etc).

## Módulos

- **Registro** → Entrada (nome, passaporte, telefone, quem recrutou) envia para o
  canal de aprovação com botões Aprovar/Reprovar. Aprovar dá o cargo de membro
  automaticamente; reprovar pede um motivo e avisa o usuário por DM.
- **Saída** → registra saída por passaporte + motivo e remove o cargo de membro.
- **Ações** → menu de seleção (Patrulha, Abordagem, Prisão, Apreensão, Confronto,
  Outra) abre um modal para detalhar a ocorrência e soma pontos no ranking.
- **Farm** → menu de seleção de itens, modal pede passaporte + quantidade,
  mantém total acumulado por item e soma pontos no ranking.
- **Ausências** → modal simples (passaporte, período, motivo) registrado em canal
  próprio.
- **Ranking** → top 10 por pontuação (farm + ações), calculado a partir do banco.
- **Administração** (somente staff) → buscar ficha de membro por passaporte, ver
  estatísticas gerais e resetar o ranking (com confirmação).

## Observações de segurança

- Nunca coloque o `TOKEN` diretamente no código — ele já está isolado em `.env`
  (que não deve ser commitado; adicione ao `.gitignore`).
- As ações de aprovar/reprovar e o painel de administração verificam o cargo de
  staff (ou permissão de Administrador) antes de executar qualquer coisa.
- Os dados ficam em `data/data.json`. Para uso em produção com muitos membros,
  o ideal é migrar para um banco real (SQLite/PostgreSQL/MongoDB), mas essa
  estrutura já funciona bem para servidores de porte pequeno/médio.