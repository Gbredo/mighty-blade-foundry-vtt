import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createMockActor } from "./test-helper.mjs";
import {
  MightyBladeCompendiumBrowser,
  obterSubAbasCompendio,
  calcularEspacosHabilidades,
  obterVagasMusicaAtor,
  alocarVagaMusica,
  musicaCompativelComTipos,
} from "../module/apps/compendium-browser.mjs";
import {
  CANONICAL_HABILIDADES,
} from "../module/data/canonical-packs-data.mjs";

describe("C3c-3c — Sistema de Músicas Concedidas no Foundry (Compendium Browser e Ator)", () => {
  test("1. Bardo Nível 1 com Poesia dos Bardos tem 2 vagas de qualquer tipo", () => {
    const bardo = createMockActor({
      name: "Trovador",
      details: { raca: "Humano", classe: "Bardo", nivel: 1 },
      items: [
        { name: "Humano", type: "raca" },
        { name: "Bardo", type: "classe" },
      ],
    });

    const info = obterVagasMusicaAtor(bardo);
    assert.equal(info.temConcessora, true);
    assert.equal(info.totalVagas, 2);
    assert.equal(info.totalLivres, 2);

    const poesia = info.concessoras.find((c) => c.id === "poesia-dos-bardos");
    assert.ok(poesia);
    assert.equal(poesia.quantidade, 2);
    assert.equal(poesia.tipos, "qualquer");

    const cancao = CANONICAL_HABILIDADES.find((h) => h.name === "Canção de Ninar");
    const ritmo = CANONICAL_HABILIDADES.find((h) => h.name === "Ritmo de Marcha");
    const melodia = CANONICAL_HABILIDADES.find((h) => h.name === "Melodia Dançante");

    assert.equal(musicaCompativelComTipos(cancao, poesia.tipos), true);
    assert.equal(musicaCompativelComTipos(ritmo, poesia.tipos), true);
    assert.equal(musicaCompativelComTipos(melodia, poesia.tipos), true);
  });

  test("2. Instrumentista só oferece Ritmos", () => {
    const ator = createMockActor({
      name: "Guerreiro Musico",
      details: { raca: "Humano", classe: "Guerreiro", nivel: 1 },
      items: [
        { name: "Humano", type: "raca" },
        { name: "Guerreiro", type: "classe" },
        {
          name: "Instrumentista",
          type: "habilidade",
          flags: { "mighty-blade": { slug: "instrumentista" } },
          system: {
            concedeMusicas: { quantidade: 1, tipos: ["Ritmo"] },
          },
        },
      ],
    });

    const info = obterVagasMusicaAtor(ator);
    assert.equal(info.temConcessora, true);
    assert.equal(info.totalVagas, 1);

    const inst = info.concessoras.find((c) => c.id === "instrumentista");
    assert.ok(inst);
    assert.deepEqual(inst.tipos, ["Ritmo"]);

    const ritmo = CANONICAL_HABILIDADES.find((h) => h.name === "Ritmo de Marcha");
    const cancao = CANONICAL_HABILIDADES.find((h) => h.name === "Canção de Ninar");
    const melodia = CANONICAL_HABILIDADES.find((h) => h.name === "Melodia Dançante");

    assert.equal(musicaCompativelComTipos(ritmo, inst.tipos), true);
    assert.equal(musicaCompativelComTipos(cancao, inst.tipos), false);
    assert.equal(musicaCompativelComTipos(melodia, inst.tipos), false);
  });

  test("3. Canção da Sereia (Nível 5) aparece desabilitada no nível 1 com aviso de nível", async () => {
    const bardo = createMockActor({
      name: "Bardo Iniciante",
      details: { raca: "Humano", classe: "Bardo", nivel: 1 },
      items: [
        { name: "Humano", type: "raca" },
        { name: "Bardo", type: "classe" },
        { name: "Eloquente", type: "habilidade", flags: { "mighty-blade": { slug: "eloquente" } } },
      ],
    });

    const browser = new MightyBladeCompendiumBrowser({
      actor: bardo,
      type: "habilidade",
      subTab: "musicas",
      onlyEligible: false,
    });

    const data = await browser.getData();
    const sereia = data.items.find((i) => i.name === "Canção da Sereia");
    assert.ok(sereia, "Canção da Sereia deve estar na lista");
    assert.equal(sereia.meetsPrereq, false, "Canção da Sereia não deve estar elegível no nível 1");
    assert.ok(sereia.ineligivelMotivo.includes("Nível 5"));
  });

  test("4. Fantasma da Ópera (três tipos) entra em qualquer filtro", () => {
    const fantasma = CANONICAL_HABILIDADES.find((h) => h.name === "Fantasma da Ópera");
    assert.ok(fantasma);

    assert.equal(musicaCompativelComTipos(fantasma, ["Ritmo"]), true);
    assert.equal(musicaCompativelComTipos(fantasma, ["Canção"]), true);
    assert.equal(musicaCompativelComTipos(fantasma, ["Melodia"]), true);
    assert.equal(musicaCompativelComTipos(fantasma, "qualquer"), true);
  });

  test("5. A mesma Música não pode ser escolhida duas vezes", () => {
    const bardo = createMockActor({
      name: "Bardo Cantador",
      details: { raca: "Humano", classe: "Bardo", nivel: 1 },
      items: [
        { name: "Humano", type: "raca" },
        { name: "Bardo", type: "classe" },
        {
          name: "Ritmo de Marcha",
          type: "habilidade",
          flags: { "mighty-blade": { slug: "ritmo-de-marcha", concedidaPor: "poesia-dos-bardos" } },
          system: { categoria: "musica", tipoMusica: "Ritmo", concedidaPor: "poesia-dos-bardos" },
        },
      ],
    });

    const ritmo = CANONICAL_HABILIDADES.find((h) => h.name === "Ritmo de Marcha");
    const aloc = alocarVagaMusica(bardo, ritmo);
    assert.equal(aloc.sucesso, false);
    assert.equal(aloc.motivo, "ja_possui");
    assert.ok(aloc.msg.includes("já está na ficha"));
  });

  test("6. Desmarcar Instrumentista remove o Ritmo escolhido", async () => {
    const ator = createMockActor({
      name: "Musico Guerreiro",
      details: { raca: "Humano", classe: "Guerreiro", nivel: 1 },
      items: [
        { name: "Humano", type: "raca" },
        { name: "Guerreiro", type: "classe" },
        {
          name: "Instrumentista",
          type: "habilidade",
          flags: { "mighty-blade": { slug: "instrumentista" } },
          system: { concedeMusicas: { quantidade: 1, tipos: ["Ritmo"] } },
        },
        {
          name: "Ritmo de Marcha",
          type: "habilidade",
          flags: { "mighty-blade": { slug: "ritmo-de-marcha", concedidaPor: "instrumentista" } },
          system: { categoria: "musica", tipoMusica: "Ritmo", concedidaPor: "instrumentista" },
        },
      ],
    });

    const habInst = ator.items.find((i) => i.name === "Instrumentista");
    assert.ok(habInst);

    // Deletar a habilidade Instrumentista
    await ator.deleteEmbeddedDocuments("Item", [habInst.id]);

    // O Ritmo concedido deve ter sido removido automaticamente
    const ritmoRestante = ator.items.find((i) => i.name === "Ritmo de Marcha");
    assert.equal(ritmoRestante, undefined, "Ritmo de Marcha concedido por Instrumentista deve ter sido removido");
  });

  test("7. Músicas concedidas não contam no limite de habilidades por nível", () => {
    const bardo = createMockActor({
      name: "Bardo Estudioso",
      details: { raca: "Humano", classe: "Bardo", nivel: 1 },
      items: [
        { name: "Humano", type: "raca" },
        { name: "Bardo", type: "classe" },
        // 3 habilidades compradas (limite máximo do nível 1)
        { name: "Sentidos Apurados", type: "habilidade", flags: { "mighty-blade": { slug: "sentidos-apurados" } } },
        { name: "Atletismo", type: "habilidade", flags: { "mighty-blade": { slug: "atletismo" } } },
        { name: "Instrumentista", type: "habilidade", flags: { "mighty-blade": { slug: "instrumentista" } } },
        // 2 Músicas concedidas por Poesia dos Bardos
        {
          name: "Canção de Ninar",
          type: "habilidade",
          flags: { "mighty-blade": { slug: "cancao-de-ninar", concedidaPor: "poesia-dos-bardos" } },
          system: { categoria: "musica", tipoMusica: "Canção", concedidaPor: "poesia-dos-bardos" },
        },
        {
          name: "Ritmo de Marcha",
          type: "habilidade",
          flags: { "mighty-blade": { slug: "ritmo-de-marcha", concedidaPor: "poesia-dos-bardos" } },
          system: { categoria: "musica", tipoMusica: "Ritmo", concedidaPor: "poesia-dos-bardos" },
        },
      ],
    });

    const espacos = calcularEspacosHabilidades(bardo);
    assert.equal(espacos.limite, 3, "Limite do Nível 1 é 3");
    assert.equal(espacos.escolhidas, 3, "Apenas as 3 habilidades compradas contam no limite");
    assert.equal(espacos.esgotado, true, "Com 3 habilidades compradas o limite está preenchido sem estourar");
  });

  test("8. Sub-aba Músicas no navegador de compêndio aparece para quem tem concessora e não aparece para quem não tem", () => {
    const guerreiro = createMockActor({
      name: "Guerreiro Puro",
      details: { raca: "Humano", classe: "Guerreiro", nivel: 1 },
      items: [
        { name: "Humano", type: "raca" },
        { name: "Guerreiro", type: "classe" },
      ],
    });

    const subGuerreiro = obterSubAbasCompendio(guerreiro, "habilidade");
    assert.equal(subGuerreiro.some((s) => s.id === "musicas"), false, "Guerreiro sem concessora não tem sub-aba Músicas");

    const bardo = createMockActor({
      name: "Bardo Menestrel",
      details: { raca: "Humano", classe: "Bardo", nivel: 1 },
      items: [
        { name: "Humano", type: "raca" },
        { name: "Bardo", type: "classe" },
      ],
    });

    const subBardo = obterSubAbasCompendio(bardo, "habilidade");
    assert.equal(subBardo.some((s) => s.id === "musicas"), true, "Bardo possui sub-aba Músicas visível");
  });

  test("9. Bloqueio com aviso se tentar pegar sem vaga livre compatível: Sem vaga de Música (Instrumentista: 1 Ritmo — já usada)", () => {
    const ator = createMockActor({
      name: "Guerreiro Musico",
      details: { raca: "Humano", classe: "Guerreiro", nivel: 1 },
      items: [
        { name: "Humano", type: "raca" },
        { name: "Guerreiro", type: "classe" },
        {
          name: "Instrumentista",
          type: "habilidade",
          flags: { "mighty-blade": { slug: "instrumentista" } },
          system: {
            concedeMusicas: { quantidade: 1, tipos: ["Ritmo"] },
          },
        },
        {
          name: "Ritmo de Marcha",
          type: "habilidade",
          flags: { "mighty-blade": { slug: "ritmo-de-marcha", concedidaPor: "instrumentista" } },
          system: { categoria: "musica", tipoMusica: "Ritmo", concedidaPor: "instrumentista" },
        },
      ],
    });

    const furia = CANONICAL_HABILIDADES.find((h) => h.name === "Ritmo da Fúria");
    const aloc = alocarVagaMusica(ator, furia);
    assert.equal(aloc.sucesso, false);
    assert.equal(aloc.motivo, "sem_vagas");
    assert.equal(aloc.msg, "Sem vaga de Música (Instrumentista: 1 Ritmo — já usada)");
  });
});
