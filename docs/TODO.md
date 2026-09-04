# 📋 Backlog & To-Do List do Projeto — Mesas do Breder

Este documento centraliza as funcionalidades planejadas, melhorias de experiência de usuário (UX), compêndios canônicos e débitos técnicos priorizados para o ecossistema **Mesas do Breder** e **Mighty Blade 3e**.

---

## 🎯 Implementações Concluídas Recentemente

### 1. 🧙 Gerador de Nomes: Filtro por Gênero (Masculino / Feminino) — ✅ [CONCLUÍDO]
* **Objetivo:** Permitir ao usuário escolher gerar nomes especificamente masculinos, femininos ou aleatórios mistos com base na cultura de cada raça.
* **Implementação Realizada:**
  * Motor `@mighty-blade/rules-core`: `nomes.ts` atualizado para aceitar `genero: "masculino" | "feminino" | "macho" | "femea"`, com resolução de patronímicos Aesir (`-son` / `-dotir`) e testes unitários 100% aprovados.
  * Interface `apps/web`: Na criação de ficha (`Ficha.tsx`), adicionada a tríade de botões rápidos: `[ ♂ Masc ]` `[ ♀ Fem ]` `[ 🎲 ]`.

---

### 2. 📁 Pastas de Parties no Dashboard (Organizador de Campanhas & Mesas) — ✅ [CONCLUÍDO]
* **Objetivo:** Permitir ao usuário criar pastas temáticas no Dashboard para agrupar e organizar suas fichas por mesa/campanha (inspirado no *DMV / Dungeon Master Vault* e *Foundry VTT*).
* **Implementação Realizada:**
  * Armazenamento unificado com `pastaStorage.ts` (CRUD completo com cores customizadas, IDs exclusivos e persistência).
  * Barra de abas dinâmicas no topo do Dashboard (`[ 👥 Todos ]`, `[ 📁 Party ]`, `[ 📂 Sem Grupo ]`, `[ ➕ Nova Party / Pasta ]`).
  * Badges temáticos em cada card/tabela com menu flutuante para transferir de pasta com 1 clique.

---

### 3. 🏷️ Etiquetas Táticas: Aliado, Neutro e Inimigo — ✅ [CONCLUÍDO]
* **Objetivo:** Marcação visual clara da postura tática de cada indivíduo, criatura ou facção (🟢 Aliado, ⚪ Neutro, 🔴 Inimigo).
* **Implementação Realizada:**
  * Alternador dinâmico de postura tática no card de relacionamento do modal e na sanfona de detalhes da ficha.

---

### 4. 📊 Barra de Reputação & Afinidade Social (-100 a +100) — ✅ [CONCLUÍDO]
* **Objetivo:** Rastrear o quanto personagens ou grupos gostam/confiam uns nos outros.
* **Implementação Realizada:**
  * Slider de -100 (Ódio/Inimizade 👎) a +100 (Amizade/Lealdade 👍) com valor neutro em 0.
  * Seleção dinâmica por categoria: Personagens do Dashboard, Parties/Pastas, Organizações Canônicas de Drakon ou NPCs customizados.
  * **Prevenção de Conflitos:** Filtro nos selects para alvos já vinculados e bloqueio contra duplicatas.

---

### 5. 😈/😇 Bússola Moral & Karma (-100 a +100) — ✅ [CONCLUÍDO]
* **Objetivo:** Rastrear a bússola ética do personagem ao longo da campanha.
* **Implementação Realizada:**
  * Escala de -100 (Diabólico / Cruel 😈) a +100 (Altruísta / Luminoso 😇).
  * Slider `.mb-range-slider` em escala completa de 100% a 100%, sem travamentos visuais.

---

### 6. 📖 Markdown & Wikilinks Bidirecionais ([[Nome]]) — ✅ [CONCLUÍDO]
* **Objetivo:** Anotações ricas estilo Obsidian com navegação entre fichas.
* **Implementação Realizada:**
  * Componente `MarkdownWikilinks.tsx` com parsing de Markdown e resolução de `[[Nome]]` em botões interativos para heróis e organizações.

---

### 7. 🪙 Fluxo de Caixa, Extrato de Moedas & Polimento Visual — ✅ [CONCLUÍDO]
* **Objetivo:** Gestão financeira de ganhos e gastos com histórico e estorno por `[✕]`.
* **Implementação Realizada:**
  * Schema canônico `transacaoDinheiroSchema` em `@mighty-blade/rules-core`.
  * Modal `ModalFluxoCaixa.tsx` com extrato cronológico e estorno com confirmação.
  * Correção de duplo tooltip e centralização dos cabeçalhos das sanfonas.

---

### 8. ⚡ Sincronização Atômica de Nível e Telas de Evolução — ✅ [CONCLUÍDO]
* **Objetivo:** Reset atômico do XP para 0 ao aceitar level up e abertura imediata nos painéis de Habilidades da Classe (esquerda) e Evolução (direita).
* **Implementação Realizada:**
  * Persistência assíncrona com `key` dinâmica de remount no `BuilderFicha`.
  * Efeito festivo de confetes comemorativos (`canvas-confetti`) disparado no aceite da evolução.

---

### 9. 🎨 Estrutura em Grid de 2 Linhas no Cabeçalho da Ficha — ✅ [CONCLUÍDO]
* **Objetivo:** Separar ações de sistema (Linha 1: Voltar, Notas, Moedas, Editar, Imprimir) dos atributos vivos de jogo (Linha 2: Nome, Nível, XP, Raça, Classe).
* **Implementação Realizada:**
  * Grid CSS dedicado `.ficha-header-grid` contido em 1400px de largura máxima.
  * Cartão compacto e unificado de Nível e XP com botões de incremento `(-)` `(+)` e círculos dinâmicos de progresso sem quebra de palavras.

---

### 10. 📜 Compêndio Canônico Oficial de Drakon & Cassiopéia (Fases 1 a 5) — ✅ [CONCLUÍDO]
* **Objetivo:** Integrar todo o lore oficial do cenário com links bidirecionais (`[[Wikilinks]]`) e citações canônicas de livros/páginas.
* **Implementação Realizada:**
  * **Fase 1 — Cronologia & Linha do Tempo (`cronologia.md`):** Os 3 calendários (Conto das Rochas, Arkanita e Tebryniano), as 5 Eras e a linha de tempo (-3000 a 521).
  * **Fase 2 — O Reino de Tebryn (`reino-de-tebryn.md`):** Geopolítica, Meritocracia Titular, Moeda Tebryniana, os 11 Condados detalhados e nações vizinhas. Mocks removidos.
  * **Fase 3 — Personagens & Linhagens (`personagens.md`):** Dinastia Strauss, nobreza regional (Gardóvia/Obrien/Esterlin), heróis históricos e mestres da Academia Argêntea.
  * **Fase 4 — Organizações & Leis (`organizacoes-leis.md`):** Sistema de justiça com 3 instâncias, Arcontes e Oráculos, Matriz Canônica de Crimes e Penas, e as 13 organizações com sinergias e rivalidades.
  * **Fase 5 — Conflitos Recentes & Ganchos 521 (`conflitos-ganchos.md`):** Morte de Honório, juventude de Rob van Strauss, crise com anões de Dagothar, guerra fria arkanita, 5 ganchos regionais e Tabela 1d6 de Rumores de Taverna.
  * **Renderizador Avançado (`LoreRenderer.tsx`):** Preprocessador de Wikilinks para Bestiário, Raças, Classes, Organizações e Glossário extenso, badges flutuantes para referências bibliográficas (`[25]`, `[Guia de Tebryn]`) e suporte completo a tabelas GFM (`remark-gfm`).

---

### 11. 🐾 Compêndio de Criaturas: Monstrum Codex (2012) & Expansões — ✅ [CONCLUÍDO]
* **Objetivo:** Disponibilizar o bestiário clássico e regras legadas com conectividade total com o Obsidian e o VTT.
* **Implementação Realizada:**
  * **Capítulo I a IV:** Animais mundanos com atributos F/A/I/V, monstros dracônicos ([[Canidrako]]), povos inteligentes ([[Ygdrus]], Halflings) e seres artificiais ([[Elementais]] de Fogo/Gelo de Pequeno a Gigante, [[Golens]] de Ferro).
  * **Capítulo V — Seres Sobrenaturais:** [[Cão Infernal]] (Pequeno e Grande), [[Espectro Perdido]] e a bruxa necromante [[Gubaba, A Yaga]] (80 PV, 200 PM).
  * **Capítulo VI — O Codex Extra de Criaturas:** [[Golem de Lama]] e [[Golem de Madeira]] (Pequeno a Colossal) e o **Modelo Matemático de Zumbificação** (-1 Agi, -1 Int, -10 PV/PM, Imunidade a Frio, Mente Vazia, Corpo Amórfico) com o [[Cão Mastim Zumbi]].
  * **Capítulo VII — Variações do Codex Monstrorum (2022):** O [[Leão]] resgatado (Ameaça 2, pág. 94) e tabela de variações biológicas (Lince, Caracal, Víbora, Orca, Pégaso, Hipoalectrion, Rena, Salamandra, Yaguaro).

---

### 12. 🎲 Foundry VTT v14: Manuais Oficiais & Arquitetura Obsidian Bases (Item 1/33 Excalidraw) — ✅ [CONCLUÍDO]
* **Objetivo:** Estabelecer a documentação técnica definitiva e canônica do sistema Mighty Blade 3.5 para Foundry VTT v14, estruturada no padrão **Obsidian Bases** (YAML Frontmatter tipado) e conectada por links bidirecionais (`[[...]]`).
* **Implementação Realizada:**
  * **Manual do Sistema (`manual-do-sistema.md`):** Guia completo de regras e operação em mesa virtual (Atores `character` e `npc`, 9 tipos de Itens, rolagens de dados $X\text{d6}$, iniciativa $2\text{d6} + \max(\text{Agi}, \text{Int})$, defesas ativas triplas, cálculo de carga e importador 1-clique de JSON canônico do site).
  * **Manual Técnico de Engenharia (`manual-tecnico.md`):** Guia aprofundado para o mantenedor (Guilherme Breder) detalhando manifesto `system.json`, DataModels tipados (`TypeDataModel`), concessões automáticas em `MightyBladeActor`, pipeline ClassicLevel/LevelDB para compilação dos compêndios (`scripts/import_all.mjs`), compilação SASS, testes locais no Foundry v14 e checklist de releases.
  * **Sincronização Bidirecional:** Arquivos criados e sincronizados tanto em `mighty-blade-foundry-vtt/docs/` quanto em `MightyBlade3eWebsite/docs/obsidian/`, com MOCs e grafos Mermaid atualizados em `Home.md`.

---

### 13. 📱 Estratégia Mobile: PWA, Android (Google Play) & iOS no Backlog (Item 2/33 Excalidraw) — ✅ [CONCLUÍDO]
* **Objetivo:** Definir e registrar as diretrizes arquiteturais, financeiras e educacionais para a presença móvel da plataforma Mesas do Breder.
* **Implementação Realizada:**
  * **Documentação Oficial (`estrategia-mobile-pwa-android.md`):** Mapeamento comparativo das lojas (Google Play taxa única US$ 25 vitalícia vs Apple App Store US$ 99 anuais + exigência de Mac físico).
  * **Arquitetura Anti-Duplicação:** Decisão técnica de não reescrever o sistema em Kotlin nativo; uso de **PWA (Progressive Web App)** imediato com custo zero (botão nativo de instalação e modo offline em Android e iOS) e empacotamento com **Capacitor / TWA** para publicação do `.aab` no Google Play Console.
  * **Sinergia Acadêmica com a PUC:** Orientação para focar a matéria de Kotlin em microsserviços/apps utilitários (Rolador 3d6 e Calculadora de Recursos) sem sobrecarregar o monorepo principal.
  * **Sincronização Bidirecional:** Documento espelhado em ambos os repositórios com MOCs atualizados em `Home.md`.

### 14. 👑 Landing Page: Seções "Sobre Nós (Quem é o Bredo?)", "Apoiadores" e "FAQ Copilot-Style" (Item 3/33 Excalidraw) — ✅ [CONCLUÍDO]
* **Objetivo:** Trazer identidade autêntica, história humana do criador, espaço para parcerias e autoridade técnica para a landing page de `https://mesasdobreder.vercel.app`.
* **Implementação Realizada:**
  * **Apoiadores & Parcerias (`#apoiadores`):** Vitrine no estilo logo cloud para comunidades (Mighty Blade Brasil, Foundry VTT Brasil, Coisinha Verde, Canais de RPG Indie, Financiamentos Coletivos no Catarse) com card de CTA `Sua Marca ou Canal Aqui` direcionando para parceria via Discord.
  * **Sobre Nós / Quem é o Bredo? (`#sobre`):**
    * Card de perfil com avatar oficial do GitHub (`https://github.com/Gbredo.png`), aura neon e status dinâmico.
    * Ticker / Typewriter rotativo (`useTypewriter`) alternando entre as facetas: `Advogado & Jurista`, `Dev Fullstack`, `Filho da PUC`, `Mestre de RPG desde 2012` e `Criador do Mesas do Breder`.
    * Storytelling autêntico destacando o encontro entre o rigor normativo do Direito, a engenharia de software da PUC e a paixão pelo Mighty Blade 3e.
    * **Menção Honrosa aos Primeiros Contribuidores (Print 1):** Badges dedicados para Gabriel Ykaro (`@ScarletYkaro10`), Enzo (`@Enzito03`) e a parceria de programação com IA.
    * Grid de métricas do projeto (100% canônico, v14 nativo no Foundry, PUC e R$ 0).
  * **Perguntas Frequentes (`#faq`):** Acordeão interativo Copilot-style com as 6 dúvidas cruciais (Gratuidade vitalícia, Direitos autorais e respeito ao Coisinha Verde, Integração com Foundry VTT v14, Impressão em PDF A4 Clássico, App PWA no celular e Ferramentas Homebrew).
  * **Animações Fluídas de Scroll:** Compatibilidade total com `.reveal-on-scroll` com suporte a subida e descida reativa.

---

## 🎯 Próximas Implementações Priorizadas (Próxima Sessão)

### 1. 📐 Triagem & Filtro das 33 Anotações do Excalidraw
* **Objetivo:** Revisar as 33 anotações pendentes da prancheta do Excalidraw para:
  * Separar o que é essencial para o VTT do que é secundário/ideia futura.
  * Eliminar redundâncias com as mecânicas já concluídas no site.
  * Estruturar um backlog limpo e priorizado por valor de entrega.

### 2. 🌌 Pesquisa & Aplicação dos Guias Obsidian TTRPG
* **Links de Referência:**
  * [Obsidian Hub (Official Community)](https://publish.obsidian.md/hub/00+-+Start+here)
  * [Obsidian TTRPG Tutorials (Josh Plunkett)](https://obsidianttrpgtutorials.com/Obsidian+TTRPG+Tutorials/Obsidian+TTRPG+Tutorials)
* **Objetivo:** Avaliar plugins e padrões arquiteturais da comunidade Obsidian (Dataview, Fantasy Statblocks, Leaflet para mapas, Canvas para árvores de NPCs) para turbinar o cofre do mestre e aproveitar padrões para o simulador web e o VTT.

### 3. ⚔️ Filtro Avançado de Equipamentos
* **Objetivo:** Atender à solicitação do Roadmap:
  * Ordenação dinâmica por **Dano Total Somado** (Dano base da arma + modificador de atributo da ficha).
  * Segregação tática clara entre **Armas de Combate** (Corpo a Corpo, À Distância, Hastes) e **Ferramentas de Ofício / Kits de Aventura**.

### 4. 🔍 Autocomplete Fuzzy Pop-up de `[[` durante a Digitação
* **Objetivo:** Exibir menu flutuante instantâneo ao digitar `[[` nos campos de História e Anotações da ficha, sugerindo nomes de personagens, monstros, perícias e facções com preenchimento em 1 clique.

### 5. 🌐 Comunidade & Redes: Criação do Subreddit Oficial (`r/MesasDoBreder`)
* **Objetivo:** Criar a presença no Reddit para divulgação de homebrews, builds da comunidade e notícias do projeto.

### 6. 💰 Planos Financeiros & Tabela de Assinatura (Mestre Pro / Apoiador da Forja) — ⏳ [CONGELADO NO BACKLOG]
* **Objetivo:** Estruturar futuramente o modelo de sustentabilidade da plataforma mantendo todas as ferramentas essenciais (criação de ficha, cálculo canônico, compêndios e PDF A4) 100% gratuitas para sempre.
* **Ideias Catalogadas para Validação Futura:**
  * **Nível Aventureiro (R$ 0 / Gratuito Vitalício):** Personagens ilimitados locais, compêndio oficial completo de regras, exportação para Foundry VTT e ficha clássica A4.
  * **Nível Mestre Pro / Patrono da Mesa (R$ X / mês):** Sincronização em nuvem multi-dispositivos estendida, templates customizados ilimitados de monstros (Build-a-Beast), compartilhamento de campanhas em tempo real com os jogadores e badge exclusivo de Patrono no Discord.
  * **Status:** Registrado no backlog conforme alinhamento estratégico; implementação visual na landing page congelada até a conclusão dos quick wins essenciais.
