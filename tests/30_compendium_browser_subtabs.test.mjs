import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createMockActor } from "./test-helper.mjs";
import {
  MightyBladeCompendiumBrowser,
  obterSubAbasCompendio,
} from "../module/apps/compendium-browser.mjs";
import { CANONICAL_CLASSES } from "../module/data/canonical-packs-data.mjs";

describe("Compendium Browser — Sub-abas e Filtro 'Apenas elegíveis' (Paridade com Seletor do Site)", () => {
  test("Para um Gnoll Necromante nível 1: sub-aba Necromante tem exatamente os 32 ids de CLASSES.necromante.listaHabilidades, sub-aba Gnoll não tem Asas Ancestrais, e Marca da Justiça não aparece em nenhuma sub-aba", async () => {
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

    // 0. Sub-aba Gerais: Auditoria Geral r1 (15 só-Geral + 8 Pacto/Apóstata = 23)
    const subGerais = subAbas.find((s) => s.id === "geral");
    assert.ok(subGerais, "Sub-aba Gerais deve estar presente");
    assert.equal(
      subGerais.ids.length,
      23,
      "Sub-aba Gerais deve conter exatamente 23 habilidades (15 só-Geral + 8 Pacto/Apóstata)"
    );

    // 1. Sub-aba Necromante (Classe)
    const subNecromante = subAbas.find((s) => s.id === "classe");
    assert.ok(subNecromante, "Sub-aba Necromante (classe) deve estar presente");
    assert.equal(subNecromante.label, "Necromante");

    const canonicalNec = CANONICAL_CLASSES.find((c) => c.name === "Necromante");
    assert.ok(canonicalNec, "Classe canônica Necromante deve existir em CANONICAL_CLASSES");

    const autoConcessoes = (canonicalNec.system?.concessoes || [])
      .filter((c) => c.tipo === "habilidade" && c.ref)
      .map((c) => c.ref);
    const expectedNecIds = (canonicalNec.system?.listaHabilidades || []).filter(
      (id) => !autoConcessoes.includes(id)
    );

    assert.equal(
      subNecromante.ids.length,
      31,
      "Sub-aba Necromante deve ter exatamente 31 habilidades no navegador (32 total - 1 automática)"
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

  test("Paridade canônica de classes C3c-3a: sub-aba Bardo mostra exatamente 35 habilidades e sub-aba Menestrel mostra exatamente 31 habilidades", async () => {
    const bardoActor = createMockActor({
      name: "Elidyr",
      details: { raca: "Humano", classe: "Bardo", nivel: 1 },
      items: [
        { name: "Humano", type: "raca" },
        { name: "Bardo", type: "classe" },
      ],
    });
    const subAbasBardo = obterSubAbasCompendio(bardoActor, "habilidade");
    const subBardo = subAbasBardo.find((s) => s.id === "classe");
    assert.ok(subBardo, "Sub-aba Bardo (classe) deve estar presente");
    assert.equal(subBardo.ids.length, 35, "Sub-aba Bardo deve conter exatamente 35 habilidades (36 total - 1 automática)");
    assert.ok(!subBardo.ids.includes("poesia-dos-bardos"), "Sub-aba Bardo não deve conter poesia-dos-bardos (pois é automática já concedida)");
    assert.ok(subBardo.ids.includes("eloquente"), "Sub-aba Bardo deve conter eloquente");

    const menestrelActor = createMockActor({
      name: "Garrick",
      details: { raca: "Fauno", classe: "Menestrel", nivel: 1 },
      items: [
        { name: "Fauno", type: "raca" },
        { name: "Menestrel", type: "classe" },
      ],
    });
    const subAbasMenestrel = obterSubAbasCompendio(menestrelActor, "habilidade");
    const subMenestrel = subAbasMenestrel.find((s) => s.id === "classe");
    assert.ok(subMenestrel, "Sub-aba Menestrel (classe) deve estar presente");
    assert.equal(subMenestrel.ids.length, 31, "Sub-aba Menestrel deve conter exatamente 31 habilidades (32 total - 1 automática)");
    assert.ok(!subMenestrel.ids.includes("jogral"), "Sub-aba Menestrel não deve conter jogral (pois é automática já concedida)");
    assert.ok(subMenestrel.ids.includes("fantasma-da-opera"), "Sub-aba Menestrel deve conter fantasma-da-opera");


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

  test("Agrupamento na ficha: Gnoll Necromante com Contato com Espíritos (sem flag) e Comunhão com Espíritos (com flag de classe) ficam em Habilidades de Classe; Salteador fica em Raciais", async () => {
    globalThis.foundry.appv1 = globalThis.foundry.appv1 || {};
    globalThis.foundry.appv1.sheets = globalThis.foundry.appv1.sheets || {};
    globalThis.foundry.appv1.sheets.ActorSheet = class {
      async getData() {
        return { items: [] };
      }
    };
    globalThis.Item = globalThis.Item || { DEFAULT_ICON: "icons/svg/item-bag.svg" };

    const { MightyBladeActorSheet } = await import("../module/sheets/actor-sheet.mjs");

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
        {
          name: "Contato com Espíritos",
          type: "habilidade",
          system: { categoria: "caracteristica" },
          // sem flag de classe (item antigo)
        },
        {
          name: "Comunhão com Espíritos",
          type: "habilidade",
          flags: {
            "mighty-blade": {
              sourceClasseId: "necromante",
            },
          },
        },
        {
          name: "Salteador",
          type: "habilidade",
          system: {
            requisitos: "Gnoll",
          },
        },
      ],
    });

    const sheet = new MightyBladeActorSheet();
    sheet.actor = gnollNecromante;

    const context = {
      items: [...gnollNecromante.items],
      system: gnollNecromante.system,
    };
    sheet._prepareItems(context);

    const classNames = context.classFeatures.map((f) => f.name);
    const racialNames = context.racialFeatures.map((f) => f.name);

    assert.ok(
      classNames.includes("Contato com Espíritos"),
      "Contato com Espíritos (sem flag, na lista da classe) deve estar em Habilidades de Classe"
    );
    assert.ok(
      classNames.includes("Comunhão com Espíritos"),
      "Comunhão com Espíritos (com sourceClasseId) deve estar em Habilidades de Classe"
    );
    assert.ok(
      racialNames.includes("Salteador"),
      "Salteador (requisito Gnoll) deve estar em Habilidades Raciais"
    );
  });

  test("Restrições de Raça e Idioma no Compendium Browser (Etapa J)", async () => {
    // 1. Aesir na sub-aba Gerais
    const aesirGuerreiro = createMockActor({
      name: "Ragnar",
      details: { raca: "Aesir", classe: "Guerreiro", nivel: 1 },
      items: [{ name: "Aesir", type: "raca" }, { name: "Guerreiro", type: "classe" }],
    });

    const browserAesir = new MightyBladeCompendiumBrowser({
      type: "habilidade",
      actor: aesirGuerreiro,
      subTab: "geral",
      onlyEligible: false,
    });
    const dataAesir = await browserAesir.getData();
    const furia = dataAesir.items.find((i) => i.name === "Fúria de Batalha");
    assert.ok(furia, "Fúria de Batalha deve constar na sub-aba geral com onlyEligible: false");
    assert.equal(furia.meetsPrereq, false, "Aesir não pode ser elegível para Fúria de Batalha");
    assert.match(furia.ineligivelMotivo, /Não disponível para Aesir/i);

    // Com onlyEligible: true, Fúria de Batalha deve ser ocultada
    browserAesir.onlyEligible = true;
    const dataAesirElegiveis = await browserAesir.getData();
    assert.equal(
      dataAesirElegiveis.items.some((i) => i.name === "Fúria de Batalha"),
      false,
      "Fúria de Batalha deve ser ocultada para Aesir quando 'Apenas elegíveis' está ativo"
    );

    // 2. Teurgia no Compendium Browser
    const humanoSemExotico = createMockActor({
      name: "João",
      details: { raca: "Humano", classe: "Guerreiro", nivel: 1, idiomas: "Burguês Tebryniano, Caint" },
      items: [{ name: "Humano", type: "raca" }, { name: "Guerreiro", type: "classe" }],
    });

    const browserHumano = new MightyBladeCompendiumBrowser({
      type: "habilidade",
      actor: humanoSemExotico,
      subTab: "geral",
      onlyEligible: false,
    });
    const dataHumano = await browserHumano.getData();
    const teurgia = dataHumano.items.find((i) => i.name === "Teurgia");
    assert.ok(teurgia, "Teurgia deve constar com onlyEligible: false");
    assert.equal(teurgia.meetsPrereq, false);
    assert.match(teurgia.ineligivelMotivo, /Requer falar um destes idiomas/i);

    // Com Arkadis, Teurgia se torna elegível
    humanoSemExotico.system.details.idiomas = "Burguês Tebryniano, Arkadis";
    const dataHumanoArkadis = await browserHumano.getData();
    const teurgiaArkadis = dataHumanoArkadis.items.find((i) => i.name === "Teurgia");
    assert.equal(teurgiaArkadis.meetsPrereq, true, "Teurgia deve ser elegível com idioma Arkadis");
  });
});

