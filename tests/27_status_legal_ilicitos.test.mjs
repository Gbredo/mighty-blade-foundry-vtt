/**
 * Suíte de Testes Automatizados - Subtítulo 27: Ilícitos, Leis e Status Legal de Equipamentos
 * Mighty Blade 3ª Edição (Guia de Tebryn / Guia do Vilão).
 *
 * Casos de Teste Cobertos:
 * - Caso 1: Validação do Status Legal de Itens (verificarStatusLegal)
 *   * Validação de propriedade `ilegal: true` em extratos, poções e equipamentos.
 *   * Validação canônica por nome (Elixir do Dragão Vermelho, Veneno Restrito, Peçonha Negra, etc.).
 *   * Validação de raridade "ilegal", subtipo, flags e propriedades alternativas.
 *   * Validação de itens legais (comuns e permitidos).
 *   * Resiliência a entradas nulas, indefinidas ou texto puro.
 *
 * - Caso 2: Fiscalização e Porte Ilegal em Metrópoles (verificarPorteIlegal)
 *   * Personagens com itens ilegais acionam teste de Furtividade/Enganação em metrópoles como Tebrynia.
 *   * Retorno estrito: { exigeTesteFurtividade: true, atributoRecomendado: "agilidade", periciaRecomendada: "furtividade", itensIlegais: [...] }.
 *   * Personagens sem itens ilegais retornam { exigeTesteFurtividade: false }.
 *   * Suporte a múltiplos itens ilegais e consolidação de sanções.
 *
 * - Caso 3: Moduladores de Ambiente (Patrulhado vs Ermos / Não Patrulhado)
 *   * Ambientes patrulhados (metrópole, tebrynia, posto fiscal, portão da cidade) acionam teste.
 *   * Ambientes ermos, florestas, ruínas e esconderijos NÃO acionam teste ({ exigeTesteFurtividade: false }).
 *   * Suporte a strings e objetos de contexto customizados.
 *
 * - Caso 4: Procedimentos de Apreensão e Abordagem de Autoridades
 *   * Apreensão de materiais proibidos (apreenderItensIlegais) removendo apenas os ilícitos.
 *   * Simulação de abordagem de patrulha e confronto com DT de fiscalização.
 *   * Sucesso na dissimulação evita fiscalização e apreensão.
 *
 * - Caso 5: Integração com createMockActor e Métodos de Conveniência
 *   * actor.verificarPorteIlegal() e actor.apreenderItensIlegais().
 *   * Reatividade e atualização do inventário.
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  createMockActor,
  STATUS_LEGAL,
  SANCOES_LEGAIS,
  ITENS_ILICITOS_CANONICOS,
  AMBIENTES_PATRULHADOS,
  AMBIENTES_NAO_PATRULHADOS,
  isAmbientePatrulhado,
  verificarStatusLegal,
  verificarPorteIlegal,
  apreenderItensIlegais,
  simularAbordagemPatrulha,
} from "./test-helper.mjs";

// ============================================================================
// CASO 1: VALIDAÇÃO DO STATUS LEGAL DE ITENS E SUBSTÂNCIAS (verificarStatusLegal)
// ============================================================================
test("Caso 1: Validação do Status Legal de Itens e Substâncias", async (t) => {
  await t.test("1.1 - Item marcado explicitamente com system.ilegal = true é ilegal", () => {
    const item = {
      name: "Toxina Paralisante Sintética",
      type: "consumivel",
      system: {
        ilegal: true,
        categoria: "veneno",
        motivoIlegal: "Substância paralisante proibida por decreto municipal.",
      },
    };

    const status = verificarStatusLegal(item);
    assert.equal(status.ilegal, true, "Deveria ser classificado como ilegal");
    assert.equal(status.status, STATUS_LEGAL.ILEGAL);
    assert.equal(status.nome, "Toxina Paralisante Sintética");
    assert.ok(status.motivo.includes("Substância paralisante"), "Motivo customizado preservado");
    assert.ok(Array.isArray(status.sancoes), "Sanções devem ser uma lista");
    assert.ok(status.sancoes.length > 0, "Deve possuir sanções legais previstas");
    assert.ok(status.sancoes.includes(SANCOES_LEGAIS.CONFISCO), "Deve incluir confisco");
  });

  await t.test("1.2 - Elixir do Dragão Vermelho é canonicamente ilegal mesmo sem flag explícita", () => {
    const item = {
      name: "Elixir do Dragão Vermelho",
      type: "pocao",
      system: {},
    };

    const status = verificarStatusLegal(item);
    assert.equal(status.ilegal, true, "Elixir do Dragão Vermelho deve ser ilegal");
    assert.equal(status.status, STATUS_LEGAL.ILEGAL);
    assert.equal(status.categoria, "elixir_proibido");
    assert.ok(status.motivo.includes("Tebrynia"), "Motivo cita as leis de Tebrynia");
    assert.ok(status.sancoes.includes(SANCOES_LEGAIS.JULGAMENTO_ARCHONS), "Deve prever julgamento pelos Archons");
    assert.ok(status.sancoes.includes(SANCOES_LEGAIS.CONFISCO), "Deve prever confisco");
    assert.ok(status.sancoes.includes(SANCOES_LEGAIS.PRISAO), "Deve prever prisão");
  });

  await t.test("1.3 - Veneno Restrito e outras toxinas canônicas são identificados pelo catálogo", () => {
    const venenos = [
      { nome: "Veneno Restrito", catEsperada: "veneno_restrito" },
      { nome: "Peçonha Negra", catEsperada: "veneno_restrito" },
      { nome: "Veneno de Basilisco", catEsperada: "veneno_restrito" },
      { nome: "Extrato de Beladona", catEsperada: "veneno_restrito" },
      { nome: "Névoa da Loucura", catEsperada: "extrato_proibido" },
      { nome: "Toxina do Escorpião Púrpura", catEsperada: "veneno_restrito" },
      { nome: "Pó do Esquecimento", catEsperada: "extrato_proibido" },
      { nome: "Essência da Morte", catEsperada: "veneno_restrito" },
    ];

    for (const v of venenos) {
      const res = verificarStatusLegal({ name: v.nome });
      assert.equal(res.ilegal, true, `${v.nome} deveria ser ilegal`);
      assert.equal(res.categoria, v.catEsperada, `Categoria de ${v.nome} deve ser ${v.catEsperada}`);
      assert.ok(res.sancoes.length > 0, `${v.nome} deve possuir sanções`);
    }
  });

  await t.test("1.4 - Identifica ilegalidade por propriedades, raridade e flags alternativas", () => {
    // A) Raridade "ilegal"
    const itemRaridade = { name: "Extrato Corrompido", system: { raridade: "ilegal" } };
    assert.equal(verificarStatusLegal(itemRaridade).ilegal, true);

    // B) Status legal string
    const itemStatus = { name: "Contrabando Élfico", system: { statusLegal: "ilegal" } };
    assert.equal(verificarStatusLegal(itemStatus).ilegal, true);

    // C) Flag no namespace mighty-blade
    const itemFlag = { name: "Frasco Sombrio", flags: { "mighty-blade": { ilegal: true } } };
    assert.equal(verificarStatusLegal(itemFlag).ilegal, true);

    // D) Propriedades de array contendo "Contrabando" ou "Proibido"
    const itemProps = { name: "Artefato Herege", system: { propriedades: ["Contrabando", "Mágico"] } };
    assert.equal(verificarStatusLegal(itemProps).ilegal, true);

    // E) legal === false
    const itemLegalFalse = { name: "Droga de Rua", system: { legal: false } };
    assert.equal(verificarStatusLegal(itemLegalFalse).ilegal, true);
  });

  await t.test("1.5 - Itens regulares e comuns são classificados como legais", () => {
    const itensLegais = [
      { name: "Poção de Cura Menor", type: "pocao", system: { raridade: "comum" } },
      { name: "Espada Longa", type: "arma", system: { fn: 2 } },
      { name: "Cota de Malha", type: "armadura", system: { defesa: 3 } },
      { name: "Ração de Viagem", type: "equipamento", system: {} },
    ];

    for (const it of itensLegais) {
      const res = verificarStatusLegal(it);
      assert.equal(res.ilegal, false, `${it.name} deve ser legal`);
      assert.equal(res.status, STATUS_LEGAL.LEGAL);
      assert.equal(res.sancoes.length, 0, "Item legal não tem sanções");
      assert.ok(res.motivo.includes("comércio regular") || res.motivo.includes("livre"), "Motivo indica livre circulação");
    }
  });

  await t.test("1.6 - Resiliência a entradas vazias, nulas ou strings literais", () => {
    // Null e undefined
    const resNull = verificarStatusLegal(null);
    assert.equal(resNull.ilegal, false);
    assert.equal(resNull.status, STATUS_LEGAL.LEGAL);

    const resUndefined = verificarStatusLegal(undefined);
    assert.equal(resUndefined.ilegal, false);

    // String direta
    const resStringIlegal = verificarStatusLegal("Elixir do Dragão Vermelho");
    assert.equal(resStringIlegal.ilegal, true);
    assert.equal(resStringIlegal.nome, "Elixir do Dragão Vermelho");

    const resStringLegal = verificarStatusLegal("Tocha Comum");
    assert.equal(resStringLegal.ilegal, false);
  });
});

// ============================================================================
// CASO 2: FISCALIZAÇÃO E PORTE ILEGAL EM METRÓPOLES (verificarPorteIlegal)
// ============================================================================
test("Caso 2: Fiscalização e Porte Ilegal em Metrópoles (Guia de Tebryn / Guia do Vilão)", async (t) => {
  await t.test("2.1 - Personagem portando item ilegal em metrópole aciona teste de Furtividade/Enganação", () => {
    const actor = createMockActor({
      name: "Traficante de Tebrynia",
      items: [
        {
          id: "item-1",
          name: "Elixir do Dragão Vermelho",
          type: "pocao",
          system: { ilegal: true },
        },
        {
          id: "item-2",
          name: "Adaga Oculta",
          type: "arma",
          system: {},
        },
      ],
    });

    const resultado = verificarPorteIlegal(actor, "metropole");

    // Validação estrita das chaves exigidas pela especificação
    assert.equal(resultado.exigeTesteFurtividade, true, "Deve exigir teste de furtividade");
    assert.equal(resultado.atributoRecomendado, "agilidade", "Atributo canônico deve ser Agilidade");
    assert.equal(resultado.periciaRecomendada, "furtividade", "Perícia canônica deve ser Furtividade");
    assert.ok(Array.isArray(resultado.itensIlegais), "itensIlegais deve ser um array");
    assert.equal(resultado.itensIlegais.length, 1, "Deve conter exatamente 1 item ilegal");
    assert.equal(resultado.itensIlegais[0].nome, "Elixir do Dragão Vermelho");
    assert.ok(resultado.motivo.includes("Tebrynia") || resultado.motivo.includes("metropole"));
    assert.equal(resultado.ambientePatrulhado, true);
  });

  await t.test("2.2 - Personagem portando múltiplos itens ilícitos consolida sanções e itens", () => {
    const actor = createMockActor({
      name: "Vilão Alquimista",
      items: [
        { id: "i1", name: "Veneno Restrito", system: { ilegal: true } },
        { id: "i2", name: "Peçonha Negra", system: { ilegal: true } },
        { id: "i3", name: "Névoa da Loucura", system: { ilegal: true } },
        { id: "i4", name: "Cajado Comum", system: {} },
      ],
    });

    const res = verificarPorteIlegal(actor, "tebrynia");
    assert.equal(res.exigeTesteFurtividade, true);
    assert.equal(res.itensIlegais.length, 3);
    assert.equal(res.quantidadeIlegais, 3);
    assert.ok(res.autoridade.includes("Archons") || res.autoridade.includes("Guardas"));
    assert.ok(res.sancoesRecomendadas.includes(SANCOES_LEGAIS.CONFISCO));
    assert.ok(res.sancoesRecomendadas.includes(SANCOES_LEGAIS.PRISAO));
  });

  await t.test("2.3 - Personagem portando apenas itens legais NÃO exige teste de Furtividade", () => {
    const actor = createMockActor({
      name: "Cavaleiro Honrado",
      items: [
        { id: "leg-1", name: "Espada Longa", system: {} },
        { id: "leg-2", name: "Escudo Pesado", system: {} },
        { id: "leg-3", name: "Poção de Cura Menor", system: {} },
      ],
    });

    const res = verificarPorteIlegal(actor, "metropole");
    assert.equal(res.exigeTesteFurtividade, false, "Não deve exigir teste para quem não porta ilícitos");
    assert.equal(res.itensIlegais.length, 0);
    assert.ok(res.motivo.includes("não porta"));
  });

  await t.test("2.4 - Inventário vazio ou ator sem itens não aciona teste", () => {
    const actor = createMockActor({ name: "Mendigo", items: [] });
    const res = verificarPorteIlegal(actor, "metropole");
    assert.equal(res.exigeTesteFurtividade, false);
    assert.equal(res.itensIlegais.length, 0);
  });

  await t.test("2.5 - Actor nulo ou indefinido é tratado com segurança", () => {
    const resNull = verificarPorteIlegal(null, "metropole");
    assert.equal(resNull.exigeTesteFurtividade, false);
    assert.equal(resNull.itensIlegais.length, 0);
  });
});

// ============================================================================
// CASO 3: MODULADORES DE AMBIENTE (PATRULHADO VS ERMOS / NÃO PATRULHADO)
// ============================================================================
test("Caso 3: Moduladores de Ambiente (Patrulhado vs Ermos / Não Patrulhado)", async (t) => {
  await t.test("3.1 - Porte de itens ilegais nos 'ermos' NÃO exige teste de Furtividade", () => {
    const actor = createMockActor({
      name: "Bandido dos Ermos",
      items: [
        { id: "v1", name: "Veneno de Basilisco", system: { ilegal: true } },
      ],
    });

    const res = verificarPorteIlegal(actor, "ermos");
    assert.equal(res.exigeTesteFurtividade, false, "Ambiente ermo não tem guardas, não exige teste");
    assert.equal(res.itensIlegais.length, 1, "Identifica que possui o item, mas dispensa teste");
    assert.equal(res.ambientePatrulhado, false);
    assert.ok(res.motivo.includes("não é patrulhado"));
  });

  await t.test("3.2 - Ambientes selvagens ou isolados dispensam teste de fiscalização", () => {
    const ambientesLivres = [
      "floresta",
      "subterraneo",
      "ruinas",
      "selva",
      "deserto",
      "covil",
      "esconderijo",
      "pantano",
      "mar_aberto",
      "nao_patrulhado",
    ];

    const actor = createMockActor({
      items: [{ name: "Essência da Morte", system: { ilegal: true } }],
    });

    for (const amb of ambientesLivres) {
      assert.equal(isAmbientePatrulhado(amb), false, `${amb} não deve ser patrulhado`);
      const res = verificarPorteIlegal(actor, amb);
      assert.equal(res.exigeTesteFurtividade, false, `${amb} não deve exigir teste de Furtividade`);
    }
  });

  await t.test("3.3 - Ambientes urbanos e pontos de controle acionam teste de fiscalização", () => {
    const ambientesPatrulhados = [
      "metropole",
      "metrópole",
      "tebrynia",
      "tebryn",
      "cidade",
      "porto_imperial",
      "posto_fiscal",
      "fronteira_archons",
      "distrito_nobre",
      "portao_da_cidade",
    ];

    const actor = createMockActor({
      items: [{ name: "Elixir do Dragão Vermelho", system: { ilegal: true } }],
    });

    for (const amb of ambientesPatrulhados) {
      assert.equal(isAmbientePatrulhado(amb), true, `${amb} deve ser patrulhado`);
      const res = verificarPorteIlegal(actor, amb);
      assert.equal(res.exigeTesteFurtividade, true, `${amb} deve exigir teste de Furtividade`);
    }
  });

  await t.test("3.4 - Suporte a contexto em formato de objeto detalhado", () => {
    const actor = createMockActor({
      items: [{ name: "Peçonha Negra", system: { ilegal: true } }],
    });

    // Objeto indicando patrulhado: true explicitamente
    const ctxFiscal = { tipo: "fronteira_sul", patrulhado: true, autoridade: "Archons" };
    const resFiscal = verificarPorteIlegal(actor, ctxFiscal);
    assert.equal(resFiscal.exigeTesteFurtividade, true);

    // Objeto indicando patrulhado: false explicitamente
    const ctxEsconderijo = { tipo: "esconderijo_guilda", patrulhado: false };
    const resEsconderijo = verificarPorteIlegal(actor, ctxEsconderijo);
    assert.equal(resEsconderijo.exigeTesteFurtividade, false);
  });
});

// ============================================================================
// CASO 4: PROCEDIMENTOS DE ABORDAGEM, APREENSÃO E RESOLUÇÃO DE TESTE
// ============================================================================
test("Caso 4: Procedimentos de Abordagem e Apreensão de Materiais Ilícitos", async (t) => {
  await t.test("4.1 - Simulação de abordagem com sucesso no teste de Furtividade", () => {
    const actor = createMockActor({
      name: "Ladino Furtivo",
      items: [
        { id: "d1", name: "Elixir do Dragão Vermelho", system: { ilegal: true } },
      ],
    });

    // Rolagem 15 contra DT padrão 12
    const simulacao = simularAbordagemPatrulha(actor, 15, {
      contextoAmbiente: "metropole",
      apreenderEmCasoDeFalha: true,
    });

    assert.equal(simulacao.evitouAbordagem, true, "Deve evitar a abordagem com sucesso");
    assert.equal(simulacao.itensApreendidos.length, 0, "Nenhum item deve ser apreendido no sucesso");
    assert.ok(simulacao.mensagem.includes("Sucesso"), "Mensagem de sucesso esperada");
    assert.equal(actor.items.length, 1, "Item permanece no inventário");
  });

  await t.test("4.2 - Simulação de falha na abordagem aciona apreensão quando habilitada", () => {
    const actor = createMockActor({
      name: "Contrabandista Descuidado",
      items: [
        { id: "p1", name: "Peçonha Negra", system: { ilegal: true } },
        { id: "e1", name: "Capa Élfica Legal", system: {} },
      ],
    });

    // Rolagem 8 contra DT 12
    const simulacao = simularAbordagemPatrulha(actor, 8, {
      contextoAmbiente: "tebrynia",
      dificuldade: 12,
      apreenderEmCasoDeFalha: true,
    });

    assert.equal(simulacao.evitouAbordagem, false, "Deve falhar na dissimulação");
    assert.equal(simulacao.itensApreendidos.length, 1, "Item ilegal deve ser confiscado");
    assert.equal(simulacao.itensApreendidos[0].name, "Peçonha Negra");
    assert.ok(simulacao.mensagem.includes("Falha"), "Mensagem de falha esperada");

    // Item legal é mantido
    assert.equal(actor.items.length, 1, "Apenas item legal permanece");
    assert.equal(actor.items[0].name, "Capa Élfica Legal");
  });

  await t.test("4.3 - apreenderItensIlegais confisca estritamente materiais proibidos", () => {
    const actor = createMockActor({
      name: "Alquimista Clandestino",
      items: [
        { id: "c1", name: "Poção de Vida", system: {} },
        { id: "i1", name: "Elixir do Dragão Vermelho", system: { ilegal: true } },
        { id: "c2", name: "Adaga de Aço", system: {} },
        { id: "i2", name: "Veneno Restrito", system: { ilegal: true } },
      ],
    });

    const apreendidos = apreenderItensIlegais(actor);
    assert.equal(apreendidos.length, 2, "Deve apreender exatamente 2 itens");
    assert.ok(apreendidos.some((i) => i.name === "Elixir do Dragão Vermelho"));
    assert.ok(apreendidos.some((i) => i.name === "Veneno Restrito"));

    // O ator agora deve ter apenas os 2 itens legais
    assert.equal(actor.items.length, 2);
    assert.ok(actor.items.every((i) => !verificarStatusLegal(i).ilegal));

    // Segunda chamada idempotente: nenhum item a mais para apreender
    const segundaApreensao = apreenderItensIlegais(actor);
    assert.equal(segundaApreensao.length, 0);
  });
});

// ============================================================================
// CASO 5: INTEGRAÇÃO COM createMockActor E MÉTODOS DE CONVENIÊNCIA
// ============================================================================
test("Caso 5: Integração com createMockActor e Métodos de Conveniência", async (t) => {
  await t.test("5.1 - actor.verificarPorteIlegal() funciona diretamente na instância", () => {
    const actor = createMockActor({
      name: "Assassino dos Archons",
      items: [
        { id: "vx", name: "Veneno de Basilisco", system: { ilegal: true } },
      ],
    });

    const checagemMetropole = actor.verificarPorteIlegal("metropole");
    assert.equal(checagemMetropole.exigeTesteFurtividade, true);
    assert.equal(checagemMetropole.atributoRecomendado, "agilidade");
    assert.equal(checagemMetropole.periciaRecomendada, "furtividade");

    const checagemErmos = actor.verificarPorteIlegal("ermos");
    assert.equal(checagemErmos.exigeTesteFurtividade, false);
  });

  await t.test("5.2 - actor.apreenderItensIlegais() limpa itens ilícitos e recomputa dados", () => {
    const actor = createMockActor({
      name: "Ladino Capturado",
      items: [
        { id: "t1", name: "Névoa da Loucura", system: { ilegal: true } },
        { id: "t2", name: "Tocha", system: {} },
      ],
    });

    assert.equal(actor.items.length, 2);
    const confiscados = actor.apreenderItensIlegais();
    assert.equal(confiscados.length, 1);
    assert.equal(actor.items.length, 1);
    assert.equal(actor.items[0].name, "Tocha");

    // Agora em metrópole não deve mais exigir teste
    const novaChecagem = actor.verificarPorteIlegal("metropole");
    assert.equal(novaChecagem.exigeTesteFurtividade, false);
  });
});
