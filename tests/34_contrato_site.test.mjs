import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { capturarSchema } from "./test-helper.mjs";
import { CANONICAL_CONTRATO_SITE } from "../module/data/canonical-packs-data.mjs";

/**
 * Fase 4 (contrato v1.2): todo campo que a ficha do site manda para o system do Actor tem que
 * existir no TypeDataModel. Campo não declarado o Foundry descarta em silêncio no Actor.create.
 */

/** Segue "a.b.c" pela árvore de SchemaFields. */
function acharCampo(raiz, caminho) {
  let atual = { tipo: "schema", args: raiz };
  for (const parte of caminho.split(".")) {
    if (atual?.tipo !== "schema") return null;
    atual = atual.args?.[parte];
    if (!atual) return null;
  }
  return atual;
}

const schema = await capturarSchema();

describe("Fase 4 — contrato da ficha do site (v1.2)", () => {
  const entradas = Object.entries(CANONICAL_CONTRATO_SITE);

  test("o contrato veio do site e cobre os blocos principais", () => {
    assert.ok(entradas.length >= 30, `contrato com ${entradas.length} campos`);
    for (const c of ["schemaVersion", "system.attributes", "system.details.inventario", "system.anotacoes"]) {
      assert.ok(CANONICAL_CONTRATO_SITE[c], `falta ${c} no contrato`);
    }
  });

  test('todo campo de destino "foundry" existe no TypeDataModel do personagem', () => {
    const faltando = entradas
      .filter(([c, d]) => d === "foundry" && c.startsWith("system."))
      .map(([c]) => c)
      .filter((c) => !acharCampo(schema, c.slice("system.".length)));
    assert.deepEqual(faltando, [], `campos que o Foundry jogaria fora: ${faltando.join(", ")}`);
  });

  test('campo "flag-site" não está no TypeDataModel (vai para a flag)', () => {
    const declarados = entradas
      .filter(([c, d]) => d === "flag-site" && c.startsWith("system."))
      .map(([c]) => c)
      .filter((c) => acharCampo(schema, c.slice("system.".length)));
    assert.deepEqual(declarados, []);
  });

  test("a mochila (foundry-items) não é campo do system", () => {
    assert.equal(acharCampo(schema, "details.inventario"), null);
  });

  test("nível aceita 0 (decisão D4)", () => {
    assert.equal(acharCampo(schema, "details.nivel").args.min, 0);
  });

  test("campos da decisão D3 declarados", () => {
    for (const c of ["details.condicoesAtivas", "details.resistenciasTemp", "details.vulnerabilidadesTemp", "details.imunidadesTemp", "progressao"]) {
      assert.equal(acharCampo(schema, c)?.tipo, "array", c);
    }
  });
});
