# 🎲 Sistema Mighty Blade 3ª Edição Revisada para Foundry VTT (v14+)

[![Foundry VTT v14](https://img.shields.io/badge/Foundry%20VTT-v14-orange?style=flat&logo=foundry-virtual-tabletop)](https://foundryvtt.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE.txt)
[![Status](https://img.shields.io/badge/Status-Active%20Development-green.svg)](https://github.com/Gbredo/mighty-blade-foundry-vtt)

Implementação modular, cinematográfica e canônica do sistema de RPG brasileiro **Mighty Blade 3ª Edição / 3.5** para **Foundry Virtual Tabletop**, com compatibilidade verificada para **Foundry VTT v14**.

---

## ⚔️ Funcionalidades Principais

* **🧙 Ficha de Personagem Dinâmica & Reativa:**
  * Cálculo automatizado de Atributos (Força, Agilidade, Inteligência, Vontade).
  * Automação de Defesas (Esquiva, Bloqueio, Determinação) e Redução de Dano (RD).
  * Gestão de recursos vitais com barras de Pontos de Vida (PV) e Pontos de Mana (PM).
  * Cálculo canônico de Carga Básica e Carga Máxima baseado em Força.
* **📦 Compêndios Oficiais Integrados (Packs):**
  * **Raças:** Todas as 21 raças canônicas com habilidades raciais automáticas.
  * **Classes:** Classes básicas e avançadas de heróis e vilões.
  * **Habilidades:** Catálogo completo de habilidades de classes, caminhos e organizações.
  * **Magias:** Magias com custos de Mana, tipos de ação e descrições canônicas.
  * **Equipamentos:** Armas, armaduras, escudos, projéteis, canalizadores e poções.
* **🐉 Suporte ao Bestiário Oficial & Motor Build-a-Beast:**
  * Compêndio canônico do *Codex Monstrorum* com regras anatômicas unificadas em [`docs/compendio-bestas-codex.md`](docs/compendio-bestas-codex.md).
  * Motor procedural de criação de monstros (**Build-a-Beast / Homebrew Generator**) em [`docs/motor-build-a-beast.md`](docs/motor-build-a-beast.md).
  * Fórmulas matemáticas de modificadores de tamanho (Miúdo, Pequeno, Médio, Grande, Colossal) e prompt de IA integrado.

---

## 🛠️ Instalação no Foundry VTT

### Método 1: Via Manifesto (Recomendado)
1. No painel inicial do Foundry VTT, acesse a aba **Game Systems** e clique em **Install System**.
2. No campo **Manifest URL** na parte inferior, cole o link:
   ```text
   https://raw.githubusercontent.com/Gbredo/mighty-blade-foundry-vtt/main/system.json
   ```
3. Clique em **Install** e aguarde o download.

### Método 2: Manual
1. Baixe o repositório como arquivo `.zip` ou clone diretamente em:
   ```text
   <FoundryData>/Data/systems/mighty-blade
   ```
2. Reinicie o servidor do Foundry VTT.

---

## 🏗️ Estrutura do Sistema

```text
mighty-blade-foundry-vtt/
├── module/                  # Scripts ES Modules do sistema (.mjs)
│   ├── mighty-blade.mjs     # Entry point do sistema e inicialização de hooks
│   ├── actor/               # Documentos de Atores e sheets
│   └── item/                # Documentos de Itens e sheets
├── packs/                   # Bancos de dados LevelDB / Compêndios
│   ├── racas/
│   ├── classes/
│   ├── habilidades/
│   ├── magias/
│   └── equipamentos/
├── docs/                    # Documentação técnica e guias de regras
│   ├── compendio-bestas-codex.md
│   └── motor-build-a-beast.md
├── lang/                    # Localização (en.json, pt-BR.json)
├── templates/               # Templates HTML de fichas e diálogos Handlebars
└── system.json              # Manifesto oficial do sistema para o Foundry v14
```

---

## 📜 Licença & Créditos

* **Autor:** Guilherme Breder (`@Gbredo`)
* **Sistema Original:** Mighty Blade é uma criação da Editora Runas / Coisinha Verde.
* **Licença de Código:** MIT License.
