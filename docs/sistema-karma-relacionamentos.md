# 🤝 Sistema de Karma Moral, Relacionamentos & Pastas de Campanhas
### Documento de Arquitetura & Decisões de Design (Mighty Blade 3e)

Este documento descreve a arquitetura técnica, estruturas de dados e decisões de experiência de usuário (UX) por trás do **Sistema de Karma**, da **Matriz de Relacionamentos Interpessoais/Facções**, dos **Wikilinks Markdown** e do **Gerenciamento de Pastas (Parties)** no ecossistema *Mesas do Breder*.

---

## 🗺️ 1. Motivação & Filosofia de Design

Em campanhas de RPG de mesa, fichas não são entidades isoladas num vácuo matemático. Heróis pertencem a grupos (*parties*), juram lealdade a facções, colecionam rivais e cultivam inclinações éticas que mudam a cada sessão.

Inspirado em soluções consagradas como o *Dungeon Master Vault (DMV)*, *Foundry VTT* e o modelo de hiperlinks bidirecionais do *Obsidian*, este módulo foi projetado para:
1. **Descentralizar o Social do Editor de Regras:** A gestão de laços e reputação ocorre em **tempo real durante a sessão** (Modo Visualização / `FichaDetalhe.tsx`), e não misturada com compras mecânicas de atributos no criador de ficha (`Ficha.tsx`).
2. **Resiliência a Mudanças de Nomes:** Vínculos guardam `alvoId` (ID do personagem, ID da pasta ou slug canônico da organização). Se um jogador alterar o nome do seu personagem no Dashboard, as relações não se perdem.
3. **Consistência Semântica:** Impedir estados contraditórios (ex: o mesmo herói ou NPC aparecer simultaneamente como aliado `+100` e inimigo `-100`).

---

## 🏛️ 2. Schema Canônico (`@mighty-blade/rules-core`)

No pacote de regras agnóstico, o schema Zod da ficha (`ficha.schema.ts`) foi estendido:

```typescript
export const relacionamentoItemSchema = z.object({
  id: z.string(),
  tipoAlvo: z.enum(["personagem", "grupo", "organizacao"]).default("personagem"),
  alvoId: z.string().optional().nullable(),
  alvoNome: z.string(),
  alinhamento: z.enum(["aliado", "neutro", "inimigo"]).default("neutro"),
  afinidade: z.number().min(-100).max(100).default(0),
  observacoes: z.string().optional().default(""),
});

// Campos adicionados a systemSchema:
karma: z.number().min(-100).max(100).default(0),
relacionamentos: z.array(relacionamentoItemSchema).default([]),
pastaId: z.string().optional().nullable(),
ordem: z.number().default(0),
visibilidade: z.enum(["publico", "privado", "mestre"]).default("publico"),
```

---

## ⚙️ 3. Módulos & Componentes Criados

### 📁 A. Pastas & Parties (`pastaStorage.ts` & `Dashboard.tsx`)
* **CRUD Local com Isolamento:** Pastas de parties armazenadas sob a chave `mb_parties_pastas` no `localStorage`.
* **Metadados de Pasta:** `id`, `nome`, `cor` (hexadecimal temático), `ordem`, `descricao` e `criadoEm`.
* **Filtros Dinâmicos no Dashboard:** Abas tipo pílula no topo do Dashboard com contadores em tempo real:
  * `[ 👥 Todos ]`
  * `[ 📁 Party Customizada ]` (com botão de exclusão que preserva os personagens contidos)
  * `[ 📂 Sem Grupo ]`
* **Transferência Rápida:** Menu flutuante em cada card permitindo realocar heróis entre mesas com 1 clique.

### 😈/😇 B. Bússola Moral / Karma
* **Escala Bipolar Contínua:** Intervalo de **-100 a +100**, onde **0** representa o centro pragmático/neutro.
* **Faixas Narrativas:**
  * `[-100 a -50]`: Diabólico / Cruel (Vermelho 🔴)
  * `[-49 a -16]`: Desordeiro / Egoísta (Laranja 🟠)
  * `[-15 a +15]`: Pragmático / Neutro (Ardósia ⚪)
  * `[+16 a +50]`: Benévolo / Honrado (Azul 🔵)
  * `[+51 a +100]`: Altruísta / Luminoso (Dourado 🟡)
* **Gradiente Reativo:** Barra de progresso bilateral desenhada a partir do eixo central (`left: 50%`), expandindo para a esquerda (vermelho) se negativo ou para a direita (esmeralda) se positivo.

### 🤝 C. Matriz de Relacionamentos & Postura Tática
* **Alinhamento Tático Tripartido:** `🟢 Aliado` | `⚪ Neutro` | `🔴 Inimigo`.
* **Barra de Afinidade:** Escala de `-100` (Inimizade / Rivalidade 👎) até `+100` (Amizade / Confiança 👍).
* **Prevenção de Duplicatas & Conflitos:**
  * O dropdown de alvos filtra automaticamente quem já foi adicionado.
  * Validação no envio bloqueia inserções duplicadas.
  * Alerta visual com borda vermelha e badge `⚠️ Duplicado` caso existam registros legados conflitantes.
  * Botão de salvar desabilitado até a resolução de conflitos.

### 📖 D. Markdown & Wikilinks Bidirecionais (`MarkdownWikilinks.tsx`)
* **Parser Inline Não-Destrutivo:** Expressão regular que divide o texto em blocos sem quebrar formatação Markdown nativa:
  ```typescript
  const partes = linha.split(/(\[\[.*?\]\]|\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  ```
* **Resolução de Wikilinks:**
  * Suporte a `[[Nome]]` e `[[Nome|Rótulo Customizado]]`.
  * Se o alvo for um personagem do Dashboard: Renderiza botão clicável `[ 👤 Nome ]` que dispara `navigate('/ficha/{id}')`.
  * Se for uma organização de Drakon: Renderiza badge roxo `[ 🏛️ Organização ]`.

---

## 🎲 4. Mapeamento para o Foundry VTT (v14+)

No módulo do Foundry VTT (`mighty-blade-foundry-vtt`), a estrutura se converte diretamente para o ecossistema de tokens e atores:

| Conceito Web App | Campo Rules-Core | Mapeamento no Foundry VTT |
|---|---|---|
| Postura Tática | `rel.alinhamento` | `token.document.disposition` (`FRIENDLY`, `NEUTRAL`, `HOSTILE`) |
| Pasta de Campanha | `system.pastaId` | `Folder` nativo da sidebar de Actors do Foundry |
| Karma Moral | `system.karma` | `actor.system.karma` (com visualizador no Header da Sheet) |
| Relações Interpessoais | `system.relacionamentos` | `actor.system.relacionamentos` |
| Wikilinks | `[[Nome]]` | Enriched HTML / Document Links (`@UUID[Actor.id]`) |

---

## 🧪 5. Garantia de Qualidade & Testes

* **Cobertura Rules-Core:** 122 testes unitários no Vitest aprovando validação de schemas Zod com os novos campos.
* **Integridade de Nomes:** Função `personagemStorage.verificarNomeExistente()` atua como barreira contra colisões de chaves no painel do jogador.
