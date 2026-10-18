import "./test-helper.mjs";
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { importCharacter, resolverIdHabilidadeAntigaFoundry } from "../module/helpers/import.mjs";

describe("C5 — Migração de Fichas ao Importar no Foundry (importCharacter)", () => {
  test("resolverIdHabilidadeAntigaFoundry resolve retiradas, inventadas e aliases", () => {
    const sonifera = resolverIdHabilidadeAntigaFoundry("melodia-sonifera");
    assert.equal(sonifera.acao, "substituido");
    assert.equal(sonifera.idFinal, "cancao-de-ninar");

    const atordoar = resolverIdHabilidadeAntigaFoundry("atordoar");
    assert.equal(atordoar.acao, "removido");
    assert.equal(atordoar.idFinal, null);

    const coracao = resolverIdHabilidadeAntigaFoundry("coracao-da-montanha");
    assert.equal(coracao.acao, "alias");
    assert.equal(coracao.idFinal, "coracao-da-montanha-1");
  });

  test("importCharacter migra ficha antiga e emite aviso consolidado", async () => {
    let avisoEmitido = "";
    const originalWarn = globalThis.ui?.notifications?.warn;
    if (globalThis.ui?.notifications) {
      globalThis.ui.notifications.warn = (msg) => {
        avisoEmitido = msg;
      };
    }

    const fichaAntiga = {
      schemaVersion: "1.0",
      name: "Guerreiro Antigo",
      type: "character",
      system: {
        attributes: {
          forca: { base: 3 },
          agilidade: { base: 2 },
          inteligencia: { base: 1 },
          vontade: { base: 2 },
        },
        details: { nivel: 1 },
      },
      items: [
        { slug: "humano", name: "Humano", type: "raca" },
        { slug: "guerreiro", name: "Guerreiro", type: "classe" },
        { slug: "melodia-sonifera", name: "Melodia Sonífera", type: "habilidade" },
        { slug: "atordoar", name: "Atordoar", type: "habilidade" },
        { slug: "coracao-da-montanha", name: "Coração da Montanha", type: "habilidade" },
        { slug: "sangrar", name: "Sangrar", type: "habilidade" },
      ],
    };

    const actor = await importCharacter(fichaAntiga);
    assert.ok(actor);

    // O aviso emitido deve conter as trocas e remoções
    assert.ok(avisoEmitido.includes("Ficha atualizada:"));
    assert.ok(avisoEmitido.includes("Melodia Sonífera → Canção de Ninar"));
    assert.ok(avisoEmitido.includes("Atordoar removida (não existe nos livros)"));
    assert.ok(avisoEmitido.includes("Sangrar → Faça-os Sangrar"));
    assert.ok(!avisoEmitido.includes("Coração da Montanha"));

    // O ator resultante possui os itens migrados
    const rawItems = Array.isArray(actor.items) ? actor.items : Array.from(actor.items.values());
    const slugs = rawItems.map((i) => i.flags?.["mighty-blade"]?.slug);

    assert.ok(!slugs.includes("melodia-sonifera"));
    assert.ok(!slugs.includes("atordoar"));
    assert.ok(!slugs.includes("sangrar"));
    assert.ok(!slugs.includes("coracao-da-montanha"));

    assert.ok(slugs.includes("cancao-de-ninar"));
    assert.ok(slugs.includes("faca-os-sangrar"));
    assert.ok(slugs.includes("coracao-da-montanha-1"));

    // Restaura warn original
    if (globalThis.ui?.notifications) {
      globalThis.ui.notifications.warn = originalWarn;
    }
  });
});
