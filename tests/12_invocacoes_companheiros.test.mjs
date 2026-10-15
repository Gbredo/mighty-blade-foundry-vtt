/**
 * Suíte de Testes Automatizados - Subtítulo 12: Companheiros Animais, Invocações e Construtos
 * Mighty Blade 3ª Edição (Foundry VTT v14)
 *
 * Casos Canônicos Cobertos:
 * - Caso 60: Validação de Limite de Invocações e Companheiros Animais
 *   (Restrição de 1 ativo por padrão; expansão por Companheiro Animal 2/3/4, Domador ou Invocador).
 * - Caso 61: Escalonamento Proporcional de Estatísticas (PVs, Defesa, Dano)
 *   (Golens, Familiares, Construtos escalam com Vontade ou Nível; bônus de Invocação Persistente/Versátil).
 * - Caso 62: Manutenção de Controle e Custo Sustentado de Mana
 *   (Consumo por turno/minuto, validação de sustentabilidade, exaustão ao zerar PM e transbordamento para PV).
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  createMockActor,
  validarLimiteInvocacoes,
  calcularEscalonamentoInvocacao,
  calcularManutencaoControle,
  aplicarManutencaoControle,
  calcularLimiteInvocacoes,
  TABELA_BASE_INVOCACOES,
  CUSTO_MANUTENCAO_PADRAO,
} from "./test-helper.mjs";

// ============================================================================
// CASO 60: VALIDAÇÃO DE LIMITE DE INVOCAÇÕES E COMPANHEIROS ANIMAIS
// ============================================================================
test("Caso 60: Validação de Limite de Invocações e Companheiros Animais", async (t) => {
  await t.test("60.1 - Restrição padrão de 1 Companheiro Animal / Familiar ativo para personagem comum", () => {
    const actor = createMockActor({
      name: "Guerreiro Comum",
      details: { nivel: 1, classe: "Guerreiro", caminho: "" },
      attributes: { vontade: 3 },
    });

    assert.equal(calcularLimiteInvocacoes(actor), 1, "Limite padrão deve ser rigorosamente 1");

    // Com 0 invocações, pode convocar
    const validacaoZero = validarLimiteInvocacoes(actor, 0);
    assert.equal(validacaoZero.valido, true);
    assert.equal(validacaoZero.permitido, true);
    assert.equal(validacaoZero.podeAdicionar, true);
    assert.equal(validacaoZero.limite, 1);
    assert.equal(validacaoZero.restante, 1);

    // Com 1 invocação ativa, está dentro do limite mas não pode convocar outra
    const validacaoUm = validarLimiteInvocacoes(actor, 1);
    assert.equal(validacaoUm.valido, true);
    assert.equal(validacaoUm.permitido, true);
    assert.equal(validacaoUm.podeAdicionar, false, "Não pode adicionar outra quando já atingiu o teto de 1");
    assert.equal(validacaoUm.restante, 0);
    assert.equal(validacaoUm.excedente, 0);
  });

  await t.test("60.2 - Violação de limite ao tentar manter 2 invocações ativas sem talentos especiais", () => {
    const actor = createMockActor({
      name: "Conjurador Novato",
      details: { nivel: 1, classe: "Feiticeiro" },
      attributes: { vontade: 4 },
    });

    const validacaoDois = validarLimiteInvocacoes(actor, 2);
    assert.equal(validacaoDois.valido, false, "2 invocações viola o limite padrão de 1");
    assert.equal(validacaoDois.permitido, false);
    assert.equal(validacaoDois.excedente, 1);
    assert.ok(validacaoDois.motivo.includes("Limite de invocações excedido"));

    // Tentar adicionar 1 quando já tem 1 ativo
    const tentarAdicionar = validarLimiteInvocacoes(actor, 1, 1);
    assert.equal(tentarAdicionar.valido, false, "1 ativa + 1 nova = 2, excede limite");
    assert.equal(tentarAdicionar.permitido, false);
  });

  await t.test("60.3 - Suporte tanto a contagem numérica quanto a arrays de objetos/nomes", () => {
    const actor = createMockActor({ name: "Herói" });

    const arrayValido = [{ name: "Lobo Cinzento" }];
    const validacaoArray1 = validarLimiteInvocacoes(actor, arrayValido);
    assert.equal(validacaoArray1.valido, true);
    assert.equal(validacaoArray1.atuais, 1);

    const arrayInvalido = [{ name: "Lobo Cinzento" }, { name: "Águia Caçadora" }];
    const validacaoArray2 = validarLimiteInvocacoes(actor, arrayInvalido);
    assert.equal(validacaoArray2.valido, false);
    assert.equal(validacaoArray2.atuais, 2);
    assert.equal(validacaoArray2.excedente, 1);
  });

  await t.test("60.4 - Personagem com 'Companheiro Animal 2' eleva o limite para até 2 ativos", () => {
    const actor = createMockActor({
      name: "Ranger Experiente",
      items: [
        {
          name: "Companheiro Animal 2",
          type: "habilidade",
          flags: { "mighty-blade": { slug: "companheiro-animal-2" } },
        },
      ],
    });

    assert.equal(calcularLimiteInvocacoes(actor), 2, "Companheiro Animal 2 expande teto para 2");

    const checagemDois = validarLimiteInvocacoes(actor, 2);
    assert.equal(checagemDois.valido, true);
    assert.equal(checagemDois.permitido, true);
    assert.equal(checagemDois.podeAdicionar, false);

    const checagemTres = validarLimiteInvocacoes(actor, 3);
    assert.equal(checagemTres.valido, false, "3 companheiros excede o teto de 2");
  });

  await t.test("60.5 - Personagem com 'Companheiro Animal 3' eleva o limite para até 3 ativos", () => {
    const actor = createMockActor({
      name: "Mestre dos Bosques",
      items: [
        {
          name: "Companheiro Animal 3",
          type: "habilidade",
          flags: { "mighty-blade": { slug: "companheiro-animal-3" } },
        },
      ],
    });

    assert.equal(calcularLimiteInvocacoes(actor), 3, "Companheiro Animal 3 expande teto para 3");

    assert.equal(validarLimiteInvocacoes(actor, 3).valido, true);
    assert.equal(validarLimiteInvocacoes(actor, 4).valido, false);
  });

  await t.test("60.6 - Personagem com 'Companheiro Animal 4' eleva o limite para até 4 ativos", () => {
    const actor = createMockActor({
      name: "Lorde das Feras",
      items: [
        {
          name: "Companheiro Animal 4",
          type: "habilidade",
          flags: { "mighty-blade": { slug: "companheiro-animal-4" } },
        },
      ],
    });

    assert.equal(calcularLimiteInvocacoes(actor), 4, "Companheiro Animal 4 expande teto para 4");
    assert.equal(validarLimiteInvocacoes(actor, 4).valido, true);
    assert.equal(validarLimiteInvocacoes(actor, 5).valido, false);
  });

  await t.test("60.7 - Caminho 'Domador' ou 'Mestre Domador' escala limite pela Vontade (mínimo 2)", () => {
    // Domador com Vontade 6: Math.floor(6 / 2) = 3
    const domadorVontade6 = createMockActor({
      name: "Domador Kael",
      details: { caminho: "Domador" },
      attributes: { vontade: 6 },
    });
    assert.equal(calcularLimiteInvocacoes(domadorVontade6), 3, "Vontade 6 concede limite 3");
    assert.equal(validarLimiteInvocacoes(domadorVontade6, 3).valido, true);
    assert.equal(validarLimiteInvocacoes(domadorVontade6, 4).valido, false);

    // Domador com Vontade 8: Math.floor(8 / 2) = 4
    const domadorVontade8 = createMockActor({
      name: "Domador Sylas",
      details: { caminho: "Domador" },
      attributes: { vontade: 8 },
    });
    assert.equal(calcularLimiteInvocacoes(domadorVontade8), 4, "Vontade 8 concede limite 4");

    // Domador com Vontade 3: Math.max(2, Math.floor(3 / 2)) = 2 (piso mínimo garantido)
    const domadorVontade3 = createMockActor({
      name: "Domador Novato",
      details: { caminho: "Domador" },
      attributes: { vontade: 3 },
    });
    assert.equal(calcularLimiteInvocacoes(domadorVontade3), 2, "Piso de 2 companheiros para o caminho Domador");
  });

  await t.test("60.8 - Caminho 'Invocador' escala limite de invocações mágicas pela Vontade", () => {
    // Invocador com Vontade 6: limite 3
    const invocador = createMockActor({
      name: "Invocador Morzan",
      details: { caminho: "Invocador" },
      attributes: { vontade: 6 },
    });
    assert.equal(calcularLimiteInvocacoes(invocador), 3, "Invocador com Vontade 6 pode manter 3 golens/elementais");
    assert.equal(validarLimiteInvocacoes(invocador, 3).valido, true);
    assert.equal(validarLimiteInvocacoes(invocador, 4).valido, false);

    // Invocador épico com Vontade 10: limite 5
    const invocadorEpico = createMockActor({
      name: "Arquimago Invocador",
      details: { caminho: "Invocador" },
      attributes: { vontade: 10 },
    });
    assert.equal(calcularLimiteInvocacoes(invocadorEpico), 5, "Vontade 10 permite 5 invocações simultâneas");
  });

  await t.test("60.9 - Talento 'Hierofante' permite manter um segundo companheiro animal", () => {
    const hierofante = createMockActor({
      name: "Druida Ancião",
      items: [
        {
          name: "Hierofante",
          type: "habilidade",
          flags: { "mighty-blade": { slug: "hierofante" } },
        },
      ],
      attributes: { vontade: 3 },
    });

    assert.equal(calcularLimiteInvocacoes(hierofante), 2, "Hierofante expande o limite para 2");
    assert.equal(validarLimiteInvocacoes(hierofante, 2).valido, true);
  });
});

// ============================================================================
// CASO 61: ESCALONAMENTO PROPORCIONAL DE ESTATÍSTICAS (PV, DEFESA, DANO)
// ============================================================================
test("Caso 61: Escalonamento Proporcional de Estatísticas (PVs, Defesa, Dano)", async (t) => {
  await t.test("61.1 - Golem escala PV, Defesa e Dano proporcionalmente à Vontade do conjurador", () => {
    const conjurador = createMockActor({
      name: "Artífice Rúnico",
      attributes: { vontade: 6 },
      details: { nivel: 3 },
    });

    // Golem base: PV 30, Defesa 10, Dano 6
    // Fator PV = 5 (+30 PV); Fator Defesa = 1 (+3 Defesa); Fator Dano = 1 (+3 Dano)
    const statsGolem = calcularEscalonamentoInvocacao("golem", conjurador);

    assert.equal(statsGolem.pvBase, 30, "PV base do Golem é 30");
    assert.equal(statsGolem.defesaBase, 10, "Defesa base do Golem é 10");
    assert.equal(statsGolem.danoBase, 6, "Dano base do Golem é 6");

    assert.equal(statsGolem.bonusPv, 30, "Bônus de PV é Vontade (6) * 5 = +30");
    assert.equal(statsGolem.bonusDefesa, 3, "Bônus de Defesa é floor(Vontade / 2) = +3");
    assert.equal(statsGolem.bonusDano, 3, "Bônus de Dano é floor(Vontade / 2) = +3");

    assert.equal(statsGolem.pv, 60, "PV total do Golem deve ser 60 (30 + 30)");
    assert.equal(statsGolem.defesa, 13, "Defesa total do Golem deve ser 13 (10 + 3)");
    assert.equal(statsGolem.dano, 9, "Dano total do Golem deve ser 9 (6 + 3)");
  });

  await t.test("61.2 - Familiar escala PV, Defesa e Dano proporcionalmente à Vontade do conjurador", () => {
    const conjurador = createMockActor({
      name: "Mago Arcano",
      attributes: { vontade: 4 },
      details: { nivel: 2 },
    });

    // Familiar base: PV 15, Defesa 8, Dano 3
    // Fator PV = 3 (+12 PV); Fator Defesa = 1 (+2 Defesa); Fator Dano = 1 (+2 Dano)
    const statsFamiliar = calcularEscalonamentoInvocacao("familiar", conjurador);

    assert.equal(statsFamiliar.pvBase, 15);
    assert.equal(statsFamiliar.defesaBase, 8);
    assert.equal(statsFamiliar.danoBase, 3);

    assert.equal(statsFamiliar.pv, 27, "PV total do Familiar deve ser 27 (15 + 12)");
    assert.equal(statsFamiliar.defesa, 10, "Defesa total do Familiar deve ser 10 (8 + 2)");
    assert.equal(statsFamiliar.dano, 5, "Dano total do Familiar deve ser 5 (3 + 2)");
  });

  await t.test("61.3 - Construto escala por Nível quando solicitado ('escalarPor: nivel')", () => {
    const artifice = createMockActor({
      name: "Engenheiro Gnomo",
      attributes: { vontade: 2 },
      details: { nivel: 5 },
    });

    // Construto base: PV 25, Defesa 9, Dano 5
    // Escala por Nível 5: Fator PV = 4 (+20 PV); Defesa floor(5/2) = +2; Dano floor(5/2) = +2
    const statsConstruto = calcularEscalonamentoInvocacao("construto", artifice, {
      escalarPor: "nivel",
    });

    assert.equal(statsConstruto.escalonamento.atributo, "nivel");
    assert.equal(statsConstruto.escalonamento.valorAtributo, 5);

    assert.equal(statsConstruto.pv, 45, "PV total: 25 + (5 * 4) = 45");
    assert.equal(statsConstruto.defesa, 11, "Defesa total: 9 + 2 = 11");
    assert.equal(statsConstruto.dano, 7, "Dano total: 5 + 2 = 7");
  });

  await t.test("61.4 - Talento 'Invocação Persistente' concede +10 PV adicionais à criatura", () => {
    const invocador = createMockActor({
      name: "Invocador Douto",
      attributes: { vontade: 4 },
      items: [
        {
          name: "Invocação Persistente",
          type: "habilidade",
          flags: { "mighty-blade": { slug: "invocacao-persistente" } },
        },
      ],
    });

    // Golem base 30 + escala (4 * 5 = 20) + Invocação Persistente (10) = 60 PV
    const stats = calcularEscalonamentoInvocacao("golem", invocador);
    assert.equal(stats.pv, 60, "30 base + 20 escala + 10 talento persistente = 60 PV");
    assert.equal(stats.escalonamento.bonusHabilidades.pv, 10);
  });

  await t.test("61.5 - Talento 'Invocação Versátil' concede +2 na Defesa da criatura", () => {
    const invocador = createMockActor({
      name: "Invocador Hábil",
      attributes: { vontade: 4 },
      items: [
        {
          name: "Invocação Versátil",
          type: "habilidade",
          flags: { "mighty-blade": { slug: "invocacao-versatil" } },
        },
      ],
    });

    // Golem base 10 + escala floor(4/2) = 2 + Versátil 2 = 14 Defesa
    const stats = calcularEscalonamentoInvocacao("golem", invocador);
    assert.equal(stats.defesa, 14, "10 base + 2 escala + 2 talento versátil = 14 Defesa");
    assert.equal(stats.escalonamento.bonusHabilidades.defesa, 2);
  });

  await t.test("61.6 - Cumulatividade: Ambos talentos ('Invocação Persistente' e 'Versátil') somam seus bônus", () => {
    const mestreInvocador = createMockActor({
      name: "Grão Invocador",
      attributes: { vontade: 6 },
      items: [
        {
          name: "Invocação Persistente",
          type: "habilidade",
          flags: { "mighty-blade": { slug: "invocacao-persistente" } },
        },
        {
          name: "Invocação Versátil",
          type: "habilidade",
          flags: { "mighty-blade": { slug: "invocacao-versatil" } },
        },
      ],
    });

    const stats = calcularEscalonamentoInvocacao("elemental", mestreInvocador);
    // Elemental base: PV 20, Defesa 8, Dano 6
    // Escala VON 6: PV +24 (20 + 24 + 10 = 54 PV)
    // Defesa: 8 + 3 + 2 = 13 Defesa
    assert.equal(stats.pv, 54, "20 base + 24 escala + 10 persistente = 54 PV");
    assert.equal(stats.defesa, 13, "8 base + 3 escala + 2 versatil = 13 Defesa");
  });

  await t.test("61.7 - Companheiro Animal com progressão de habilidades ('Companheiro Animal 2/3/4')", () => {
    const domador = createMockActor({
      name: "Domador Mestre",
      attributes: { vontade: 4 },
      items: [
        {
          name: "Companheiro Animal 2",
          type: "habilidade",
          flags: { "mighty-blade": { slug: "companheiro-animal-2" } },
        },
      ],
    });

    // Companheiro animal base: 20 PV. Escala VON 4: 4 * 5 = +20 PV. Companheiro Animal 2: +5 PV = 45 PV.
    const stats = calcularEscalonamentoInvocacao("companheiro_animal", domador);
    assert.equal(stats.pv, 45, "20 base + 20 escala + 5 habilidade = 45 PV");
  });

  await t.test("61.8 - Customização de estatísticas base via objeto de invocação", () => {
    const conjurador = createMockActor({ attributes: { vontade: 4 } });

    // Invocação personalizada de Golem de Ferro Reforçado
    const invocacaoCustom = {
      tipo: "golem",
      nome: "Golem de Ferro Ancestral",
      pvBase: 50,
      defesaBase: 12,
      danoBase: 10,
      fatorPv: 10,
    };

    const stats = calcularEscalonamentoInvocacao(invocacaoCustom, conjurador);
    assert.equal(stats.nome, "Golem de Ferro Ancestral");
    assert.equal(stats.pvBase, 50);
    assert.equal(stats.pv, 90, "50 base + (4 * 10) = 90 PV");
    assert.equal(stats.defesa, 14, "12 base + 2 = 14 Defesa");
    assert.equal(stats.dano, 12, "10 base + 2 = 12 Dano");
  });
});

// ============================================================================
// CASO 62: MANUTENÇÃO DE CONTROLE E CUSTO SUSTENTADO DE MANA
// ============================================================================
test("Caso 62: Manutenção de Controle e Custo Sustentado de Mana", async (t) => {
  await t.test("62.1 - Custo de sustentação canônico de Golens: 3 PM por turno ativo", () => {
    const manutencao = calcularManutencaoControle("golem", 4);
    assert.equal(manutencao.custoPorTurno, 3, "Golens consomem 3 PM por turno sustentado");
    assert.equal(manutencao.turnosAtivos, 4);
    assert.equal(manutencao.custoTotal, 12, "4 turnos * 3 PM = 12 PM no total");
  });

  await t.test("62.2 - Custo de sustentação de Construtos e Elementais: 2 PM por turno ativo", () => {
    const manutencaoConstruto = calcularManutencaoControle("construto", 5);
    assert.equal(manutencaoConstruto.custoPorTurno, 2);
    assert.equal(manutencaoConstruto.custoTotal, 10, "5 turnos * 2 PM = 10 PM");

    const manutencaoElemental = calcularManutencaoControle("elemental", 3);
    assert.equal(manutencaoElemental.custoPorTurno, 2);
    assert.equal(manutencaoElemental.custoTotal, 6, "3 turnos * 2 PM = 6 PM");
  });

  await t.test("62.3 - Custo de sustentação de Familiares: 1 PM por turno ativo", () => {
    const manutencaoFamiliar = calcularManutencaoControle("familiar", 10);
    assert.equal(manutencaoFamiliar.custoPorTurno, 1);
    assert.equal(manutencaoFamiliar.custoTotal, 10, "10 turnos * 1 PM = 10 PM");
  });

  await t.test("62.4 - Validação de sustentabilidade contra a reserva de Mana do conjurador", () => {
    // Conjurador com 30 PM mantendo Golem por 5 turnos (15 PM) -> Sustentável
    const conjuradorComMana = createMockActor({
      resources: { mana: { value: 30, max: 30 } },
    });

    const resultadoApto = calcularManutencaoControle("golem", 5, { conjurador: conjuradorComMana });
    assert.equal(resultadoApto.sustentavel, true);
    assert.equal(resultadoApto.manaAtual, 30);
    assert.equal(resultadoApto.manaRestante, 15);
    assert.equal(resultadoApto.manaFaltante, 0);
    assert.equal(resultadoApto.causaExaustao, false);

    // Conjurador com apenas 10 PM mantendo Golem por 5 turnos (15 PM) -> Insustentável
    const conjuradorSemMana = createMockActor({
      resources: { mana: { value: 10, max: 30 } },
    });

    const resultadoInapto = calcularManutencaoControle("golem", 5, { conjurador: conjuradorSemMana });
    assert.equal(resultadoInapto.sustentavel, false);
    assert.equal(resultadoInapto.manaFaltante, 5);
    assert.equal(resultadoInapto.causaExaustao, true);
  });

  await t.test("62.5 - Aplicação prática do débito de sustentação na ficha do conjurador", async () => {
    const conjurador = createMockActor({
      resources: { mana: { value: 40, max: 40 }, vida: { value: 60, max: 60 } },
    });

    // Sustentar Golem por 3 turnos: 9 PM
    const res = await aplicarManutencaoControle("golem", 3, conjurador);

    assert.equal(res.consumoAplicado, true);
    assert.equal(res.custoTotal, 9);
    assert.equal(conjurador.system.resources.mana.value, 31, "40 PM - 9 PM = 31 PM restante");
    assert.equal(conjurador.system.resources.vida.value, 60, "Vida permanece intacta");
    assert.equal(conjurador.temCondicao("exausto"), false);
  });

  await t.test("62.6 - Esgotamento de Mana por manutenção: Zera PM, gera Exaustão e transborda para PV", async () => {
    // Regra canônica do Caso 36: ao chegar a 0 PM, personagem fica Exausto; excedente drena PV
    const conjurador = createMockActor({
      resources: { mana: { value: 10, max: 40 }, vida: { value: 50, max: 50 } },
    });

    // Sustentar Golem por 4 turnos: 12 PM necessários (tem apenas 10 PM)
    const res = await aplicarManutencaoControle("golem", 4, conjurador);

    assert.equal(res.custoTotal, 12);
    assert.equal(conjurador.system.resources.mana.value, 0, "Mana é completamente esgotada (0 PM)");
    assert.equal(conjurador.system.resources.vida.value, 48, "Excedente de 2 PM drenado diretamente dos PV (50 -> 48)");
    assert.equal(conjurador.temCondicao("exausto"), true, "Conjurador deve ficar com a condição Exausto ao zerar PM");
  });

  await t.test("62.7 - Tratamento seguro e robusto para turnos zerados ou valores inválidos", async () => {
    const conjurador = createMockActor({
      resources: { mana: { value: 20, max: 20 } },
    });

    const resZero = calcularManutencaoControle("golem", 0, { conjurador });
    assert.equal(resZero.custoTotal, 0);
    assert.equal(resZero.sustentavel, true);

    const resNegativo = calcularManutencaoControle("golem", -3, { conjurador });
    assert.equal(resNegativo.custoTotal, 0);
  });
});
