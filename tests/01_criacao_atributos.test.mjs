import test from "node:test";
import assert from "node:assert/strict";

import {
  createMockActor,
  createCharacter,
  levelUp,
  beneficiosDoNivel,
  niveisDeAtributo,
  validarAumentoAtributos,
  NIVEIS_COM_AUMENTO_ATRIBUTO,
  ATRIBUTOS_CANONICOS,
  CANONICAL_RACAS,
  CANONICAL_CLASSES,
  RACES,
  CLASSES,
  validarHabilidadeExclusivaCriacao,
  HABILIDADES_EXCLUSIVAS_CRIACAO,
} from "./test-helper.mjs";

test("Bloco 1: Criação de Personagem — Atributos e Distribuição Básica", async (t) => {
  // ===========================================================================
  // Sub-módulo 1.1: Validação das 21 Raças (Atributos Iniciais & Habilidades Inatas)
  // ===========================================================================
  await t.test("Sub-módulo 1.1: Validação das 21 Raças (Atributos Iniciais & Habilidades Inatas)", async (st) => {
    // 1.1.1 Atribuição Base por Raça para as 21 raças canônicas
    await st.test("1.1.1 Atribuição Base por Raça: Cada uma das 21 raças atribui os atributos exatos do manual", () => {
      assert.equal(CANONICAL_RACAS.length, 21, "Devem existir exatamente 21 raças canônicas");

      for (const raca of CANONICAL_RACAS) {
        const char = createCharacter({ raceId: raca.name, humanBonusAttribute: "forca" });
        const attrsEsperados = raca.system.atributos;

        // Se for Humano, o createCharacter adiciona +1 pelo humanBonusAttribute; para testar a base pura testamos sem adaptabilidade ou subtraímos
        if (raca.name === "Humano") {
          assert.equal(char.system.attributes.agilidade.value, 3, "Humano base AGI");
          assert.equal(char.system.attributes.inteligencia.value, 3, "Humano base INT");
          assert.equal(char.system.attributes.vontade.value, 3, "Humano base VON");
          assert.equal(char.system.attributes.forca.value, 4, "Humano com +1 FOR Adaptabilidade");
        } else {
          for (const attr of ATRIBUTOS_CANONICOS) {
            assert.equal(
              char.attributes[attr],
              attrsEsperados[attr],
              `Raça ${raca.name}: atributo ${attr} esperado ${attrsEsperados[attr]}, obtido ${char.attributes[attr]}`
            );
          }
        }
      }

      // Validação estrita dos valores canônicos chave
      const racaAnao = CANONICAL_RACAS.find((r) => r.name === "Anão");
      const racaElfo = CANONICAL_RACAS.find((r) => r.name === "Elfo");
      const racaOrc = CANONICAL_RACAS.find((r) => r.name === "Orc");
      const racaMahok = CANONICAL_RACAS.find((r) => r.name === "Mahok");
      const racaLevent = CANONICAL_RACAS.find((r) => r.name === "Levent");

      assert.deepEqual(racaAnao.system.atributos, { forca: 4, agilidade: 2, inteligencia: 3, vontade: 3 });
      assert.deepEqual(racaElfo.system.atributos, { forca: 2, agilidade: 4, inteligencia: 3, vontade: 3 });
      assert.deepEqual(racaOrc.system.atributos, { forca: 4, agilidade: 3, inteligencia: 2, vontade: 3 });
      assert.deepEqual(racaMahok.system.atributos, { forca: 5, agilidade: 2, inteligencia: 2, vontade: 3 });
      assert.deepEqual(racaLevent.system.atributos, { forca: 2, agilidade: 3, inteligencia: 3, vontade: 3 });
    });

    // 1.1.2 Habilidade Automática Concedida para cada uma das 21 raças
    await st.test("1.1.2 Habilidade Automática Concedida: Insere a habilidade automática correta no vetor de habilidades", () => {
      const habilidadesRaciaisEsperadas = {
        "Anão": "Coração da Montanha 1",
        "Elfo": "Bênção de Lathellanis",
        "Fauno": "Patas com Cascos",
        "Humano": "Adaptabilidade",
        "Juban": "Corpo Pesado",
        "Tailox": "Pernas Vulpinas",
        "Aesir": "Vigor Nórdico",
        "Astério": "Chifres Poderosos",
        "Astéria": "Faro",
        "Centauro": "Corpo Equino",
        "Dragano": "Linhagem Dracônica",
        "Faen": "Constituição Feérica",
        "Fira": "Habitante do Deserto",
        "Gnoll": "Salteador",
        "Hamelin": "Habitante do Esgoto",
        "Levent": "Asas Ancestrais",
        "Mahok": "Pele de Pedra",
        "Metadílio": "Tamanho Pequeno",
        "Naga (Macho)": "Corpo Ofídio",
        "Naga (Fêmea)": "Corpo Ofídio",
        "Orc": "Sangue Orc",
      };

      for (const [racaNome, habEsperada] of Object.entries(habilidadesRaciaisEsperadas)) {
        const char = createCharacter({ raceId: racaNome, humanBonusAttribute: "agilidade" });
        const habsNomes = char.abilities.map((a) => a.name);
        assert.ok(
          habsNomes.includes(habEsperada),
          `Raça ${racaNome} deve conceder a habilidade '${habEsperada}'. Habilidades presentes: ${habsNomes.join(", ")}`
        );
      }
    });

    // 1.1.3 Trava de Habilidades Exclusivas de Criação (somenteCriacao: true)
    await st.test("1.1.3 Trava de Habilidades Exclusivas de Criação: Elegíveis no Nível 1 e bloqueadas nos Níveis 2+", () => {
      const habilidadesCriacao = [
        "Isnuu",
        "Fulgurante",
        "Braços Extras",
        "Olhos de Águia",
        "Nanismo",
        "Escamas Pesadas",
        "Duro como Pedra",
      ];

      for (const hab of habilidadesCriacao) {
        // No Nível 1, a habilidade de criação é válida
        const validacaoNivel1 = validarHabilidadeExclusivaCriacao(1, hab);
        assert.equal(
          validacaoNivel1.valido,
          true,
          `Habilidade '${hab}' deve ser elegível no Nível 1`
        );

        // Nos Níveis 2 a 10, a aquisição é estritamente bloqueada
        for (const nivel of [2, 3, 4, 5, 7, 10]) {
          const validacaoNivelSuperior = validarHabilidadeExclusivaCriacao(nivel, hab);
          assert.equal(
            validacaoNivelSuperior.valido,
            false,
            `Habilidade de criação '${hab}' DEVE ser bloqueada no Nível ${nivel}`
          );
          assert.match(
            validacaoNivelSuperior.erro,
            /criação|nivel 1/i,
            `Mensagem de erro de '${hab}' deve indicar restrição de criação`
          );
        }
      }

      // Habilidades comuns não possuem a trava de criação
      const habComum = validarHabilidadeExclusivaCriacao(2, "Ataque Poderoso");
      assert.equal(habComum.valido, true, "Habilidades comuns não sofrem trava de criação");
    });
  });

  // ===========================================================================
  // Sub-módulo 1.2: Validação das 14 Classes (+1 em Dois Atributos Distintos)
  // ===========================================================================
  await t.test("Sub-módulo 1.2: Validação das 14 Classes (+1 em Dois Atributos Distintos)", async (st) => {
    // 1.2.1 Bônus da Classe: +1 em dois atributos diferentes para todas as 14 classes
    await st.test("1.2.1 Bônus da Classe: Cada uma das 14 classes injeta exatamente +1 em dois atributos diferentes", () => {
      assert.equal(CANONICAL_CLASSES.length, 14, "Devem existir exatamente 14 classes canônicas");

      for (const classe of CANONICAL_CLASSES) {
        const bonus = classe.system?.atributos;
        assert.ok(bonus, `Classe ${classe.name} deve possuir system.atributos`);

        const valores = ATRIBUTOS_CANONICOS.map((a) => Number(bonus[a]) || 0);
        const soma = valores.reduce((acc, v) => acc + v, 0);
        assert.equal(soma, 2, `Classe ${classe.name} deve fornecer exatamente 2 pontos de bônus no total`);

        const atributosComBonus = valores.filter((v) => v === 1);
        assert.equal(
          atributosComBonus.length,
          2,
          `Classe ${classe.name} deve conceder +1 em exatamente 2 atributos distintos`
        );
      }

      // Validação canônica específica de classes fundamentais
      const guerreiro = CANONICAL_CLASSES.find((c) => c.name === "Guerreiro");
      const feiticeiro = CANONICAL_CLASSES.find((c) => c.name === "Feiticeiro");
      const ladino = CANONICAL_CLASSES.find((c) => c.name === "Ladino");
      const sacerdote = CANONICAL_CLASSES.find((c) => c.name === "Sacerdote");

      assert.deepEqual(guerreiro.system.atributos, { forca: 1, agilidade: 1, inteligencia: 0, vontade: 0 });
      assert.deepEqual(feiticeiro.system.atributos, { forca: 0, agilidade: 0, inteligencia: 1, vontade: 1 });
      assert.deepEqual(ladino.system.atributos, { forca: 0, agilidade: 1, inteligencia: 1, vontade: 0 });
      assert.deepEqual(sacerdote.system.atributos, { forca: 0, agilidade: 0, inteligencia: 1, vontade: 1 });
    });

    // 1.2.2 Invariante de Bônus Único: NENHUMA classe tenta conceder +2 no mesmo atributo
    await st.test("1.2.2 Invariante de Bônus Único: Nenhuma classe concede +2 no mesmo atributo", () => {
      for (const classe of CANONICAL_CLASSES) {
        for (const attr of ATRIBUTOS_CANONICOS) {
          const val = Number(classe.system?.atributos?.[attr]) || 0;
          assert.notEqual(
            val,
            2,
            `Invariante violado: classe ${classe.name} concede +2 em ${attr}`
          );
          assert.ok(
            val === 0 || val === 1,
            `Bônus do atributo ${attr} na classe ${classe.name} deve ser 0 ou 1 (obtido: ${val})`
          );
        }
      }
    });

    // 1.2.3 Injeção da Habilidade Automática da Classe
    await st.test("1.2.3 Injeção da Habilidade Automática da Classe: Confirmar adição da habilidade nos itens do ator", () => {
      const habilidadesClassesEsperadas = {
        "Guerreiro": "Mestre de Armas 1",
        "Feiticeiro": "Conhecimento Arcano",
        "Ladino": "Gatuno",
        "Sacerdote": "Conhecimento Místico",
        "Paladino": "Mestre de Armas 1",
        "Patrulheiro": "Arqueria",
        "Bardo": "Poesia dos Bardos",
        "Druida": "Conhecimento Místico",
        "Espadachim": "Mestre de Armas 1",
        "Rúnico": "Conhecimento Arcano",
        "Dracomante": "Conhecimento Místico",
        "Necromante": "Conhecimento Arcano",
        "Senescal": "Posição Distinta",
        "Xamã": "Guia Espiritual",
      };

      for (const [classeNome, habEsperada] of Object.entries(habilidadesClassesEsperadas)) {
        const char = createCharacter({ raceId: "orc", classId: classeNome });
        const habsNomes = char.abilities.map((a) => a.name);
        assert.ok(
          habsNomes.includes(habEsperada),
          `Classe ${classeNome} deve injetar '${habEsperada}'. Habilidades presentes: ${habsNomes.join(", ")}`
        );
      }
    });
  });

  // ===========================================================================
  // Sub-módulo 1.3: Regra Especial — Adaptabilidade Humana
  // ===========================================================================
  await t.test("Sub-módulo 1.3: Regra Especial — Adaptabilidade Humana", async (st) => {
    // 1.3.1 Concessão da Escolha (escolhaAtributo)
    await st.test("1.3.1 Concessão da Escolha: Humano possui a concessão escolhaAtributo com ref adaptabilidade", () => {
      const racaHumano = CANONICAL_RACAS.find((r) => r.name === "Humano");
      assert.ok(racaHumano, "Raça Humano deve existir");

      const concessoes = racaHumano.system?.concessoes || [];
      const concAdapt = concessoes.find((c) => c.tipo === "escolhaAtributo" && c.ref === "adaptabilidade");
      assert.ok(concAdapt, "Humano deve possuir concessão 'escolhaAtributo' para adaptabilidade");
      assert.equal(concAdapt.valor, 1, "Concessão deve fornecer exatamente +1");
    });

    // 1.3.2 Validação de Alocação Válida em cada atributo
    await st.test("1.3.2 Validação de Alocação Válida: Selecionar atributo resulta em 4 no escolhido e 3 nos demais", () => {
      for (const attr of ATRIBUTOS_CANONICOS) {
        const char = createCharacter({
          raceId: "humano",
          humanBonusAttribute: attr,
        });

        for (const testAttr of ATRIBUTOS_CANONICOS) {
          const esperado = testAttr === attr ? 4 : 3;
          assert.equal(
            char.attributes[testAttr],
            esperado,
            `Adaptabilidade em ${attr}: ${testAttr} esperado ${esperado}, obtido ${char.attributes[testAttr]}`
          );
        }
      }
    });

    // 1.3.3 Impedimento de Finalização Sem Escolha
    await st.test("1.3.3 Impedimento de Finalização Sem Escolha: Rejeita criação de Humano sem definir Adaptabilidade", () => {
      assert.throws(
        () => {
          createCharacter({
            raceId: "humano",
            classId: "mago",
          });
        },
        /Selecione o atributo extra da Adaptabilidade Humana/i,
        "Deve disparar erro de validação ao criar Humano sem atributo extra"
      );
    });
  });

  // ===========================================================================
  // Sub-módulo 1.4: Fórmula Geral de Soma de Atributos
  // ===========================================================================
  await t.test("Sub-módulo 1.4: Fórmula Geral de Soma de Atributos", async (st) => {
    // 1.4.1 Humano Guerreiro Nível 1 (Adaptabilidade em AGI)
    await st.test("1.4.1 Humano Guerreiro Nível 1 (Adaptabilidade em AGI): FOR 4, AGI 5, INT 3, VON 3", () => {
      const char = createCharacter({
        raceId: "humano",
        classId: "guerreiro",
        humanBonusAttribute: "agilidade",
        level: 1,
      });

      // Base: [3, 3, 3, 3] + Adapt AGI (+1 AGI) + Guerreiro (+1 FOR, +1 AGI)
      assert.equal(char.attributes.forca, 4, "FOR esperada 4 (3 base + 1 classe)");
      assert.equal(char.attributes.agilidade, 5, "AGI esperada 5 (3 base + 1 adapt + 1 classe)");
      assert.equal(char.attributes.inteligencia, 3, "INT esperada 3");
      assert.equal(char.attributes.vontade, 3, "VON esperada 3");
    });

    // 1.4.2 Orc Guerreiro Nível 1: FOR 5, AGI 4, INT 2, VON 3
    await st.test("1.4.2 Orc Guerreiro Nível 1: FOR 5, AGI 4, INT 2, VON 3 e habilidades corretas", () => {
      const char = createCharacter({
        raceId: "orc",
        classId: "guerreiro",
        level: 1,
      });

      // Base Orc: [4, 3, 2, 3] + Guerreiro (+1 FOR, +1 AGI)
      assert.equal(char.attributes.forca, 5, "FOR esperada 5 (4 base + 1 classe)");
      assert.equal(char.attributes.agilidade, 4, "AGI esperada 4 (3 base + 1 classe)");
      assert.equal(char.attributes.inteligencia, 2, "INT esperada 2");
      assert.equal(char.attributes.vontade, 3, "VON esperada 3");

      const habsNomes = char.abilities.map((a) => a.name);
      assert.ok(habsNomes.includes("Sangue Orc"), "Deve possuir Sangue Orc");
      assert.ok(habsNomes.includes("Mestre de Armas 1"), "Deve possuir Mestre de Armas 1");
    });

    // 1.4.3 Modificadores de Habilidades e Recálculo Dinâmico
    await st.test("1.4.3 Modificadores de Habilidades somados na equação final e reatividade na remoção", () => {
      const char = createCharacter({
        raceId: "humano",
        classId: "sacerdote",
        humanBonusAttribute: "vontade",
        level: 1,
      });

      // Humano Sacerdote + Adapt VON => FOR 3, AGI 3, INT 4, VON 5
      assert.equal(char.attributes.forca, 3);
      assert.equal(char.attributes.agilidade, 3);
      assert.equal(char.attributes.inteligencia, 4);
      assert.equal(char.attributes.vontade, 5);

      // Adiciona Dogma (+1 Força)
      char.addItem({
        name: "Dogma (Discípulo da Guerra)",
        type: "habilidade",
        system: {
          efeitos: [{ tipo: "bonusAtributo", atributo: "forca", valor: 1 }],
        },
      });

      assert.equal(char.attributes.forca, 4, "Força deve ser 4 após Dogma");

      // Adiciona Estudo Arcano (+1 Inteligência)
      char.addItem({
        name: "Estudo Arcano Superior",
        type: "habilidade",
        system: {
          efeitos: [{ tipo: "bonusAtributo", atributo: "inteligencia", valor: 1 }],
        },
      });

      assert.equal(char.attributes.inteligencia, 5, "Inteligência deve ser 5 após Estudo Arcano");

      // Remoção do item restaura o valor
      char.removeItem("Dogma (Discípulo da Guerra)");
      assert.equal(char.attributes.forca, 3, "Força deve retornar para 3 após remoção");
    });
  });

  // ===========================================================================
  // Sub-módulo 1.5: Incremento de Atributos nos Níveis 4, 7 e 10
  // ===========================================================================
  await t.test("Sub-módulo 1.5: Incremento de Atributos nos Níveis 4, 7 e 10", async (st) => {
    // 1.5.1 Subida Válida para Nível 4: [+1 FOR, +1 VON]
    await st.test("1.5.1 Subida Válida para Nível 4: Permite +1 em dois atributos diferentes", () => {
      let char = createCharacter({ raceId: "anao", classId: "guerreiro", level: 3 });

      // Anão Guerreiro Nv 3: Base Atributos Anão (4,2,3,3) + Guerreiro (1,1,0,0) = FOR 5, AGI 3, INT 3, VON 3
      assert.equal(char.attributes.forca, 5);
      assert.equal(char.attributes.vontade, 3);

      char = levelUp(char, {
        targetLevel: 4,
        evolutionPoint: "10_pv",
        attributeIncreases: ["forca", "vontade"],
      });

      assert.equal(char.level, 4);
      assert.equal(char.attributes.forca, char.baseAttributes.forca + 1);
      assert.equal(char.attributes.vontade, char.baseAttributes.vontade + 1);
      assert.equal(char.attributes.forca, 6);
      assert.equal(char.attributes.vontade, 4);
    });

    // 1.5.2 Rejeição de Alocação Inválida (+2 no mesmo atributo)
    await st.test("1.5.2 Rejeição de Alocação Inválida: Rejeita colocar +2 no mesmo atributo no Nível 4, 7 ou 10", () => {
      const char = createCharacter({ raceId: "anao", classId: "guerreiro", level: 3 });

      assert.throws(
        () => {
          levelUp(char, {
            targetLevel: 4,
            attributeIncreases: ["forca", "forca"],
          });
        },
        /diferentes/i,
        "Deve rejeitar alocação com dois atributos iguais no Nível 4"
      );

      // Rejeita também nos Níveis 7 e 10
      assert.throws(
        () => {
          levelUp(char, {
            targetLevel: 7,
            attributeIncreases: ["agilidade", "agilidade"],
          });
        },
        /diferentes/i
      );

      assert.throws(
        () => {
          levelUp(char, {
            targetLevel: 10,
            attributeIncreases: ["vontade", "vontade"],
          });
        },
        /diferentes/i
      );
    });

    // 1.5.3 Rejeição de Níveis Não-Marco (Níveis 2, 3, 5, 6, 8, 9)
    await st.test("1.5.3 Rejeição de Níveis Não-Marco: Bloqueia distribuição de atributos fora de 4, 7 e 10", () => {
      const char = createCharacter({ raceId: "anao", classId: "guerreiro", level: 1 });
      const niveisNaoMarco = [2, 3, 5, 6, 8, 9];

      for (const lvl of niveisNaoMarco) {
        assert.throws(
          () => {
            levelUp(char, {
              targetLevel: lvl,
              attributeIncreases: ["forca", "agilidade"],
            });
          },
          /não permite alocação de atributos|diferentes/i,
          `Nível ${lvl} não deve permitir alocação de atributos`
        );
      }
    });

    // 1.5.4 Acúmulo Sequencial (Níveis 1 -> 4 -> 7 -> 10)
    await st.test("1.5.4 Acúmulo Sequencial Completo: Nível 1 -> 4 -> 7 -> 10", () => {
      // Cria Humano Guerreiro Nível 1 com Adaptabilidade em AGI
      let char = createCharacter({
        raceId: "humano",
        classId: "guerreiro",
        humanBonusAttribute: "agilidade",
        level: 1,
      });

      // Nível 1: FOR 4, AGI 5, INT 3, VON 3
      assert.equal(char.attributes.forca, 4);
      assert.equal(char.attributes.agilidade, 5);
      assert.equal(char.attributes.inteligencia, 3);
      assert.equal(char.attributes.vontade, 3);

      // Nível 4 (+1 FOR, +1 VON) => FOR 5, AGI 5, INT 3, VON 4
      char = levelUp(char, {
        targetLevel: 4,
        evolutionPoint: "10_pv",
        attributeIncreases: ["forca", "vontade"],
      });
      assert.equal(char.attributes.forca, 5, "Nv 4 FOR");
      assert.equal(char.attributes.agilidade, 5, "Nv 4 AGI");
      assert.equal(char.attributes.inteligencia, 3, "Nv 4 INT");
      assert.equal(char.attributes.vontade, 4, "Nv 4 VON");

      // Nível 7 (+1 AGI, +1 INT) => FOR 5, AGI 6, INT 4, VON 4
      char = levelUp(char, {
        targetLevel: 7,
        evolutionPoint: "10_pv",
        attributeIncreases: ["agilidade", "inteligencia"],
      });
      assert.equal(char.attributes.forca, 5, "Nv 7 FOR");
      assert.equal(char.attributes.agilidade, 6, "Nv 7 AGI");
      assert.equal(char.attributes.inteligencia, 4, "Nv 7 INT");
      assert.equal(char.attributes.vontade, 4, "Nv 7 VON");

      // Nível 10 (+1 FOR, +1 AGI) => FOR 6, AGI 7, INT 4, VON 4
      char = levelUp(char, {
        targetLevel: 10,
        evolutionPoint: "10_pv",
        attributeIncreases: ["forca", "agilidade"],
      });
      assert.equal(char.attributes.forca, 6, "Nv 10 FOR");
      assert.equal(char.attributes.agilidade, 7, "Nv 10 AGI");
      assert.equal(char.attributes.inteligencia, 4, "Nv 10 INT");
      assert.equal(char.attributes.vontade, 4, "Nv 10 VON");
    });
  });
});
