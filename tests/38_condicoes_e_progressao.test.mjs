import { createMockActor } from "./test-helper.mjs";
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import MightyBladeCharacterData from "../module/data/actor-character.mjs";
import { aplicarCondicoesNoMovimento } from "../module/helpers/condicoes-movimento.mjs";
import { montarDadosDoActor, exportarParaCanonico, bonusRecursosPeloDataModel } from "../module/helpers/ida-e-volta.mjs";

/** Fase 4 — condições no movimento (mesma regra do site) e level-up gravando system.progressao. */

describe("Fase 4 — condições no movimento (regra do site)", () => {
  test("Guia Básico: Atordoado -1 (Corrida acompanha), Enregelado metade, Agarrado e Paralisado zeram", () => {
    assert.deepEqual(pick(aplicarCondicoesNoMovimento(7, 28, ["atordoado"])), { deslocamento: 6, corrida: 24 });
    assert.deepEqual(pick(aplicarCondicoesNoMovimento(7, 21, ["enregelado"])), { deslocamento: 4, corrida: 11 });
    assert.deepEqual(pick(aplicarCondicoesNoMovimento(7, 28, ["agarrado"])), { deslocamento: 0, corrida: 0 });
    assert.deepEqual(pick(aplicarCondicoesNoMovimento(7, 28, ["paralisado"])), { deslocamento: 0, corrida: 0 });
    assert.deepEqual(pick(aplicarCondicoesNoMovimento(7, 28, ["caido"])), { deslocamento: 7, corrida: 28 });
  });

  test("Manual do Combatente: Caído e Exausto dão metade; Atordoado não mexe no movimento", () => {
    const mc = { usarManualDoCombatente: true };
    assert.deepEqual(pick(aplicarCondicoesNoMovimento(6, 24, ["caido"], mc)), { deslocamento: 3, corrida: 12 });
    assert.deepEqual(pick(aplicarCondicoesNoMovimento(6, 24, ["exausto"], mc)), { deslocamento: 3, corrida: 12 });
    assert.deepEqual(pick(aplicarCondicoesNoMovimento(6, 24, ["atordoado"], mc)), { deslocamento: 6, corrida: 24 });
  });

  test("a ficha do Actor usa as condições da ficha do site, os status e o 0 PV", () => {
    const actor = createMockActor({ name: "C", system: { attributes: { agilidade: { base: 4 } }, details: { nivel: 1, condicoesAtivas: ["atordoado"] } } });
    actor.prepareDerivedData();
    assert.equal(actor.system.subattributes.deslocamento.value, actor.system.subattributes.deslocamento.semCondicao - 1);
  });
});

const pick = (r) => ({ deslocamento: r.deslocamento, corrida: r.corrida });

describe("Fase 4 — level-up do Foundry grava system.progressao", () => {
  const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "fase4");
  const ficha = JSON.parse(fs.readFileSync(path.join(DIR, "l45-02-metadilio-ladino-cacador.json"), "utf8")); // nível 3

  async function importado() {
    const { actorData } = montarDadosDoActor(ficha, { bonusRecursos: bonusRecursosPeloDataModel(MightyBladeCharacterData.prototype) });
    const actor = createMockActor(JSON.parse(JSON.stringify(actorData)));
    actor.prepareDerivedData();
    return { actor, actorData };
  }

  test("nível 4 com +10 PV e +1 em dois atributos: entrada no formato do site, sem mexer na base", async () => {
    const { actor } = await importado();
    const antes = { forca: actor.system.attributes.forca, vontade: actor.system.attributes.vontade };
    const baseForca = antes.forca.base;
    const valorForca = antes.forca.value;
    await actor.applyLevelUp({ nextLevel: 4, benefit: "vida", attributeIncreases: ["forca", "vontade"] });
    const entrada = actor.system.progressao.find((p) => p.nivel === 4);
    assert.deepEqual(entrada, { nivel: 4, peGasto: "mais10PV", atributosUpados: ["forca", "vontade"] });
    assert.equal(actor.system.attributes.forca.base, baseForca);
    assert.equal(actor.system.attributes.forca.value, valorForca + 1);
    assert.equal(actor.system.details.nivel, 4);
  });

  test("Aprendiz de Classe vira peGasto aprendizClasse com o id da classe", async () => {
    const { actor } = await importado();
    await actor.applyLevelUp({ nextLevel: 4, benefit: "aprendiz", aprendizClass: "Guerreiro", attributeIncreases: ["forca", "agilidade"] });
    const entrada = actor.system.progressao.find((p) => p.nivel === 4);
    assert.equal(entrada.peGasto, "aprendizClasse");
    assert.equal(entrada.peEscolhaId, "guerreiro");
  });

  test("a volta para o site leva a entrada e, importada de novo, não conta o atributo em dobro", async () => {
    const { actor, actorData } = await importado();
    const valorAntes = actor.system.attributes.vontade.value;
    await actor.applyLevelUp({ nextLevel: 4, benefit: "mana", attributeIncreases: ["inteligencia", "vontade"] });
    const semParent = (k, v) => (k === "parent" ? undefined : v);
    const salvo = { ...JSON.parse(JSON.stringify(actorData)), system: JSON.parse(JSON.stringify(actor.system, semParent)) };
    const { ficha: volta } = exportarParaCanonico(salvo, { recursos: actor.system.resources });
    assert.ok(volta.system.progressao.some((p) => p.nivel === 4 && p.peGasto === "mais10PM"));
    assert.equal(volta.system.attributes.vontade.base, ficha.system.attributes.vontade.base);

    const { actorData: de2 } = montarDadosDoActor(volta, { bonusRecursos: bonusRecursosPeloDataModel(MightyBladeCharacterData.prototype) });
    const outra = createMockActor(de2);
    outra.prepareDerivedData();
    assert.equal(outra.system.attributes.vontade.value, valorAntes + 1);
  });
});
