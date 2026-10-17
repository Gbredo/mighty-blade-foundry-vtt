import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createMockActor } from "./test-helper.mjs";
import {
  MightyBladeCompendiumBrowser,
  obterSubAbasCompendio,
} from "../module/apps/compendium-browser.mjs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { CLASSES } = require("../../MightyBlade3eWebsite/packages/rules-core/dist/index.js");

describe("Compendium Browser — Sub-abas e Filtro 'Apenas elegíveis' (Paridade com Seletor do Site)", () => {
  test("Para um Gnoll Necromante nível 1: sub-aba Necromante tem exatamente os ids de CLASSES.necromante.listaHabilidades (menos automáticas), sub-aba Gnoll não tem Asas Ancestrais, e Marca da Justiça não aparece em nenhuma sub-aba", async () => {
    const gnollNecromante = createMockActor({
      name: "Gorguk",
      details: {
        raca: "Gnoll",
        classe: "Necromante",
        nivel: 1,
      },
      items: [
        { name: "Gnoll", type: "raca" },
        { name: "Necromante", type: "classe" },
      ],
    });

    const subAbas = obterSubAbasCompendio(gnollNecromante, "habilidade");

    // 1. Sub-aba Necromante (Classe)
    const subNecromante = subAbas.find((s) => s.id === "classe");
    assert.ok(subNecromante, "Sub-aba Necromante (classe) deve estar presente");
    assert.equal(subNecromante.label, "Necromante");

    const necAuto = CLASSES.necromante.habilidadesAutomaticas || [];
    const expectedNecIds = CLASSES.necromante.listaHabilidades.filter(
      (id) => !necAuto.includes(id)
    );

    assert.equal(
      subNecromante.ids.length,
      expectedNecIds.length,
      `Sub-aba Necromante deve ter ${expectedNecIds.length} habilidades (34 total - 1 automática)`
    );

    assert.deepEqual(
      [...subNecromante.ids].sort(),
      [...expectedNecIds].sort(),
      "Sub-aba Necromante deve conter exatamente os ids de CLASSES.necromante.listaHabilidades (menos as automáticas)"
    );

    // 2. Sub-aba Gnoll (Raça) não tem "Asas Ancestrais"
    const subGnoll = subAbas.find((s) => s.id === "raca");
    assert.ok(subGnoll, "Sub-aba Gnoll (raça) deve estar presente");
    assert.equal(subGnoll.label, "Gnoll");

    assert.equal(
      subGnoll.ids.includes("asas-ancestrais"),
      false,
      "Sub-aba Gnoll não pode conter o id de 'Asas Ancestrais' (exclusiva de Dragano)"
    );

    assert.equal(
      subGnoll.items.some((i) => i.name === "Asas Ancestrais" || i.flags?.["mighty-blade"]?.slug === "asas-ancestrais"),
      false,
      "Sub-aba Gnoll não pode conter o item 'Asas Ancestrais'"
    );

    // 3. "Marca da Justiça" não aparece em nenhuma sub-aba
    for (const sub of subAbas) {
      assert.equal(
        sub.ids.includes("marca-da-justica"),
        false,
        `"Marca da Justiça" não pode aparecer nos ids da sub-aba ${sub.label} (${sub.id})`
      );
      assert.equal(
        sub.items.some(
          (i) => i.name === "Marca da Justiça" || i.flags?.["mighty-blade"]?.slug === "marca-da-justica"
        ),
        false,
        `"Marca da Justiça" não pode aparecer nos itens da sub-aba ${sub.label} (${sub.id})`
      );
    }
  });

  test("Checkbox 'Apenas elegíveis' ligado por padrão esconde itens com pré-requisitos pendentes", async () => {
    const gnollNecromante = createMockActor({
      name: "Gorguk",
      details: {
        raca: "Gnoll",
        classe: "Necromante",
        nivel: 1,
      },
      items: [
        { name: "Gnoll", type: "raca" },
        { name: "Necromante", type: "classe" },
      ],
    });

    // Browser com default (onlyEligible = true)
    const browserElegiveis = new MightyBladeCompendiumBrowser({
      type: "habilidade",
      actor: gnollNecromante,
      subTab: "classe",
    });
    assert.equal(browserElegiveis.onlyEligible, true, "onlyEligible deve ser true por padrão");

    const dataElegiveis = await browserElegiveis.getData();
    assert.ok(dataElegiveis.hasSubTabs, "hasSubTabs deve ser true com personagem");

    // No Nível 1, habilidades que exigem Nível 5 / Nível 10 não podem aparecer quando onlyEligible é true
    const nomesElegiveis = dataElegiveis.items.map((i) => i.name);
    assert.equal(
      nomesElegiveis.includes("Despertar dos Mortos 2"),
      false,
      "Despertar dos Mortos 2 (exige Nível 5) deve ser escondido com 'Apenas elegíveis' ativado no Nível 1"
    );

    // Browser com onlyEligible = false (mostra todos da sub-aba com cadeado)
    const browserTodos = new MightyBladeCompendiumBrowser({
      type: "habilidade",
      actor: gnollNecromante,
      subTab: "classe",
      onlyEligible: false,
    });

    const dataTodos = await browserTodos.getData();
    const nomesTodos = dataTodos.items.map((i) => i.name);
    assert.equal(
      nomesTodos.includes("Despertar dos Mortos 2"),
      true,
      "Despertar dos Mortos 2 deve aparecer quando 'Apenas elegíveis' está desligado"
    );

    const itemNv5 = dataTodos.items.find((i) => i.name === "Despertar dos Mortos 2");
    assert.equal(itemNv5?.meetsPrereq, false, "Item de Nível 5 deve ter meetsPrereq: false para herói Nível 1");
  });

  test("Sem personagem no browser: mantém comportamento original sem sub-abas", async () => {
    const browser = new MightyBladeCompendiumBrowser({
      type: "habilidade",
    });

    const data = await browser.getData();
    assert.equal(data.hasSubTabs, false, "hasSubTabs deve ser false sem personagem");
    assert.equal(data.subTabs, null, "subTabs deve ser null sem personagem");
    assert.ok(data.items.length > 500, "Deve listar catálogo completo de habilidades");
  });
});
