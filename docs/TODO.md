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

### 22. 🎲 Reorganização do Sistema no Padrão D&D 5e (Foundry VTT) — ✅ [CONCLUÍDO]
* **Objetivo:** Modernizar a arquitetura e experiência de usuário da ficha de personagem e dos itens do Mighty Blade 3.5, alinhando-se ao design e padrão do sistema oficial D&D 5e no Foundry VTT (`foundryvtt/dnd5e`).
* **Implementação Realizada:**
  * **Layout em 3 Zonas da Ficha de Personagem (`actor-character-sheet.hbs`):**
    * **Sidebar Esquerda:** Retrato com moldura escura, Tríade de Defesas (Bloqueio em destaque, Esquiva e Determinação com fórmulas e tooltips), Métricas de Combate (Iniciativa rollable, Deslocamento e Corrida), Barras de Recursos Vitais (Vida carmesim e Mana azul com preenchimento reativo), e Gaveta de Favoritos com atalho de rolagem imediato.
    * **Cabeçalho & Nível:** Nome do herói, atalhos de Descanso Curto (Recuperação Rápida: +50% PV/PM) e Descanso Longo (Descanso Completo: 100% PV/PM), Badge circular de Nível e Barra de XP dinâmica.
    * **Aba Principal (Atributos & Identidade):** Os 4 atributos em badges geométricos com rolagem direta $2\text{d6} + \text{ATR}$, Armas equipadas para ataque rápido, Traços/Idiomas/Condições, e **Slots de Identidade** (Raça, Classe com Aprendiz, Caminho, Organização, Antecedente) com botões vazios de encaixe (`[ + Adicionar Raça ]`, similar ao `[ ADD SPECIES ]` do D&D 5e).
    * **Barra de Navegação Vertical:** Abas à direita com ícones táteis para Atributos, Inventário, Habilidades, Magias, Efeitos e Biografia.
  * **Aba de Inventário Estruturada (`actor-items.hbs`):** Barra de Carga (*Encumbrance Bar*) com pesos calculados sobre Força (básica e máxima), carteira de moedas (Ouro, Prata e Cobre), busca rápida e tabelas categorizadas colapsáveis para Armas, Armaduras & Escudos, Consumíveis e Equipamentos Gerais.
  * **Padronização das Fichas de Item em Abas:** Todas as fichas (`item-raca-sheet.hbs`, `item-classe-sheet.hbs`, `item-caminho-sheet.hbs`, `item-arma-sheet.hbs`, `item-armadura-sheet.hbs`, etc.) reestruturadas com abas padronizadas: `DESCRIÇÃO` (com resumo de metadados em badges no topo), `DETALHES` e `AVANÇO` (*Advancement*).
  * **Fluxo de Avanço & Concessões (*Advancement Wizard*):** Diálogos interativos de escolha de atributos e habilidades atualizados no padrão visual `Advancement — [Item] • Passo 1 de 1` com confirmação verde e cards táteis.
  * **Estilização SCSS & CSS:** Compilação do SASS com 0 erros, aplicando paleta Obsidian/D&D 5e e tipografia canônica.
  * **Correção de Hierarquia & Especificidade do Layout D&D 5e:** Resolvido bug onde seletores sem espaçamento (`.mighty-blade.dnd5e-theme`) não casavam com a estrutura de janela do Foundry (`window-app` > `window-content` > `form.dnd5e-theme`). Adicionado suporte a todas as permutações (`.mighty-blade .dnd5e-theme`, `form.dnd5e-theme`, etc.), classe `dnd5e-theme-sheet` no `ActorSheet.defaultOptions`, trava estrita de dimensões no avatar (`190px`) e nos ícones de slots de identidade (`28px`), e garantia de orientação vertical nas abas (`flex-direction: column !important`).
  * **Regras Canônicas de Aprendiz de Classe & UI de Evolução (`LevelUpDialog`):**
    * **Regra de Negócio (Exclusividade e Habilidade Automática):** Travado avanço para permitir no máximo 1 classe de aprendiz por personagem (disponível a partir do nível 2). Ao se tornar aprendiz de uma classe secundária, o herói adquire sua habilidade automática oficial (ex.: Bardo -> Poesia dos Bardos, Guerreiro -> Mestre de Armas 1, Feiticeiro -> Conhecimento Arcano, etc.), sem somar atributos extras. Bloqueado acúmulo de múltiplos aprendizes em níveis futuros.
    * **UI Dark Obsidian para Evolução:** Modal de Level Up agora possui tema escuro completo (`#090b10`), gradientes radiais, cards com bordas coloridas temáticas, tipografia de alto contraste e banner informativo caso o herói já tenha escolhido seu aprendiz, eliminando o fundo claro ilegível do Foundry.

---

### 23. 🛡️ Motor Canônico de Pré-Requisitos e Bloqueio Estrito no Compêndio (Caminhos Heroicos) — ✅ [CONCLUÍDO]
* **Objetivo:** Garantir que personagens só possam adotar Caminhos Heroicos (e habilidades avançadas) se cumprirem rigorosamente os pré-requisitos mecânicos estabelecidos pelas regras canônicas do Mighty Blade 3e (ex.: *Alquimista* requer "Inteligência 5, Herbalismo").
* **Implementação Realizada:**
  * **Motor de Regras (`module/helpers/requisitos.mjs`):**
    * Funções `parseRequisitosTexto` e `avaliarRequisitos(requisitosTexto, actor)` para resolução de:
      * **Atributos:** Força, Agilidade, Inteligência e Vontade com comparação contra o valor real do herói (`sistema.attributes[attr].value`).
      * **Nível:** Requisitos de avanço heroico (ex.: "Nível 3", "Nível 5").
      * **Habilidades / Magias / Antecedentes:** Verificação flexível por nome e slug, incluindo requisitos genéricos (ex.: *"Uma habilidade de Fúria qualquer"* para Amoque).
      * **Raças:** Verificação contra a raça atual do personagem quando aplicável.
      * **Requisitos Narrativos:** Identificação de condições interpretativas/históricas (ex.: *"Ter sido aceito como Irmão da Ordem..."*, *"Ficar Por um Fio devido a Sangramento"*) sinalizadas como informativas para o Mestre sem travar indevidamente a ficha.
  * **Interface do Compêndio Browser (`MightyBladeCompendiumBrowser` & `compendium-browser.hbs`):**
    * Lista dinâmica com badge de cadeado `🔒 Requisitos pendentes`, radio button desativado (`disabled`) e estilização opaca para opções não qualificadas.
    * Painel interativo de detalhes com checklist visual verde/vermelho indicando o status exato de cada pré-requisito (ex.: `❌ Inteligência 5: Você possui 4 (Requer 5)`).
    * Bloqueio imediato ao clique em itens não qualificados, mantendo o botão *Selecionar* desabilitado e exibindo alerta com as pendências no rodapé e notificações do Foundry.
    * Salvaguarda final contra bypass no botão *Selecionar*.
  * **Validação em Nível de Documento (`MightyBladeActor`):**
    * Ganchos `_onCaminhoCreated` e `_onCaminhoDeleted` no ciclo de vida de itens embutidos: mesmo que o usuário tente arrastar o item diretamente por *Drag-and-Drop* para a ficha, a validação detecta a violação, emite `ui.notifications.error` com a lista de pendências e deleta o item imediatamente, garantindo a integridade dos dados e a regra de apenas 1 Caminho ativo.

---

### 25. 🧪 Suíte Completa de Testes Canônicos do Mighty Blade 3e (200 Testes Unitários) — ✅ [CONCLUÍDO]
* **Objetivo:** Implementação, auditoria e automação dos 39 casos de teste / requisitos de validação das regras oficiais do Mighty Blade 3ª Edição divididos em 7 subagentes especializados.
* **Implementação Realizada:**
  * **Subtítulo 1 — Criação de Personagem: Atributos & Distribuição Básica (`tests/01_criacao_atributos.test.mjs`):**
    * Módulos `tests/test-helper.mjs` (`createCharacter`, `levelUp`) e `module/helpers/progressao.mjs`:
      * **Sub-módulo 1.1:** Validação das 21 Raças canônicas (atributos base, habilidades automáticas e trava de habilidades exclusivas de criação `somenteCriacao: true`).
      * **Sub-módulo 1.2:** Validação das 14 Classes (+1 em dois atributos distintos, invariante de bônus único, injeção de habilidades automáticas).
      * **Sub-módulo 1.3:** Regra Especial de Adaptabilidade Humana (concessão `escolhaAtributo`, alocação em cada um dos 4 atributos e impedimento de criação sem escolha).
      * **Sub-módulo 1.4:** Fórmula Geral de Soma de Atributos ($\text{Atributo Final} = \text{Base} + \text{Classe} + \text{Adaptabilidade} + \text{Habilidades}$) para Humano Guerreiro, Orc Guerreiro e modificadores adicionais.
      * **Sub-módulo 1.5:** Incremento de Atributos nos Níveis 4, 7 e 10 (+1 em dois atributos diferentes, rejeição de +2 no mesmo atributo, bloqueio em níveis não-marco e acúmulo sequencial Níveis 1 -> 4 -> 7 -> 10).
  * **Subtítulo 2 — Cálculos de Estatísticas Derivadas (`tests/02_estatisticas_derivadas.test.mjs`):**
    * Módulos `module/helpers/estatisticas-derivadas.mjs` e `module/data/actor-character.mjs`:
      * **Sub-módulo 2.1 — Vitalidade e Mana (PV e PM):** Base canônica de 60 PV e 60 PM no Nível 1; bônus raciais e de habilidades cumulativos (*Sangue Orc* +10 PV, *Durão* +5 PV, *Mente Expandida* +10 PM, *Herança Feérica* +10 PM, *Intelecto Élfico* +10 PM); efeitos declarativos e recálculo reativo na remoção.
      * **Sub-módulo 2.2 — Determinação:** Fórmula estrita `Determinação = Vontade + Modificadores` (*Durão* +2, *Cabeça Dura* +2, *Pacto da Loucura* +2, *Espelhar Loucura* +2, `bonusDefesa: determinacao`).
      * **Sub-módulo 2.3 — Defesa Base & Prevalência:** Defesa Base padrão (5), Nanismo (6), Forma da Raposa Tailox (7); aplicação irrestrita do princípio de prevalência do maior valor (`Math.max(5, ...)`), garantindo que bases nunca se somam.
      * **Sub-módulo 2.4 — Esquiva e Bloqueio Reativos:** Esquiva (`Defesa Base + Agilidade + Armadura + Bônus` como *Dançarino do Ar*); Bloqueio (`Defesa Base + Força + Armadura + Escudo com FN atendida`); perda total de bônus de escudo quando $\text{FN} > \text{Força}$.
      * **Sub-módulo 2.5 — Deslocamento e Carga Física:** Fórmula de Deslocamento $\lfloor \text{Agilidade} / 2 \rfloor + 4$ com bônus de +1 para Fauno (*Patas com Cascos*), Tailox (*Pernas Vulpinas*) e Gnoll (*Salteador*); Carga básica padrão ($\text{Força} \times 10\text{ kg}$) e Manual do Combatente ($\text{Força} \times 20\text{ kg}$ e máxima $\text{Força} \times 40\text{ kg}$); bônus de *Coração da Montanha* (+2 Força para carga).
  * **Subtítulo 3 — Restrições e Incompatibilidades Raciais / Pactos (`tests/03_restricoes_incompatibilidades.test.mjs`):**
    * Módulos `module/helpers/restricoes.mjs`, `module/documents/actor.mjs` e `module/apps/compendium-browser.mjs`:
      * **Sub-módulo 3.1 — Restrições da Raça Naga:** Bloqueio absoluto de Sacerdote e Dogma para qualquer Naga (macho ou fêmea); Naga Fêmea elegível para Feiticeiro, Necromante, Rúnico e Conhecimento Místico fora de Sacerdote/Dogma; Naga Macho elegível para Guerreiro, Espadachim, Paladino e Rúnico (magia militar rúnica), sem acesso a Feiticeiro, Necromante ou Conhecimento Místico.
      * **Sub-módulo 3.2 — Incompatibilidade Absoluta Pacto × Misticismo:** Cultista/Pacto impede Conhecimento Místico, Dogma e Aprendiz de Sacerdote; Sacerdote, Druida e Dracomante que adquirem Pacto têm Dogma e Conhecimento Místico revogados automaticamente.
      * **Sub-módulo 3.3 — Trava e Restrições Físicas de Nanismo:** Proibido para Metadílios; exclusivo do Nível 1 (bloqueado nos Níveis 2 a 10); armas corporais de duas mãos inaptas; armas corporais com $\text{FN} \ge 5$ exigem duas mãos.
      * **Sub-módulo 3.4 — Proibições Raciais Específicas:** Astério/Astéria sem Intuição; Mahok sem Sentidos Apurados; Fúria Bestial exclusiva para Aesir com Espírito Animal Lobo ou Urso.
      * **Sub-módulo 3.5 — Trava de Habilidades Exclusivas de Criação nos Níveis 2+:** Bloqueio de Isnuu, Fulgurante, Escamas Pesadas, Braços Extras, Olhos de Águia, Fortaleza, Duro como Pedra e flag `somenteCriacao: true` nos Níveis 2 a 10.
      * **Sub-módulo 3.6 — Integração Runtime (Actor & Compendium Browser):** Hooks `_onRaceCreated`, `_onClassCreated`, `_onHabilidadeCreated`, `_onMagiaCreated`, `applyLevelUp`, `addLevelAbility` e `setAprendiz` integrados em `MightyBladeActor`; filtragem dinâmica `filtrarItensCompendioParaAtor` ativa no `MightyBladeCompendiumBrowser`; arquivo legado `03_restricoes_raciais.test.mjs` removido.
  * **Subtítulo 4 — Pré-requisitos de Habilidades, Níveis e Cadeias Encadeadas (`tests/04_prerequisitos_cadeias.test.mjs`):**
    * Módulos `module/helpers/requisitos.mjs`, `module/helpers/restricoes.mjs` e `module/documents/actor.mjs`:
      * **Sub-módulo 4.1 — Atributos Mínimos para Habilidades:** *Força Interior* (Vontade 4+), *Voador Exímio* (Força 3+), *Aprendiz Arcano* e Caminhos Arcanos (*Argênteo*, *Artífice*, *Ilusionista*, *Alquimista*: Inteligência 5+).
      * **Sub-módulo 4.2 — Trava de Nível Mínimo:** Habilidades Avançadas Nível 5+ (*Nervos de Aço*, *Vontade de Ferro*, *Mestre de Armas 2*) e Habilidades Finais/Mestre Nível 10 (*Mestre Especialista*, *Fúria Brutal*, *Mestre de Armas 3*).
      * **Sub-módulo 4.3 — Cadeias Encadeadas e Habilidades Prévias:** *Chamas Internas 2* (exige *Chamas Internas 1*), *Ataque Furioso* (exige Nível 5 + Força 4), *Imparável* (exige Raça *Astério* + *Fortaleza* + *Vontade 5*).
      * **Sub-módulo 4.4 — Exclusividade de Fúrias:** *Fúria Bestial*, *Fúria de Batalha* e *Fúria Orc* mutuamente exclusivas em aquisição e ativação simultânea (`ativarFuria`, `desativarFuria` com suporte a bloqueio ou substituição automática `{ substituir: true }`).
      * **Sub-módulo 4.5 — Integração Runtime:** Hook `_onHabilidadeCreated` e `addLevelAbility` em `MightyBladeActor` validam pré-requisitos encadeados e removem/bloqueiam itens pendentes; arquivo legado `04_requisitos_habilidades.test.mjs` removido.
  * **Subtítulo 5 — Equipamentos, Armas, Armaduras e Regra de Inaptidão (`tests/05_equipamentos_inaptidao.test.mjs`):**
    * Módulos `module/helpers/equipamento.mjs` e `module/sheets/actor-sheet.mjs`:
      * **Sub-módulo 5.1 — Força Necessária (FN) & Mecânica de Inaptidão:** Ativação automática da flag `inapto` (`item.system.inapto`) em armas/armaduras/escudos quando $\text{Força} < \text{FN}$; redução do pool de dados de 2d6 para 1d6 (ou variante `3d6kl2` descartando o maior dado) e conversão de dados extras em $+2$ numérico fixo.
      * **Sub-módulo 5.2 — Limite de Armaduras Corporais:** Trava estrita de 1 Armadura Corporal por vez (escudos consomem slot de mão); `equiparItemSeguramente` bloqueia tentativa de 2ª armadura por padrão ou desequipa a anterior automaticamente com `{ substituir: true }`.
      * **Sub-módulo 5.3 — Slots de Mão & Exceção Racial do Mahok:** Limite padrão de 2 slots de mão (armas 1 mão e escudos = 1 slot; armas 2 mãos = 2 slots) com bloqueio em runtime ao exceder; exceção racial de 4 slots para *Mahok* com *Braços Extras*, permitindo empunhar duas armas de duas mãos simultaneamente (ex: duas *Claymores*).
      * **Sub-módulo 5.4 — Penalidades de Armaduras Pesadas:** Aplicação de Redução de Dano (RD 1) contra danos físicos corporais/projéteis (`aplicarReducaoDanoArmaduraPesada`), anulação dos benefícios de *Atletismo* (+2 $\to$ 0) e redução do multiplicador de corrida máxima para $3\times$ o Deslocamento (ou $2\times$ se a armadura for Rígida).
      * **Sub-módulo 5.5 — Anulação de Bloqueio em Escudos com FN Insuficiente:** Zeramento integral ($0\%$) do bônus de Bloqueio/Defesa do escudo no Bloqueio Reativo quando $\text{Força} < \text{FN do Escudo}$.
  * **Subtítulo 6 — Sistema de Danos, Imunidades e Condições (`tests/06_danos_imunidades_condicoes.test.mjs`):**
    * Módulos `module/helpers/danos-condicoes.mjs` e `module/helpers/dice.mjs`:
      * **Sub-módulo 6.1 — Imunidade Elemental:** Anulação completa (dano = 0) para todos os 6 elementos canônicos (*Corte*, *Perfuração*, *Contusão*, *Fogo*, *Frio*, *Eletricidade*) e integração via `system.efeitos`.
      * **Sub-módulo 6.2 — Resistência Elemental:** Divisão de dano pela metade com arredondamento obrigatório para baixo ($\lfloor \text{Dano} / 2 \rfloor$, ex: $7 \to 3$).
      * **Sub-módulo 6.3 — Vulnerabilidade Elemental:** Multiplicação de dano por 2 ($\text{Dano} \times 2$, ex: $5 \to 10$).
      * **Sub-módulo 6.4 — Anulação Mútua (Resistência + Vulnerabilidade):** Cancelamento neutro ($1\times$) quando o alvo possui Resistência e Vulnerabilidade ao mesmo elemento simultaneamente; prevalência de Imunidade sobre ambos.
      * **Sub-módulo 6.5 — Exaustão de Mana (0 PM) e Dreno de PV:** Ativação automática da condição *Exausto* ao atingir 0 PM (impondo Inaptidão em todos os testes via `isActorInapto` e `rollTest`/`castSpell`); gastos ou perdas de PM com saldo 0 ou insuficiente descontam o excedente diretamente dos Pontos de Vida (PV); arquivo legado `06_danos_condicoes.test.mjs` removido.
  * **Subtítulo 7 — Subida de Nível e Pontos de Evolução (`tests/07_subida_nivel.test.mjs`):**
    * Módulo `module/documents/actor.mjs`: Concessão de 1 nova habilidade por nível respeitando raça/classe e pré-requisitos; Escolha atômica obrigatória de 1 benefício de evolução (+10 PV, +10 PM, +5 PV/+5 PM, ou Aprendiz de Classe com limite estrito de 1 único aprendiz a partir do Nível 2 e sem atributos adicionais); Bloqueio absoluto acima do Teto de Nível 10.
  * **Subtítulo 8 — Conjuração, Magias e Grimórios / Itens de Registro (`tests/08_conjuracao_magias.test.mjs`):**
    * Módulo `module/helpers/magia.mjs`: Cálculo de custo de Mana com piso mínimo de 1 PM (Foco Mágico -5 PM); Dificuldade base e modificadores (Asseste Mágico -1, Isnuu -1, Dom da Magia -1); Inaptidão por armadura corporal para conjuradores sem treino; Sintonização via Runa Pessoal / Selo Simples (DV 8, 0 PM); Capacidade máxima de Grimórios (INT x 2) e exigência de Canalizador empunhado; Custo de 5 PV para símbolos profanos sem Conhecimento Nefasto.
  * **Subtítulo 9 — Propriedades Táticas de Equipamentos e Combate (`tests/09_tatico_combatente.test.mjs`):**
    * Módulo `module/helpers/combate-tatico.mjs`: Armas Mão-e-Meia (2 mãos: FN pela metade arredondada para cima e +2 no dano ou Força via Ataque Furioso; 1 mão: FN integral); Propriedades especiais (*Transpor* ignorando escudos e cobertura, *Trespassar* transferindo dano excedente, *Carregar* exigindo Ação de Movimento para recarregar sem penalidade adjacente, *Gancho* para derrubar/desarmar); Penalidade de Armadura Pesada sem túnica (-5 PM/turno).
  * **Subtítulo 10 — Sistema de Carga, Sobrecarga e Movimentação Física (`tests/10_carga_sobrecarga_movimento.test.mjs`):**
    * Módulo `module/helpers/carga-ambiente.mjs`: Sobrecarga parcial (Carga > Máx: Inaptidão física/Agilidade e metade do Deslocamento); Sobrecarga extrema (Carga > 2x Máx: Imobilizado com Deslocamento 0); Dano de Queda (1d6/metro, Metadílio com Balofo divide por 2); Fôlego de Sufocamento (turnos = max(FOR, VON), imunidade infinita para Anfíbio e Fulgurante).
  * **Subtítulo 11 — Pactos, Maldições e Efeitos Colaterais (`tests/11_pactos_maldicoes_vilao.test.mjs`):**
    * Módulo `module/helpers/pactos-vilao.mjs`: Pacto da Loucura (+2 Determinação, -1 INT, imunidade a medo e efeitos mentais); Pacto da Escuridão (visão no escuro sem olhos, Inaptidão sob luz solar direta); Pacto da Pestilência (vetor imune a sintomas); Pacto da Tirania (teste de Vontade contra Determinação para atacar); Habilidade Virulência (resistência contra infecções/venenos em raio como Inapta).
  * **Subtítulo 12 — Companheiros Animais, Invocações e Construtos (`tests/12_invocacoes_companheiros.test.mjs`):**
    * Módulo `module/helpers/invocacoes.mjs`: Limite de 1 invocação ativa por padrão e expansão via talentos ou caminhos de Domador/Invocador (VON / 2); Escalonamento proporcional de PV, Defesa e Dano de Golens/Familiares/Construtos por Vontade/Nível; Custo de manutenção sustentada de Mana por turno (Golens 3 PM, Construtos 2 PM, Familiares 1 PM).
  * **Subtítulo 13 — Músicas de Bardo, Menestrel e Concentração (`tests/13_musicas_bardo.test.mjs`):**
    * Módulo `module/helpers/musicas-bardo.mjs`: Teste de Vontade/Performance (dificuldade padrão 8 ou proporcional ao dano sofrido) para não interromper performance; Bônus de +2 em instrumentos de sopro para Faunos/Flauta de Pã/Soprista; Exclusividade estrita de no máximo 1 música contínua sustentada ao mesmo tempo.
  * **Subtítulo 14 — Validação de Entrada em Caminhos de Prestígio (`tests/14_caminhos_prestigio.test.mjs`):**
    * Módulo `module/helpers/requisitos.mjs` e `module/documents/actor.mjs`:
      * Tabela canônica `CAMINHOS_PRESTIGIO` com os 8 caminhos canônicos (Amoque, Argênteo, Artífice, Assassino, Sanguíneo, Estrige, Tohunga, Lanceiro).
      * Validação estrita de atributos, habilidades e marcos narrativos (`sangramentoPorUmFio`, `destruiuSobrenatural`, etc.).
      * Exclusividade: adotar novo caminho substitui e limpa o anterior (máximo 1 ativo).
  * **Subtítulo 15 — Máquina de Estados e Condições do Personagem (`tests/15_estados_condicoes.test.mjs`):**
    * Módulo `module/helpers/estados-saude.mjs`: Ciclo de vida de saúde `Saudável` -> `Por um Fio` (em 0 PV) -> `Morto` (dano adicional em Por um Fio ou falha de sobrevivência); Cura restaura Por um Fio para Saudável; Condições ativas (*Atordoado* sem ações/reações, *Cego* com ataques/visão inaptos e -2 de defesa, *Amedrontado* com -2 em testes e bloqueio de aproximação).
  * **Subtítulo 16 — Sistema de Alquimia, Preparo de Poções e Extratos (`tests/16_alquimia_pocoes.test.mjs`):**
    * Módulo `module/helpers/alquimia.mjs`:
      * `conheceReceita(habilidadesActor, receita)`: Herbalismo (poções básicas comuns e incomuns, sem destilação); Alquimia Básica (todas as poções básicas + destilação); Alquimia Avançada (todas as receitas).
      * `processarEtapaAlquimia(...)`: 6 processos canônicos (Infusão, Maceração, Tintura, Tisana, Fermentação, Destilação). Falha em etapa descarta apenas ingredientes daquela etapa; ingredientes de etapas posteriores permanecem preservados no inventário.
      * Sucesso Crítico (+1 dose adicional cumulativa da poção) e Falha Crítica (geração obrigatória de Poção do Caos sorteada na tabela canônica 2d6).
  * **Subtítulo 17 — Personagens de Nível Zero (Aspirantes e Desclassificados) (`tests/17_nivel_zero.test.mjs`):**
    * Módulo `module/helpers/nivel-zero.mjs`:
      * Aspirantes: Início com 40 PV e 40 PM; Atributos da Raça + Habilidade da Raça; Habilidade Automática da Classe + apenas 1 modificador de Atributo da Classe (com trava de atributo $\le 5$); Evolução aos 10 XP (+20 PV, +20 PM, +1 no 2º atributo da classe podendo agora ultrapassar 5, 2 novas habilidades).
      * Desclassificados: Início com 30 PV e 30 PM, sem pontos extras de atributo; definido obrigatoriamente por Antecedente (sem custo de Ponto de Atributo); Evolução aos 10 XP (+30 PV, +30 PM, Habilidade de Classe, modificadores da Classe com penalidade de -1 ponto no atributo por possuir Antecedente, 2 novas habilidades).
  * **Subtítulo 18 — Faixas Etárias, Envelhecimento e Efeitos Biológicos (`tests/18_faixas_etarias.test.mjs`):**
    * Módulo `module/helpers/envelhecimento.mjs`:
      * 6 faixas etárias oficiais: Filhote (Atributos = 1, 5 PV/PM, sem bônus raciais, Tamanho Miúdo -2), Criança (Atributos -3 mín 1, 10 PV/PM, sem bônus raciais, Tamanho Pequeno -1), Adolescente (Atributos -1 mín 2, 30 PV/PM, ganha Habilidade Racial), Adulto (60 PV / 60 PM padrão), Idoso (teste FOR e AGI DV 10 com falha = -1 permanente mín 2, +1 livre em VON ou INT), Ancião (-1 imediato em todos os atributos mín 1, testes anuais DV 12).
      * Exceção Elfos e Levents: Imunes à perda de atributos por idade; em Idoso ganham +1 livre em VON ou INT; testes de ciclo de anos (Elfos 50 anos, Levents 25 anos); 10 falhas acumuladas deflagram falência orgânica e morte placidamente em dias iguais à sua Vontade.
  * **Subtítulo 19 — Sistema de Apostasia, Abandono de Votos e Código Sagrado (`tests/19_apostasia_votos.test.mjs`):**
    * Módulo `module/helpers/apostasia.mjs`:
      * `processarApostasia(actor, patronoOuVoto)`: Abandono de Dogmas/Códigos sagrados para Sacerdotes, Dracomantes e Paladinos revoga instantaneamente a conjuração de Punições, Magias Místicas e Mitos do patrono.
      * `validarHabilidadeApostata(actor)`: Pré-requisito estrito "Ter abandonado um Voto", canalizando a perda de fé em Resistência Pura (+2 RD) ou Resistência Mágica (+2 RM).
      * `validarIncompatibilidadeReligiosaProfana(actor, novoItem)`: Bloqueio absoluto entre Pacto Infernal e Dogma/Conhecimento Místico.
  * **Subtítulo 20 — Tatuagens Místicas e Registro Cutâneo (`tests/20_tatuagens_misticas.test.mjs`):**
    * Módulo `module/helpers/tatuagens.mjs`:
      * Capacidade cutânea por porte: Médio (13 GC), Pequeno (10 GC), Grande/Gigantismo (15 GC); Tatuagens Tohunga (Primeira Marca, Tamoko, Tribais) ocupam 1 GC cada.
      * Magias Tatuadas: Ocupam GC igual ao Círculo/Grau; reduzem Dificuldade em 1 (-1 DV) e Mana em 5 PM (-5 PM com piso de 1 PM).
      * Tatuar Objeto: Permite fundir/invocar item na pele por 5 PM.
  * **Subtítulo 21 — Manobras Táticas de Combate (`tests/21_manobras_taticas.test.mjs`):**
    * Módulo `module/helpers/manobras-combate.mjs`:
      * `processarAtaqueLocalizado`: Modificador de +4 na Defesa do alvo antes da rolagem.
      * `processarEncontrao`: Ação Completa, mínimo 3 metros, dano soma maior FN entre arma e armadura + 1 a cada 3m percorridos, impõe -2 de Esquiva no atacante até o próximo turno.
      * `processarFintar`: Reação, primeiro ataque causa metade do dano (floor), concede +1d6 nos ataques subsequentes contra o mesmo alvo no mesmo turno.
      * `processarInterceptar`: Reação contra oponente adjacente com confronto de Agilidade; vitória bloqueia passagem e consome Ação de Movimento do próximo turno do interceptador.
  * **Subtítulo 22 — Economia, Antecedentes e Progressão de Ouro (`tests/22_economia_ouro_antecedentes.test.mjs`):**
    * Módulo `module/helpers/economia.mjs`:
      * `calcularCustoAntecedenteCriacao(actor, classe)`: Selecionar Antecedente no Nível 1 consome 1 ponto de bônus de Atributo concedido pela Classe (resta +1 em apenas 1 atributo da classe).
      * `validarAntecedentePosterior(actor)`: Aquisição após Nível 1 consome 1 Ponto de Evolução e penaliza o herói nos Níveis 4, 7 e 10 a receber +1 em apenas 1 Atributo (em vez de +1 em dois).
      * `calcularOuroInicialPorNivel(nivel)`: Tabela e progressão canônica de moedas para campanhas iniciando acima do Nível 1 (Nv 1: 500, Nv 2: 850, Nv 3: 1450, Nv 4: 2450, Nv 5: 4200, Nv 6: 7200, Nv 7: 12000, Nv 8: 20500, Nv 9: 35000, Nv 10: 60000 moedas; Fórmula: $Ouro_N = Ouro_{N-1} + 70\% \text{ do } Ouro_{N-1}$); Bônus de Antecedentes (Nobre +200, Fidalgo +100).
  * **Subtítulo 23 — Economia Estrita do Turno (`tests/23_economia_turno.test.mjs`):**
    * Módulo `module/helpers/economia-turno.mjs`:
      * Combinações válidas de turno: 1 Rodada Completa + Livres; 1 Padrão + 1 Movimento + Livres; 2 Movimentos + Livres.
      * Regra negativa restritiva canônica: Proibição estrita de trocar Ação de Movimento por uma segunda Ação Padrão no mesmo turno (`podeTrocarMovimentoPorPadrao = false`).
      * Suporte a exatamente 1 Reação por rodada fora do turno.
  * **Subtítulo 24 — Resolução de Dados, Graus de Sucesso e Dupla Inaptidão (`tests/24_resolucao_dados_graus.test.mjs`):**
    * Módulo `module/helpers/resolucao-dados.mjs`:
      * Critérios de Sucesso Decisivo (Acerto Crítico): 2 ou mais dados com resultado 6. Em Magias: escolha estrita de exatamente 1 benefício (0 PM, dano 2x, ou área/duração 2x). Em Ataques Físicos: dano multiplicado por 2. Regra aditiva de multiplicadores ($2 + 2 = 4\times$, jamais exponencial $2 \times 2$).
      * Falha Crítica: todos os dados rolados resultam em 1, aplicando falha automática e efeito colateral grave.
      * Trava Absoluta de Dupla Inaptidão: duas ou mais condições impondo Inaptidão no mesmo teste encerram a ação em falha automática imediata (0% de chance de sucesso, sem rolagem).
      * Resolução de Confrontos Opostos e Empates: Sucesso Decisivo vence não-crítico; se ambos críticos ou normais vence maior soma (Dados + Atributo); empate na soma vence maior Atributo; atributos idênticos desempata com rolagem rápida de 1d6.
  * **Subtítulo 25 — Geografia, Clima e Modificadores Elementais do Ambiente (`tests/25_ambiente_elemental.test.mjs`):**
    * Módulo `module/helpers/ambiente-elemental.mjs`:
      * Ambientes Gelados (Eishelm, picos nevados): Gelo criado magicamente dura indefinidamente; Magias de Fogo sofrem +2 na Dificuldade (DV).
      * Ambientes Quentes / Áridos (Terras Secas, Picos Orientais, Arkânia): Magias e objetos de Gelo duram metade do tempo; Magias de Fogo causam +5 de dano adicional.
      * Ambientes Subaquáticos: Magias de Fogo não funcionam no padrão (fervem água e geram bolhas ferventes locais); Magias de Gelo duram metade do tempo e flutuam (exceto profundezas polares); Magias de Eletricidade afetam criaturas em raio de 10m ao redor do conjurador ou dobram área.
  * **Subtítulo 26 — Sistema de Fabricação (Crafting), Mineração e Avaliação (`tests/26_crafting_fabricacao.test.mjs`):**
    * Módulo `module/helpers/crafting.mjs`:
      * Tabela Canônica de Produção (Artesão): $\le 6$ falha com perda de 50% de material (ou perda de 100% e ferramentas quebradas em Falha Crítica); 7 a 9 Qualidade Baixa; 10 a 15 Qualidade Mediana; 16 a 20 Qualidade Alta (+2 DV para encantar); $\ge 21$ Obra-Prima.
      * Bônus por Dedicação de Tempo: gastar o dobro do tempo necessário concede +2 no teste de fabricação.
      * Desmontagem para Matéria-Prima: destruir um item para reaproveitá-lo fornece exatamente metade (50%) do material necessário para criar um novo.
      * Sistema de Avaliação (1 minuto: graus básico, detalhado e mágico), Prospecção Mineral (DV 16), Garimpagem e Mineração semanal.
  * **Subtítulo 27 — Ilícitos, Leis e Status Legal de Equipamentos (`tests/27_status_legal_ilicitos.test.mjs`):**
    * Módulo `module/helpers/status-legal.mjs`:
      * Propriedade Legal de Itens: validação de flag `ilegal` para extratos e elixires proibidos (Elixir do Dragão Vermelho, Veneno Restrito, toxinas canônicas).
      * Fiscalização Urbana: personagens portando itens ilegais acionam testes de Furtividade/Enganação ao passar por guardas estaduais ou Archons em metrópoles como Tebrynia; dispensa em ermos. Procedimento de apreensão seletiva.
  * **Subtítulo 28 — Estatísticas de Objetos Inanimados e Alvos Específicos (`tests/28_objetos_inanimados.test.mjs`):**
    * Módulo `module/helpers/objetos-inanimados.mjs`:
      * Defesa Base de Objetos Inanimados por porte: Pequeno até 1m (6), Médio até 2m (5), Grande até 4m (4), Gigante/Colossal > 4m (3).
      * Modificador de Movimento: objeto em movimento soma +1d6 (ou média +3) ao valor de Defesa.
      * Alvo Específico / Ataque Localizado: visar membros específicos, garganta, armas empunhadas ou amuletos equipados adiciona +4 na Defesa do alvo.
  * **Subtítulo 29 — Sistema de Avanço (D&D 5e) e Sub-Features Raciais: Humano & Dragano (`tests/29_avanco_humano_dragano.test.mjs`):**
    * Concessões estruturadas `escolhaAtributo` (Adaptabilidade/Diversidade) e `origemDraconica` (Linhagem Dracônica + 6 Características Dracônicas como Sub-Features).
  * **Subtítulo 30 — Sincronização Canônica com `habilidades.base` (Obsidian SSOT) e Filtro Estrito de Acesso (`tests/03_restricoes_incompatibilidades.test.mjs`):**
    * **Causa Raiz Corrigida (Feiticeiro × Magias de Sacerdote):** Anteriormente, `CANONICAL_MAGIAS` e `CANONICAL_HABILIDADES` não exportavam os metadados `acesso`, `tipoAcesso`, `nivel` e `requisitos` das notas da Base do Obsidian (`D:\ArquivosObsidian\Cofre Obsidian Principal\RPG\MB\banco de dados\notas das bases mb\Habilidades\*.md`), e `validarAcessoMagia` verificava apenas a restrição racial de Naga Macho.
    * **Pipeline SSOT (`scripts/export_canonical_content.cjs` & `module/data/canonical-packs-data.mjs`):** Exportação direta das **721 notas canônicas** do cofre Obsidian (557 Habilidades principais + 6 Sub-Features Dracônicas + 164 Magias), preservando `efeitos` mecânicos do `@mighty-blade/rules-core` e injetando `acesso`, `tipoAcesso`, `nivel`, `requisitos`, `fonte` (`arcana` via *Runa Arcana* vs `mistica` via *Selo Místico*), `dificuldadeTexto` e `fonteLivro`.
    * **Motor de Acesso & Requisitos (`module/helpers/restricoes.mjs`, `module/helpers/requisitos.mjs`, `module/apps/compendium-browser.mjs`, `module/documents/actor.mjs`):**
      * `obterAcessosAtor(actor)` e `validarAcessoItem(actor, item)`: Filtram estritamente Habilidades e Magias pelo conjunto de acessos ativos do personagem (`Geral`, Raça + dimorfismo Naga ♀/♂, Classe Principal, Classe de Aprendiz, Caminho, Organização e Antecedente).
      * `enriquecerItemComSSOT(item)`: Garante enriquecimento em memória mesmo antes de rebuild de LevelDB, além de `LAST_PACKS_VERSION = "2.5.0-obsidian-ssot-acesso"` em `module/mighty-blade.mjs` para reconstrução automática dos compêndios ao recarregar (`F5`).
      * No `CompendiumBrowser`, magias e habilidades de outras classes/raças/caminhos/organizações (ex.: *Abençoar Aliados 1/2*, *Abençoar Objeto* de `Sacerdote` para um `Feiticeiro`) são ocultadas automaticamente, e o painel de detalhes exibe `Acesso Canônico`, `Livro` e o Card de Checklist de Pré-Requisitos também para Magias.
  * **Resultados Globais Consolidados:** 789 testes automatizados via `node --test tests/*.test.mjs` distribuídos em 68 suítes executados em ~800ms com **100% de aprovação (789 pass, 0 fail, 0 regressões)**.

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


