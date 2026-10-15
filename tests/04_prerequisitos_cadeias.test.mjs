/**
 * Bloco 4 — Pré-requisitos de Habilidades, Níveis e Cadeias Encadeadas.
 * Mighty Blade 3e (Foundry VTT v14 / Test Runner Nativo Node.js).
 *
 * Sub-módulos:
 * 4.1 Atributos Mínimos para Habilidades (Voador Exímio FOR 3, Aprendiz/Caminhos Arcanos INT 5).
 * 4.2 Trava de Nível Mínimo (Avançadas Nível 5+ e Finais/Mestre Nível 10).
 * 4.3 Cadeias Encadeadas e Habilidades Prévias (Chamas Internas 1->2, Ataque Furioso Nv5, Imparável Astério+Fortaleza+VON5 / Juban+Fortaleza+VON5).
 * 4.4 Exclusividade Mútua de Fúrias (Fúria Bestial, Fúria de Batalha e Fúria Orc).
 * 4.5 Integração Runtime com MightyBladeActor (_onHabilidadeCreated e addLevelAbility).
 */

import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  createMockActor,
  createCharacter,
  addAbility,
  levelUp,
} from "./test-helper.mjs";
import {
  CANONICAL_HABILIDADES,
  CANONICAL_CAMINHOS,
} from "../module/data/canonical-packs-data.mjs";
import {
  avaliarRequisitos,
  parseRequisitosTexto,
  validarExclusividadeFurias,
  getFuriasAtivas,
  ativarFuria,
  desativarFuria,
  FURIAS_EXCLUSIVAS,
} from "../module/helpers/requisitos.mjs";

const findHabilidade = (nome) =>
  CANONICAL_HABILIDADES.find((h) => h.name.toLowerCase() === nome.toLowerCase());

const findCaminho = (nome) =>
  CANONICAL_CAMINHOS.find((c) => c.name.toLowerCase() === nome.toLowerCase());

describe("Bloco 4 — Pré-requisitos de Habilidades, Níveis e Cadeias Encadeadas", () => {
  // ===========================================================================
  describe("Sub-módulo 4.1 — Atributos Mínimos para Habilidades", () => {
    test("4.1.1 (obsoleto) Força Interior removida no GB 2023 — canonical_packs não deve incluí-la", () => {
      // Força Interior existe no GB 2017 ("Web com Capa") mas foi REMOVIDA na edição 2023.
      // Fonte: comparação dos PDFs (CreationDate 2023-11-06 vs 2017-08-06).
      // Hierarquia de fontes adotada: GB 2023 é o core. Portanto, Força Interior não deve
      // constar em CANONICAL_HABILIDADES. Este teste valida que ela não está no canônico.
      const habForcaInterior = findHabilidade("Força Interior");
      assert.equal(habForcaInterior, undefined, "Força Interior não deve constar no canônico GB 2023");
    });

        test("4.1.2 Voador Exímio exige Força 3 (Rejeita FOR <= 2; Permite FOR >= 3)", () => {
      // Faen Feiticeiro possui Força 2
      const charFor2 = createCharacter({
        raceId: "faen",
        classId: "feiticeiro",
        level: 1,
      });
      assert.equal(charFor2.attributes.forca, 2);

      assert.throws(() => {
        addAbility(charFor2, "Voador Exímio");
      }, /Requer Força 3 ou superior/i);

      // Levent Guerreiro possui Força 3 (2 base + 1 Guerreiro)
      const charFor3 = createCharacter({
        raceId: "levent",
        classId: "guerreiro",
        level: 1,
      });
      assert.equal(charFor3.attributes.forca, 3);
      assert.doesNotThrow(() => {
        addAbility(charFor3, "Voador Exímio");
      });
      assert.equal(charFor3.abilities.some((a) => a.name === "Voador Exímio"), true);
    });

    test("4.1.3 Aprendiz Arcano e Caminhos Arcanos exigem Inteligência 5", () => {
      // Elfo Patrulheiro possui Inteligência 4
      const charInt4 = createCharacter({
        raceId: "elfo",
        classId: "patrulheiro",
        level: 1,
      });
      assert.equal(charInt4.attributes.inteligencia, 4);

      assert.throws(() => {
        addAbility(charInt4, "Aprendiz Arcano");
      }, /Requer Inteligência 5 ou superior/i);

      // Humano Feiticeiro com Adaptabilidade em Inteligência possui Inteligência 5 (3 base + 1 Feiticeiro + 1 Adaptabilidade)
      const charInt5 = createCharacter({
        raceId: "humano",
        classId: "feiticeiro",
        humanBonusAttribute: "inteligencia",
        level: 1,
      });
      assert.equal(charInt5.attributes.inteligencia, 5);
      assert.doesNotThrow(() => {
        addAbility(charInt5, "Aprendiz Arcano");
      });

      // Validação canônica dos Caminhos Arcanos que exigem Inteligência 5
      const caminhosArcanos = [
        { nome: "Argênteo", subReq: "Teleporte 1" },
        { nome: "Artífice", subReq: "Conhecimento Arcano" },
        { nome: "Ilusionista", subReq: "Detectar Magia" },
        { nome: "Alquimista", subReq: "Herbalismo" },
      ];

      for (const c of caminhosArcanos) {
        const doc = findCaminho(c.nome);
        assert.ok(doc, `Caminho canônico ${c.nome} deve existir`);

        const atorInt4 = createMockActor({
          attributes: { inteligencia: { value: 4 } },
          items: [{ name: c.subReq, type: "habilidade" }],
        });
        assert.equal(avaliarRequisitos(doc.system.requisitos, atorInt4).atende, false);

        const atorInt5 = createMockActor({
          attributes: { inteligencia: { value: 5 } },
          items: [{ name: c.subReq, type: "habilidade" }],
        });
        assert.equal(avaliarRequisitos(doc.system.requisitos, atorInt5).atende, true);
      }
    });
  });

  // ===========================================================================
  describe("Sub-módulo 4.2 — Trava de Nível Mínimo (Avançadas e Finais)", () => {
    test("4.2.1 Habilidades Avançadas (Nervos de Aço, Vontade de Ferro, Mestre de Armas 2) exigem Nível 5+", () => {
      for (let nivel = 1; nivel <= 4; nivel++) {
        const char = createCharacter({ raceId: "anao", classId: "guerreiro", level: nivel });
        assert.throws(
          () => addAbility(char, "Nervos de Aço"),
          /Requer Nível 5 ou superior/i,
          `Nervos de Aço deve ser bloqueada no Nível ${nivel}`,
        );
        assert.throws(
          () => addAbility(char, "Vontade de Ferro"),
          /Requer Nível 5 ou superior/i,
          `Vontade de Ferro deve ser bloqueada no Nível ${nivel}`,
        );
        assert.throws(
          () => addAbility(char, "Mestre de Armas 2"),
          /Requer Nível 5 ou superior/i,
          `Mestre de Armas 2 deve ser bloqueada no Nível ${nivel}`,
        );
      }

      // Subindo para o Nível 5 libera a aquisição
      const charNv4 = createCharacter({ raceId: "anao", classId: "guerreiro", level: 4 });
      const charNv5 = levelUp(charNv4, { targetLevel: 5, evolutionPoint: "10_pv" });
      assert.doesNotThrow(() => addAbility(charNv5, "Nervos de Aço"));
      assert.doesNotThrow(() => addAbility(charNv5, "Vontade de Ferro"));
      assert.doesNotThrow(() => addAbility(charNv5, "Mestre de Armas 2"));
    });

    test("4.2.2 Habilidades Finais / Mestre exigem estritamente o Nível 10", () => {
      for (let nivel = 1; nivel <= 9; nivel++) {
        const char = createCharacter({
          raceId: "orc",
          classId: "guerreiro",
          level: nivel,
          abilities: ["Fúria Colérica", "Mestre de Armas 2"],
        });
        assert.throws(
          () => addAbility(char, "Mestre Especialista"),
          /Requer Nível 10 ou superior/i,
        );
        assert.throws(
          () => addAbility(char, "Fúria Brutal"),
          /Requer Nível 10 ou superior/i,
        );
        assert.throws(
          () => addAbility(char, "Mestre de Armas 3"),
          /Requer Nível 10 ou superior/i,
        );
      }

      // No Nível 10, sem a habilidade prévia (Fúria Colérica), ainda bloqueia
      const charNv10SemPrevia = createCharacter({
        raceId: "orc",
        classId: "guerreiro",
        level: 10,
      });
      assert.doesNotThrow(() => addAbility(charNv10SemPrevia, "Mestre Especialista"));
      assert.throws(() => addAbility(charNv10SemPrevia, "Fúria Brutal"), /Fúria Colérica/i);

      // Com Fúria Colérica no Nível 10, permite Fúria Brutal
      addAbility(charNv10SemPrevia, { name: "Fúria Colérica", type: "habilidade", system: { requisitos: "" } });
      assert.doesNotThrow(() => addAbility(charNv10SemPrevia, "Fúria Brutal"));
    });
  });

  // ===========================================================================
  describe("Sub-módulo 4.3 — Cadeias Encadeadas e Habilidades Prévias", () => {
    test("4.3.1 Cadeia Simples: Chamas Internas 2 exige Chamas Internas 1", () => {
      const char = createCharacter({ raceId: "fira", classId: "feiticeiro", level: 1 });

      assert.throws(() => {
        addAbility(char, "Chamas Internas 2");
      }, /Requer a habilidade Chamas Internas 1/i);

      // Adquire Chamas Internas 1 e depois Chamas Internas 2
      assert.doesNotThrow(() => addAbility(char, "Chamas Internas 1"));
      assert.doesNotThrow(() => addAbility(char, "Chamas Internas 2"));
      assert.equal(char.abilities.some((a) => a.name === "Chamas Internas 2"), true);
    });

    test("4.3.2 Ataque Furioso exige apenas Nível 5 (Vilão p.72)", () => {
      // Guia do Vilão p.72 (PDF): Ataque Furioso — Requisito: Nível 5. Sem requisito de Força.
      // (Antes o teste exigia Nível 5 + Força 4; removido o requisito de Força por não constar no livro.)

      // Nível 4 com Força alta -> falha por Nível
      const charNv4 = createCharacter({ raceId: "anao", classId: "guerreiro", level: 4 });
      assert.throws(() => {
        addAbility(charNv4, "Ataque Furioso");
      }, /Requer Nível 5 ou superior/i);

      // Nível 5 com Força qualquer -> sucesso
      const charNv5ForBaixa = createCharacter({ raceId: "elfo", classId: "guerreiro", level: 5 });
      assert.equal(charNv5ForBaixa.attributes.forca, 3); // Força baixa não bloqueia
      assert.doesNotThrow(() => {
        addAbility(charNv5ForBaixa, "Ataque Furioso");
      }, "Nível 5 com Força 3 deve ser aceito — sem requisito de Força");
      assert.equal(charNv5ForBaixa.abilities.some((a) => a.name === "Ataque Furioso"), true);

      // Nível 5 com Força alta -> também sucesso
      const charNv5ForAlta = createCharacter({ raceId: "anao", classId: "guerreiro", level: 5 });
      assert.doesNotThrow(() => {
        addAbility(charNv5ForAlta, "Ataque Furioso");
      });
      assert.equal(charNv5ForAlta.abilities.some((a) => a.name === "Ataque Furioso"), true);
    });

    test("4.3.3 Cadeia Complexa (Raça + Habilidade + Atributo): Imparável exige Astério + Fortaleza + Vontade 5", () => {
      // 1. Astério com Vontade 5 mas SEM Fortaleza -> falha
      const asterioSemFortaleza = createMockActor({
        details: { raca: "Astério", nivel: 4 },
        attributes: { vontade: { value: 5 } },
        items: [{ name: "Astério", type: "raca" }],
      });
      assert.throws(() => {
        addAbility(asterioSemFortaleza, "Imparável");
      }, /Requer a habilidade Fortaleza/i);

      // 2. Astério com Fortaleza mas com Vontade 4 -> falha
      const asterioVon4 = createMockActor({
        details: { raca: "Astério", nivel: 4 },
        attributes: { vontade: { value: 4 } },
        items: [
          { name: "Astério", type: "raca" },
          { name: "Fortaleza", type: "habilidade" },
        ],
      });
      assert.throws(() => {
        addAbility(asterioVon4, "Imparável");
      }, /Requer Vontade 5 ou superior/i);

      // 3. Elfo (raça incorreta) com Fortaleza e Vontade 5 -> falha
      const elfo = createMockActor({
        details: { raca: "Elfo", nivel: 4 },
        attributes: { vontade: { value: 5 } },
        items: [
          { name: "Elfo", type: "raca" },
          { name: "Fortaleza", type: "habilidade" },
        ],
      });
      assert.throws(() => {
        addAbility(elfo, "Imparável");
      }, /Requer Raça Astério/i);

      // 4. Astério com Fortaleza e Vontade 5 -> sucesso!
      const asterioCompleto = createMockActor({
        details: { raca: "Astério", nivel: 4 },
        attributes: { vontade: { value: 5 } },
        items: [
          { name: "Astério", type: "raca" },
          { name: "Fortaleza", type: "habilidade" },
        ],
      });
      assert.doesNotThrow(() => {
        addAbility(asterioCompleto, "Imparável");
      });
      assert.equal(asterioCompleto.items.some((i) => i.name === "Imparável"), true);

      // 5. Juban com Fortaleza e Vontade 5 -> sucesso! (GB p.67)
      // Imparável não é exclusiva de Astérios: Jubans também podem obtê-la (GB p.67).
      // NLM confirmou: Herói p.15 (Astérios) e GB p.67 (Jubans) — ambos requerem Fortaleza + VON 5.
      const jubanCompleto = createMockActor({
        details: { raca: "Juban", nivel: 4 },
        attributes: { vontade: { value: 5 } },
        items: [
          { name: "Juban", type: "raca" },
          { name: "Fortaleza", type: "habilidade" },
        ],
      });
      assert.doesNotThrow(() => {
        addAbility(jubanCompleto, "Imparável");
      }, "Juban com Fortaleza e Vontade 5 deve poder adquirir Imparável (GB p.67)");
      assert.equal(jubanCompleto.items.some((i) => i.name === "Imparável"), true);

      // 6. Juban SEM Fortaleza -> falha
      const jubanSemFortaleza = createMockActor({
        details: { raca: "Juban", nivel: 4 },
        attributes: { vontade: { value: 5 } },
        items: [{ name: "Juban", type: "raca" }],
      });
      assert.throws(() => {
        addAbility(jubanSemFortaleza, "Imparável");
      }, /Requer a habilidade Fortaleza/i);
    });
  });

  // ===========================================================================
  describe("Sub-módulo 4.4 — Exclusividade de Fúrias", () => {
    test("4.4.1 Lista canônica de fúrias mutuamente exclusivas", () => {
      assert.deepEqual(FURIAS_EXCLUSIVAS, [
        "furia bestial",
        "furia de batalha",
        "furia orc",
      ]);
    });

    test("4.4.2 Impede ativar nova Fúria quando outra já está ativa", () => {
      const berserker = createMockActor({ name: "Berserker" });

      ativarFuria(berserker, "Fúria Bestial");
      assert.deepEqual(getFuriasAtivas(berserker), ["furia bestial"]);

      // Tentar ativar Fúria de Batalha ou Fúria Orc com Fúria Bestial ativa lança erro
      assert.throws(
        () => ativarFuria(berserker, "Fúria de Batalha"),
        /Exclusividade de Fúrias violada/i,
      );
      assert.throws(
        () => ativarFuria(berserker, "Fúria Orc"),
        /Exclusividade de Fúrias violada/i,
      );
      assert.deepEqual(getFuriasAtivas(berserker), ["furia bestial"]);
    });

    test("4.4.3 Modo de substituição desativa automaticamente a fúria anterior ao ativar a nova", () => {
      const guerreiro = createMockActor({ name: "Guerreiro Furioso" });

      ativarFuria(guerreiro, "Fúria de Batalha");
      assert.deepEqual(getFuriasAtivas(guerreiro), ["furia de batalha"]);

      const resultado = ativarFuria(guerreiro, "Fúria Orc", { substituir: true });
      assert.deepEqual(resultado.desativadas, ["furia de batalha"]);
      assert.deepEqual(resultado.furiasAtivas, ["furia orc"]);
      assert.deepEqual(getFuriasAtivas(guerreiro), ["furia orc"]);

      // Desativar manualmente limpa as fúrias ativas
      desativarFuria(guerreiro);
      assert.deepEqual(getFuriasAtivas(guerreiro), []);
    });

    test("4.4.4 Restrição de aquisição entre Fúrias raciais (Aesir vs Fúria de Batalha vs Orc)", () => {
      const aesir = createMockActor({ details: { raca: "Aesir", espiritoAnimal: "Urso" } });
      const humano = createMockActor({ details: { raca: "Humano" } });
      const orc = createMockActor({ details: { raca: "Orc" } });

      // Fúria de Batalha tem requisito "Todas exceto Aesires"
      assert.throws(() => addAbility(aesir, "Fúria de Batalha"), /Aesir/i);
      assert.doesNotThrow(() => addAbility(humano, "Fúria de Batalha"));

      // Fúria Orc exige Orc
      assert.throws(() => addAbility(humano, "Fúria Orc"), /Requer Raça Orc/i);
      assert.doesNotThrow(() => addAbility(orc, "Fúria Orc"));
    });
  });

  // ===========================================================================
  describe("Sub-módulo 4.5 — Integração Runtime com MightyBladeActor", () => {
    test("4.5.1 Hook _onHabilidadeCreated rejeita e remove habilidade com pré-requisitos pendentes", async () => {
      const ator = createMockActor({
        name: "Iniciante",
        details: { raca: "Humano", nivel: 2 },
        attributes: { vontade: { value: 3 } },
        items: [
          {
            id: "hab-nervos",
            name: "Nervos de Aço",
            type: "habilidade",
            system: { requisitos: "Nível 5" },
          },
        ],
      });

      const ok = await ator._onHabilidadeCreated(ator.items[0]);
      assert.equal(ok, false, "_onHabilidadeCreated deve rejeitar Nervos de Aço no Nível 2");
      assert.equal(ator.items.length, 0, "Item inválido deve ser removido da ficha");
    });

    test("4.5.2 parseRequisitosTexto separa requisitos por vírgula ou sinal de adição", () => {
      assert.deepEqual(
        parseRequisitosTexto("Astério, Vontade 5, Fortaleza."),
        ["Astério", "Vontade 5", "Fortaleza"],
      );
      assert.deepEqual(
        parseRequisitosTexto("Nível 5 + Força 4"),
        ["Nível 5", "Força 4"],
      );
    });
  });
});
