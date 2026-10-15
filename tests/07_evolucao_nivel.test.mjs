/**
 * Bloco 7 — Subida de Nível e Pontos de Evolução (Níveis 1 a 10)
 *
 * Plano de Testes Canônico (Mighty Blade 3ª Edição):
 * - Sub-módulo 7.1: Ganho de Habilidade por Nível (7.1.1 Aquisição Contínua e Pré-requisitos)
 * - Sub-módulo 7.2: Distribuição Atômica do Ponto de Evolução (7.2.1 Escolha Obrigatória; 7.2.2 Rejeição de ausência/multiplicidade)
 * - Sub-módulo 7.3: Aprendiz de Classe Único — Nível 2+ (7.3.1 Nível 2+; 7.3.2 Habilidade Automática sem atributos; 7.3.3 Trava de Aprendiz Único)
 * - Sub-módulo 7.4: Teto Canônico de Nível — Nível 10 (7.4.1 Bloqueio estrito no Nível 10)
 */

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  createCharacter,
  levelUp,
  createMockActor,
  normalizarPontoEvolucao,
  obterHabilidadeAutomaticaClasse,
  TETO_NIVEL_PADRAO,
} from "./test-helper.mjs";

describe("Bloco 7 — Subida de Nível e Pontos de Evolução (Níveis 1 a 10)", () => {

  // =========================================================================
  // SUB-MÓDULO 7.1: GANHO DE HABILIDADE POR NÍVEL
  // =========================================================================
  describe("Sub-módulo 7.1 — Ganho de Habilidade por Nível", () => {

    test("7.1.1 — Aquisição Contínua: do Nível 2 ao Nível 10 concede exatamente 1 nova habilidade por nível", () => {
      let hero = createCharacter({
        raceId: "humano",
        classId: "guerreiro",
        level: 1,
        humanBonus: { attribute: "forca", ability: "Vitalidade" },
      });

      const initialAbilitiesCount = hero.abilities.length;
      const abilityProgression = [
        "Ataque Poderoso",      // Nv 2
        "Combate Tático",       // Nv 3
        "Golpe Preciso",        // Nv 4
        "Lutar com Escudo",     // Nv 5
        "Bloqueio Perfeito",    // Nv 6 (Requer Lutar com Escudo + Nível 5)
        "Golpe Demolidor",      // Nv 7 (Requer Ataque Poderoso + Força 4)
        "Esquiva Aprimorada",   // Nv 8
        "Postura Defensiva",    // Nv 9
        "Mestre de Armas",      // Nv 10
      ];

      for (let idx = 0; idx < abilityProgression.length; idx++) {
        const targetLevel = idx + 2;
        const abilityName = abilityProgression[idx];
        const prevCount = hero.abilities.length;

        hero = levelUp(hero, {
          targetLevel,
          evolutionPoint: "10_pv",
          newAbility: abilityName,
        });

        assert.equal(hero.level, targetLevel, `Deve alcançar o Nível ${targetLevel}`);
        assert.equal(
          hero.abilities.length,
          prevCount + 1,
          `No Nível ${targetLevel} deve ganhar exatamente 1 habilidade`
        );
        assert.equal(
          hero.abilities.some((a) => a.name === abilityName),
          true,
          `Habilidade "${abilityName}" deve estar registrada no Nível ${targetLevel}`
        );
      }

      assert.equal(hero.level, 10);
      assert.equal(hero.abilities.length, initialAbilitiesCount + 9);
    });

    test("7.1.2 — Respeito a Raça, Classe, Aprendiz de Classe e Pré-requisitos na escolha de habilidade", async () => {
      const anaoGuerreiro = createCharacter({
        raceId: "anao",
        classId: "guerreiro",
        level: 1,
      });

      // Tentativa de pegar habilidade restrita a outra raça (Elfo) no Nível 2 deve falhar
      assert.throws(() => {
        levelUp(anaoGuerreiro, {
          targetLevel: 2,
          evolutionPoint: "10_pv",
          newAbility: {
            name: "Visão Élfica",
            type: "habilidade",
            system: { raca: "Elfo", requisitos: "Elfo" },
          },
        });
      }, /restrita à raça|Pré-requisitos não atendidos/i);

      // Tentativa de pegar habilidade restrita a outra classe (Feiticeiro) sem ser Aprendiz deve falhar
      assert.throws(() => {
        levelUp(anaoGuerreiro, {
          targetLevel: 2,
          evolutionPoint: "10_pv",
          newAbility: {
            name: "Manipulação de Mana",
            type: "habilidade",
            system: { classe: "Feiticeiro", requisitos: "" },
          },
        });
      }, /restrita à classe "Feiticeiro"/i);

      // Tentativa de pegar habilidade com pré-requisito de Nível 5 no Nível 2 deve falhar
      assert.throws(() => {
        levelUp(anaoGuerreiro, {
          targetLevel: 2,
          evolutionPoint: "10_pv",
          newAbility: "Nervos de Aço", // Requer Nível 5
        });
      }, /Pré-requisitos não atendidos/i);

      // Tentativa de pegar habilidade exclusiva de criação de personagem (Nível 1) no Nível 2 deve falhar
      assert.throws(() => {
        levelUp(anaoGuerreiro, {
          targetLevel: 2,
          evolutionPoint: "10_pv",
          newAbility: "Duro como Pedra", // Somente Nível 1
        });
      }, /criação d[eo] personagem/i);

      // Tentativa de passar múltiplas habilidades no mesmo nível deve falhar
      assert.throws(() => {
        levelUp(anaoGuerreiro, {
          targetLevel: 2,
          evolutionPoint: "10_pv",
          newAbility: ["Ataque Poderoso", "Combate Tático"],
        });
      }, /exatamente 1 nova habilidade por nível/i);
    });

    test("7.1.3 — Impede duplicação de habilidade já possuída pelo personagem", () => {
      const char = createCharacter({
        raceId: "anao",
        classId: "guerreiro",
        level: 1,
      });

      const nv2 = levelUp(char, {
        targetLevel: 2,
        evolutionPoint: "10_pv",
        newAbility: "Ataque Poderoso",
      });

      assert.throws(() => {
        levelUp(nv2, {
          targetLevel: 3,
          evolutionPoint: "10_pv",
          newAbility: "Ataque Poderoso",
        });
      }, /já possui a habilidade "Ataque Poderoso"/i);
    });
  });

  // =========================================================================
  // SUB-MÓDULO 7.2: DISTRIBUIÇÃO ATÔMICA DO PONTO DE EVOLUÇÃO
  // =========================================================================
  describe("Sub-módulo 7.2 — Distribuição Atômica do Ponto de Evolução", () => {

    test("7.2 — Ponto de Evolução exige exatamente 1 escolha válida (+10 PV)", () => {
      const char = createCharacter({
        raceId: "humano",
        classId: "guerreiro",
        level: 1,
        humanBonus: { attribute: "forca", ability: "Ataque Poderoso" },
      });

      // Evoluir com +10 PV
      const nv2 = levelUp(char, {
        targetLevel: 2,
        evolutionPoint: "10_pv",
        newAbility: "Combate Tático",
      });

      assert.equal(nv2.level, 2);
      assert.equal(nv2.stats.pv, char.stats.pv + 10);
      assert.equal(nv2.stats.pm, char.stats.pm);
    });

    test("7.2.1 — Todas as 4 opções canônicas de Ponto de Evolução aplicam seus valores exatos", () => {
      // 1. Opção +10 PV ('10_pv')
      const cPv = createCharacter({ raceId: "anao", classId: "guerreiro", level: 1 });
      const nv2Pv = levelUp(cPv, {
        targetLevel: 2,
        evolutionPoint: "10_pv",
        newAbility: "Ataque Poderoso",
      });
      assert.equal(nv2Pv.stats.pv, cPv.stats.pv + 10);
      assert.equal(nv2Pv.stats.pm, cPv.stats.pm);

      // 2. Opção +10 PM ('10_pm')
      const cPm = createCharacter({ raceId: "elfo", classId: "feiticeiro", level: 1 });
      const nv2Pm = levelUp(cPm, {
        targetLevel: 2,
        evolutionPoint: "10_pm",
        newAbility: "Magia Silenciosa",
      });
      assert.equal(nv2Pm.stats.pm, cPm.stats.pm + 10);
      assert.equal(nv2Pm.stats.pv, cPm.stats.pv);

      // 3. Opção +5 PV e +5 PM ('5_pv_5_pm')
      const cMisto = createCharacter({ raceId: "fauno", classId: "bardo", level: 1 });
      const nv2Misto = levelUp(cMisto, {
        targetLevel: 2,
        evolutionPoint: "5_pv_5_pm",
        newAbility: "Acrobacia",
      });
      assert.equal(nv2Misto.stats.pv, cMisto.stats.pv + 5);
      assert.equal(nv2Misto.stats.pm, cMisto.stats.pm + 5);

      // 4. Opção Aprendiz de Classe ('aprendiz_ladino') — não altera PV/PM, concede Habilidade Automática
      const cAprendiz = createCharacter({ raceId: "anao", classId: "guerreiro", level: 1 });
      const nv2Aprendiz = levelUp(cAprendiz, {
        targetLevel: 2,
        evolutionPoint: "aprendiz_ladino",
        newAbility: "Esquiva Aprimorada",
      });
      assert.equal(nv2Aprendiz.stats.pv, cAprendiz.stats.pv);
      assert.equal(nv2Aprendiz.stats.pm, cAprendiz.stats.pm);
      assert.equal(nv2Aprendiz.abilities.some((a) => a.name === "Gatuno"), true);
    });

    test("7.2.2 — Validação de Rejeição: evoluir sem escolher benefício ou escolhendo múltiplos benefícios lança exceção", () => {
      const char = createCharacter({
        raceId: "anao",
        classId: "guerreiro",
        level: 1,
      });

      // Sem evolução informada (undefined / null / vazio)
      assert.throws(() => {
        levelUp(char, {
          targetLevel: 2,
          newAbility: "Ataque Poderoso",
        });
      }, /Distribuição do Ponto de Evolução: Exige a escolha de exatamente 1 dos benefícios/i);

      assert.throws(() => {
        levelUp(char, {
          targetLevel: 2,
          evolutionPoint: "",
          newAbility: "Ataque Poderoso",
        });
      }, /Distribuição do Ponto de Evolução/i);

      assert.throws(() => {
        levelUp(char, {
          targetLevel: 2,
          evolutionPoint: "nenhum",
          newAbility: "Ataque Poderoso",
        });
      }, /Distribuição do Ponto de Evolução/i);

      // Múltiplos benefícios via Array
      assert.throws(() => {
        levelUp(char, {
          targetLevel: 2,
          evolutionPoint: ["10_pv", "10_pm"],
          newAbility: "Ataque Poderoso",
        });
      }, /Não é permitido escolher múltiplos benefícios no mesmo nível/i);

      // Múltiplos benefícios combinados em string ou objeto
      assert.throws(() => {
        levelUp(char, {
          targetLevel: 2,
          evolutionPoint: "10_pv+10_pm",
          newAbility: "Ataque Poderoso",
        });
      }, /Não é permitido escolher múltiplos benefícios no mesmo nível/i);

      assert.throws(() => {
        levelUp(char, {
          targetLevel: 2,
          evolutionPoint: { pv: 10, pm: 10 },
          newAbility: "Ataque Poderoso",
        });
      }, /Não é permitido escolher múltiplos benefícios no mesmo nível/i);

      // Garante que o personagem permanece intacto no Nível 1 após falhas atômicas
      assert.equal(char.level, 1);
    });
  });

  // =========================================================================
  // SUB-MÓDULO 7.3: APRENDIZ DE CLASSE ÚNICO (NÍVEL 2+)
  // =========================================================================
  describe("Sub-módulo 7.3 — Aprendiz de Classe Único (Nível 2+)", () => {

    test("7.3.1 — Liberação a partir do Nível 2: bloqueado no Nível 1 e liberado no Nível 2", async () => {
      // Bloqueado na criação de Nível 1
      assert.throws(() => {
        createCharacter({
          raceId: "humano",
          classId: "guerreiro",
          level: 1,
          aprendiz: "Ladino",
          humanBonus: { attribute: "forca", ability: "Vitalidade" },
        });
      }, /Aprendiz de Classe bloqueado no Nível 1/i);

      // Bloqueado via applyLevelUp em Nível 1
      const actorNv1 = createMockActor({
        name: "Iniciante",
        details: { nivel: 1, raca: "Humano", classe: "Guerreiro" },
      });
      await assert.rejects(
        async () =>
          await actorNv1.applyLevelUp({
            nextLevel: 1,
            evolutionPoint: "aprendiz_ladino",
          }),
        /Aprendiz de Classe só pode ser adquirido a partir do Nível 2/i
      );
    });

    test("7.3 — Aprendiz de Classe concede apenas a Habilidade Automática e bloqueia duplicidade", () => {
      const guerreiro = createCharacter({
        raceId: "anao",
        classId: "guerreiro",
        level: 1,
      });

      const attrsAntes = { ...guerreiro.attributes };

      // Torna-se Aprendiz de Ladino no Nível 2
      const nv2 = levelUp(guerreiro, {
        targetLevel: 2,
        evolutionPoint: "aprendiz_ladino",
        newAbility: "Esquiva Aprimorada",
      });

      // Deve ter a habilidade automática de Ladino (Gatuno) + a habilidade escolhida do nível (Esquiva Aprimorada)
      assert.equal(nv2.abilities.some((a) => a.name === "Gatuno"), true);
      assert.equal(nv2.abilities.some((a) => a.name === "Esquiva Aprimorada"), true);

      // 7.3.2: NÃO deve conceder os bônus de atributos iniciais de Ladino (+1 AGI, +1 INT)
      assert.deepEqual(
        nv2.attributes,
        attrsAntes,
        "Aprendiz de Classe não deve conceder bônus de atributos iniciais da classe secundária"
      );

      // 7.3.3: Tentativa de tornar-se Aprendiz de Mago no Nível 3 DEVE FALHAR
      assert.throws(() => {
        levelUp(nv2, {
          targetLevel: 3,
          evolutionPoint: "aprendiz_mago",
          newAbility: "Foco Arcano",
        });
      }, /O personagem já possui uma classe de Aprendiz/i);
    });

    test("7.3.2 & 7.3.3 — Aprendiz desbloqueia habilidades da classe secundária nos níveis seguintes e proíbe mesma classe primária", () => {
      const guerreiro = createCharacter({
        raceId: "anao",
        classId: "guerreiro",
        level: 1,
      });

      // Não pode ser Aprendiz da própria classe primária (Guerreiro)
      assert.throws(() => {
        levelUp(guerreiro, {
          targetLevel: 2,
          evolutionPoint: "aprendiz_guerreiro",
          newAbility: "Ataque Poderoso",
        });
      }, /não pode escolher a mesma classe como Aprendiz/i);

      // Torna-se Aprendiz de Ladino no Nível 2
      const nv2 = levelUp(guerreiro, {
        targetLevel: 2,
        evolutionPoint: "aprendiz_ladino",
        newAbility: "Ataque Poderoso",
      });

      // No Nível 3 pode escolher uma habilidade exclusiva de Ladino
      const nv3 = levelUp(nv2, {
        targetLevel: 3,
        evolutionPoint: "10_pv",
        newAbility: {
          name: "Ataque Furtivo Aprimorado",
          type: "habilidade",
          system: { classe: "Ladino", requisitos: "" },
        },
      });

      assert.equal(nv3.level, 3);
      assert.equal(nv3.abilities.some((a) => a.name === "Ataque Furtivo Aprimorado"), true);

      // Verifica mapeamento canônico de Habilidades Automáticas das Classes
      assert.equal(obterHabilidadeAutomaticaClasse("Ladino"), "Gatuno");
      assert.equal(obterHabilidadeAutomaticaClasse("Mago"), "Conhecimento Arcano");
      assert.equal(obterHabilidadeAutomaticaClasse("Paladino"), "Mestre de Armas 1");
      assert.equal(obterHabilidadeAutomaticaClasse("Sacerdote"), "Conhecimento Místico");
    });
  });

  // =========================================================================
  // SUB-MÓDULO 7.4: TETO CANÔNICO DE NÍVEL (NÍVEL 10)
  // =========================================================================
  describe("Sub-módulo 7.4 — Teto Canônico de Nível (Nível 10)", () => {

    test("7.4 — Bloquear evolução acima do Nível 10", () => {
      const lorde = createCharacter({
        raceId: "elfo",
        classId: "feiticeiro",
        level: 10,
      });

      assert.equal(lorde.level, 10);
      assert.equal(TETO_NIVEL_PADRAO, 10);

      assert.throws(() => {
        levelUp(lorde, { targetLevel: 11, evolutionPoint: "10_pm" });
      }, /Nível máximo alcançado \(10\)/i);

      // Sem evolutionPoint também deve acusar o bloqueio de Nível 10 imediatamente
      assert.throws(() => {
        levelUp(lorde, { targetLevel: 11 });
      }, /Nível máximo alcançado \(10\)/i);
    });

    test("7.4.1 — Bloqueia salto direto acima do Nível 10 ou regressão de nível no Actor do Foundry VTT", async () => {
      const actor = createMockActor({
        name: "Arquimago",
        details: { nivel: 10, raca: "Elfo", classe: "Feiticeiro" },
      });

      await assert.rejects(
        async () => await actor.applyLevelUp({ nextLevel: 11, benefit: "mana" }),
        /Nível máximo alcançado \(10\)/i
      );

      const actorNv5 = createMockActor({
        name: "Aventureiro",
        details: { nivel: 5, raca: "Humano", classe: "Guerreiro" },
      });

      await assert.rejects(
        async () => await actorNv5.applyLevelUp({ nextLevel: 5, benefit: "vida" }),
        /deve ser estritamente maior que o nível atual/i
      );

      await assert.rejects(
        async () => await actorNv5.applyLevelUp({ nextLevel: 4, benefit: "vida" }),
        /deve ser estritamente maior que o nível atual/i
      );
    });
  });
});
