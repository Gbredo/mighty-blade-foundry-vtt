# 🎲 Tabela 2d6 de Características do Bredo — Easter Egg da Landing Page
### Gamificação Interativa de Perfil & Curva de Probabilidade Canônica do Mighty Blade

> *"Tudo em Mighty Blade se resolve nos dados de seis faces. Por que a biografia do criador seria diferente?"*

---

## 1. 🎯 Conceito & Filosofia

Na Landing Page oficial ([mesasdobreder.vercel.app](https://mesasdobreder.vercel.app)), o cartão de apresentação de **Guilherme Breder (@Gbredo)** conta com um ticker rotativo animado (*Typewriter HUD*). 

Para elevar a experiência a um patamar de **Gamificação Autêntica (Gamification on Steroids)**, a apresentação das características do criador adota a mecânica central do RPG nacional: **Rolagens de $2\text{d6}$**.

### A Curva de Gauss do 2d6 (2 a 12)
Em vez de uma lista estática e engessada, o componente simula a física de **dois dados de 6 faces** jogados na mesa. A soma ($2$ a $12$) segue a clássica distribuição de probabilidade binomial:

* **Soma 2 (1+1):** Chance de **2,78%** (1 em 36) — *Falha Crítica Absoluta / Azar Lendário*.
* **Soma 7 (Média Central):** Chance de **16,67%** (6 em 36) — *O resultado estatisticamente mais comum*.
* **Soma 12 (6+6):** Chance de **2,78%** (1 em 36) — *Acerto Crítico Lendário / O Maior Sucesso da Vida*.

```
   Distribuição de Probabilidade (2d6):
   Soma | Combinações | Probabilidade | Título Canônico
   -----+--------------+---------------+------------------------------------
     2  | (1+1)        | 2.78% (1/36)  | 💸 Nunca Ganhou na Loteria
     3  | (1+2, 2+1)   | 5.56% (2/36)  | 🎧 Codando ao Som de OST de RPG
     4  | (1+3, 2+2..) | 8.33% (3/36)  | 🤖 Doutor em Regras, Aluno em Kotlin
     5  | (1+4, 2+3..) | 11.11% (4/36) | ☕ Movido a Café com Açúcar
     6  | (1+5, 2+4..) | 13.89% (5/36) | 🎓 Filho da PUC (ADS & Direito)
     7  | (1+6, 2+5..) | 16.67% (6/36) | 💻 Desenvolvedor Fullstack (Vértice)
     8  | (2+6, 3+5..) | 13.89% (5/36) | 🐉 Mestre de RPG desde 2012
     9  | (3+6, 4+5..) | 11.11% (4/36) | ⚡ Dormiu 4h e tá Pronto pra Codar
    10  | (4+6, 5+5..) | 8.33% (3/36)  | 🎲 Acumulador Compulsivo de Dados
    11  | (5+6, 6+5)   | 5.56% (2/36)  | 🛡️ Criador do Mesas do Breder
    12  | (6+6)        | 2.78% (1/36)  | 🐶🐶 Pai de Pet Dedicado (Jackpot!)
```

---

## 2. 📜 A Tabela Canônica Oficial (2 a 12)

| Soma | Faces | Categoria | Frase do Typewriter | Descrição Narrativa |
| :---: | :---: | :---: | :--- | :--- |
| **2** | ⚀ + ⚀ | *Falha Crítica* | `Nunca Ganhou na Loteria 💸` | O azar lendário nos sorteios, balanceado pela sorte no código. |
| **3** | ⚀ + ⚁ | *Hábito* | `Codando ao Som de OST de RPG 🎧` | O monorepo avança no ritmo de trilhas sonoras orquestradas. |
| **4** | ⚀ + ⚂ | *Academia* | `Doutor em Regras, Aluno em Kotlin 🤖` | Conhece o manual de cor, mas no Android Studio ainda é padawan. |
| **5** | ⚁ + ⚂ | *Combustível* | `Movido a Café com Açúcar ☕` | Meia xícara doce nas madrugadas para sustentar a maratona. |
| **6** | ⚂ + ⚂ | *Origem* | `Filho da PUC (ADS & Direito) 🎓` | A união da lógica jurídica normativa com a ciência de dados. |
| **7** | ⚂ + ⚃ | *Ofício Central* | `Desenvolvedor Fullstack 💻` | O epicentro profissional: React, TypeScript, Node e VTT nativo. |
| **8** | ⚃ + ⚃ | *Veterania* | `Mestre de RPG desde 2012 🐉` | Mais de uma década narrando fantasia medieval no papel sulfite. |
| **9** | ⚃ + ⚄ | *Energia* | `Dormiu 4h e tá Pronto pra Codar ⚡` | Acorda disposto e acelerado para despachar novos commits. |
| **10** | ⚄ + ⚄ | *TOC de Mestre* | `Acumulador Compulsivo de Dados 🎲` | Dezenas de kits físicos de d6 espalhados pela escrivaninha. |
| **11** | ⚄ + ⚅ | *Legado* | `Criador do Mesas do Breder 🛡️` | A forja viva do ecossistema digital do Mighty Blade 3e. |
| **12** | ⚅ + ⚅ | *Sucesso Crítico* | `Pai de Pet Dedicado 🐶🐶` | O maior acerto decisivo da vida: carinho e lealdade canina. |

---

## 3. ⚙️ Arquitetura do Componente Front-End

### 3.1. Estrutura dos Estados (`React`)
1. **`dado1` e `dado2`:** Inteiros de 1 a 6.
2. **`isRolling`:** Booleano que aciona a classe de rotação 3D e o embaralhador de números (*tumbler effect* de 500ms).
3. **`soma`:** $D_1 + D_2$ que indexa a tabela de frases.
4. **`currentText`:** O texto digitado caractere por caractere via `useTypewriter` unicode-safe.

### 3.2. Ciclo de Interação
* **Automático:** A cada ciclo completo de escrita, pausa e deleção, o sistema rola automaticamente um novo resultado randômico.
* **Sob Demanda (Interativo):** O widget inteiro possui `cursor: pointer` e tooltip *"Clique para rolar 2d6!"*. Ao clicar, interrompe a digitação atual, inicia a animação de rolagem dos dois cubos e sorteia uma nova característica instantaneamente.

### 3.3. Estilo Visual (HUD Gamer & Pips 3D)
* Dois pequenos cubos estilizados com bordas de neon âmbar (`#fbbf24`), sombras profundas e pips (pontos) brancos iluminados.
* Efeito `@keyframes diceTumble`: Rotação rápida em eixos X e Y com leve salto para cima (`translateY(-4px)`), seguido de um flash dourado de aterrissagem.

---

## 4. 🔗 Backlinks e Conexões no Vault

* [[Home]] — Central de MOCs do Vault.
* [[TODO]] — Registro das entregas da Landing Page e personalizações de perfil.
* [[manual-do-sistema]] — Rolagens oficiais com dados de 6 faces ($X\text{d6}$).
