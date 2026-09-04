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

### 15. 📄 Paginação de Alta Performance: Habilidades (722), Bestiário e Equipamentos — ✅ [CONCLUÍDO]
* **Objetivo:** Resolver a sobrecarga visual e cognitiva de centenas de registros renderizados de uma só vez (reclamado nos testes com as 722 habilidades), permitindo navegação fluída, ágil e customizável.
* **Implementação Realizada:**
  * **Componente Modular `Paginacao.tsx` (`paginacao.css`):**
    * Controles de página: `Primeira (⏮)`, `Anterior (◀)`, botões numéricos com janela inteligente de elipses (`1 ... 4 5 6 ... 46`), `Próxima (▶)` e `Última (⏭)`.
    * **Seletor de Itens por Página:** Opções de `16 por página (Padrão 4x4)`, `32 por página`, `64 por página` e `Ver Todos (100%)` para quem deseja a lista completa sem paginação.
    * **Persistência de Preferência:** Armazenamento automático da escolha de itens por página no `localStorage` (`mb_compendio_hab_por_pagina`, `mb_compendio_monstros_por_pagina`, `mb_compendio_equip_por_pagina`).
    * **Resete Reativo:** Resete automático para a página 1 ao digitar na busca ou alterar filtros.
    * **Scroll Suave:** Rola suavemente para o topo do catálogo ao mudar de página.
  * **Integração nas 3 Páginas de Compêndio:**
    * `Habilidades.tsx`: Paginação tanto na visão em Grid de Cards quanto na Tabela detalhada.
    * `Monstros.tsx`: Paginação no Bestiário (Cards de monstros e Tabela tática).
    * `Equipamentos.tsx`: Paginação no Arsenal (Grid e Tabela) e no catálogo de Ingredientes Alquímicos.
  * **Refinamento Visual (Feedback Comunitário):** Remoção de poluição visual e redundâncias (texto duplicado de página no topo e contador de range à esquerda), mantendo exclusivamente os controles de navegação limpos no canto inferior direito (`« ‹ 1 2 3 ... 46 › »`).

### 16. 📱 Otimização Mobile DMV-Style e Dock Social Linktree — ✅ [CONCLUÍDO]
* **Objetivo:** Resolver feedbacks cruciais da comunidade (Miguel Neto / Hunt) sobre usabilidade mobile:
  * Corrigir o bug de zoom automático e corte lateral no mobile que distorcia o layout da ficha.
  * Reduzir a fadiga de scroll vertical infinito na escolha de Identidade (Raça, Classe, Antecedente, Caminho).
  * Adicionar barra social "Lazy Linktree" na Landing Page com botões mock/ativos solicitados no Excalidraw.
* **Implementação Realizada:**
  * **Fix de Viewport e Zoom Mobile:**
    * Atualização da meta tag de viewport para `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />` em `index.html`.
    * Regra global `@media (max-width: 768px)` com `font-size: 16px !important` em `input, select, textarea` para bloquear o auto-zoom do Safari iOS e Chrome Android.
    * Contenção de transbordamento horizontal (`overflow-x: hidden`) e suavização no carrossel de passos da ficha.
  * **Modo Compacto DMV / Nitsoa-Style na Criação de Ficha (`Ficha.tsx` / `ficha.css`):**
    * Barra de alternância rápida entre `[ 📑 Compacto (DMV) ]` e `[ 🎴 Cards Detalhados ]` com persistência em `localStorage` (`mb_builder_modo_compacto`) e ativação padrão automática em telas menores que 768px.
    * Painel unificado em grid com selects suspensos para Raça, Classe, Antecedente e Caminho.
    * Botões rápidos `[ 📖 ]` ao lado de cada select que abrem diretamente os modais ricos de lore e regras sem necessidade de scroll.
    * Botões canônicos rápidos `♂` e `♀` ao lado do nome do PJ gerando nomes de acordo com a raça e sexo selecionados.
    * Chips dinâmicos para escolhas raciais (ex: Linhagem Dracônica, Adaptabilidade Humana) e débitos de atributos de antecedentes.
  * **Dock Social "Lazy Linktree" na Landing Page (`LandingPage.tsx` / `landing.css`):**
    * 7 botões squircle elegantes com ícones SVG nítidos: Discord (ativo com link oficial do Mighty Blade), Telegram, YouTube, Instagram, X/Twitter, Facebook e Twitch (em modo mock disabled).

### 17. 🔗 Hipertexto e Wikilinks Recursivos com Histórico de Navegação — ✅ [CONCLUÍDO]
* **Objetivo:** Atender ao feedback sobre a ausência de links clicáveis dentro dos modais de lore (especificamente no popup do "Reino de Tebryn", onde `Cassiopéia`, `Stord`, `Miralda`, `Ektória` e `Rei Boren Strauss` eram texto estático não interativo).
* **Implementação Realizada:**
  * **Parser Recursivo de Wikilinks (`renderTextoWikilinks` em `LoreRenderer.tsx`):** Converte qualquer menção `[[Alvo|Display]]`, `[[Alvo]]` ou `[citação]` dentro dos modais de lore em botões dourados `✦ Wikilink` interativos com hover styling.
  * **Pilha de Histórico de Navegação (`historicoModal`):** Permite navegar recursivamente de um artigo para o outro (ex: Tebryn ➔ Boren Strauss ➔ Stord ➔ Fingal Mata-Dragão) com botão elegante `[ ← Voltar para ... ]` para retornar ao artigo anterior sem perder o contexto.
  * **Catalogação de Entradas Canônicas Fundacionais:** Adição no `LORE_GLOSSARIO` das cidades-estado fundadoras de Tebryn (`Stord`, `Miralda`, `Ektória`) e enriquecimento de `Rei Boren Strauss`, `Cassiopéia` e `Reino de Tebryn` com links recíprocos e suporte a busca resiliente a hífens e títulos completos.

---

## 🎯 Pacote de Quick Wins & Polimento Tático (Feedback dos Prints & Moretto)

### 1. 🏹 Sistema Tático de Munição & Flechas no Modal de Ataque — ✅ [CONCLUÍDO]
* **Objetivo:** Rastrear o consumo real de flechas/virotes ao atacar com arcos e bestas:
  * Motor `@mighty-blade/rules-core`: Módulo `municao.ts` com validação universal de armas e tipos compatíveis (arcos usam flechas, bestas usam virotes, fundas usam balas, zarabatanas usam dardos), com 100% de testes unitários.
  * Dropdown para selecionar o tipo de flecha carregada (Comum, Garateia, Explosiva, etc.).
  * Contador dinâmico com steppers `[ - ] {qtd} [ + ]` e checkbox `[x] Descontar 1 ao disparar (Zero Fricção)`.
  * Botão de recuperação rápida `[ ♻️ Recuperar do Chão ]` (metade das flechas gastas no combate recuperadas sem burocracia).
  * Checkbox de **Ataque Preciso / Golpe Localizado (+4 na Dificuldade)** para mirar em pontos vitais ou através de cobertura, com selo tático no teste.

### 2. ⚡ Mochila Interativa na Visualização da Ficha (`FichaDetalhe.tsx`) — ✅ [CONCLUÍDO]
* **Objetivo:** Eliminar a necessidade de entrar no modo de edição apenas para trocar de arma ou consultar itens:
  * Exibição completa da mochila diretamente na tela de jogo com pesos, categorias, notas e steppers de quantidade.
  * Sub-painel tático em combate com armas na bainha e botão rápido `[ ⚔️ Empunhar ]` para troca instantânea de arma em 1 clique.
  * Botões de 1 clique `[ Equipar ]` / `[ Desequipar ]` e `[ Usar ]` para consumíveis (elixires de vida/mana).
  * Auto-regras inteligentes: equipar nova armadura desequipa a anterior; equipar arma de 2 mãos desequipa escudo.

### 3. 🎒 10º Slot de Costas (Mochila / Aljava / Capa) no Paperdoll — ✅ [CONCLUÍDO]
* **Objetivo:** Adicionar no boneco de equipamentos (`Paperdoll.tsx`) o slot dedicado para itens dorsais:
  * Grid 5x5 perfeitamente simétrico (5 slots na coluna esquerda, 5 slots na coluna direita).
  * Respeito à regra canônica estrita do livro de regras: mochila e aljava competem pelo mesmo espaço nas costas.

### 4. 📜 Tabela Oficial de Dificuldades do MB 3e Integrada nos Testes — ✅ [CONCLUÍDO]
* **Objetivo:** Incorporar a tabela canônica do livro de regras como presets rápidos e modal de consulta com exemplos oficiais:
  * Módulo `@mighty-blade/rules-core/data/dificuldades.ts` com todos os exemplos canônicos do livro.
  * Modal interativo `ModalTabelaDificuldade.tsx` e chips de seleção rápida em `TestesModal.tsx` e `AtributosPreview.tsx`:
    * Corriqueiro ($\le 7$) • Fácil ($8$) • Moderado ($10$) • Desafiador ($12$) • Difícil ($14$) • Muito Difícil ($16$) • Lendário ($\ge 18$).

### 5. 🖼️ Moldura e Fim do Letterboxing no Modal de Ilustração (`OriginToken.tsx`) — ✅ [CONCLUÍDO]
* **Objetivo:** Corrigir as faixas pretas ociosas nas laterais da ilustração do Sacerdote/Classes.
  * Modal compactado e proporções otimizadas para 280x360px eliminando completamente o letterboxing cinza/preto.

### 6. 🪙 Alerta Visual de Orçamento Estourado (500 Moedas Iniciais) — ✅ [CONCLUÍDO]
* **Objetivo:** Alerta visual proeminente quando o custo dos itens comprados na criação ultrapassar os fundos disponíveis:
  * Banner de destaque vermelho/dourado com ícone de alerta em `InventarioPainel.tsx` informando o valor exato excedido e orientações sobre espólio/dívida.

### 7. 🔄 Correção do Loop de Navegação Pós-Edição (`Ficha.tsx`) — ✅ [CONCLUÍDO]
* **Objetivo:** Ao salvar a edição de um personagem, retornar diretamente para a ficha ativa (`/ficha/:id`) em vez de chutar o usuário para o dashboard geral.

### 8. 🗺️ Compêndio Canônico de Termos Geográficos & Relevo — ✅ [CONCLUÍDO]
* **Objetivo:** Enciclopédia canônica com os 42 termos geográficos e de relevo de Drakon, com infográfico em alta resolução, zoom lightbox e links no glossário.

### 9. 🗂️ Dashboard Pro: Filtros Avançados, Ordenação, Paginação e Drag-and-Drop — ✅ [CONCLUÍDO]
* **Objetivo:** Gestão completa de múltiplas fichas de personagens com:
  * **Filtros Avançados:** Dropdowns dedicados para Raça, Classe, Caminho e Organização, com botão "Limpar Filtros" e busca textual unificada.
  * **Ordenação Flexível:** Alfabética (A-Z e Z-A), Nível (Maior-Menor e Menor-Maior), Data de Criação (Mais Recente e Mais Antigo) e Manual.
  * **Drag & Drop Nativo:** Reordenação de cards por arraste com persistência instantânea em `localStorage` (`personagemStorage.reordenar`).
  * **Paginação Completa:** Integração de `Paginacao.tsx` com seletor de itens por página (8, 16, 24, "todos") e indicador de contagem.
  * **Colunas e Badges de Caminho & Organização:** Exibição enriquecida nos cards da grade e colunas dedicadas na visualização em tabela.

### 10. ☀️/🌙 Modo Claro e Escuro: Toggle de Iluminação na Aparência — ✅ [CONCLUÍDO]
* **Objetivo:** Suporte a Modo Claro (Pergaminho Solar) preservando o Modo Escuro (Dark Obsidian) como padrão oficial:
  * Novo seletor de iluminação na aba "Aparência e Temas" de `SettingsModal.tsx`.
  * Tokens adaptativos em `tokens.css` para `body.theme-claro`, com estilização dedicada em `layout.css`, `dashboard.css` e `settingsModal.css`.
  * Persistência da preferência em `localStorage` (`mb_modo_tema`).

### 11. 📝 Anotações & Diários de Campanha no Estilo Foundry VTT — ✅ [CONCLUÍDO]
* **Objetivo:** Resolver em definitivo o alerta de erro na Vercel e implementar sistema modular de organização estilo Foundry VTT:
  * Novo motor de persistência offline-first (`anotacaoStorage.ts`) sem bloqueios de rede.
  * Pastas personalizadas para agrupar anotações por sessão ou campanha, com contadores e filtro por abas no topo.
  * Múltiplas páginas por anotação com títulos próprios, navegação por abas laterais e botões `< Página Anterior` / `Próxima Página >`.
  * Visualização de alta fidelidade com Markdown e `<LoreRenderer>`.

### 12. 🎯 Centralização da Paginação no Rodapé — ✅ [CONCLUÍDO]
* **Objetivo:** Posicionamento simétrico e equilibrado dos controles de navegação:
  * CSS Grid (`1fr auto 1fr`) centralizando os botões (`◀ [1] [2] ▶`) no canto inferior das páginas.
  * Contagem de itens posicionada à esquerda e seletor de itens por página à direita.

### 13. 🎒 UX da Loja de Equipamentos na Ficha — ✅ [CONCLUÍDO]
* **Objetivo:** Evitar que o jogador ache que o botão `+` não funcionou ao adicionar equipamentos na ficha:
  * Alternância automática para a aba "Inventário" ao adicionar itens.
  * Badge visual indicando a quantidade total de itens no inventário.

### 14. ⚔️ Correções de Equipamentos Canônicos & Bestiário — ✅ [CONCLUÍDO]
* **Objetivo:** Alinhamento 100% rigoroso com as regras canônicas do livro básico:
  * Remoção da propriedade errônea `Canalizador` das armas mundanas (`foice`, `bordao`, `clava`, `adaga`).
  * Chicote corrigido para Custo 50 moedas, Dano FOR+2 corte/contusão e propriedades `Segurar`, `Transpor` e `Gancho`.
  * Propriedade `DuasMaos` adicionada ao `martelo-lucerno` e `debulhador`.
  * Criação da categoria canônica `"Montaria"` para animais e veículos (`bolanta`, `burro`, `carroca`, `cavalo-comum`, `cavalo-de-guerra`, etc.).
  * Fichas completas de `BURRO` e `CAVALO_DE_GUERRA` integradas ao Bestiário oficial.

### 15. 🛡️ Simetria da Ficha de Personagem & Condição "Por um Fio" — ✅ [CONCLUÍDO]
* **Objetivo:** Proporções harmônicas de 3 colunas e automação de quase-morte:
  * Remoção de duplicidade da mochila na visualização detalhada.
  * Aplicação automática da condição `por-um-fio` quando a Vida atinge `0 PV`, com tarja de aviso vermelha em destaque.
  * Remoção automática da condição ao recuperar PV (> 0).
  * Integração de `resolverPenalidades` nos cálculos de Defesa e Movimentação sob condições restritivas.

### 16. 📐 Otimização de Espaço nos Compêndios (Zero Redundâncias) — ✅ [CONCLUÍDO]
* **Objetivo:** Eliminar poluição visual e ganhar espaço horizontal nas tabelas e cards:
  * Remoção da coluna redundante "Ação" e do botão "Ver" nas tabelas de Habilidades, Equipamentos e Bestiário.
  * Remoção do botão "Ver Detalhes" do rodapé de cada card, mantendo o card limpo e com altura dinâmica.
  * Linhas e cards 100% interativos por inteiro, com transição suave, elevação no hover (`translateY(-2px)`), borda dourada e tooltips informativos.

### 17. 🔀 Drag & Drop Bidirecional: Cards & Linhas de Tabela — ✅ [CONCLUÍDO]
* **Objetivo:** Permitir ao usuário reordenar livremente suas fichas tanto no modo Grade quanto no modo Tabela:
  * **API Nativa HTML5:** Solução leve (0 KB de dependências externas) usando `draggable={true}`, `handleDragStart`, `handleDragOver` e `handleDrop`.
  * **Paridade de Modos:** Alça de pegada (`⠿`) dedicada na primeira coluna da tabela (`<td className="dash-td-drag">`) e no cabeçalho de cada card.
  * **Feedback Visual:** Linha ou card de destino destacado com bordas douradas reluzentes e sombra de encaixe; elemento arrastado fica com 35% de opacidade.
  * **Persistência Imediata:** Atualização do array no storage (`personagemStorage.reordenar`) com troca automática do seletor para "Ordem Manual".
  * **Proteção de Ações:** Cliques em botões de visualizar, editar e excluir protegidos contra disparo indevido de arraste (`target.closest(...)`).

### 18. 🔍 Dashboard Pro: Filtros Avançados & Modos de Ordenação — ✅ [CONCLUÍDO]
* **Objetivo:** Localização instantânea de personagens em contas com dezenas de fichas:
  * **Barra de Filtros:** Seletores rápidos por Raça, Classe, Caminho e Organização com indicação de filtros ativos.
  * **Modos de Ordenação:** 7 opções canônicas (*Ordem Manual*, *Nome A-Z / Z-A*, *Nível Maior / Menor*, *Mais Recente / Mais Antigo*).
  * **Botão Reset:** Limpeza de todos os filtros e busca com 1 clique (`Limpar Filtros`).

### 19. 🌓 Modo Claro / Escuro (Design System Semântico) — ✅ [CONCLUÍDO]
* **Objetivo:** Conforto visual para diferentes ambientes de iluminação (escuro imersivo vs leitura solar):
  * **Tokens Semânticos:** Variáveis centralizadas em `tokens.css` com override via classe `.theme-claro` no `<body>`.
  * **Alternador Integrado:** Switch dedicado nas Configurações (aba "Aparência e Temas") com persistência em `localStorage`.
  * **Contraste Aprovado:** Suporte refinado a cards, tabelas, modais, inputs e cabeçalhos.

### 20. 🎒 Auto-Stacking & Consolidação Automática de Inventário — ✅ [CONCLUÍDO]
* **Objetivo:** Agrupar automaticamente itens consumíveis idênticos (flechas, virotes, poções, itens mundanos):
  * **Na Loja:** Incremento direto de quantidade (`qtd += 1`) quando o item já existir desequipado na mochila, sem gerar linhas repetidas.
  * **Ao Carregar a Ficha:** Varredura automática em `FichaDetalhe.tsx` consolidando múltiplos itens idênticos (`refId`, `material`, `qualidade`) em uma linha única e persistindo no storage.
  * **Exclusão Segura:** Diálogo de confirmação para exclusão ao decrementar a quantidade até 0.

### 21. 🎲 Painel de Testes Mobile-First (Zero Scroll) & Acentuação Canônica — ✅ [CONCLUÍDO]
* **Objetivo:** Experiência tátil fluida de rolagens de combate/testes em smartphones e acentuação canônica impecável:
  * **Zero Scroll:** Modal fixado em `max-height: 92vh` contido na tela sem barra de rolagem vertical.
  * **Touch Targets Generosos:** Botões táteis com altura mínima de 42px e seletor nativo `<select>` para dificuldade sem toques acidentais.
  * **Fluxo em Abas (Configuração ➔ Resultado):** Ao rolar, o modal transiciona para a visualização limpa de resultado (dados 48px, banner de sucesso/crítico/falha, dano total e botão de 1-toque `[ 🎲 Rolar Novamente ]`).
  * **Acentuação Canônica:** `Inteligência` no modal de testes, `Anão` e `Xamã` no Dashboard, tags da ficha e exportação em PDF, mais `Oráculo`, `Capitão`, `Espadachim` e `Rúnico`.

---


## 🎯 Próximas Implementações Priorizadas (Roadmap Geral)

### 1. 📐 Triagem & Filtro das 33 Anotações do Excalidraw
* **Objetivo:** Separar itens essenciais para o VTT e consolidar débitos de longo prazo.

### 2. 🌌 Pesquisa & Aplicação dos Guias Obsidian TTRPG
* **Objetivo:** Incorporar padrões de Dataview, Statblocks e Leaflet nos compêndios do cofre.

### 3. ⚔️ Filtro Avançado de Equipamentos
* **Objetivo:** Ordenação por Dano Total Somado e segregação tática entre armas e kits utilitários.

### 4. 🔍 Autocomplete Fuzzy Pop-up de `[[` durante a Digitação
* **Objetivo:** Menu flutuante instantâneo para referências rápidas na ficha.

### 5. 🌐 Comunidade: Criação do Subreddit Oficial (`r/MesasDoBreder`)

### 6. 💰 Planos Financeiros & Tabela de Assinatura — ⏳ [CONGELADO NO BACKLOG]


