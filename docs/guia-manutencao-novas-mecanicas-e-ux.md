---
tipo: guia-tecnico
sistema: "Mighty Blade 3.5 & Web App"
plataforma: "Mesas do Breder Web & VTT"
versao: "1.6.1"
autor: "Guilherme Breder (@Gbredo) & Antigravity"
tags:
  - engenharia/software
  - manutencao
  - ui-ux
  - design-system
  - cofre/mestre
---

# 🛠️ Guia de Manutenção: Novas Mecânicas, UX e Arquitetura (v1.6.1)
### Manual Técnico de Sobrevivência para o Mantenedor

> [!IMPORTANT]
> Este documento é o **manual de referência e manutenção** para todas as funcionalidades, mecânicas de regras e melhorias de UI/UX implementadas no ecossistema **Mesas do Breder / Mighty Blade 3e** desde o início dos trabalhos. 
> Se você precisar alterar comportamentos, corrigir bugs ou expandir estas áreas no futuro sem depender de IA, todos os fluxos, arquivos, linhas e padrões de código estão descritos aqui.

---

## 📑 Índice de Tópicos
1. [Drag & Drop Bidirecional: Cards e Linhas de Tabela](#1-drag--drop-bidirecional-cards-e-linhas-de-tabela)
2. [Centralização Geométrica da Paginação (`<Paginacao />`)](#2-centralização-geométrica-da-paginação-paginacao-)
3. [Anotações & Diários de Campanha Estilo Foundry VTT (Offline-First)](#3-anotações--diários-de-campanha-estilo-foundry-vtt-offline-first)
4. [Barra de Filtros Avançados e Modos de Ordenação no Dashboard](#4-barra-de-filtros-avançados-e-modos-de-ordenação-no-dashboard)
5. [Modo Claro / Escuro (Design System & CSS Tokens)](#5-modo-claro--escuro-design-system--css-tokens)
6. [Automação da Loja de Equipamentos na Ficha](#6-automação-da-loja-de-equipamentos-na-ficha)
7. [Ficha Simétrica, Condição "Por um Fio" & Penalidades](#7-ficha-simétrica-condição-por-um-fio--penalidades)
8. [Regras Canônicas de Equipamentos, Montarias & Bestiário](#8-regras-canônicas-de-equipamentos-montarias--bestiário)
9. [Auto-Stacking & Consolidação Automática de Inventário](#9-auto-stacking--consolidação-automática-de-inventário)
10. [Painel de Testes Mobile-First e Zero Scroll & Acentuação Canônica](#10-painel-de-testes-mobile-first-e-zero-scroll-testesmodaltsx--acentuação-canônica)

---

## 1. Drag & Drop Bidirecional: Cards e Linhas de Tabela

### 🎯 O Problema que Resolve
Permite ao usuário organizar visualmente a ordem de prioridade de seus personagens arrastando os elementos na tela, funcionando de maneira idêntica tanto no **Modo Grade (Cards)** quanto no **Modo Tabela (Linhas `<tr>`)**.

### 📁 Arquivos Relevantes
- `apps/web/src/pages/Dashboard.tsx` (Estado, handlers e renderização)
- `apps/web/src/pages/dashboard.css` (Estilização de alças, opacidades e bordas de drop)
- `apps/web/src/services/personagemStorage.ts` (Persistência da ordem no storage)

### 🧠 Como Funciona o Algoritmo (HTML5 Drag and Drop API)
Nenhuma biblioteca pesada externa (como `react-beautiful-dnd` ou `dnd-kit`) foi utilizada. Usamos a API nativa do navegador, que é ultra-leve (0 KB adicionais):

1. **Estado do Drag (`Dashboard.tsx`):**
   ```tsx
   const [draggedId, setDraggedId] = useState<string | null>(null);
   const [dragOverId, setDragOverId] = useState<string | null>(null);
   ```
2. **Início do Arraste (`handleDragStart`):**
   ```tsx
   const handleDragStart = (e: React.DragEvent<HTMLElement>, id: string) => {
     // Proteção contra cliques em botões, links ou selects internos
     const target = e.target as HTMLElement;
     if (target.closest("button, a, input, select")) {
       e.preventDefault();
       return;
     }
     e.dataTransfer.setData("text/plain", id);
     e.dataTransfer.effectAllowed = "move";
     setDraggedId(id);
   };
   ```
3. **Sobreposição (`handleDragOver` e `handleDragLeave`):**
   - `handleDragOver` chama obrigatoriamente `e.preventDefault()` (requisito do HTML5 para permitir o drop) e atualiza `dragOverId` para o item de destino.
4. **Finalização e Troca de Posição (`handleDrop`):**
   - Encontra o índice do item de origem (`indexOrigem`) e do item de destino (`indexDestino`).
   - Usa `splice` para remover o item da posição antiga e inseri-lo na nova:
     ```tsx
     const novaLista = [...personagens];
     const [removido] = novaLista.splice(indexOrigem, 1);
     novaLista.splice(indexDestino, 0, removido);
     setPersonagens(novaLista);
     setOrdenacao("manual");
     await personagemStorage.reordenar(novaLista.map((p) => p.id));
     ```
5. **Aplicação na Tabela (`<tr>`):**
   - No HTML5, `<tr>` suporta perfeitamente `draggable={true}`.
   - Adicionamos uma alça visual `<td className="dash-td-drag"><GripVertical size={15} /></td>` com `cursor: grab`.
   - Ao sobrepor uma linha, o CSS aplica:
     ```css
     .dash-tabela-linha.drag-over td {
       border-top: 2px solid var(--mb-cor-primaria) !important;
       border-bottom: 2px solid var(--mb-cor-primaria) !important;
       background: rgba(245, 158, 11, 0.14) !important;
     }
     ```

### 🔧 Como Dar Manutenção
- Se quiser desabilitar o arraste em determinados estados (ex: quando há busca ativa), basta colocar `draggable={!busca}` no elemento.
- Para alterar o efeito sonoro ou animação, use a classe `.is-dragging` (card ou linha que está voando) e `.drag-over` (alvo que receberá a inserção).

---

## 2. Centralização Geométrica da Paginação (`<Paginacao />`)

### 🎯 O Problema que Resolve
Anteriormente, o componente de paginação podia ter seus botões empurrados para os lados dependendo do tamanho do texto informativo ("Mostrando 1 a 16 de 42"). 

### 📁 Arquivos Relevantes
- `apps/web/src/components/Paginacao.tsx`
- `apps/web/src/components/paginacao.css`

### 🧠 Como Funciona a Solução
Utilizamos um layout em **CSS Grid de 3 slots balanceados**:
```css
.paginacao {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1rem;
  width: 100%;
}
```
- **Slot 1 (`1fr` à esquerda):** `.paginacao-info` — Exibe a contagem de itens alinhada à esquerda (`justify-self: start`).
- **Slot 2 (`auto` no centro):** `.paginacao-controles` — Agrupa os botões `◀ [1] [2] [3] ▶` e fica **matematicamente cravado no centro horizontal**, independentemente do que haja nos lados.
- **Slot 3 (`1fr` à direita):** `.paginacao-seletor-container` — Agrupa o dropdown de "Itens por Página" alinhado à direita (`justify-self: end`).

Em telas mobile (`@media (max-width: 640px)`), o grid colapsa automaticamente para `flex-direction: column` com alinhamento central.

### 🔧 Como Reutilizar em Novas Páginas
Basta importar o componente e passar os estados:
```tsx
<Paginacao
  paginaAtual={paginaAtual}
  totalItens={lista.length}
  itensPorPagina={itensPorPagina}
  onMudarPagina={setPaginaAtual}
  onMudarItensPorPagina={setItensPorPagina}
  opcoesItensPorPagina={[10, 25, 50, "todos"]}
  rotuloItem="item"
  rotuloItemPlural="itens"
/>
```

---

## 3. Anotações & Diários de Campanha Estilo Foundry VTT (Offline-First)

### 🎯 O Problema que Resolve
No ambiente de produção (Vercel) e para usuários sem backend conectado, o antigo sistema de anotações gerava erros do tipo `alert("Erro ao criar anotação.")` devido a chamadas HTTP não autorizadas (401). Além disso, anotações de mesa precisam de organização por pastas e páginas múltiplas.

### 📁 Arquivos Relevantes
- `apps/web/src/services/anotacaoStorage.ts` (Motor de persistência)
- `apps/web/src/pages/AnotacoesPainel.tsx` (Interface de pastas, páginas e editor)

### 🧠 Arquitetura de Dados
A interface de cada anotação espelha o modelo de Journal Entries do Foundry VTT:
```ts
export interface PaginaAnotacao {
  id: string;
  titulo: string;
  conteudo: string; // Markdown com suporte a [[Wikilinks]]
  criadoEm: string;
  atualizadoEm: string;
}

export interface AnotacaoVTT {
  id: string;
  titulo: string;
  pastaId?: string | null;
  paginas: PaginaAnotacao[];
  tags?: string[];
  criadoEm: string;
  atualizadoEm: string;
}
```

### 🛡️ Resiliência Offline-First
O arquivo `anotacaoStorage.ts` opera de forma transparente:
- Salva na chave `mb_anotacoes_vtt` do `localStorage`.
- Se o usuário estiver autenticado com token na nuvem, pode sincronizar em segundo plano, mas **nunca bloqueia ou exibe erros de rede** para o usuário local.
- Criação de pastas (`mb_anotacoes_pastas`) permite agrupar notas por Sessão, Lore, NPCs ou Cidades.
- O editor permite alternar entre visualização com formatação Markdown no componente `<LoreRenderer>` e edição em texto puro com auto-save.

---

## 4. Barra de Filtros Avançados e Modos de Ordenação no Dashboard

### 🎯 O Problema que Resolve
Mesas com dezenas de fichas ficavam difíceis de navegar sem categorização rápida por arquétipos e raças.

### 📁 Arquivo: `apps/web/src/pages/Dashboard.tsx`

### 🧠 Como Funciona o Pipeline de Filtragem e Ordenação
A lista de personagens passa por dois `useMemo` encadeados:
```text
personagens (brutos do storage)
   │
   ▼
[useMemo] personagensFiltrados
   ├─ Filtro por Pasta/Party Ativa
   ├─ Filtro por Raça (racaSlug)
   ├─ Filtro por Classe (classeSlug)
   ├─ Filtro por Caminho (caminhoSlug)
   ├─ Filtro por Organização (organizacaoSlug)
   └─ Termo de Busca (Nome, Raça, Classe, Caminho, Org)
   │
   ▼
[useMemo] personagensOrdenados
   ├─ "manual": Mantém ordem do array (salva pelo Drag & Drop)
   ├─ "nome_asc" / "nome_desc": localeCompare alfabético
   ├─ "nivel_desc" / "nivel_asc": Numérico por nível (com desempate por nome)
   └─ "recente" / "antigo": Comparação de timestamps (criadoEm)
   │
   ▼
[useMemo] personagensPaginados (slice por itensPorPagina)
```

### 🔧 Manutenção e Adição de Novos Filtros
Para adicionar um novo filtro (ex: por Nível mínimo):
1. Crie o estado: `const [filtroNivel, setFiltroNivel] = useState("todos");`
2. Adicione a condição correspondente dentro de `personagensFiltrados`.
3. Adicione `filtroNivel` no array de dependências do `useEffect` que reseta a página para 1 (`setPaginaAtual(1)`).
4. Insira o `<select>` na `.dash-filtros-bar`.

---

## 5. Modo Claro / Escuro (Design System & CSS Tokens)

### 🎯 O Problema que Resolve
Permitir ao usuário escolher entre a atmosfera imersiva escura (Dark Obsidian) e o modo leitura solar (Pergaminho Claro) para ambientes iluminados.

### 📁 Arquivos Relevantes
- `apps/web/src/styles/tokens.css` (Variáveis CSS raiz)
- `apps/web/src/styles/global.css` (Classes utilitárias)
- `apps/web/src/components/SettingsModal.tsx` (Seletor de tema)
- `apps/web/src/pages/dashboard.css` (Overrides de cards e tabelas)

### 🧠 Como Funciona a Troca de Temas
Ao carregar o app ou alternar no modal de Configurações:
1. O valor é salvo no `localStorage.getItem("mb_tema")` como `"escuro"` ou `"claro"`.
2. Se `"claro"`, a classe `.theme-claro` é adicionada ao elemento `document.body`.
3. O arquivo `tokens.css` redefine automaticamente as variáveis semânticas:
   ```css
   body.theme-claro {
     --mb-cor-fundo: #f8fafc;
     --mb-cor-superficie: #ffffff;
     --mb-cor-superficie-hover: #f1f5f9;
     --mb-cor-borda: #cbd5e1;
     --mb-cor-texto: #0f172a;
     --mb-cor-texto-suave: #64748b;
   }
   ```

### 🔧 Regra de Ouro para Novos Componentes
Nunca use cores hexadecimais fixas como `color: #ffffff` ou `background: #0d111d` diretamente nos seletores de componentes gerais. Sempre utilize as variáveis CSS semânticas:
- Fundo de card: `background: var(--mb-cor-superficie);`
- Borda: `border: 1px solid var(--mb-cor-borda);`
- Texto principal: `color: var(--mb-cor-texto);`
- Texto secundário: `color: var(--mb-cor-texto-suave);`

---

## 6. Automação da Loja de Equipamentos na Ficha

### 🎯 O Problema que Resolve
Ao comprar/adicionar um item na loja de equipamentos dentro do editor de fichas, o jogador tinha que trocar de aba manualmente para verificar se o item realmente entrou no inventário.

### 📁 Arquivos Relevantes
- `apps/web/src/components/EquipamentosTab.tsx`
- `apps/web/src/pages/Ficha.tsx`

### 🧠 Como Funciona
Ao clicar no botão de adicionar (`+`):
1. A função `adicionarAoInventario(item)` despacha a adição para o array `ficha.system.inventario`.
2. O estado da sub-aba é trocado instantaneamente: `setSubAba("inventario");`.
3. Um badge informativo renderiza no topo da aba: `Inventário (${inventario.length})`.

---

## 7. Ficha Simétrica, Condição "Por um Fio" & Penalidades

### 🎯 O Problema que Resolve
1. O layout de visualização (`FichaDetalhe.tsx`) possuía um inventário duplicado e desbalanceamento entre colunas.
2. Personagens que atingiam 0 Pontos de Vida (PV) precisavam de sinalização tática imediata de perigo de morte e aplicação das regras oficiais de perda de defesas ativas.

### 📁 Arquivos Relevantes
- `apps/web/src/pages/FichaDetalhe.tsx`
- `packages/rules-core/src/rules/combat.ts` (`resolverPenalidades`)

### 🧠 Como Funciona a Condição "Por um Fio"
1. **Gatilho de 0 PV:**
   Quando `vidaAtual <= 0`:
   - A condição canônica `"por-um-fio"` é inserida automaticamente em `condicoesAtivas` se ainda não estiver presente.
   - Um banner vermelho pulsante de alerta máximo é exibido no topo da ficha:
     *"⚠️ ATENÇÃO: Personagem Por um Fio (0 PV)! Defesa e Deslocamento penalizados."*
2. **Cálculo de Penalidades:**
   - A Defesa Ativa e o Deslocamento chamam a função canônica do motor:
     ```ts
     const penalidades = resolverPenalidades(ficha.system.condicoesAtivas);
     ```
   - Se o personagem estiver inconsciente, imobilizado ou cego, a esquiva e o escudo são zerados ou reduzidos conforme o manual de regras.
3. **Recuperação:**
   - Assim que o jogador clica para recuperar PV (`vidaAtual > 0`), a condição `"por-um-fio"` é removida automaticamente.

---

## 8. Regras Canônicas de Equipamentos, Montarias & Bestiário

### 🎯 O Problema que Resolve
Algumas armas no banco de dados possuíam propriedades incorretas herdadas de rascunhos antigos (ex: adagas e foices mundanas marcadas com `Canalizador`), enquanto chicotes e montarias faltavam no compêndio oficial.

### 📁 Arquivos Relevantes
- `packages/rules-core/src/data/equipamentos.ts`
- `packages/rules-core/src/data/equipamentos.types.ts`
- `packages/rules-core/src/data/bestiario.ts`

### ⚖️ Especificação Canônica Atualizada
1. **Canalizador**: Propriedade exclusiva de itens mágicos sagrados ou arcanos. Removida de foice, bordão, clava e adaga mundanas.
2. **Chicote**:
   - `custo: 50` moedas de prata.
   - `dano: "FOR+2"` (corte/contusão).
   - `propriedades: ["Segurar", "Transpor", "Gancho"]`.
3. **Armas de Duas Mãos**:
   - `martelo-lucerno`: Dano `FOR+4` contusão/perfuração, `propriedades: ["DuasMaos", "Pesada", "Perfurante"]`.
   - `debulhador`: Dano `FOR+3` contusão, `propriedades: ["DuasMaos", "Desarmar"]`.
4. **Categoria Montaria**:
   - Criada a categoria canônica `"Montaria"` em `equipamentos.types.ts`.
   - Inclui cavalos, carroças, carruagens e o burro de carga.
5. **Bestiário Canônico de Suporte**:
   - Adicionadas as fichas canônicas completas de `BURRO` (Ameaça 1) e `CAVALO_DE_GUERRA` (Ameaça 2) em `bestiario.ts`.

---

## 9. Auto-Stacking & Consolidação Automática de Inventário

### 🎯 O Problema que Resolve
Ao comprar repetidamente itens consumíveis na loja (como flechas ou poções), o sistema criava múltiplas linhas soltas no inventário com `quantidade: 1`, poluindo a mochila com dezenas de caixas idênticas.

### 📁 Arquivos Relevantes
- `apps/web/src/pages/FichaDetalhe.tsx` (Auto-consolidação no carregamento)
- `apps/web/src/hooks/useFichaBuilder.ts` (Empilhamento na loja)
- `apps/web/src/components/InventarioPainel.tsx` (Agrupamento com soma de quantidades)

### 🧠 Como Funciona
1. **Ao Abrir a Ficha (`FichaDetalhe.tsx`):** O sistema percorre o inventário e agrupa itens idênticos desequipados (`refId`, `material` e `qualidade`), somando suas quantidades em uma linha única e persistindo no storage. Itens com anotações personalizadas ou equipados mantêm sua individualidade.
2. **Ao Adicionar na Loja (`useFichaBuilder.ts`):** Para itens empilháveis (munição, poção, consumíveis e itens mundanos), se o item já existir desequipado, o sistema incrementa `quantidade += 1` em vez de criar um novo item.
3. **Remoção Segura:** Se a quantidade de um item atinge 0, o sistema solicita confirmação do usuário antes de removê-lo da mochila.

---

## 10. Painel de Testes Mobile-First e Zero Scroll (`TestesModal.tsx`) & Acentuação Canônica

### 🎯 O Problema que Resolve
O modal de rolagens de testes e combate era excessivamente longo, com opções táteis minúsculas (difíceis de acertar no mobile) e o bloco de resultado expandia a tela para baixo, forçando o usuário a rolar continuamente para ver o desfecho. Além disso, termos como "Inteligencia", "Anao" e "Xama" eram exibidos sem os acentos canônicos (`^` e `~`).

### 📁 Arquivos Relevantes
- `apps/web/src/components/TestesModal.tsx` (Layout de painel coeso e abas de resultado)
- `apps/web/src/pages/Dashboard.tsx` (`formatSlug` inteligente)
- `apps/web/src/pages/FichaDetalhe.tsx` (Resolução de `racaBase` e `classeBase`)

### 🧠 Como Funciona
1. **Zero Scroll & Mobile-First (`TestesModal.tsx`):**
   - O modal é contido em um painel fixo de altura confortável (`max-height: 92vh`), projetado para caber 100% no campo de visão sem barra de rolagem.
   - **Touch Targets Generosos:** Botões com altura mínima de 40px a 48px, facilitando o toque preciso com o polegar.
   - **Seletor de Dificuldade com `<select>` Touch:** No smartphone, abre a roda de seleção nativa do sistema operacional, eliminando erros de clique em botões pequenos.
   - **Visão Dedicada de Resultado:** Ao rolar os dados, o modal transiciona suavemente para a visão de Resultado com dados grandes (48x48px), indicador tático de Sucesso/Crítico/Falha, cálculo e dano, além dos botões de ação imediata: `[ 🎲 Rolar Novamente ]` (1 toque) e `[ ⚙️ Ajustar Teste ]`.
2. **Acentuação Canônica Impecável:**
   - Mapeamento em `ATRIBUTO_LABELS`: `"inteligencia"` agora renderiza sempre como **`Inteligência`** (com circunflexo `^`).
   - `formatSlug`: Mapeamento automático dos catálogos canônicos (`RACAS`, `CLASSES`, `CAMINHOS`, `ORGANIZACOES`), garantindo **`Anão`** e **`Xamã`** com til (`~`), bem como **`Oráculo`**, **`Capitão`**, **`Espadachim`** e **`Rúnico`**.

