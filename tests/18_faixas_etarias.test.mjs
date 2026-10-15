/**
 * Suíte de Testes Automatizados - Subtítulo 18: Faixas Etárias, Envelhecimento e Efeitos Biológicos
 * Mighty Blade 3ª Edição (Foundry VTT v14)
 *
 * Casos de Teste Cobertos:
 * - Caso 18.1: Filhotes (Todos Atributos = 1; 5 PV e 5 PM; sem benefícios raciais; Tamanho Miúdo -2)
 * - Caso 18.2: Crianças (Atributos Iniciais -3 min 1; 10 PV e 10 PM; sem benefícios raciais; Tamanho Pequeno -1)
 * - Caso 18.3: Adolescentes (Atributos Iniciais -1 min 2; 30 PV e 30 PM; recebem Habilidade Racial; Tamanho Médio 0)
 * - Caso 18.4: Adultos (Atributos integrais; 60 PV e 60 PM; benefícios raciais integrais; Tamanho Médio 0)
 * - Caso 18.5: Idosos em Raças Comuns (Testes FOR/AGI DV 10; falha reduz -1 min 2; +1 livre em Vontade ou Inteligência)
 * - Caso 18.6: Anciãos em Raças Comuns (-1 imediato em todos os atributos min 1; testes anuais com DV 12)
 * - Caso 18.7: Exceção Elfos e Levents (Não perdem Atributos; +1 Vontade/Inteligência em Idoso; Ciclos de 50/25 anos)
 * - Caso 18.8: Falência Orgânica em Longevos (10 falhas acumuladas -> falência orgânica e morte plácida em dias = Vontade)
 * - Caso 18.9: Transições de Ciclo de Vida, Reatividade e Normalização
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  createMockActor,
  aplicarFaixaEtaria,
  testarEnvelhecimentoIdoso,
  testarEnvelhecimentoAnual,
  processarCicloLongevo,
  isRacaLongeva,
  obterFaixaEtaria,
  obterTamanhoFaixa,
  obterAtributosIniciais,
  obterCicloAnos,
  FAIXAS_ETARIAS,
  FAIXA_FILHOTE,
  FAIXA_CRIANCA,
  FAIXA_ADOLESCENTE,
  FAIXA_ADULTO,
  FAIXA_IDOSO,
  FAIXA_ANCIAO,
  TAMANHOS_FAIXA,
  DIFICULDADE_TESTE_IDOSO,
  DIFICULDADE_TESTE_ANCIAO,
  LIMITE_FALHAS_LONGEVOS,
  RACAS_LONGEVAS,
  CICLOS_ANOS_LONGEVAS,
} from "./test-helper.mjs";

// ============================================================================
// CASO 18.1: FILHOTES
// ============================================================================
test("Caso 18.1: Faixa Etária Filhote", async (t) => {
  await t.test("18.1.1 - Filhotes têm todos os atributos estritamente iguais a 1", () => {
    const actor = createMockActor({
      name: "Filhote de Urso",
      attributes: { forca: 5, agilidade: 4, inteligencia: 3, vontade: 3 },
    });

    const resultado = aplicarFaixaEtaria(actor, "filhote");

    assert.equal(resultado.atributos.forca, 1);
    assert.equal(resultado.atributos.agilidade, 1);
    assert.equal(resultado.atributos.inteligencia, 1);
    assert.equal(resultado.atributos.vontade, 1);

    assert.equal(actor.system.attributes.forca.value, 1);
    assert.equal(actor.system.attributes.agilidade.value, 1);
    assert.equal(actor.system.attributes.inteligencia.value, 1);
    assert.equal(actor.system.attributes.vontade.value, 1);
  });

  await t.test("18.1.2 - Filhotes têm exatamente 5 PV e 5 PM (máximo e valor)", () => {
    const actor = createMockActor({
      name: "Lobisomem Filhote",
      resources: { vida: { value: 60, max: 60 }, mana: { value: 60, max: 60 } },
    });

    const resultado = aplicarFaixaEtaria(actor, "filhote");

    assert.equal(resultado.pv, 5);
    assert.equal(resultado.pm, 5);
    assert.equal(actor.system.resources.vida.max, 5);
    assert.equal(actor.system.resources.vida.value, 5);
    assert.equal(actor.system.resources.mana.max, 5);
    assert.equal(actor.system.resources.mana.value, 5);
  });

  await t.test("18.1.3 - Filhotes não recebem benefícios raciais nem habilidade racial", () => {
    const actor = createMockActor({
      name: "Filhote Juban",
      details: { raca: "juban" },
    });

    const resultado = aplicarFaixaEtaria(actor, "filhote");

    assert.equal(resultado.beneficiosRaciais, false);
    assert.equal(resultado.habilidadeRacial, false);
    assert.equal(actor.system.details.beneficiosRaciais, false);
    assert.equal(actor.system.details.habilidadeRacial, false);
  });

  await t.test("18.1.4 - Filhotes possuem Tamanho Miúdo com modificador de tamanho -2", () => {
    const actor = createMockActor({ name: "Cão Filhote" });

    const resultado = aplicarFaixaEtaria(actor, "filhote");

    assert.equal(resultado.tamanho, "miudo");
    assert.equal(resultado.modificadorTamanho, -2);
    assert.equal(actor.system.details.tamanho, "miudo");
    assert.equal(actor.system.details.modificadorTamanho, -2);
  });

  await t.test("18.1.5 - Método de conveniência actor.aplicarFaixaEtaria('filhote') funciona identicamente", () => {
    const actor = createMockActor({
      name: "Filhote Selvagem",
      attributes: { forca: 4, agilidade: 3, inteligencia: 2, vontade: 2 },
    });

    const resultado = actor.aplicarFaixaEtaria("filhote");

    assert.equal(resultado.faixaEtaria, "filhote");
    assert.equal(actor.obterFaixaEtaria(), "filhote");
    assert.equal(actor.system.attributes.forca.value, 1);
    assert.equal(actor.system.resources.vida.max, 5);
    assert.equal(actor.system.details.modificadorTamanho, -2);
  });
});

// ============================================================================
// CASO 18.2: CRIANÇAS
// ============================================================================
test("Caso 18.2: Faixa Etária Criança", async (t) => {
  await t.test("18.2.1 - Crianças reduzem Atributos Iniciais em -3 com piso mínimo de 1", () => {
    const actor = createMockActor({
      name: "Jovem Garoto",
      attributes: { forca: 5, agilidade: 4, inteligencia: 3, vontade: 2 },
    });

    const resultado = aplicarFaixaEtaria(actor, "crianca");

    // 5 - 3 = 2
    assert.equal(resultado.atributos.forca, 2);
    // 4 - 3 = 1
    assert.equal(resultado.atributos.agilidade, 1);
    // 3 - 3 = 0 -> clampa em 1 (mínimo 1)
    assert.equal(resultado.atributos.inteligencia, 1);
    // 2 - 3 = -1 -> clampa em 1 (mínimo 1)
    assert.equal(resultado.atributos.vontade, 1);

    assert.equal(actor.system.attributes.forca.value, 2);
    assert.equal(actor.system.attributes.agilidade.value, 1);
    assert.equal(actor.system.attributes.inteligencia.value, 1);
    assert.equal(actor.system.attributes.vontade.value, 1);
  });

  await t.test("18.2.2 - Piso mínimo de 1 é rigorosamente mantido para atributos baixos", () => {
    const actor = createMockActor({
      name: "Menino Frágil",
      attributes: { forca: 1, agilidade: 1, inteligencia: 1, vontade: 1 },
    });

    const resultado = aplicarFaixaEtaria(actor, "criança");

    assert.equal(resultado.atributos.forca, 1);
    assert.equal(resultado.atributos.agilidade, 1);
    assert.equal(resultado.atributos.inteligencia, 1);
    assert.equal(resultado.atributos.vontade, 1);
  });

  await t.test("18.2.3 - Crianças têm 10 PV e 10 PM", () => {
    const actor = createMockActor({
      name: "Criança Humana",
      resources: { vida: { value: 60, max: 60 }, mana: { value: 60, max: 60 } },
    });

    const resultado = aplicarFaixaEtaria(actor, "crianca");

    assert.equal(resultado.pv, 10);
    assert.equal(resultado.pm, 10);
    assert.equal(actor.system.resources.vida.max, 10);
    assert.equal(actor.system.resources.vida.value, 10);
    assert.equal(actor.system.resources.mana.max, 10);
    assert.equal(actor.system.resources.mana.value, 10);
  });

  await t.test("18.2.4 - Crianças não recebem benefícios raciais", () => {
    const actor = createMockActor({
      name: "Criança Anã",
      details: { raca: "anao" },
    });

    const resultado = aplicarFaixaEtaria(actor, "crianca");

    assert.equal(resultado.beneficiosRaciais, false);
    assert.equal(resultado.habilidadeRacial, false);
    assert.equal(actor.system.details.beneficiosRaciais, false);
  });

  await t.test("18.2.5 - Crianças possuem Tamanho Pequeno com modificador de tamanho -1", () => {
    const actor = createMockActor({ name: "Criança Metadília" });

    const resultado = aplicarFaixaEtaria(actor, "crianca");

    assert.equal(resultado.tamanho, "pequeno");
    assert.equal(resultado.modificadorTamanho, -1);
    assert.equal(actor.system.details.tamanho, "pequeno");
    assert.equal(actor.system.details.modificadorTamanho, -1);
  });
});

// ============================================================================
// CASO 18.3: ADOLESCENTES
// ============================================================================
test("Caso 18.3: Faixa Etária Adolescente", async (t) => {
  await t.test("18.3.1 - Adolescentes reduzem Atributos Iniciais em -1 com piso mínimo de 2", () => {
    const actor = createMockActor({
      name: "Rapaz Ágil",
      attributes: { forca: 4, agilidade: 3, inteligencia: 2, vontade: 2 },
    });

    const resultado = aplicarFaixaEtaria(actor, "adolescente");

    // 4 - 1 = 3
    assert.equal(resultado.atributos.forca, 3);
    // 3 - 1 = 2
    assert.equal(resultado.atributos.agilidade, 2);
    // 2 - 1 = 1 -> clampa em 2 (mínimo 2)
    assert.equal(resultado.atributos.inteligencia, 2);
    // 2 - 1 = 1 -> clampa em 2 (mínimo 2)
    assert.equal(resultado.atributos.vontade, 2);

    assert.equal(actor.system.attributes.forca.value, 3);
    assert.equal(actor.system.attributes.agilidade.value, 2);
    assert.equal(actor.system.attributes.inteligencia.value, 2);
    assert.equal(actor.system.attributes.vontade.value, 2);
  });

  await t.test("18.3.2 - Adolescentes têm metade dos PVs/PMs de um adulto (30/30)", () => {
    const actor = createMockActor({
      name: "Jovem Guerreiro",
      resources: { vida: { value: 60, max: 60 }, mana: { value: 60, max: 60 } },
    });

    const resultado = aplicarFaixaEtaria(actor, "adolescente");

    assert.equal(resultado.pv, 30);
    assert.equal(resultado.pm, 30);
    assert.equal(actor.system.resources.vida.max, 30);
    assert.equal(actor.system.resources.vida.value, 30);
    assert.equal(actor.system.resources.mana.max, 30);
    assert.equal(actor.system.resources.mana.value, 30);
  });

  await t.test("18.3.3 - Adolescentes recebem Habilidade Racial ativa", () => {
    const actor = createMockActor({
      name: "Jovem Fauno",
      details: { raca: "fauno" },
    });

    const resultado = aplicarFaixaEtaria(actor, "adolescente");

    assert.equal(resultado.habilidadeRacial, true);
    assert.equal(resultado.beneficiosRaciais, true);
    assert.equal(actor.system.details.habilidadeRacial, true);
  });

  await t.test("18.3.4 - Adolescentes têm Tamanho Médio com modificador 0", () => {
    const actor = createMockActor({ name: "Adolescente Humano" });

    const resultado = aplicarFaixaEtaria(actor, "adolescente");

    assert.equal(resultado.tamanho, "medio");
    assert.equal(resultado.modificadorTamanho, 0);
    assert.equal(actor.system.details.tamanho, "medio");
    assert.equal(actor.system.details.modificadorTamanho, 0);
  });
});

// ============================================================================
// CASO 18.4: ADULTOS
// ============================================================================
test("Caso 18.4: Faixa Etária Adulto", async (t) => {
  await t.test("18.4.1 - Adultos mantêm Atributos Iniciais integrais sem redução", () => {
    const actor = createMockActor({
      name: "Campeão Adulto",
      attributes: { forca: 4, agilidade: 3, inteligencia: 3, vontade: 2 },
    });

    const resultado = aplicarFaixaEtaria(actor, "adulto");

    assert.equal(resultado.atributos.forca, 4);
    assert.equal(resultado.atributos.agilidade, 3);
    assert.equal(resultado.atributos.inteligencia, 3);
    assert.equal(resultado.atributos.vontade, 2);
    assert.equal(actor.system.attributes.forca.value, 4);
  });

  await t.test("18.4.2 - Adultos têm padrão 60 PV e 60 PM", () => {
    const actor = createMockActor({ name: "Adulto Padrão" });

    const resultado = aplicarFaixaEtaria(actor, "adulto");

    assert.equal(resultado.pv, 60);
    assert.equal(resultado.pm, 60);
    assert.equal(actor.system.resources.vida.max, 60);
    assert.equal(actor.system.resources.mana.max, 60);
  });

  await t.test("18.4.3 - Adultos mantêm benefícios raciais integrais e tamanho médio", () => {
    const actor = createMockActor({ name: "Veterano" });

    const resultado = aplicarFaixaEtaria(actor, "adulto");

    assert.equal(resultado.beneficiosRaciais, true);
    assert.equal(resultado.habilidadeRacial, true);
    assert.equal(resultado.tamanho, "medio");
    assert.equal(resultado.modificadorTamanho, 0);
  });
});

// ============================================================================
// CASO 18.5: IDOSOS EM RAÇAS COMUNS (HUMANOS, ANÕES, FAUNOS ETC.)
// ============================================================================
test("Caso 18.5: Faixa Etária Idoso em Raças Comuns", async (t) => {
  await t.test("18.5.1 - Falha no teste de FOR (< 10) reduz -1 permanente com mínimo 2", () => {
    const actor = createMockActor({
      name: "Humano Idoso",
      attributes: { forca: 4, agilidade: 3, inteligencia: 2, vontade: 2 },
      details: { raca: "humano" },
    });

    // Força falhou (8 < 10); Agilidade passou (12 >= 10)
    const resultado = aplicarFaixaEtaria(actor, "idoso", {
      testeForca: 8,
      testeAgilidade: 12,
      aumentoMental: "vontade",
    });

    assert.equal(resultado.atributos.forca, 3, "Força deve reduzir de 4 para 3");
    assert.equal(resultado.atributos.agilidade, 3, "Agilidade deve ser mantida em 3");
    assert.equal(resultado.testes.forca.sucesso, false);
    assert.equal(resultado.testes.agilidade.sucesso, true);
  });

  await t.test("18.5.2 - Falha no teste de AGI (< 10) reduz -1 permanente com mínimo 2", () => {
    const actor = createMockActor({
      name: "Anão Idoso",
      attributes: { forca: 4, agilidade: 3, inteligencia: 2, vontade: 2 },
      details: { raca: "anao" },
    });

    // Força passou (10 >= 10); Agilidade falhou (7 < 10)
    const resultado = aplicarFaixaEtaria(actor, "idoso", {
      testeForca: 10,
      testeAgilidade: 7,
      aumentoMental: "inteligencia",
    });

    assert.equal(resultado.atributos.forca, 4, "Força deve se manter intacta");
    assert.equal(resultado.atributos.agilidade, 2, "Agilidade deve reduzir de 3 para 2");
    assert.equal(resultado.testes.agilidade.sucesso, false);
  });

  await t.test("18.5.3 - Sucesso em ambos os testes (FOR >= 10 e AGI >= 10) preserva atributos físicos", () => {
    const actor = createMockActor({
      name: "Veterano Rijo",
      attributes: { forca: 4, agilidade: 3, inteligencia: 3, vontade: 3 },
      details: { raca: "humano" },
    });

    const resultado = aplicarFaixaEtaria(actor, "idoso", {
      testeForca: 11,
      testeAgilidade: 10,
      aumentoMental: "vontade",
    });

    assert.equal(resultado.atributos.forca, 4);
    assert.equal(resultado.atributos.agilidade, 3);
  });

  await t.test("18.5.4 - Piso mínimo 2 em FOR e AGI não reduz abaixo de 2 mesmo em falha", () => {
    const actor = createMockActor({
      name: "Mago Velho",
      attributes: { forca: 2, agilidade: 2, inteligencia: 4, vontade: 4 },
      details: { raca: "humano" },
    });

    const resultado = aplicarFaixaEtaria(actor, "idoso", {
      testeForca: 4,
      testeAgilidade: 5,
    });

    assert.equal(resultado.atributos.forca, 2, "Força não pode cair abaixo de 2");
    assert.equal(resultado.atributos.agilidade, 2, "Agilidade não pode cair abaixo de 2");
  });

  await t.test("18.5.5 - Idoso concede +1 livre em Vontade", () => {
    const actor = createMockActor({
      name: "Sábio",
      attributes: { forca: 3, agilidade: 3, inteligencia: 3, vontade: 3 },
      details: { raca: "humano" },
    });

    const resultado = aplicarFaixaEtaria(actor, "idoso", {
      testeForca: 10,
      testeAgilidade: 10,
      aumentoMental: "vontade",
    });

    assert.equal(resultado.atributos.vontade, 4, "Vontade deve aumentar em +1");
    assert.equal(resultado.atributos.inteligencia, 3, "Inteligência permanece inalterada");
    assert.equal(resultado.aumentoMentalAplicado, "vontade");
    assert.equal(actor.system.attributes.vontade.value, 4);
  });

  await t.test("18.5.6 - Idoso concede +1 livre em Inteligência", () => {
    const actor = createMockActor({
      name: "Erudito",
      attributes: { forca: 3, agilidade: 3, inteligencia: 3, vontade: 3 },
      details: { raca: "humano" },
    });

    const resultado = aplicarFaixaEtaria(actor, "idoso", {
      testeForca: 10,
      testeAgilidade: 10,
      aumentoMental: "inteligencia",
    });

    assert.equal(resultado.atributos.inteligencia, 4, "Inteligência deve aumentar em +1");
    assert.equal(resultado.atributos.vontade, 3, "Vontade permanece inalterada");
    assert.equal(resultado.aumentoMentalAplicado, "inteligencia");
    assert.equal(actor.system.attributes.inteligencia.value, 4);
  });

  await t.test("18.5.7 - testarEnvelhecimentoIdoso isolado atualiza o ator", () => {
    const actor = createMockActor({
      name: "Humano Cansado",
      attributes: { forca: 4, agilidade: 4, inteligencia: 2, vontade: 2 },
      details: { raca: "humano" },
    });

    const res = testarEnvelhecimentoIdoso(actor, {
      testeForca: 6,      // Falha
      testeAgilidade: 11, // Sucesso
    });

    assert.equal(res.forca.sucesso, false);
    assert.equal(res.forca.valor, 3);
    assert.equal(res.agilidade.sucesso, true);
    assert.equal(res.agilidade.valor, 4);
    assert.equal(actor.system.attributes.forca.value, 3);
    assert.equal(actor.system.attributes.agilidade.value, 4);
  });
});

// ============================================================================
// CASO 18.6: ANCIÃOS EM RAÇAS COMUNS
// ============================================================================
test("Caso 18.6: Faixa Etária Ancião em Raças Comuns", async (t) => {
  await t.test("18.6.1 - Entrada na faixa Ancião aplica -1 imediato em todos os atributos (mínimo 1)", () => {
    const actor = createMockActor({
      name: "Ancião Humano",
      attributes: { forca: 3, agilidade: 2, inteligencia: 4, vontade: 4 },
      details: { raca: "humano" },
    });

    const resultado = aplicarFaixaEtaria(actor, "ancião");

    assert.equal(resultado.atributos.forca, 2);
    assert.equal(resultado.atributos.agilidade, 1);
    assert.equal(resultado.atributos.inteligencia, 3);
    assert.equal(resultado.atributos.vontade, 3);

    assert.equal(actor.system.attributes.forca.value, 2);
    assert.equal(actor.system.attributes.agilidade.value, 1);
    assert.equal(actor.system.attributes.inteligencia.value, 3);
    assert.equal(actor.system.attributes.vontade.value, 3);
  });

  await t.test("18.6.2 - Piso mínimo de 1 é rigorosamente mantido para todos os atributos", () => {
    const actor = createMockActor({
      name: "Ancião Decrépito",
      attributes: { forca: 1, agilidade: 1, inteligencia: 1, vontade: 1 },
      details: { raca: "humano" },
    });

    const resultado = aplicarFaixaEtaria(actor, "anciao");

    assert.equal(resultado.atributos.forca, 1);
    assert.equal(resultado.atributos.agilidade, 1);
    assert.equal(resultado.atributos.inteligencia, 1);
    assert.equal(resultado.atributos.vontade, 1);
  });

  await t.test("18.6.3 - Teste anual de Ancião tem Dificuldade canônica 12", () => {
    assert.equal(DIFICULDADE_TESTE_ANCIAO, 12);
  });

  await t.test("18.6.4 - Sucesso no teste anual (>= 12) preserva atributos", () => {
    const actor = createMockActor({
      name: "Ancião Resiliente",
      attributes: { forca: 2, agilidade: 2, inteligencia: 3, vontade: 3 },
      details: { raca: "humano" },
    });

    const res = testarEnvelhecimentoAnual(actor, {
      testeAnual: 13,
      atributo: "forca",
    });

    assert.equal(res.sucesso, true);
    assert.equal(res.penalidadeAplicada, 0);
    assert.equal(res.novoValor, 2);
    assert.equal(actor.system.attributes.forca.value, 2);
  });

  await t.test("18.6.5 - Falha no teste anual (< 12) reduz -1 permanente no atributo (mínimo 1)", () => {
    const actor = createMockActor({
      name: "Ancião Fragilizado",
      attributes: { forca: 3, agilidade: 2, inteligencia: 3, vontade: 3 },
      details: { raca: "humano" },
    });

    const res = testarEnvelhecimentoAnual(actor, {
      testeAnual: 9,
      atributo: "forca",
    });

    assert.equal(res.sucesso, false);
    assert.equal(res.penalidadeAplicada, 1);
    assert.equal(res.novoValor, 2);
    assert.equal(actor.system.attributes.forca.value, 2);
  });
});

// ============================================================================
// CASO 18.7: EXCEÇÃO ELFOS E LEVENTS (RAÇAS LONGEVAS)
// ============================================================================
test("Caso 18.7: Exceção Elfos e Levents (Raças Longevas)", async (t) => {
  await t.test("18.7.1 - isRacaLongeva identifica Elfos e Levents corretamente", () => {
    assert.equal(isRacaLongeva("elfo"), true);
    assert.equal(isRacaLongeva("Elfo da Floresta"), true);
    assert.equal(isRacaLongeva("levent"), true);
    assert.equal(isRacaLongeva("Levent Alado"), true);
    assert.equal(isRacaLongeva("humano"), false);
    assert.equal(isRacaLongeva("anao"), false);
  });

  await t.test("18.7.2 - Elfos e Levents NÃO perdem Atributos por idade ao atingirem Idoso", () => {
    const elfo = createMockActor({
      name: "Arquimago Elfo",
      attributes: { forca: 3, agilidade: 4, inteligencia: 4, vontade: 4 },
      details: { raca: "elfo" },
    });

    // Mesmo enviando falhas nos testes físicos, eles não perdem atributos!
    const resElfo = aplicarFaixaEtaria(elfo, "idoso", {
      testeForca: 4,      // Falha simulada ignorada
      testeAgilidade: 3,  // Falha simulada ignorada
      aumentoMental: "vontade",
    });

    assert.equal(resElfo.isLongevo, true);
    assert.equal(resElfo.atributos.forca, 3, "Força de Elfo não deve cair");
    assert.equal(resElfo.atributos.agilidade, 4, "Agilidade de Elfo não deve cair");
    assert.equal(resElfo.atributos.vontade, 5, "Recebe +1 em Vontade");

    const levent = createMockActor({
      name: "Senescal Levent",
      attributes: { forca: 3, agilidade: 4, inteligencia: 3, vontade: 4 },
      details: { raca: "levent" },
    });

    const resLevent = aplicarFaixaEtaria(levent, "idoso", {
      testeForca: 2,
      testeAgilidade: 2,
      aumentoMental: "inteligencia",
    });

    assert.equal(resLevent.isLongevo, true);
    assert.equal(resLevent.atributos.forca, 3, "Força de Levent não deve cair");
    assert.equal(resLevent.atributos.agilidade, 4, "Agilidade de Levent não deve cair");
    assert.equal(resLevent.atributos.inteligencia, 4, "Recebe +1 em Inteligência");
  });

  await t.test("18.7.3 - Ciclos de anos canônicos: Elfos = 50 anos, Levents = 25 anos", () => {
    assert.equal(CICLOS_ANOS_LONGEVAS.elfo, 50);
    assert.equal(CICLOS_ANOS_LONGEVAS.levent, 25);
    assert.equal(obterCicloAnos("elfo"), 50);
    assert.equal(obterCicloAnos("levent"), 25);
  });

  await t.test("18.7.4 - Elfos e Levents não entram na categoria Ancião e não perdem atributos", () => {
    const elfo = createMockActor({
      name: "Elfo Antigo",
      attributes: { forca: 3, agilidade: 4, inteligencia: 4, vontade: 4 },
      details: { raca: "elfo" },
    });

    const res = aplicarFaixaEtaria(elfo, "ancião");
    assert.equal(res.atributos.forca, 3);
    assert.equal(res.atributos.agilidade, 4);

    const resAnual = testarEnvelhecimentoAnual(elfo, { testeAnual: 5 });
    assert.equal(resAnual.imune, true);
  });
});

// ============================================================================
// CASO 18.8: FALÊNCIA ORGÂNICA EM LONGEVOS (10 FALHAS ACUMULADAS)
// ============================================================================
test("Caso 18.8: Falência Orgânica em Longevos", async (t) => {
  await t.test("18.8.1 - Menos de 10 falhas acumuladas (1 a 9) não disparam falência orgânica", () => {
    const elfo = createMockActor({
      name: "Elfo no Nono Ciclo",
      attributes: { forca: 3, agilidade: 4, inteligencia: 4, vontade: 4 },
      details: { raca: "elfo", falhasEnvelhecimento: 8 },
    });

    // 9ª falha
    const res = processarCicloLongevo(elfo, { sucesso: false });

    assert.equal(res.falhasAcumuladas, 9);
    assert.equal(res.falenciaOrganica, false);
    assert.equal(res.diasDeVidaRestantes, null);
    assert.equal(res.falhasRestantes, 1);
  });

  await t.test("18.8.2 - Ao acumular 10 falhas entram em falência orgânica", () => {
    const elfo = createMockActor({
      name: "Elfo Centenário",
      attributes: { forca: 3, agilidade: 4, inteligencia: 4, vontade: 4 },
      details: { raca: "elfo", falhasEnvelhecimento: 9 },
    });

    // 10ª falha
    const res = processarCicloLongevo(elfo, { sucesso: false });

    assert.equal(res.falhasAcumuladas, 10);
    assert.equal(res.falenciaOrganica, true);
    assert.equal(res.falhasRestantes, 0);
  });

  await t.test("18.8.3 - Morrem placidamente em dias iguais à sua Vontade (Vontade 4 = 4 dias)", () => {
    const elfo = createMockActor({
      name: "Sacerdote Elfo",
      attributes: { forca: 2, agilidade: 3, inteligencia: 5, vontade: 4 },
      details: { raca: "elfo", falhasEnvelhecimento: 9 },
    });

    const res = processarCicloLongevo(elfo, { sucesso: false });

    assert.equal(res.falenciaOrganica, true);
    assert.equal(res.diasDeVidaRestantes, 4, "Dias restantes devem ser iguais à Vontade (4)");
    assert.equal(elfo.system.details.falenciaOrganica, true);
    assert.equal(elfo.system.details.diasDeVidaRestantes, 4);
    assert.equal(elfo.system.details.estadoBiologico, "falencia_organica");
  });

  await t.test("18.8.4 - Longevo com Vontade 6 morre placidamente em 6 dias", () => {
    const levent = createMockActor({
      name: "Místico Levent",
      attributes: { forca: 2, agilidade: 3, inteligencia: 4, vontade: 6 },
      details: { raca: "levent" },
    });

    const res = processarCicloLongevo(levent, { falhasAdicionais: 10 });

    assert.equal(res.falenciaOrganica, true);
    assert.equal(res.diasDeVidaRestantes, 6, "Dias restantes devem ser iguais à Vontade (6)");
  });

  await t.test("18.8.5 - aplicarFaixaEtaria detecta falência orgânica imediata se falhas >= 10", () => {
    const elfo = createMockActor({
      name: "Elfo Ancestral",
      attributes: { forca: 3, agilidade: 3, inteligencia: 4, vontade: 5 },
      details: { raca: "elfo" },
    });

    const resultado = aplicarFaixaEtaria(elfo, "idoso", {
      falhasAcumuladas: 10,
      aumentoMental: "vontade",
    });

    // Vontade era 5, ganhou +1 de idoso = 6. Dias restantes = 6!
    assert.equal(resultado.falenciaOrganica, true);
    assert.equal(resultado.diasDeVidaRestantes, 6);
    assert.equal(elfo.system.details.diasDeVidaRestantes, 6);
  });
});

// ============================================================================
// CASO 18.9: TRANSIÇÕES DE FAIXA, PERSISTÊNCIA E REATIVIDADE
// ============================================================================
test("Caso 18.9: Transições de Faixa, Persistência e Reatividade", async (t) => {
  await t.test("18.9.1 - Transição completa Filhote -> Criança -> Adolescente -> Adulto preserva atributos base", () => {
    const actor = createMockActor({
      name: "Lobisomem em Crescimento",
      attributes: { forca: 5, agilidade: 4, inteligencia: 2, vontade: 3 },
    });

    // 1. Filhote
    actor.aplicarFaixaEtaria("filhote");
    assert.equal(actor.system.attributes.forca.value, 1);
    assert.equal(actor.system.resources.vida.max, 5);
    assert.equal(actor.system.details.modificadorTamanho, -2);

    // 2. Criança (base 5 - 3 = 2, base 4 - 3 = 1)
    actor.aplicarFaixaEtaria("crianca");
    assert.equal(actor.system.attributes.forca.value, 2);
    assert.equal(actor.system.attributes.agilidade.value, 1);
    assert.equal(actor.system.resources.vida.max, 10);
    assert.equal(actor.system.details.modificadorTamanho, -1);

    // 3. Adolescente (base 5 - 1 = 4, base 4 - 1 = 3)
    actor.aplicarFaixaEtaria("adolescente");
    assert.equal(actor.system.attributes.forca.value, 4);
    assert.equal(actor.system.attributes.agilidade.value, 3);
    assert.equal(actor.system.resources.vida.max, 30);
    assert.equal(actor.system.details.modificadorTamanho, 0);

    // 4. Adulto (base integral 5, 4, 2, 3)
    actor.aplicarFaixaEtaria("adulto");
    assert.equal(actor.system.attributes.forca.value, 5);
    assert.equal(actor.system.attributes.agilidade.value, 4);
    assert.equal(actor.system.resources.vida.max, 60);
    assert.equal(actor.system.details.modificadorTamanho, 0);
  });

  await t.test("18.9.2 - Normalização insensível a acentuação e maiúsculas", () => {
    const actor = createMockActor({ name: "Teste Normalização" });

    assert.equal(aplicarFaixaEtaria(actor, "FILHOTE").faixaEtaria, "filhote");
    assert.equal(aplicarFaixaEtaria(actor, "Criança").faixaEtaria, "crianca");
    assert.equal(aplicarFaixaEtaria(actor, "Adolescente").faixaEtaria, "adolescente");
    assert.equal(aplicarFaixaEtaria(actor, "ADULTO").faixaEtaria, "adulto");
    assert.equal(aplicarFaixaEtaria(actor, "Idoso").faixaEtaria, "idoso");
    assert.equal(aplicarFaixaEtaria(actor, "Ancião").faixaEtaria, "anciao");
  });

  await t.test("18.9.3 - Flags e detalhes registrados no Foundry VTT", () => {
    const actor = createMockActor({ name: "Herói com Flags" });

    actor.aplicarFaixaEtaria("crianca");

    assert.equal(actor.getFlag("mighty-blade", "faixaEtaria"), "crianca");
    assert.equal(actor.getFlag("mighty-blade", "tamanho"), "pequeno");
    assert.equal(actor.getFlag("mighty-blade", "modificadorTamanho"), -1);
    assert.equal(actor.system.details.faixaEtaria, "crianca");
  });

  await t.test("18.9.4 - Tabela canônica FAIXAS_ETARIAS contém exatamente as 6 faixas", () => {
    assert.equal(FAIXAS_ETARIAS.length, 6);
    assert.deepEqual(FAIXAS_ETARIAS, [
      "filhote",
      "crianca",
      "adolescente",
      "adulto",
      "idoso",
      "anciao",
    ]);
  });
});
