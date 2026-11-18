import { capturarSchema } from "./test-helper.mjs";
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { montarDadosDoActor, exportarParaCanonico, acharEquipamentoDoSite } from "../module/helpers/ida-e-volta.mjs";

/**
 * Fase 4: ficha do site → Foundry → site. Simula o que o TypeDataModel faz (descarta o que não
 * declara) para garantir que nada do site se perde no caminho.
 */

/** Corta do objeto tudo o que o schema não declara, como o Foundry faz no Actor.create. */
function limparPeloSchema(campos, dados) {
  if (!dados || typeof dados !== "object") return dados;
  const saida = {};
  for (const [k, campo] of Object.entries(campos)) {
    if (!(k in dados)) continue;
    saida[k] = campo.tipo === "schema" ? limparPeloSchema(campo.args, dados[k]) : JSON.parse(JSON.stringify(dados[k]));
  }
  return saida;
}

const SCHEMA = await capturarSchema();

/** Site → Actor "salvo" (system limpo pelo schema) → site. */
function idaEVolta(ficha) {
  const { actorData, avisos } = montarDadosDoActor(ficha);
  const salvo = { ...actorData, system: limparPeloSchema(SCHEMA, actorData.system) };
  const volta = exportarParaCanonico(salvo);
  return { actorData, salvo, volta: volta.ficha, avisos: [...avisos, ...volta.avisos] };
}

const UID = "3f2b8c1e-5a7d-4e9f-8b6a-1c2d3e4f5a6b";
const fichaCompleta = () => ({
  schemaVersion: "1.2",
  slug: "personagem-abc123",
  name: "Ayla",
  type: "character",
  system: {
    attributes: { forca: { base: 2 }, agilidade: { base: 4 }, inteligencia: { base: 3 }, vontade: { base: 2 } },
    resources: { vida: { value: 18, max: 22 }, mana: { value: 10, max: 14 } },
    details: {
      nivel: 0, experiencia: 3, dinheiro: 45, aprendiz: "", caminho: "", organizacao: "", antecedente: "",
      evolucao: "", idiomas: "Comum", motivacao: "Vingança", condicao: "", idade: 23,
      condicoesAtivas: ["caido"], resistenciasTemp: ["Fogo"], vulnerabilidadesTemp: [], imunidadesTemp: ["Veneno"],
      companheiro: { nome: "Brasa", tipo: "lobo" },
      historicoDinheiro: [{ valor: 5, motivo: "venda" }],
      usarManualDoCombatente: true,
      inventario: [
        { uid: UID, refId: "elixir-de-vida", equipado: false, qualidade: "Mediana", material: "Aco", maoEMeiaAtivo: false, sintonizado: false, isEspolio: false, quantidade: 2 },
        { uid: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d", refId: "corda", equipado: false, qualidade: "Mediana", material: "Aco", maoEMeiaAtivo: false, sintonizado: false, isEspolio: true, quantidade: 1, nomeCustomizado: "Corda do avô", anotacoes: "não vende" },
      ],
      aflicoes: [{ id: "x1", nome: "Maldição", efeito: "-1", duracao: "1 dia" }],
    },
    progressao: [{ nivel: 1, peGasto: 0, habilidade: "faca-os-sangrar" }],
    anotacoes: "notas do jogador",
    karma: 2,
    pastaId: "pasta-1",
    visibilidade: "PUBLICA",
    biography: "<p>História</p>",
  },
  items: [
    { slug: "humano", name: "Humano", type: "raca", system: { efeitos: [] } },
    { slug: "faca-os-sangrar", name: "Faça-os Sangrar", type: "habilidade", system: { efeitos: [{ alvo: "x" }] } },
  ],
  flags: { "mighty-blade-site": { tema: "escuro" } },
});

describe("Fase 4 — ida e volta site ↔ Foundry", () => {
  test("mochila do site vira Items do compêndio, com alias de id antigo", () => {
    const { actorData } = montarDadosDoActor(fichaCompleta());
    const mochila = actorData.items.filter((i) => i.flags["mighty-blade"].inventario);
    assert.equal(mochila.length, 2);
    const elixir = mochila.find((i) => i.flags["mighty-blade"].inventario.uid === UID);
    assert.equal(elixir.flags["mighty-blade"].slug, "elixir-de-cura");
    assert.equal(elixir.system.quantidade, 2);
    const corda = mochila.find((i) => i.flags["mighty-blade"].siteId === "corda");
    assert.equal(corda.name, "Corda do avô");
    assert.equal(corda.flags["mighty-blade"].slug, "corda-10m");
    assert.equal(actorData.system.details.inventario, undefined);
  });

  test("campos só do site vão para a flag e não ficam no system", () => {
    const { actorData } = montarDadosDoActor(fichaCompleta());
    const site = actorData.flags["mighty-blade"].site;
    assert.equal(site.system.anotacoes, "notas do jogador");
    assert.equal(site.system.karma, 2);
    assert.deepEqual(site.system.details.companheiro, { nome: "Brasa", tipo: "lobo" });
    assert.equal(site.system.details.usarManualDoCombatente, true);
    assert.equal(actorData.system.anotacoes, undefined);
    assert.equal(actorData.system.details.companheiro, undefined);
    assert.equal(actorData.flags["mighty-blade"].slug, "personagem-abc123");
    assert.equal(actorData.system.details.idade, "23");
  });

  test("a ficha volta igual depois do Foundry limpar o system", () => {
    const original = fichaCompleta();
    const { volta, avisos } = idaEVolta(original);
    assert.deepEqual(avisos, []);
    assert.equal(volta.schemaVersion, "1.2");
    assert.equal(volta.slug, "personagem-abc123");
    assert.deepEqual(volta.system.attributes, original.system.attributes);
    assert.deepEqual(volta.system.resources, original.system.resources);
    assert.deepEqual(volta.system.progressao, original.system.progressao);
    assert.deepEqual(volta.flags, original.flags);
    for (const k of ["anotacoes", "karma", "pastaId", "visibilidade", "biography"]) assert.deepEqual(volta.system[k], original.system[k], k);
    const d = volta.system.details, o = original.system.details;
    for (const k of ["nivel", "experiencia", "dinheiro", "idiomas", "motivacao", "condicoesAtivas", "resistenciasTemp", "imunidadesTemp", "companheiro", "historicoDinheiro", "usarManualDoCombatente", "aflicoes"]) {
      assert.deepEqual(d[k], o[k], k);
    }
    assert.equal(d.idade, "23"); // o site aceita texto ou número
    // mochila: mesma coisa, id do site de hoje (elixir-de-vida → elixir-de-cura no site também é alias)
    const porUid = Object.fromEntries(d.inventario.map((i) => [i.uid, i]));
    assert.deepEqual(porUid[UID], { ...o.inventario[0], refId: "elixir-de-vida" });
    assert.deepEqual(porUid[o.inventario[1].uid], o.inventario[1]);
    // itens do envelope voltam com o system do site
    assert.deepEqual(volta.items.map((i) => i.slug), ["humano", "faca-os-sangrar"]);
    assert.deepEqual(volta.items[1].system, original.items[1].system);
  });

  test("item que não está no compêndio entra como equipamento genérico e volta", () => {
    const f = fichaCompleta();
    f.system.details.inventario = [{ uid: UID, refId: "item-homebrew-xyz", equipado: true, qualidade: "Mediana", material: "Aco", maoEMeiaAtivo: false, sintonizado: false, isEspolio: false, quantidade: 1 }];
    const { actorData, volta, avisos } = idaEVolta(f);
    assert.equal(actorData.items.at(-1).type, "equipamento");
    assert.ok(avisos.some((a) => a.includes("item-homebrew-xyz")));
    assert.deepEqual(volta.system.details.inventario, f.system.details.inventario);
  });

  test("item criado no Foundry sem correspondência no site fica guardado fora da mochila", () => {
    const { salvo } = idaEVolta(fichaCompleta());
    salvo.items.push({ name: "Espada do Mestre", type: "arma", system: { dano: 9 }, flags: {} });
    salvo.items.push({ name: "Caminho do Fogo", type: "caminho", system: {}, flags: { "mighty-blade": { slug: "caminho-do-fogo" } } });
    const { ficha, avisos } = exportarParaCanonico(salvo);
    assert.equal(ficha.system.details.inventario.length, 2);
    assert.deepEqual(ficha.flags["mighty-blade-foundry"].itensSemCorrespondencia.map((i) => i.name), ["Espada do Mestre"]);
    assert.equal(ficha.system.details.caminho, "caminho-do-fogo");
    assert.ok(!ficha.items.some((i) => i.type === "caminho"));
    assert.ok(avisos.some((a) => a.includes("Espada do Mestre")));
  });

  test("item do compêndio arrastado no Foundry vira item da mochila com uid novo", () => {
    const { salvo } = idaEVolta(fichaCompleta());
    const canon = acharEquipamentoDoSite("oleo-de-fogo");
    salvo.items.push({ name: canon.name, type: canon.type, system: { ...canon.system, quantidade: 3 }, flags: { "mighty-blade": { ...canon.flags["mighty-blade"] } } });
    const { ficha } = exportarParaCanonico(salvo);
    const oleo = ficha.system.details.inventario.find((i) => i.refId === "oleo-de-fogo");
    assert.ok(oleo);
    assert.equal(oleo.quantidade, 3);
    assert.match(oleo.uid, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  test("ficha antiga (sem mochila, sem flags) continua importando", () => {
    const { actorData, avisos } = montarDadosDoActor({ schemaVersion: "1.0", name: "Velho", type: "character", system: { details: { nivel: 1 } }, items: [] });
    assert.deepEqual(actorData.items, []);
    assert.deepEqual(avisos, []);
    assert.equal(actorData.flags["mighty-blade"].site, undefined);
  });

  test("todo equipamento do compêndio tem o id do site", () => {
    // 383 equipamentos, cada um com siteId (o export_canonical_content grava)
    assert.ok(acharEquipamentoDoSite("corda"));
    assert.ok(acharEquipamentoDoSite("tenda-pequena"));
    assert.ok(acharEquipamentoDoSite("quarto-grande-para-oito"));
  });
});
