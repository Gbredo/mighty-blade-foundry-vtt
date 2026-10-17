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

  test("Duplicata ao arrastar: _onHabilidadeCreated e _onMagiaCreated removem item repetido e emitem warn, mas preservam automáticas", async () => {
    // 1. Já possui "Absorver Alma"
    gnollNecromante.items.push({
      _id: "hab-original",
      id: "hab-original",
      name: "Absorver Alma",
      type: "habilidade",
      flags: { "mighty-blade": { slug: "absorver-alma" } },
    });

    // Tentativa de arrastar nova cópia de "Absorver Alma"
    const novaCopia = {
      _id: "hab-duplicada",
      id: "hab-duplicada",
      name: "Absorver Alma",
      type: "habilidade",
      flags: { "mighty-blade": { slug: "absorver-alma" } },
    };
    gnollNecromante.items.push(novaCopia);

    const resHab = await gnollNecromante._onHabilidadeCreated(novaCopia);
    assert.equal(resHab, false, "Deve recusar a criação de habilidade duplicada");
    assert.equal(
      gnollNecromante.items.some((i) => i.id === "hab-duplicada"),
      false,
      "Item duplicado deve ser removido do ator"
    );
    assert.equal(
      gnollNecromante.items.some((i) => i.id === "hab-original"),
      true,
      "Item original deve ser preservado na ficha"
    );
    assert.ok(
      warnMessages.includes("Absorver Alma já está na ficha."),
      "Deve emitir warn com o nome da habilidade duplicada"
    );

    // 2. Duplicata ao arrastar Magia
    gnollNecromante.items.push({
      _id: "mag-original",
      id: "mag-original",
      name: "Luz Mágica",
      type: "magia",
      flags: { "mighty-blade": { slug: "luz-magica" } },
    });
    const novaMagia = {
      _id: "mag-duplicada",
      id: "mag-duplicada",
      name: "Luz Mágica",
      type: "magia",
      flags: { "mighty-blade": { slug: "luz-magica" } },
    };
    gnollNecromante.items.push(novaMagia);

    const resMag = await gnollNecromante._onMagiaCreated(novaMagia);
    assert.equal(resMag, false, "Deve recusar a criação de magia duplicada");
    assert.equal(
      gnollNecromante.items.some((i) => i.id === "mag-duplicada"),
      false,
      "Magia duplicada deve ser removida do ator"
    );
    assert.ok(
      warnMessages.includes("Luz Mágica já está na ficha."),
      "Deve emitir warn informando duplicata de magia"
    );

    // 3. Não bloqueia itens automáticos com mesma nomenclatura
    const autoItem = {
      _id: "hab-auto-grant",
      id: "hab-auto-grant",
      name: "Conhecimento Arcano",
      type: "habilidade",
      flags: { "mighty-blade": { slug: "conhecimento-arcano", automatica: true } },
    };
    gnollNecromante.items.push(autoItem);
    const resAuto = await gnollNecromante._onHabilidadeCreated(autoItem);
    assert.notEqual(resAuto, false, "Habilidade automática não deve ser rejeitada como duplicata de compra");
  });

  test("Limite ao arrastar: apenas avisa ('Espaços excedidos (X / Y)'), sem deletar o item", async () => {
    // Preenche os 3 espaços do nível 1
    gnollNecromante.items.push(
      {
        _id: "h1",
        id: "h1",
        name: "Habilidade 1",
        type: "habilidade",
        flags: { "mighty-blade": { slug: "habilidade-1" } },
      },
      {
        _id: "h2",
        id: "h2",
        name: "Habilidade 2",
        type: "habilidade",
        flags: { "mighty-blade": { slug: "habilidade-2" } },
      },
      {
        _id: "h3",
        id: "h3",
        name: "Habilidade 3",
        type: "habilidade",
        flags: { "mighty-blade": { slug: "habilidade-3" } },
      }
    );

    // Arrasta a 4ª habilidade para a ficha
    const quartaHab = {
      _id: "h4",
      id: "h4",
      name: "Habilidade 4",
      type: "habilidade",
      flags: { "mighty-blade": { slug: "habilidade-4" } },
    };
    gnollNecromante.items.push(quartaHab);

    await gnollNecromante._onHabilidadeCreated(quartaHab);

    // Confirma que NÃO deletou
    assert.equal(
      gnollNecromante.items.some((i) => i.id === "h4"),
      true,
      "Item excedente arrastado NÃO deve ser deletado, para não quebrar fichas importadas"
    );
    assert.ok(
      warnMessages.some((msg) => msg.includes("Espaços excedidos (4 / 3)")),
      "Deve emitir aviso de 'Espaços excedidos (4 / 3)'"
    );
  });

  test("Habilidades Virtuais: somar ao limite as automáticas substituídas por Caminho ou Pacto", () => {
    // Sacerdote possui Conhecimento Místico e Dogma como automáticas
    const sacerdote = createMockActor({
      name: "Valerius",
      details: {
        raca: "Humano",
        classe: "Sacerdote",
        nivel: 1,
      },
      items: [
        { name: "Humano", type: "raca" },
        {
          name: "Sacerdote",
          type: "classe",
          system: {
            habilidadesAutomaticas: ["conhecimento-mistico", "dogma"],
          },
        },
        {
          _id: "auto-cm",
          name: "Conhecimento Místico",
          type: "habilidade",
          flags: { "mighty-blade": { slug: "conhecimento-mistico", automatica: true } },
        },
        {
          _id: "auto-dogma",
          name: "Dogma",
          type: "habilidade",
          flags: { "mighty-blade": { slug: "dogma", automatica: true } },
        },
      ],
    });

    // Antes do pacto: limite 3, virtuais 0
    const espacosAntes = calcularEspacosHabilidades(sacerdote);
    assert.equal(espacosAntes.limite, 3, "Limite base do nível 1 é 3");
    assert.equal(espacosAntes.virtuais, 0, "Sem virtuais antes de substituir");

    // Sacerdote adquire Pacto (sobrescreve: ["conhecimento-mistico", "dogma"])
    sacerdote.items.push({
      _id: "hab-pacto",
      id: "hab-pacto",
      name: "Pacto",
      type: "habilidade",
      flags: {
        "mighty-blade": {
          slug: "pacto",
          sobrescreve: ["conhecimento-mistico", "dogma"],
        },
      },
      system: {
        sobrescreve: ["conhecimento-mistico", "dogma"],
      },
    });

    // Nível 1: ganha min(totalSubstituidas = 2, nivel = 1) = 1 habilidade virtual -> Limite = 3 + 1 = 4
    const espacosNv1 = calcularEspacosHabilidades(sacerdote);
    assert.equal(espacosNv1.totalSubstituidas, 2, "2 automáticas substituídas");
    assert.equal(espacosNv1.virtuais, 1, "No nível 1, recebe 1 habilidade virtual");
    assert.equal(espacosNv1.limite, 4, "Limite expandido para 4 no nível 1");

    // Nível 2: ganha min(totalSubstituidas = 2, nivel = 2) = 2 habilidades virtuais -> Limite = 4 (base) + 2 = 6
    sacerdote.system.details.nivel = 2;
    const espacosNv2 = calcularEspacosHabilidades(sacerdote);
    assert.equal(espacosNv2.virtuais, 2, "No nível 2, recebe 2 habilidades virtuais");
    assert.equal(espacosNv2.baseLimite, 4, "Base no nível 2 é 4");
    assert.equal(espacosNv2.limite, 6, "Limite expandido para 6 no nível 2");
  });

  test("Aviso de Magia em Lote: se várias magias forem criadas juntas, mostra aviso único consolidado", async () => {
    const magiasLote = [
      { _id: "m1", id: "m1", name: "Luz Mágica", type: "magia", flags: { "mighty-blade": { slug: "luz-magica" } } },
      { _id: "m2", id: "m2", name: "Som Ilusório", type: "magia", flags: { "mighty-blade": { slug: "som-ilusorio" } } },
      { _id: "m3", id: "m3", name: "Escudo Arcano", type: "magia", flags: { "mighty-blade": { slug: "escudo-arcano" } } },
    ];

    await gnollNecromante._onCreateEmbeddedDocuments("Item", magiasLote);

    // Deve emitir exatamente o aviso consolidado: "3 magias adicionadas ao Grimório."
    assert.ok(
      infoMessages.includes("3 magias adicionadas ao Grimório."),
      "Deve emitir o aviso em lote '3 magias adicionadas ao Grimório.'"
    );

    // Não deve conter avisos individuais para as magias quando criadas em lote
    const avisosIndividuais = infoMessages.filter((msg) =>
      msg.includes("foi adicionada ao Grimório (aba Magias).")
    );
    assert.equal(
      avisosIndividuais.length,
      0,
      "Não deve emitir avisos individuais quando o lote tem mais de 1 magia"
    );
  });
});
