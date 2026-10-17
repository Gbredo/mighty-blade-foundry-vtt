# Diretrizes do Repositorio: mighty-blade-foundry-vtt

## Protocolo de Inicio de Sessao (Obrigatorio)
Ao iniciar qualquer sessao neste repositorio:
1. Leia obrigatoriamente o arquivo STATUS.md na raiz para saber onde o trabalho parou.
2. Execute git status e git log -n 5 para checar o estado da compilacao e dos compendios.

---

## 1. Hierarquia da Fonte de Verdade (SSOT)
* O Cofre Obsidian (D:\ArquivosObsidian\Cofre Obsidian Principal\RPG\MB\) e a autoridade canonica: regras, habilidades, classes, magias e monstros vem de la.
* Este repositorio e uma implementacao oficial para Foundry VTT v14.
* Divergencias: Se uma mecanica do sistema divergir da nota do cofre, sinalize expressamente ao usuario em vez de tomar decisoes unilaterais.

---

## 2. Concorrencia, Branches e Handoff
* Um agente por repositorio por vez: Nao altere este repositorio se outro agente estiver atuando nele.
* Trabalho paralelo: Em caso de tarefas simultaneas, trabalhe em branch separada (feat/..., fix/...).
* Commits:
  * Mensagens em padrao Conventional Commits (feat:, fix:, refactor:, chore:, docs:).
  * Aguarde aprovacao do usuario antes de commitar.
  * NUNCA execute git push automaticamente.
* Finalizacao de Sessao (Handoff):
  * Sobrescreva o STATUS.md na raiz (maximo ~20 linhas).

---

## 3. Topologia e Paridade com o Website
* Juncao NTFS: O repositorio esta vinculado localmente a:
  D:\FoundryVTT\FoundryUserData\Data\systems\mighty-blade
* Design 2x2 Simetrico: A ficha de personagem replica rigorosamente o layout da Web (Raca, Classe, Caminho, Organizacao).
* Organizacoes: Cor canonica purpura (#c084fc).
* Aprendiz de Classe: Sub-badge aninhada no card da classe primaria (↳ Apren: [Nome]).

---

## 4. Comandos Canonicos do Sistema
* npm run build — Compila os arquivos Sass (src/scss/mighty-blade.scss -> css/mighty-blade.css).
* npm run build:watch — Monitora e compila alteracoes de Sass em tempo real.
* npm run build:packs — Importa e compila todos os pacotes LevelDB do Foundry a partir dos JSONs fonte em packs/*_src/.
* npm run build:habilidades / build:equipamentos / build:racas / build:classes — Compila pacotes especificos.

---

## 5. Perfil de Regras GB 2023 (Canônico)
Fórmulas vigentes — NÃO altere sem consultar o GB 2023 ou o Cofre Obsidian:

| Atributo | Fórmula | Fonte |
|---|---|---|
| Determinação | `8 + max(VON, INT) + bônus` | GB p.36 |
| Deslocamento | `⌊AGI/2⌋ + 5` | GB p.19 |
| Corrida | `Deslocamento × 3` | GB p.19 |
| PM | `Classe base + bônus de itens/pactos (sem dupla contagem)` | GB p.30 |

Habilidades removidas do GB 2023 (presentes no GB 2017, ausentes agora):
- "Força Interior" — não incluir em canonical-packs-data.mjs

Contagem SSOT esperada:
- 556 habilidades principais (`habilidades.base`)
- 164 magias

Histórico de decisão: `RPG/MB/specs/Auditoria de Regras 2026-10-15.md` no Cofre Obsidian.

---

## 6. Scripts de Investigacao e Rascunho (Ad-hoc)
* Scripts de investigação (inspecionar, ver, checar, testar…) vão em scripts/_rascunho/ e nunca são commitados. Só entram no repositório geradores reaproveitáveis, scripts de migração e testes em tests/.
