import { createMockActor } from "./test-helper.mjs";
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import MightyBladeCharacterData from "../module/data/actor-character.mjs";
import { montarDadosDoActor, exportarParaCanonico, bonusRecursosPeloDataModel, acharEquipamentoDoSite } from "../module/helpers/ida-e-volta.mjs";
import { CANONICAL_ALIASES_EQUIPAMENTOS } from "../module/data/canonical-packs-data.mjs";

/**
 * Fase 4, Lote 4.5 — a parte automática do roteiro de ida e volta.
 * Para cada personagem do 4.5 (fixtures l45-*): importa, "mexe no Foundry" como o roteiro pede
 * (dano, PM, condição, nível, item comprado e equipado, qualidade trocada), exporta e confere que
 * a ficha volta com essas mudanças e NENHUMA outra.
 */

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "fase4");
const fixtures = fs.readdirSync(DIR).filter((f) => f.startsWith("l45-") && f.endsWith(".json") && !f.endsWith(".esperado.json")).sort();
const clonar = (v) => JSON.parse(JSON.stringify(v));

function diferencas(a, b, caminho = "") {
  if (JSON.stringify(a) === JSON.stringify(b)) return [];
  const obj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
  if (obj(a) && obj(b)) return [...new Set([...Object.keys(a), ...Object.keys(b)])].sort().flatMap((k) => diferencas(a[k], b[k], caminho ? `${caminho}.${k}` : k));
  return [caminho];
}

/** Como o comparar_fichas.ts do site: sem versão, mochila por uid, itens por tipo+slug, id antigo pelo alias. */
function normalizar(f) {
  const c = clonar(f);
  delete c.schemaVersion;
  const det = c.system.details;
  if (typeof det.idade === "number") det.idade = String(det.idade);
  det.inventario = Object.fromEntries((det.inventario ?? []).map((i) => [i.uid, { ...i, refId: CANONICAL_ALIASES_EQUIPAMENTOS?.[i.refId] ?? i.refId }]));
  c.items = Object.fromEntries((c.items ?? []).map((i) => [`${i.type}:${i.slug}`, i]));
  return c;
}

describe("Fase 4, Lote 4.5 — ida e volta mexendo no Foundry", () => {
  test("há os personagens do 4.5", () => assert.ok(fixtures.length >= 9, `${fixtures.length}`));

  for (const arquivo of fixtures) {
    const ficha = JSON.parse(fs.readFileSync(path.join(DIR, arquivo), "utf8"));

    test(`${ficha.name}: volta só com o que foi mexido`, () => {
      const { actorData } = montarDadosDoActor(ficha, { bonusRecursos: bonusRecursosPeloDataModel(MightyBladeCharacterData.prototype) });
      const actor = createMockActor(clonar(actorData));
      actor.prepareDerivedData();
      const salvo = clonar(actorData);

      // mexer no Foundry
      salvo.system.resources.vida.value = Math.max(0, actor.system.resources.vida.value - 5); // tomou 5 de dano
      salvo.system.resources.mana.value = Math.max(0, actor.system.resources.mana.value - 3); // gastou 3 PM
      salvo.system.details.condicoesAtivas = [...(salvo.system.details.condicoesAtivas ?? []), "amedrontado"];
      salvo.system.details.nivel = (salvo.system.details.nivel ?? 1) + 1; // subiu um nível
      const comprado = acharEquipamentoDoSite("adaga");
      salvo.items.push({ name: comprado.name, type: comprado.type, system: { ...clonar(comprado.system), equipado: true, quantidade: 1 }, flags: { "mighty-blade": clonar(comprado.flags["mighty-blade"]) } });
      const arma = salvo.items.find((i) => i.type === "arma" && i.flags?.["mighty-blade"]?.inventario);
      if (arma) arma.flags["mighty-blade"].inventario.qualidade = "Alta";

      const preparado = createMockActor(clonar(salvo));
      preparado.prepareDerivedData();
      const { ficha: volta } = exportarParaCanonico(salvo, { recursos: preparado.system.resources });

      const mudou = diferencas(normalizar(ficha), normalizar(volta));
      const uidNovo = volta.system.details.inventario.find((i) => i.refId === "adaga")?.uid;
      const esperado = [
        "system.resources.vida.value",
        "system.resources.mana.value",
        "system.details.condicoesAtivas",
        "system.details.nivel",
        `system.details.inventario.${uidNovo}`,
        ...(arma ? [`system.details.inventario.${arma.flags["mighty-blade"].inventario.uid}.qualidade`] : []),
      ];
      assert.deepEqual(mudou.sort(), esperado.sort());

      // e os valores são os mexidos
      assert.equal(volta.system.resources.vida.value, salvo.system.resources.vida.value);
      assert.equal(volta.system.resources.vida.max, ficha.system.resources.vida.max);
      assert.ok(volta.system.details.condicoesAtivas.includes("amedrontado"));
      const nova = volta.system.details.inventario.find((i) => i.uid === uidNovo);
      assert.equal(nova.equipado, true);
    });
  }
});
