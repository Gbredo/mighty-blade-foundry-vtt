import { createMockActor } from "./test-helper.mjs";
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import MightyBladeCharacterData from "../module/data/actor-character.mjs";
import { montarDadosDoActor, exportarParaCanonico, bonusRecursosPeloDataModel } from "../module/helpers/ida-e-volta.mjs";
import { temCondicao, obterPenalidadeDefesa } from "../module/helpers/estados-saude.mjs";

/**
 * Fase 4, Lote 4.4 — paridade de números entre o site e o Foundry.
 *
 * As fixtures vêm do site (`npx tsx scripts/fase4/gerar_fixtures.ts --foundry <este repositório>`):
 * `<nome>.json` é a ficha e `<nome>.esperado.json` os números que a tela do site mostra
 * (numerosDaFicha do rules-core). Aqui a ficha passa pelo import (montarDadosDoActor, como o
 * importCharacter faz), o Actor é preparado e os números têm que ser os mesmos.
 */

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "fase4");
const fixtures = fs.readdirSync(DIR).filter((f) => f.endsWith(".json") && !f.endsWith(".esperado.json")).sort();

/**
 * Diferenças aceitas (escritas aqui de propósito, cada uma com o motivo):
 * - Condições ativas: o site desconta as penalidades no número da ficha; o Foundry aplica na hora
 *   do teste (obterPenalidadeDefesa). Fixtures com condição conferem a penalidade no Foundry à parte.
 */
const CAMPOS_COM_CONDICAO = new Set(["bloqueio", "esquiva"]);

function prepararNoFoundry(ficha) {
  const { actorData } = montarDadosDoActor(ficha, { bonusRecursos: bonusRecursosPeloDataModel(MightyBladeCharacterData.prototype) });
  const actor = createMockActor(actorData);
  actor.prepareDerivedData();
  return { actorData, actor };
}

function numerosDoFoundry(s) {
  return {
    forca: s.attributes.forca.value, agilidade: s.attributes.agilidade.value,
    inteligencia: s.attributes.inteligencia.value, vontade: s.attributes.vontade.value,
    bloqueio: s.defesas.bloqueio.value, esquiva: s.defesas.esquiva.value,
    determinacao: s.defesas.determinacao.value, rd: s.defesas.rd.value,
    deslocamento: s.subattributes.deslocamento.value, corrida: s.subattributes.corrida.value,
    iniciativa: s.subattributes.iniciativa.value,
    pvMax: s.resources.vida.max, pmMax: s.resources.mana.max,
    cargaBasica: s.subattributes.carga.basica, cargaPesada: s.subattributes.carga.pesadaPadrao, cargaMaxima: s.subattributes.carga.maximaPadrao,
  };
}

function numerosDoSite(e) {
  return {
    ...e.atributos,
    bloqueio: e.defesas.bloqueio, esquiva: e.defesas.esquiva, determinacao: e.defesas.determinacao, rd: e.defesas.rd,
    deslocamento: e.deslocamento, corrida: e.corrida, iniciativa: e.iniciativa,
    pvMax: e.pv.max, pmMax: e.pm.max,
    cargaBasica: e.carga.basica, cargaPesada: e.carga.pesada, cargaMaxima: e.carga.maxima,
  };
}

describe("Fase 4 — paridade de números site ↔ Foundry (fixtures do site)", () => {
  test("há fixtures do site", () => {
    assert.ok(fixtures.length >= 5, `fixtures em ${DIR}: ${fixtures.length}`);
  });

  for (const arquivo of fixtures) {
    const ficha = JSON.parse(fs.readFileSync(path.join(DIR, arquivo), "utf8"));
    const esperado = JSON.parse(fs.readFileSync(path.join(DIR, arquivo.replace(/\.json$/, ".esperado.json")), "utf8"));
    const temCondicoes = (ficha.system.details.condicoesAtivas ?? []).length > 0;

    test(`${ficha.name}: mesmos números dos dois lados`, () => {
      const { actor } = prepararNoFoundry(ficha);
      const site = numerosDoSite(esperado);
      const foundry = numerosDoFoundry(actor.system);
      const diferencas = Object.keys(site)
        .filter((k) => !(temCondicoes && CAMPOS_COM_CONDICAO.has(k)))
        .filter((k) => site[k] !== foundry[k])
        .map((k) => `${k}: site ${site[k]}, Foundry ${foundry[k]}`);
      assert.deepEqual(diferencas, []);
    });

    if (temCondicoes) {
      test(`${ficha.name}: a condição chega ao Foundry e pesa na defesa`, () => {
        const { actor } = prepararNoFoundry(ficha);
        for (const c of ficha.system.details.condicoesAtivas) assert.ok(temCondicao(actor, c), c);
        const penalidade = obterPenalidadeDefesa(actor, "corporal");
        assert.equal(actor.system.defesas.bloqueio.value + penalidade, esperado.defesas.bloqueio);
      });
    }

    test(`${ficha.name}: volta para o site igual (fora a versão)`, () => {
      const { actorData, actor } = prepararNoFoundry(ficha);
      const { ficha: volta, avisos } = exportarParaCanonico({ ...actorData, system: JSON.parse(JSON.stringify(actorData.system)) }, { recursos: actor.system.resources });
      assert.deepEqual(avisos, []);
      assert.deepEqual(volta.system.resources, ficha.system.resources);
      assert.deepEqual(volta.system.attributes, ficha.system.attributes);
      assert.deepEqual(volta.system.details.inventario, ficha.system.details.inventario);
      assert.deepEqual(volta.items.map((i) => i.slug), ficha.items.map((i) => i.slug));
      for (const k of ["nivel", "experiencia", "dinheiro", "condicoesAtivas", "usarManualDoCombatente"]) {
        assert.deepEqual(volta.system.details[k], ficha.system.details[k], k);
      }
    });
  }
});
