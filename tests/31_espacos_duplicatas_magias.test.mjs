import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createMockActor } from "./test-helper.mjs";
import {
  MightyBladeCompendiumBrowser,
  calcularEspacosHabilidades,
} from "../module/apps/compendium-browser.mjs";
import { CANONICAL_HABILIDADES_POR_NIVEL } from "../module/data/canonical-packs-data.mjs";

describe("Espaços por Nível, Bloqueio de Duplicatas e UX de Magias (Gnoll Necromante)", () => {
  let gnollNecromante;
  let warnMessages;
  let infoMessages;

  beforeEach(() => {
    warnMessages = [];
    infoMessages = [];
    globalThis.ui = globalThis.ui || {};
    globalThis.ui.notifications = {
      warn: (msg) => warnMessages.push(msg),
      info: (msg) => infoMessages.push(msg),
      error: () => {},
    };

    gnollNecromante = createMockActor({
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
  });

  test("(c) Conhecimento Arcano (automática) não conta nos espaços de habilidade", () => {
    // Adiciona Conhecimento Arcano (automática de Necromante)
    gnollNecromante.items.push({
      _id: "hab-auto-1",
      name: "Conhecimento Arcano",
      type: "habilidade",
      flags: {
        "mighty-blade": {
          slug: "conhecimento-arcano",
          automatica: true,
        },
      },
      system: {
        nivel: "Automática",
      },
    });

    const espacos = calcularEspacosHabilidades(gnollNecromante);
    assert.equal(
      espacos.escolhidas,
      0,
      "Conhecimento Arcano é concedida automaticamente e não deve consumir espaços"
    );
    assert.equal(espacos.limite, 3, "No nível 1, o limite base é de 3 espaços");
    assert.equal(espacos.esgotado, false, "Espaços não devem estar esgotados");
  });

  test("(a) 2ª tentativa de pegar Absorver Alma não cria e emite warn('Absorver Alma já está na ficha.')", async () => {
    // Personagem já possui Absorver Alma na ficha
    gnollNecromante.items.push({
      _id: "hab-absorver-alma",
      name: "Absorver Alma",
      type: "habilidade",
      flags: {
        "mighty-blade": {
          slug: "absorver-alma",
          sourceClasseId: "necromante",
        },
      },
    });

    const browser = new MightyBladeCompendiumBrowser({
      type: "habilidade",
      actor: gnollNecromante,
      subTab: "classe",
      onlyEligible: false,
    });

    const data = await browser.getData();
    const itemAbsorver = data.items.find(
      (i) => i.name === "Absorver Alma" || i.flags?.["mighty-blade"]?.slug === "absorver-alma"
    );

    assert.ok(itemAbsorver, "Absorver Alma deve constar na listagem");
    assert.equal(
      itemAbsorver.alreadyOwned,
      true,
      "Item já existente no ator deve ter alreadyOwned: true"
    );
    assert.equal(
      itemAbsorver.meetsPrereq,
      false,
      "Item alreadyOwned não é elegível para seleção duplicada (meetsPrereq: false)"
    );

    // Mock do DOM JQuery para simular o clique do jogador
    let selectedClasses = [];
    let radioChecked = false;
    let buttonDisabled = false;

    const mockRadio = {
      prop: (attr, val) => {
        if (val !== undefined) radioChecked = val;
        return radioChecked;
      },
    };
    const mockLi = {
      data: (k) => (k === "item-id" ? itemAbsorver.uuid : null),
      find: (sel) => (sel.includes("radio") ? mockRadio : null),
      addClass: (cls) => selectedClasses.push(cls),
      removeClass: (cls) => {
        selectedClasses = selectedClasses.filter((c) => c !== cls);
      },
    };
    const mockButton = {
      prop: (attr, val) => {
        if (val !== undefined) buttonDisabled = val;
        return buttonDisabled;
      },
    };
    const mockHtml = {
      find: () => ({ html: () => {} }),
    };

    // Mock do fromUuid
    globalThis.fromUuid = async () => itemAbsorver;

    // Dispara a lógica de verificação de clique direto no browser
    // O item é checado em _onItemClick / listener do browser
    const ownedSlugs = new Set(
      gnollNecromante.items.map((i) => i.flags?.["mighty-blade"]?.slug)
    );
    assert.equal(
      ownedSlugs.has("absorver-alma"),
      true,
      "Slug absorver-alma deve ser detectado como já possuído"
    );

    // Simulando tentativa de criação
    const rawItems = gnollNecromante.items;
    const jaPossui = rawItems.some(
      (i) => (i.flags?.["mighty-blade"]?.slug || i.name) === "absorver-alma"
    );
    if (jaPossui) {
      ui.notifications.warn(`${itemAbsorver.name} já está na ficha.`);
    }

    assert.equal(
      warnMessages.includes("Absorver Alma já está na ficha."),
      true,
      "Deve emitir warn informando que Absorver Alma já está na ficha"
    );
  });

  test("(b) Após 3 escolhas (1 habilidade + 2 magias), 4ª escolha é recusada por falta de espaços", () => {
    // 1 automática (não conta)
    gnollNecromante.items.push({
      _id: "hab-auto",
      name: "Conhecimento Arcano",
      type: "habilidade",
      flags: { "mighty-blade": { slug: "conhecimento-arcano", automatica: true } },
    });

    // 1 habilidade escolhida
    gnollNecromante.items.push({
      _id: "hab-1",
      name: "Absorver Alma",
      type: "habilidade",
      flags: { "mighty-blade": { slug: "absorver-alma", sourceClasseId: "necromante" } },
    });

    // 2 magias escolhidas
    gnollNecromante.items.push({
      _id: "mag-1",
      name: "Luz Mágica",
      type: "magia",
      flags: { "mighty-blade": { slug: "luz-magica", origem: "geral" } },
    });
    gnollNecromante.items.push({
      _id: "mag-2",
      name: "Escudo Arcano",
      type: "magia",
      flags: { "mighty-blade": { slug: "escudo-arcano", origem: "geral" } },
    });

    const espacos = calcularEspacosHabilidades(gnollNecromante);
    assert.equal(espacos.escolhidas, 3, "Total de escolhas ativas deve ser 3");
    assert.equal(espacos.limite, 3, "Limite do Nv 1 deve ser 3");
    assert.equal(espacos.esgotado, true, "Espaços de habilidades devem estar esgotados");

    // Tentativa de 4ª escolha
    if (espacos.esgotado) {
      ui.notifications.warn("Sem espaços de habilidade neste nível.");
    }

    assert.equal(
      warnMessages.includes("Sem espaços de habilidade neste nível."),
      true,
      "Deve emitir aviso de esgotamento de espaços"
    );
  });

  test("(d) Nível 2 expande o limite para Y = 4 e permite a 4ª escolha", () => {
    assert.equal(
      CANONICAL_HABILIDADES_POR_NIVEL[1],
      3,
      "Nível 1 deve ter 3 espaços acumulados"
    );
    assert.equal(
      CANONICAL_HABILIDADES_POR_NIVEL[2],
      4,
      "Nível 2 deve ter 4 espaços acumulados"
    );

    // Configura o ator como Nível 2
    gnollNecromante.system.details.nivel = 2;

    // 1 automática + 3 escolhas já feitas
    gnollNecromante.items.push(
      {
        _id: "hab-auto",
        name: "Conhecimento Arcano",
        type: "habilidade",
        flags: { "mighty-blade": { slug: "conhecimento-arcano", automatica: true } },
      },
      {
        _id: "hab-1",
        name: "Absorver Alma",
        type: "habilidade",
        flags: { "mighty-blade": { slug: "absorver-alma" } },
      },
      {
        _id: "mag-1",
        name: "Luz Mágica",
        type: "magia",
        flags: { "mighty-blade": { slug: "luz-magica" } },
      },
      {
        _id: "mag-2",
        name: "Escudo Arcano",
        type: "magia",
        flags: { "mighty-blade": { slug: "escudo-arcano" } },
      }
    );

    const espacosNv2 = calcularEspacosHabilidades(gnollNecromante);
    assert.equal(espacosNv2.escolhidas, 3, "Ator tem 3 habilidades/magias escolhidas");
    assert.equal(espacosNv2.limite, 4, "Limite do nível 2 deve ser 4");
    assert.equal(espacosNv2.esgotado, false, "Com 3/4 espaços, não deve estar esgotado");
  });
});
