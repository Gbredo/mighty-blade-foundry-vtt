# 📋 Backlog & To-Do List do Projeto — Mesas do Breder

Este documento centraliza as funcionalidades planejadas, melhorias de experiência de usuário (UX) e débitos técnicos priorizados para o ecossistema **Mesas do Breder** e **Mighty Blade 3e**.

---

## 🎯 Próximas Implementações (Prioridade Máxima)

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
* **Objetivo:** Marcação visual clara da postura tática de cada indivíduo, criatura ou facção:
  * 🟢 **Aliado (Ally):** Integrantes do grupo de heróis, companheiros animais e NPCs parceiros.
  * ⚪ **Neutro (Neutral):** Criaturas pacíficas, mercadores, plebeus e terceiros.
  * 🔴 **Inimigo (Enemy / Rival):** Oponentes em combate, monstros hostis e vilões.
* **Implementação Realizada:**
  * Alternador dinâmico de postura tática `🟢 / ⚪ / 🔴` no card de relacionamento do modal e na sanfona de detalhes da ficha.

---

### 4. 📊 Barra de Reputação & Afinidade Social (-100 a +100) — ✅ [CONCLUÍDO]
* **Objetivo:** Rastrear o quanto personagens ou grupos gostam/confiam uns nos outros.
* **Implementação Realizada:**
  * Slider de -100 (Ódio/Inimizade 👎) a +100 (Amizade/Lealdade 👍) com valor neutro em 0.
  * Seleção dinâmica por categoria: Personagens do Dashboard, Parties/Pastas, Organizações Canônicas de Drakon ou NPCs customizados.
  * **Prevenção de Conflitos:** Filtro nos selects para alvos já vinculados e bloqueio contra duplicatas (impedindo que um mesmo herói seja amado e odiado simultaneamente).

---

### 5. 😈/😇 Bússola Moral & Karma (-100 a +100) — ✅ [CONCLUÍDO]
* **Objetivo:** Rastrear a bússola ética do personagem ao longo da campanha.
* **Implementação Realizada:**
  * Escala de -100 (Diabólico / Cruel 😈) a +100 (Altruísta / Luminoso 😇).
  * Botão de acesso rápido no cabeçalho da ficha (`[ 🤝 Karma: +25 😇 | 2 relações ✏️ ]`) e sanfona de visualização em `FichaDetalhe.tsx`.

---

### 6. 📖 Markdown & Wikilinks Bidirecionais ([[Nome]]) — ✅ [CONCLUÍDO]
* **Objetivo:** Anotações ricas estilo Obsidian com navegação entre fichas.
* **Implementação Realizada:**
  * Componente `MarkdownWikilinks.tsx` com parsing de Markdown (negrito, itálico, listas, código).
  * Sintaxe `[[Nome]]` converte automaticamente em botões interativos `[ 👤 Nome ]` que abrem a ficha do personagem referenciado, ou `[ 🏛️ Organização ]` para facções canônicas.
  * Renderização de História/Biografia, Motivação e Anotações na visualização de detalhes da ficha.

---

### 7. 🛡️ Prevenção de Fichas Duplicadas no Dashboard — ✅ [CONCLUÍDO]
* **Objetivo:** Garantir nomes exclusivos para heróis no painel.
* **Implementação Realizada:**
  * Validação com `personagemStorage.verificarNomeExistente()` no salvamento da ficha e na importação JSON, com alertas claros e amigáveis ao usuário.

---

## 🎯 Próximas Implementações Priorizadas

### 1. 🔍 Autocomplete Fuzzy Pop-up de `[[` durante a Digitação
* **Objetivo:** Exibir menu flutuante em tempo real ao digitar `[[` no campo de história e anotações, listando personagens, monstros, magias e organizações para preenchimento com 1 clique (estilo Obsidian / Notion).

### 2. ⚔️ Filtro por Pastas no Rastreador de Encontros & Combate
* **Objetivo:** Permitir carregar uma party inteira para um encontro de combate com um único clique a partir da pasta do Dashboard.

### 3. 📄 Exportação de Ficha Completa para PDF Oficial A4
* **Objetivo:** Integrar os campos de Karma, Relacionamentos e Notas Markdown diretamente no gerador de PDF oficial para impressão de mesa.

---

## 📦 Backlog Geral do Ecossistema

### VTT & Foundry
* [ ] Integrar compêndios compilados do Codex Monstrorum no Foundry v14.
* [ ] Conectar o motor `@mighty-blade/rules-core` diretamente nos DataModels do Foundry.
* [ ] Sincronizar tokens e anotações de alinhamento com os novos campos de relacionamento canônicos.

### Construtor de Fichas & Comunidade
* [ ] Implementar exportação de ficha em PDF oficial A4 incluindo módulo social.
* [ ] Adicionar suporte a múltiplos companheiros animais para personagens com habilidades específicas.
* [ ] Sistema de privacidade granular (Fichas Públicas com link compartilhado vs Fichas Privadas de campanha).
