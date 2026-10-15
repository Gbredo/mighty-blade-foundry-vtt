/**
 * Suíte de Testes Automatizados - Subtítulo 22: Economia, Antecedentes e Progressão de Ouro
 * Mighty Blade 3ª Edição (Foundry VTT v14)
 *
 * Casos Canônicos Cobertos:
 * - Caso 1: Custo de Antecedente na Criação (Nível 1)
 *   * Selecionar um Antecedente no Nível 1 consome 1 ponto de bônus de Atributo fornecido pela Classe.
 *   * Classe originalmente fornece +1 em dois Atributos (total 2); com Antecedente, resta apenas 1 ponto.
 * - Caso 2: Aquisição Posterior de Antecedente (Após o Nível 1) e Penalidade
 *   * Adquirir após o Nível 1 consome 1 Ponto de Evolução.
 *   * Penaliza o personagem nos Níveis 4, 7 e 10 a receber +1 em apenas 1 Atributo (em vez de +1 em dois).
 * - Caso 3: Economia e Tabela Canônica de Ouro Inicial por Nível
 *   * Valores canônicos para campanhas iniciando acima do Nível 1:
 *     Nv 1: 500 | Nv 2: 850 | Nv 3: 1450 | Nv 4: 2450 | Nv 5: 4200 |
 *     Nv 6: 7200 | Nv 7: 12000 | Nv 8: 20500 | Nv 9: 35000 | Nv 10: 60000 moedas.
 *   * Fórmula: Ouro_N = Ouro_{N-1} + 70% do Ouro_{N-1}.
 *   * Bônus de moedas de Antecedentes (Nobre: +200, Fidalgo: +100).
 * - Caso 4: Ciclo de Vida Integrado e Simulação de Campanha
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  createMockActor,
  calcularCustoAntecedenteCriacao,
  validarAntecedentePosterior,
  calcularOuroInicialPorNivel,
  calcularOuroPorFormula,
  aplicarOuroInicial,
  aplicarAntecedentePosterior,
  obterBonusMoedasAntecedente,
  TABELA_OURO_INICIAL_POR_NIVEL,
  TAXA_PROGRESSAO_OURO,
  OURO_BASE_NIVEL_1,
  NIVEIS_PENALIZADOS_ANTECEDENTE_POSTERIOR,
  CUSTO_ATRIBUTO_CRIACAO_ANTECEDENTE,
  CUSTO_EVOLUCAO_ANTECEDENTE_POSTERIOR,
  BONUS_MOEDAS_ANTECEDENTE,
} from "./test-helper.mjs";

import { CANONICAL_CLASSES } from "../module/data/canonical-packs-data.mjs";

// ============================================================================
// CASO 1: CUSTO DE ANTECEDENTE NA CRIAÇÃO (NÍVEL 1)
// ============================================================================
test("Subtítulo 22 - Caso 1: Custo de Antecedente na Criação (Nível 1)", async (t) => {
  await t.test("1.1 - Sem Antecedente: A classe concede os 2 pontos de bônus de atributo padrão", () => {
    const actorSemAntecedente = createMockActor({
      name: "Guerreiro Iniciante",
      details: { nivel: 1, classe: "Guerreiro", antecedente: "" },
    });

    const resultado = calcularCustoAntecedenteCriacao(actorSemAntecedente, "Guerreiro");

    assert.equal(resultado.temAntecedente, false, "Ator não deve possuir antecedente");
    assert.equal(resultado.custo, 0, "Custo em pontos de atributo da classe deve ser 0");
    assert.equal(resultado.pontosConsumidos, 0, "Nenhum ponto de bônus foi consumido");
    assert.equal(resultado.pontosRestantes, 2, "Devem restar 2 pontos de bônus da classe para alocação");
    assert.equal(resultado.pontosPadraoClasse, 2, "Classe concede 2 pontos no padrão");
    assert.equal(resultado.valido, true);
  });

  await t.test("1.2 - Com Antecedente: Consome 1 ponto de bônus de Atributo fornecido pela Classe", () => {
    const actorComAntecedente = createMockActor({
      name: "Artesão Guerreiro",
      details: { nivel: 1, classe: "Guerreiro", antecedente: "Artesão" },
    });

    const resultado = calcularCustoAntecedenteCriacao(actorComAntecedente, "Guerreiro");

    assert.equal(resultado.temAntecedente, true, "Ator deve ser identificado com antecedente");
    assert.equal(resultado.antecedenteNome, "Artesão");
    assert.equal(resultado.custo, 1, "Custo deve ser exatamente 1 ponto de bônus de atributo da classe");
    assert.equal(resultado.pontosConsumidos, 1, "1 ponto foi consumido pelo Antecedente");
    assert.equal(resultado.pontosRestantes, 1, "Deve restar exatamente 1 ponto de bônus da classe para alocação");
    assert.equal(resultado.valido, true);
  });

  await t.test("1.3 - Validação de atributos selecionados: Rejeita escolher 2 atributos da classe com Antecedente", () => {
    const actor = createMockActor({
      name: "Ladino Astuto",
      details: { nivel: 1, classe: "Ladino", antecedente: "Criminoso" },
    });

    // Ladino concede bônus em Agilidade e Inteligência
    // Tenta alocar os dois pontos mesmo tendo selecionado antecedente
    const tentativaDoisPontos = calcularCustoAntecedenteCriacao(actor, "Ladino", {
      atributosEscolhidos: ["agilidade", "inteligencia"],
    });

    assert.equal(tentativaDoisPontos.valido, false, "Não pode selecionar 2 atributos quando consome 1 com Antecedente");
    assert.match(
      tentativaDoisPontos.erro,
      /consome 1 ponto de bônus de Atributo.*apenas 1 atributo/i,
      "Mensagem de erro deve explicar o consumo do bônus de atributo pelo Antecedente"
    );

    // Alocar corretamente apenas 1 atributo da classe
    const tentativaUmPonto = calcularCustoAntecedenteCriacao(actor, "Ladino", {
      atributosEscolhidos: ["agilidade"],
    });

    assert.equal(tentativaUmPonto.valido, true, "Deve aceitar a seleção de exatamente 1 atributo");
    assert.equal(tentativaUmPonto.pontosRestantes, 1);
  });

  await t.test("1.4 - Validação de atributos selecionados: Sem Antecedente exige exatamente 2 atributos da classe", () => {
    const actor = createMockActor({
      name: "Feiticeiro Místico",
      details: { nivel: 1, classe: "Feiticeiro", antecedente: "" },
    });

    // Tentativa inválida de escolher apenas 1 atributo sem ter antecedente
    const tentativaUm = calcularCustoAntecedenteCriacao(actor, "Feiticeiro", {
      atributosEscolhidos: ["inteligencia"],
    });
    assert.equal(tentativaUm.valido, false, "Sem antecedente, deve exigir 2 atributos");

    // Tentativa válida com 2 atributos da classe (Feiticeiro: Inteligência e Vontade)
    const tentativaDois = calcularCustoAntecedenteCriacao(actor, "Feiticeiro", {
      atributosEscolhidos: ["inteligencia", "vontade"],
    });
    assert.equal(tentativaDois.valido, true, "Deve aceitar 2 atributos corretos da classe");
  });

  await t.test("1.5 - Rejeita atributo escolhido que não faça parte dos bônus concedidos pela classe", () => {
    const actor = createMockActor({
      name: "Guerreiro Tanque",
      details: { nivel: 1, classe: "Guerreiro", antecedente: "Caçador" },
    });

    // Guerreiro concede bônus em Força e Agilidade. Inteligência não é da classe!
    const tentativaInvalida = calcularCustoAntecedenteCriacao(actor, "Guerreiro", {
      atributosEscolhidos: ["inteligencia"],
    });

    assert.equal(tentativaInvalida.valido, false);
    assert.match(tentativaInvalida.erro, /não recebe bônus da classe Guerreiro/i);

    // Força é válido para Guerreiro
    const tentativaValida = calcularCustoAntecedenteCriacao(actor, "Guerreiro", {
      atributosEscolhidos: ["forca"],
    });
    assert.equal(tentativaValida.valido, true);
  });

  await t.test("1.6 - Detecção de antecedente em item embutido no ator (Actor.items)", () => {
    const itemAntecedente = {
      name: "Mascate",
      type: "antecedente",
      system: { categoria: "antecedente" },
    };

    const actorComItem = createMockActor({
      name: "Mercador Itinerante",
      details: { nivel: 1, classe: "Ladino" },
    });
    actorComItem.addItem(itemAntecedente);

    const resultado = calcularCustoAntecedenteCriacao(actorComItem, "Ladino");
    assert.equal(resultado.temAntecedente, true);
    assert.equal(resultado.antecedenteNome, "Mascate");
    assert.equal(resultado.custo, 1);
    assert.equal(resultado.pontosRestantes, 1);
  });

  await t.test("1.7 - Comportamento e coerção numérica de calcularCustoAntecedenteCriacao", () => {
    const comAntecedente = calcularCustoAntecedenteCriacao(true);
    const semAntecedente = calcularCustoAntecedenteCriacao(false);

    assert.equal(Number(comAntecedente), 1, "Coerção numérica de comAntecedente deve ser 1");
    assert.equal(Number(semAntecedente), 0, "Coerção numérica de semAntecedente deve ser 0");
    assert.equal(comAntecedente.custo, 1);
    assert.equal(semAntecedente.custo, 0);
  });
});

// ============================================================================
// CASO 2: AQUISIÇÃO POSTERIOR DE ANTECEDENTE (APÓS NÍVEL 1) E PENALIDADE
// ============================================================================
test("Subtítulo 22 - Caso 2: Aquisição Posterior de Antecedente (Após Nível 1) e Penalidade de Atributos", async (t) => {
  await t.test("2.1 - Aquisição após o Nível 1 consome 1 Ponto de Evolução", () => {
    const actorNivel2 = createMockActor({
      name: "Aventureiro Nv 2",
      details: { nivel: 2, classe: "Guerreiro", antecedente: "" },
    });

    const validacao = validarAntecedentePosterior(actorNivel2, {
      adquirir: true,
      nivelAquisicao: 2,
      pontoEvolucaoDisponivel: true,
      antecedenteNome: "Caçador",
    });

    assert.equal(validacao.valido, true);
    assert.equal(validacao.consumoPontoEvolucao, CUSTO_EVOLUCAO_ANTECEDENTE_POSTERIOR);
    assert.equal(validacao.consumoPontoEvolucao, 1, "Deve consumir rigorosamente 1 Ponto de Evolução");
    assert.equal(validacao.penalidadeAtiva, true, "Penalidade deve ser registrada como ativa");
    assert.deepEqual(validacao.niveisPenalizados, [4, 7, 10]);
  });

  await t.test("2.2 - Rejeita aquisição posterior se o nível for <= 1", () => {
    const actorNivel1 = createMockActor({
      name: "Novato Nv 1",
      details: { nivel: 1, classe: "Guerreiro" },
    });

    const validacao = validarAntecedentePosterior(actorNivel1, {
      adquirir: true,
      nivelAquisicao: 1,
    });

    assert.equal(validacao.valido, false);
    assert.match(validacao.erro, /após o Nível 1.*Nível 2 ou superior/i);
  });

  await t.test("2.3 - Rejeita aquisição posterior se não houver Ponto de Evolução disponível", () => {
    const actorNivel3 = createMockActor({
      name: "Guerreiro Sem PE",
      details: { nivel: 3, classe: "Guerreiro" },
    });

    const validacao = validarAntecedentePosterior(actorNivel3, {
      adquirir: true,
      nivelAquisicao: 3,
      pontoEvolucaoDisponivel: false,
    });

    assert.equal(validacao.valido, false);
    assert.match(validacao.erro, /consome 1 Ponto de Evolução.*não possui Ponto de Evolução/i);
  });

  await t.test("2.4 - Rejeita tentar acumular um segundo antecedente se o personagem já possui um", () => {
    const actorJaTemAntecedente = createMockActor({
      name: "Herói com Nobre",
      details: { nivel: 3, classe: "Paladino", antecedente: "Nobre" },
    });

    const validacao = validarAntecedentePosterior(actorJaTemAntecedente, {
      adquirir: true,
      nivelAquisicao: 3,
      antecedenteNome: "Curandeiro",
    });

    assert.equal(validacao.valido, false);
    assert.match(validacao.erro, /já possui o Antecedente 'Nobre'.*não permitem acumular múltiplos/i);
  });

  await t.test("2.5 - Penalidade ativa nos Níveis 4, 7 e 10: Rejeita escolher 2 atributos", () => {
    const actorPenalizado = createMockActor({
      name: "Herói Penalizado",
      details: {
        nivel: 3,
        classe: "Guerreiro",
        antecedente: "Artesão",
        antecedentePosterior: true,
      },
    });

    // Testar nos 3 níveis canônicos penalizados: 4, 7 e 10
    for (const nivel of [4, 7, 10]) {
      const tentativaDoisAtributos = validarAntecedentePosterior(actorPenalizado, {
        nivel,
        atributosEscolhidos: ["forca", "agilidade"],
      });

      assert.equal(
        tentativaDoisAtributos.valido,
        false,
        `No nível ${nivel}, a tentativa de alocar 2 atributos deve ser rejeitada`
      );
      assert.match(
        tentativaDoisAtributos.erro,
        /penaliza o personagem nos Níveis 4, 7 e 10 a receber \+1 em apenas 1 Atributo \(em vez de \+1 em dois\)/i
      );
      assert.equal(tentativaDoisAtributos.quantidadeAtributosPermitidos, 1);
    }
  });

  await t.test("2.6 - Penalidade ativa nos Níveis 4, 7 e 10: Aceita escolher exatamente 1 atributo", () => {
    const actorPenalizado = createMockActor({
      name: "Herói Penalizado",
      details: {
        nivel: 3,
        classe: "Guerreiro",
        antecedente: "Artesão",
        antecedentePosterior: true,
      },
    });

    for (const nivel of [4, 7, 10]) {
      const tentativaUmAtributo = validarAntecedentePosterior(actorPenalizado, {
        nivel,
        atributosEscolhidos: ["forca"],
      });

      assert.equal(
        tentativaUmAtributo.valido,
        true,
        `No nível ${nivel}, escolher 1 único atributo deve ser válido sob penalidade`
      );
      assert.equal(tentativaUmAtributo.quantidadeAtributosPermitidos, 1);
      assert.equal(tentativaUmAtributo.penalidadeAtiva, true);
    }
  });

  await t.test("2.7 - Personagem comum (sem antecedente posterior) NÃO sofre a penalidade e exige 2 atributos", () => {
    const actorComum = createMockActor({
      name: "Guerreiro Normal",
      details: { nivel: 3, classe: "Guerreiro", antecedente: "" },
    });

    for (const nivel of [4, 7, 10]) {
      // 1 atributo só é rejeitado para personagem comum
      const tentativaUmAtributo = validarAntecedentePosterior(actorComum, {
        nivel,
        atributosEscolhidos: ["forca"],
      });
      assert.equal(tentativaUmAtributo.valido, false);
      assert.equal(tentativaUmAtributo.quantidadeAtributosPermitidos, 2);

      // 2 atributos diferentes são aceitos para personagem comum
      const tentativaDoisAtributos = validarAntecedentePosterior(actorComum, {
        nivel,
        atributosEscolhidos: ["forca", "agilidade"],
      });
      assert.equal(tentativaDoisAtributos.valido, true);
    }
  });

  await t.test("2.8 - Aplicação com aplicarAntecedentePosterior grava dados na ficha e ativa penalidade", async () => {
    const actor = createMockActor({
      name: "Jovem Guerreiro",
      details: { nivel: 2, classe: "Guerreiro", antecedente: "", evolucao: "" },
    });

    const res = await aplicarAntecedentePosterior(actor, "Médium", { nivel: 2 });
    assert.equal(res.sucesso, true);
    assert.equal(res.consumoPontoEvolucao, 1);
    assert.equal(res.penalidadeAtributosAtiva, true);

    // Valida estado atualizado do ator
    assert.equal(actor.system.details.antecedente, "Médium");
    assert.equal(actor.system.details.antecedentePosterior, true);
    assert.equal(actor.system.details.evolucao, "Antecedente: Médium");
    assert.equal(actor.flags["mighty-blade"]?.antecedentePosterior, true);

    // Valida que agora o ator é detectado como penalizado para o nível 4
    const validacaoNivel4 = validarAntecedentePosterior(actor, {
      nivel: 4,
      atributosEscolhidos: ["forca", "vontade"],
    });
    assert.equal(validacaoNivel4.valido, false, "Agora deve ser penalizado nos níveis 4, 7 e 10");

    const validacaoNivel4Correta = validarAntecedentePosterior(actor, {
      nivel: 4,
      atributosEscolhidos: ["vontade"],
    });
    assert.equal(validacaoNivel4Correta.valido, true, "Deve aceitar apenas 1 atributo");
  });
});

// ============================================================================
// CASO 3: ECONOMIA E TABELA CANÔNICA DE OURO INICIAL POR NÍVEL
// ============================================================================
test("Subtítulo 22 - Caso 3: Economia e Tabela Canônica de Ouro Inicial por Nível", async (t) => {
  await t.test("3.1 - Tabela canônica de moedas iniciais por nível (Níveis 1 a 10)", () => {
    const valoresEsperados = {
      1: 500,
      2: 850,
      3: 1450,
      4: 2450,
      5: 4200,
      6: 7200,
      7: 12000,
      8: 20500,
      9: 35000,
      10: 60000,
    };

    assert.deepEqual(TABELA_OURO_INICIAL_POR_NIVEL, valoresEsperados);

    for (const [nivelStr, valorEsperado] of Object.entries(valoresEsperados)) {
      const nivel = Number(nivelStr);
      const ouro = calcularOuroInicialPorNivel(nivel);
      assert.equal(
        ouro,
        valorEsperado,
        `Nível ${nivel} deve fornecer exatamente ${valorEsperado} moedas (obtido: ${ouro})`
      );
    }
  });

  await t.test("3.2 - Fórmula de progressão de ouro: Ouro_N = Ouro_{N-1} + 70% do Ouro_{N-1}", () => {
    assert.equal(TAXA_PROGRESSAO_OURO, 0.70, "Taxa de progressão de ouro deve ser 70% (0.70)");
    assert.equal(OURO_BASE_NIVEL_1, 500, "Ouro base do Nível 1 deve ser 500");

    // Validação passo a passo da fórmula matemática pura
    // Nv 1: 500
    // Nv 2: 500 + 70% * 500 = 850 (exato)
    const nv2 = calcularOuroPorFormula(2);
    assert.equal(nv2, 850);

    // Nv 3: 850 + 70% * 850 = 1445 -> tabela canônica arredonda para 1450
    const nv3 = calcularOuroPorFormula(3);
    assert.equal(nv3, 1445);
    assert.equal(TABELA_OURO_INICIAL_POR_NIVEL[3], 1450);

    // Nv 4: 1445 + 70% * 1445 = 2456.5 -> tabela canônica adota 2450
    const nv4 = calcularOuroPorFormula(4);
    assert.ok(Math.abs(nv4 - 2456.5) < 0.001);
    assert.equal(TABELA_OURO_INICIAL_POR_NIVEL[4], 2450);

    // Nv 10: Tabela canônica atinge o valor de 60000 moedas
    assert.equal(TABELA_OURO_INICIAL_POR_NIVEL[10], 60000);
  });

  await t.test("3.3 - Bônus de moedas de Antecedentes (Nobre: +200, Fidalgo: +100)", () => {
    assert.equal(BONUS_MOEDAS_ANTECEDENTE.nobre, 200);
    assert.equal(BONUS_MOEDAS_ANTECEDENTE.fidalgo, 100);

    assert.equal(obterBonusMoedasAntecedente("Nobre"), 200);
    assert.equal(obterBonusMoedasAntecedente("Fidalgo"), 100);
    assert.equal(obterBonusMoedasAntecedente("Guerreiro"), 0);
    assert.equal(obterBonusMoedasAntecedente(""), 0);

    // Nível 1 com Nobre: 500 + 200 = 700 moedas
    const ouroNobreNv1 = calcularOuroInicialPorNivel(1, { antecedente: "Nobre" });
    assert.equal(ouroNobreNv1, 700);

    // Nível 3 com Fidalgo: 1450 + 100 = 1550 moedas
    const ouroFidalgoNv3 = calcularOuroInicialPorNivel(3, { antecedente: "Fidalgo" });
    assert.equal(ouroFidalgoNv3, 1550);

    // Nível 5 com Caçador (sem bônus monetário): 4200 moedas
    const ouroCacadorNv5 = calcularOuroInicialPorNivel(5, { antecedente: "Caçador" });
    assert.equal(ouroCacadorNv5, 4200);
  });

  await t.test("3.4 - Suporte a passagem de Documento do Ator, string ou número", () => {
    const actorNv4 = createMockActor({
      name: "Herói Nv 4",
      details: { nivel: 4, antecedente: "Nobre" },
    });

    // Passando o ator diretamente com flag de incluir bônus de antecedente
    const ouroAtorComBonus = calcularOuroInicialPorNivel(actorNv4, { incluirBonusAntecedente: true });
    assert.equal(ouroAtorComBonus, 2450 + 200);

    // Passando o ator sem flag de bônus retorna o base do nível
    const ouroAtorBase = calcularOuroInicialPorNivel(actorNv4);
    assert.equal(ouroAtorBase, 2450);

    // Passando como string
    assert.equal(calcularOuroInicialPorNivel("6"), 7200);
  });

  await t.test("3.5 - Tratamento de níveis inválidos (0, negativos, NaN)", () => {
    assert.equal(calcularOuroInicialPorNivel(0), 0);
    assert.equal(calcularOuroInicialPorNivel(-1), 0);
    assert.equal(calcularOuroInicialPorNivel(NaN), 0);
    assert.equal(calcularOuroInicialPorNivel("invalido"), 0);
    assert.equal(calcularOuroPorFormula(0), 0);
    assert.equal(calcularOuroPorFormula(-5), 0);
  });

  await t.test("3.6 - Projeção de Níveis Épicos (> 10) utilizando a progressão de +70% a partir do Nível 10", () => {
    // Nível 10 é 60000
    // Nível 11: 60000 * 1.70 = 102000 moedas
    const ouroNv11 = calcularOuroInicialPorNivel(11);
    assert.equal(ouroNv11, 102000);

    // Nível 12: 102000 * 1.70 = 173400 moedas
    const ouroNv12 = calcularOuroInicialPorNivel(12);
    assert.equal(ouroNv12, 173400);
  });

  await t.test("3.7 - Aplicação de ouro diretamente na ficha com aplicarOuroInicial", async () => {
    const actor = createMockActor({
      name: "Veterano Nv 5",
      details: { nivel: 5, dinheiro: 0, antecedente: "Nobre" },
    });

    assert.equal(actor.system.details.dinheiro, 0);

    const gravado = await aplicarOuroInicial(actor, 5);
    assert.equal(gravado, 4200);
    assert.equal(actor.system.details.dinheiro, 4200);

    // Aplicar com bônus de Nobre
    const gravadoComNobre = await aplicarOuroInicial(actor, 5, { incluirBonusAntecedente: true });
    assert.equal(gravadoComNobre, 4400);
    assert.equal(actor.system.details.dinheiro, 4400);
  });
});

// ============================================================================
// CASO 4: SIMULAÇÃO INTEGRADA DE CAMPANHA E CICLO DE VIDA
// ============================================================================
test("Subtítulo 22 - Caso 4: Simulação Integrada de Campanha e Ciclo de Vida", async (t) => {
  await t.test("4.1 - Herói Nível 1 criado com Antecedente: consome 1 atributo da classe e recebe 500 moedas", async () => {
    // 1. Criação com Raça Humano (3/3/3/3) e Classe Guerreiro (bônus Força/Agilidade)
    const hero = createMockActor({
      name: "Sir Roland",
      details: { nivel: 1, classe: "Guerreiro", antecedente: "Fidalgo", dinheiro: 0 },
      attributes: {
        forca: { base: 3, value: 3 },
        agilidade: { base: 3, value: 3 },
        inteligencia: { base: 3, value: 3 },
        vontade: { base: 3, value: 3 },
      },
    });

    // 2. Aplica ouro inicial com Fidalgo (+100 moedas): 500 + 100 = 600
    await aplicarOuroInicial(hero, 1, { incluirBonusAntecedente: true });
    assert.equal(hero.system.details.dinheiro, 600);

    // 3. Valida custo de criação: Antecedente consome 1 ponto de bônus da classe
    const custo = calcularCustoAntecedenteCriacao(hero, "Guerreiro", {
      atributosEscolhidos: ["forca"],
    });
    assert.equal(custo.valido, true);
    assert.equal(custo.custo, 1);
    assert.equal(custo.pontosRestantes, 1);

    // Aplicar o 1 ponto restante em Força: Força passa de 3 para 4
    hero.system.attributes.forca.value += 1;
    hero.system.attributes.forca.base += 1;
    assert.equal(hero.system.attributes.forca.value, 4);
    assert.equal(hero.system.attributes.agilidade.value, 3); // Agilidade não recebeu bônus devido ao custo do Antecedente
  });

  await t.test("4.2 - Herói que compra Antecedente no Nível 2 sofre penalidade nos Níveis 4, 7 e 10", async () => {
    const hero = createMockActor({
      name: "Eldrin",
      details: { nivel: 1, classe: "Feiticeiro", antecedente: "", dinheiro: 0 },
    });

    // Nível 1: sem antecedente, 2 bônus da classe Feiticeiro (Inteligência e Vontade)
    const custoNv1 = calcularCustoAntecedenteCriacao(hero, "Feiticeiro", {
      atributosEscolhidos: ["inteligencia", "vontade"],
    });
    assert.equal(custoNv1.valido, true);
    assert.equal(custoNv1.pontosRestantes, 2);

    // Avança para o Nível 2 e decide adquirir o Antecedente "Apotecário"
    hero.system.details.nivel = 2;
    const aquisicao = await aplicarAntecedentePosterior(hero, "Apotecário", { nivel: 2 });
    assert.equal(aquisicao.sucesso, true);
    assert.equal(aquisicao.penalidadeAtributosAtiva, true);

    // Nível 4: Atinge nível com aumento de atributos
    hero.system.details.nivel = 4;
    // Se tentar escolher 2 atributos (+1 Inteligência, +1 Vontade), é bloqueado!
    const tentativaNv4Dupla = validarAntecedentePosterior(hero, {
      nivel: 4,
      atributosEscolhidos: ["inteligencia", "vontade"],
    });
    assert.equal(tentativaNv4Dupla.valido, false);

    // Escolher apenas 1 atributo (+1 Inteligência) é aceito
    const tentativaNv4Unica = validarAntecedentePosterior(hero, {
      nivel: 4,
      atributosEscolhidos: ["inteligencia"],
    });
    assert.equal(tentativaNv4Unica.valido, true);

    // Nível 7: Mesma penalidade se mantém
    hero.system.details.nivel = 7;
    const tentativaNv7Unica = validarAntecedentePosterior(hero, {
      nivel: 7,
      atributosEscolhidos: ["vontade"],
    });
    assert.equal(tentativaNv7Unica.valido, true);

    // Nível 10: Mesma penalidade se mantém
    hero.system.details.nivel = 10;
    const tentativaNv10Unica = validarAntecedentePosterior(hero, {
      nivel: 10,
      atributosEscolhidos: ["vontade"],
    });
    assert.equal(tentativaNv10Unica.valido, true);
  });
});
