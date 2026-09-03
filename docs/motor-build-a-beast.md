# Motor de Regras: Build-a-Beast / Homebrew Generator
### Mighty Blade 3ª Edição & Codex Monstrorum

Este documento define a lógica matemática, a arquitetura de dados e as regras canônicas para o motor gerador de monstros do **Mighty Blade 3e**. 

Com este motor, qualquer ferramenta (seja um gerador procedural no site, um módulo de Foundry VTT ou uma Inteligência Artificial) consegue criar fichas de monstros 100% equilibradas, funcionais e aderentes às regras da Editora Runas.

---

## 1. 🗄️ O Schema JSON para Ficha de Criatura

Para instanciar ou serializar criaturas no VTT e no web app, utiliza-se a seguinte estrutura:

```json
{
  "id": "besouro-guilhotina-adulto",
  "nome": "Besouro Guilhotina Adulto",
  "classificacao": "Besta (Artrópode)",
  "biologia": {
    "habitat": ["Floresta", "Pântano"],
    "dieta": "Carnívora",
    "organizacao": "Solitário (Ameaça 0)",
    "tamanho": "Grande",
    "peso": "1200 kg",
    "mediaVida": "15 anos",
    "temperamento": "Agressivo"
  },
  "atributos": {
    "forca": 9,
    "agilidade": 3,
    "inteligencia": 3,
    "vontade": 6
  },
  "recursos": {
    "pvMax": 120,
    "pmMax": 50,
    "rd": 3
  },
  "defesas": {
    "esquiva": 13,
    "determinacao": 15
  },
  "ataques": [
    {
      "nome": "Mandíbulas",
      "bonus": 9,
      "alcance": "CaC",
      "danoFormula": "27",
      "tipoDano": "Corte",
      "efeito": "Ataque Esmagador"
    },
    {
      "nome": "Encontrão",
      "bonus": 9,
      "alcance": "CaC",
      "danoFormula": "18",
      "tipoDano": "Contusão",
      "efeito": null
    }
  ],
  "habilidades": [
    { "nome": "Ataque do Búfalo", "tipo": "Ação", "mana": 10 },
    { "nome": "Ataque Esmagador", "tipo": "Suporte", "mana": 0 },
    { "nome": "Enterrar-se", "tipo": "Ação", "mana": 0 },
    { "nome": "Miriápode", "tipo": "Suporte", "mana": 0 }
  ]
}
```

---

## 📐 2. O Motor de Regras: Cálculos Matemáticos Automáticos

Ao programar ou gerar monstros de forma dinâmica, as seguintes fórmulas devem ser estritamente aplicadas:

### A. Modificadores de Tamanho (A Regra de Ouro)

O tamanho da besta modifica automaticamente a **Defesa Base**, o bônus de **Furtividade** e os cálculos de **Dano Físico**:

*   **Miúdo (Até 50 cm):** 
    *   **Defesa Base:** **8** (ao invés de 5).
    *   **Furtividade:** Rola **+2d6** em testes de se esconder, mover em silêncio ou camuflar.
    *   **Atributo:** **Força é obrigatoriamente 0**.
    *   **Dano:** Seus ataques causam apenas **1 ponto de dano fixo** (sem multiplicadores de crítico, exceto com Alvo Específico).
*   **Pequeno (51 cm a 1 m):**
    *   **Defesa Base:** **6**.
    *   **Furtividade:** Rola **+1d6** em testes de furtividade.
    *   **Dano:** Cálculo normal.
*   **Médio (1,01 m a 2,90 m):**
    *   **Defesa Base:** Padrão de **5**.
    *   **Furtividade:** Sem modificadores de tamanho.
    *   **Dano:** Cálculo normal.
*   **Grande (3 m a 7,99 m):**
    *   **Defesa Base:** **4**.
    *   **Furtividade:** Testes de se esconder, mover em silêncio e disfarçar são feitos como **Inapto (1d6)**.
    *   **Multiplicador de Dano:** **A Força do monstro é considerada o DOBRO** para o cálculo de danos corporais (ex: se tem Força 5, o bônus de dano corporal conta como +10).
*   **Colossal (Acima de 8 m):**
    *   **Defesa Base:** **2**.
    *   **Furtividade:** **Falha Automática** em testes de se esconder, mover em silêncio e se disfarçar.
    *   **Multiplicador de Dano:** **A Força do monstro é considerada o DOBRO** para o cálculo de dano corporal primário.
    *   **Armadura:** É imune a testes de falha ou ruptura de armadura natural.

### B. O Bônus de Ataque das Feras
Diferente dos personagens jogadores, as criaturas têm bônus de acerto direto:
$$\text{Bônus de Ataque} = \max(\text{Força}, \text{Agilidade}) + \text{Bônus de Habilidade Extra}$$

### C. Comportamento dos Atributos Mentais em Criaturas Irracionais
*   **Inteligência (INT):** Representa instinto de sobrevivência e percepção aguçada (usada para iniciativa e evitar emboscadas), sem capacidade de formulação de planos abstratos complexos ou mentiras sociais.
*   **Vontade (VON):** Usada para resistir a intimidações, adestramento forçado e para determinar a **Determinação** ($\text{VON} + \text{Bônus de Temperamento}$).

---

## 🐜 3. Habilidades Biológicas Inatas & Automação

1.  **Mente Vazia [Suporte]:** Torna a besta totalmente imune a efeitos de Medo e magias de influência mental.
2.  **Placas Quitinosas (Exclusivo de Artrópodes) [Suporte]:**
    *   *Miúdo:* +1 Defesa / RD 1
    *   *Pequeno:* +2 Defesa / RD 1
    *   *Médio:* +4 Defesa / RD 2
    *   *Grande:* +6 Defesa / RD 3
    *   *Colossal:* +8 Defesa / RD 4
3.  **Escamas Grossas [Suporte]:** Concede automaticamente **Defesa +2** e **RD 2** (ambos contam como armadura natural).
4.  **Serpentiforme [Suporte]:** Concede **+2** em testes físicos (correr, nadar, escalar e agarrar). A cauda pode ser usada para desferir ataques de constrição e contusão.
5.  **Sentidos Apurados [Suporte]:** Concede **+2** em testes de perceber, procurar, observar, ouvir e em testes de **Iniciativa**.

---

## 🤖 4. Prompt Oficial de IA para Suporte ao Mestre / VTT

Para gerar monstros equilibrados instantaneamente através de LLMs no VTT ou ferramentas de mestre:

```text
Você é um gerador de monstros homebrew para o sistema Mighty Blade (3ª Edição / 3.5), especializado nas regras do Codex Monstrorum. Use a estrutura do arquivo compendio-bestas-codex.md como base mecânica de equilíbrio de criaturas.

Ao criar um monstro, você deve obrigatoriamente:
1. Definir seu Nome, Habitat, Dieta, Temperamento e Classificação.
2. Escolher um Tamanho (Miúdo, Pequeno, Médio, Grande, Colossal) e aplicar a Defesa Base e modificadores de Dano/Furtividade corretos baseados na categoria de tamanho.
3. Distribuir os Atributos (Força, Agilidade, Inteligência, Vontade), lembrando que criaturas Miúdas possuem Força 0 e criaturas Irracionais possuem Inteligência apenas para iniciativa/percepção.
4. Definir PVs e PMs coerentes com o nível de ameaça pretendido.
5. Montar a lista de Ataques, definindo o bônus de acerto (maior entre Força ou Agilidade), alcance (CaC ou Haste) e dano por tipo (Contusão, Corte ou Perfuração).
6. Adicionar habilidades biológicas coerentes (ex: Mente Vazia, Serpentiforme, Placas Quitinosas) e aplicar os modificadores matemáticos dessas habilidades diretamente na Defesa, RD e Ataques da ficha.

Gere o monstro formatado exatamente no padrão do JSON de VTT fornecido nas especificações do motor Build-a-Beast.
```
