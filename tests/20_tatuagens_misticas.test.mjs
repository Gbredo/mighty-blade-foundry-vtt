/**
 * Suíte de Testes Automatizados - Subtítulo 20: Tatuagens Místicas e Registro Cutâneo (Tohunga / Escriba)
 * Mighty Blade 3ª Edição (Foundry VTT v14)
 *
 * Casos Canônicos Cobertos:
 * - Caso 20.1: Capacidade Cutânea Total por Categoria de Tamanho (Pequeno 10 GC, Médio 13 GC, Grande / Gigantismo 15 GC)
 * - Caso 20.2: Tatuagens de Tohunga e Ocupação de Espaço Cutâneo (Primeira Marca, Tamoko, Tribais = 1 GC cada)
 * - Caso 20.3: Validação de Magia Tatuada (Registro Cutâneo, Círculo = GC, Bloqueio ao Exceder Capacidade)
 * - Caso 20.4: Benefício de Conjuração de Magia Tatuada (-1 DV na Dificuldade, -5 PM com piso de 1 PM)
 * - Caso 20.5: Tatuar Objeto à Pele (Fusão e Invocação com Custo de 5 PM, Restrição de Tamanho de Objeto)
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  createMockActor,
  calcularCapacidadeTatuagem,
  validarTatuarMagia,
  calcularBeneficioTatuagemMagica,
  tatuarObjeto,
  conjurarObjetoTatuado,
  recolherObjetoTatuado,
  obterTamanhoPersonagem,
  obterGrauComplexidadeMagia,
  isTatuagemTohunga,
  CAPACIDADE_TATUAGEM_TAMANHO,
  GC_TATUAGEM_TOHUNGA,
  CUSTO_PM_TATUAR_OBJETO,
  CUSTO_PM_INVOCAR_OBJETO,
  REDUCAO_DIFICULDADE_TATUAGEM,
  REDUCAO_MANA_TATUAGEM,
  PISO_MANA_TATUAGEM,
} from "./test-helper.mjs";

/* ========================================================================= */
/* CASO 20.1: CAPACIDADE CUTÂNEA POR CATEGORIA DE TAMANHO                    */
/* ========================================================================= */
test("Caso 20.1: Capacidade Cutânea por Categoria de Tamanho (GC)", async (t) => {
  await t.test("20.1.1 - Personagem de Tamanho Médio possui capacidade de até 13 GC", () => {
    const actorMedio = createMockActor({
      name: "Guerreiro Humano",
      details: { raca: "Humano", tamanho: "medio" },
    });

    const cap = calcularCapacidadeTatuagem(actorMedio);
    assert.equal(cap.capacidadeTotal, 13, "Capacidade total de tamanho Médio deve ser 13 GC");
    assert.equal(cap.gcMaximo, 13);
    assert.equal(cap.gcUsado, 0, "Sem tatuagens, GC usado é 0");
    assert.equal(cap.gcDisponivel, 13, "13 GC disponíveis");
    assert.equal(cap.tamanho, "medio");
  });

  await t.test("20.1.2 - Personagem de Tamanho Pequeno (Metadílio / Faen / Nanismo) possui 10 GC", () => {
    const actorMetadilio = createMockActor({
      name: "Ladino Metadílio",
      details: { raca: "Metadílio" },
    });

    const capMetadilio = calcularCapacidadeTatuagem(actorMetadilio);
    assert.equal(capMetadilio.capacidadeTotal, 10, "Metadílio tem 10 GC");
    assert.equal(capMetadilio.tamanho, "pequeno");

    const actorNanismo = createMockActor({
      name: "Guerreiro com Nanismo",
      items: [{ name: "Nanismo", type: "habilidade" }],
    });
    const capNanismo = calcularCapacidadeTatuagem(actorNanismo);
    assert.equal(capNanismo.capacidadeTotal, 10, "Personagem com Nanismo tem 10 GC");
    assert.equal(capNanismo.tamanho, "pequeno");

    const actorPequeno = createMockActor({
      name: "Silfo Alado",
      details: { tamanho: "pequeno" },
    });
    assert.equal(calcularCapacidadeTatuagem(actorPequeno).capacidadeTotal, 10);
  });

  await t.test("20.1.3 - Personagem de Tamanho Grande ou com Gigantismo possui 15 GC", () => {
    const actorGigantismo = createMockActor({
      name: "Bárbaro Gigante",
      items: [{ name: "Gigantismo", type: "habilidade" }],
    });

    const capGigante = calcularCapacidadeTatuagem(actorGigantismo);
    assert.equal(capGigante.capacidadeTotal, 15, "Personagem com Gigantismo tem 15 GC");
    assert.equal(capGigante.tamanho, "grande");

    const actorGrande = createMockActor({
      name: "Centauro Robusto",
      details: { tamanho: "grande" },
    });
    assert.equal(calcularCapacidadeTatuagem(actorGrande).capacidadeTotal, 15);
  });

  await t.test("20.1.4 - Identificação de tamanho a partir de strings simples", () => {
    assert.equal(obterTamanhoPersonagem("pequeno"), "pequeno");
    assert.equal(obterTamanhoPersonagem("medio"), "medio");
    assert.equal(obterTamanhoPersonagem("grande"), "grande");

    assert.equal(calcularCapacidadeTatuagem("pequeno").capacidadeTotal, 10);
    assert.equal(calcularCapacidadeTatuagem("medio").capacidadeTotal, 13);
    assert.equal(calcularCapacidadeTatuagem("grande").capacidadeTotal, 15);
  });

  await t.test("20.1.5 - Opção apenasNumero retorna o número primitivo", () => {
    const actor = createMockActor({ details: { tamanho: "medio" } });
    const valor = calcularCapacidadeTatuagem(actor, { apenasNumero: true });
    assert.equal(typeof valor, "number");
    assert.equal(valor, 13);
  });
});

/* ========================================================================= */
/* CASO 20.2: TATUAGENS DE TOHUNGA E OCUPAÇÃO DE ESPAÇO CUTÂNEO (1 GC CADA)   */
/* ========================================================================= */
test("Caso 20.2: Tatuagens de Tohunga ocupam 1 GC cada", async (t) => {
  await t.test("20.2.1 - Primeira Marca ocupa 1 GC", () => {
    const actor = createMockActor({
      name: "Tohunga Aprendiz",
      details: { tamanho: "medio", caminho: "Tohunga" },
      items: [{ name: "Primeira Marca", type: "habilidade" }],
    });

    const cap = calcularCapacidadeTatuagem(actor);
    assert.equal(cap.capacidadeTotal, 13);
    assert.equal(cap.gcUsado, 1, "Primeira Marca consome 1 GC");
    assert.equal(cap.gcDisponivel, 12, "Restam 12 GC");
    assert.equal(cap.tatuagensTohunga.length, 1);
  });

  await t.test("20.2.2 - Tamoko (Ta Moko) ocupa 1 GC", () => {
    const actor = createMockActor({
      name: "Tohunga Marcado",
      details: { tamanho: "medio" },
      items: [{ name: "Tamoko", type: "habilidade" }],
    });

    const cap = calcularCapacidadeTatuagem(actor);
    assert.equal(cap.gcUsado, 1, "Tamoko consome 1 GC");
    assert.equal(cap.gcDisponivel, 12);
  });

  await t.test("20.2.3 - Tribal de Proteção e Tribal de Poder ocupam 1 GC cada", () => {
    const actorProtecao = createMockActor({
      items: [{ name: "Tribal de Proteção", type: "habilidade" }],
    });
    assert.equal(calcularCapacidadeTatuagem(actorProtecao).gcUsado, 1);

    const actorPoder = createMockActor({
      items: [{ name: "Tribal de Poder", type: "habilidade" }],
    });
    assert.equal(calcularCapacidadeTatuagem(actorPoder).gcUsado, 1);
  });

  await t.test("20.2.4 - Múltiplas tatuagens de Tohunga acumulam espaço consumido", () => {
    const actorTohunga = createMockActor({
      name: "Mestre Tohunga",
      details: { tamanho: "medio" },
      items: [
        { name: "Primeira Marca", type: "habilidade" },
        { name: "Tamoko", type: "habilidade" },
        { name: "Tribal de Proteção", type: "habilidade" },
        { name: "Tribal de Poder", type: "habilidade" },
      ],
    });

    const cap = calcularCapacidadeTatuagem(actorTohunga);
    assert.equal(cap.gcUsado, 4, "4 tatuagens de Tohunga consomem 4 GC");
    assert.equal(cap.gcDisponivel, 9, "13 - 4 = 9 GC disponíveis");
    assert.equal(cap.tatuagensTohunga.length, 4);
  });

  await t.test("20.2.5 - Tatuagens de Tohunga em personagem Pequeno reduzem a partir de 10 GC", () => {
    const actorPequeno = createMockActor({
      details: { tamanho: "pequeno" },
      items: [
        { name: "Primeira Marca", type: "habilidade" },
        { name: "Tamoko", type: "habilidade" },
      ],
    });

    const cap = calcularCapacidadeTatuagem(actorPequeno);
    assert.equal(cap.capacidadeTotal, 10);
    assert.equal(cap.gcUsado, 2);
    assert.equal(cap.gcDisponivel, 8, "10 - 2 = 8 GC disponíveis");
  });
});

/* ========================================================================= */
/* CASO 20.3: VALIDAÇÃO DE TATUAR MAGIA (CÍRCULO/GRAU = GC E BLOQUEIO)       */
/* ========================================================================= */
test("Caso 20.3: Validação de Magia Tatuada (Círculo = GC e Limite Cutâneo)", async (t) => {
  await t.test("20.3.1 - Magia consome GC equivalente ao seu Círculo ou Grau", () => {
    const magia1 = { name: "Luz", system: { circulo: 1 } };
    const magia2 = { name: "Raio Elétrico", system: { circulo: 2 } };
    const magia3 = { name: "Bola de Fogo", system: { circulo: 3 } };
    const magia4 = { name: "Tempestade", system: { circulo: 4 } };
    const magia5 = { name: "Desintegração", system: { circulo: 5 } };

    assert.equal(obterGrauComplexidadeMagia(magia1), 1);
    assert.equal(obterGrauComplexidadeMagia(magia2), 2);
    assert.equal(obterGrauComplexidadeMagia(magia3), 3);
    assert.equal(obterGrauComplexidadeMagia(magia4), 4);
    assert.equal(obterGrauComplexidadeMagia(magia5), 5);
  });

  await t.test("20.3.2 - Magia permitida quando GC total cabe na pele", () => {
    const actor = createMockActor({ details: { tamanho: "medio" } });
    const magia = { name: "Bola de Fogo", system: { circulo: 3 } };

    // Sem tatuagens prévias: 3 GC em capacidade 13 GC
    const res = validarTatuarMagia(actor, magia, 0);
    assert.equal(res.valido, true);
    assert.equal(res.permitido, true);
    assert.equal(res.bloqueado, false);
    assert.equal(res.gcMagia, 3);
    assert.equal(res.gcTotal, 3);
    assert.equal(res.gcDisponivelDepois, 10);
    assert.equal(res.erro, null);
  });

  await t.test("20.3.3 - Bloqueio quando GC excede a capacidade da pele", () => {
    const actorPequeno = createMockActor({ details: { tamanho: "pequeno" } }); // 10 GC max
    const magiaGrande = { name: "Muralha de Energia", system: { circulo: 4 } };

    // Personagem já possui 8 GC ocupados por tatuagens prévias
    const res = validarTatuarMagia(actorPequeno, magiaGrande, 8);
    assert.equal(res.valido, false);
    assert.equal(res.permitido, false);
    assert.equal(res.bloqueado, true);
    assert.equal(res.gcTotal, 12, "8 + 4 = 12 GC");
    assert.equal(res.capacidadeTotal, 10);
    assert.equal(res.excedente, 2, "12 - 10 = 2 GC excedentes");
    assert.match(res.erro, /excedida/i);
    assert.match(res.erro, /12 GC/);
  });

  await t.test("20.3.4 - Preenchimento exato da capacidade (limite no teto é permitido)", () => {
    const actor = createMockActor({ details: { tamanho: "medio" } }); // 13 GC max
    const magia = { name: "Magia Suprema", system: { circulo: 3 } };

    // Já tem 10 GC ocupados, adiciona 3 GC = exatamente 13 GC
    const res = validarTatuarMagia(actor, magia, 10);
    assert.equal(res.valido, true);
    assert.equal(res.gcTotal, 13);
    assert.equal(res.gcDisponivelDepois, 0);
    assert.equal(res.excedente, 0);
  });

  await t.test("20.3.5 - Suporte a passagem de tatuagensAtuais como array de itens", () => {
    const actor = createMockActor({ details: { tamanho: "medio" } });
    const tatuagensAtuais = [
      { name: "Primeira Marca", type: "habilidade" }, // 1 GC
      { name: "Tamoko", type: "habilidade" },         // 1 GC
      { name: "Dardo Místico", system: { circulo: 1 } }, // 1 GC
      { name: "Escudo Arcano", system: { circulo: 2 } }, // 2 GC
    ]; // Total atual = 5 GC

    const novaMagia = { name: "Tempestade de Gelo", system: { circulo: 4 } };
    const res = validarTatuarMagia(actor, novaMagia, tatuagensAtuais);
    assert.equal(res.gcAtual, 5);
    assert.equal(res.gcMagia, 4);
    assert.equal(res.gcTotal, 9);
    assert.equal(res.valido, true);
    assert.equal(res.gcDisponivelDepois, 4);
  });

  await t.test("20.3.6 - Leitura automática de tatuagens do próprio ator quando omitido tatuagensAtuais", () => {
    const actor = createMockActor({
      details: { tamanho: "pequeno" }, // 10 GC
      items: [
        { name: "Primeira Marca", type: "habilidade" }, // 1 GC
        { name: "Tribal de Poder", type: "habilidade" }, // 1 GC
      ],
    });

    const magia5 = { name: "Apocalipse", system: { circulo: 5 } };
    const res = validarTatuarMagia(actor, magia5);
    assert.equal(res.gcAtual, 2);
    assert.equal(res.gcMagia, 5);
    assert.equal(res.gcTotal, 7);
    assert.equal(res.valido, true);

    // Agora uma magia que estouraria (9 GC num espaço onde restam 8 GC)
    const magia9 = { name: "Ritual Impossível", system: { circulo: 9 } };
    const resEstouro = validarTatuarMagia(actor, magia9);
    assert.equal(resEstouro.valido, false);
    assert.equal(resEstouro.excedente, 1);
  });
});

/* ========================================================================= */
/* CASO 20.4: BENEFÍCIO DE CONJURAÇÃO DE MAGIA TATUADA (-1 DV, -5 PM, PISO)  */
/* ========================================================================= */
test("Caso 20.4: Benefício de Magia Tatuada (-1 DV, -5 PM com piso de 1 PM)", async (t) => {
  await t.test("20.4.1 - Redução de Dificuldade em 1 ponto (-1 DV)", () => {
    const magiaDificil = {
      name: "Raios da Morte",
      system: { dificuldade: 10, custo: 15 },
    };

    const ben = calcularBeneficioTatuagemMagica(magiaDificil);
    assert.equal(ben.dificuldadeOriginal, 10);
    assert.equal(ben.dificuldadeFinal, 9, "10 - 1 = 9 DV");
    assert.equal(ben.reducaoDificuldade, 1);

    const magiaComum = {
      name: "Dardo de Fogo",
      system: { dificuldade: 8, custo: 10 },
    };
    assert.equal(calcularBeneficioTatuagemMagica(magiaComum).dificuldadeFinal, 7);
  });

  await t.test("20.4.2 - Redução de Custo de Mana em 5 PM (-5 PM)", () => {
    const magiaMedia = {
      name: "Teleporte",
      system: { dificuldade: 9, custo: 12 },
    };

    const ben = calcularBeneficioTatuagemMagica(magiaMedia);
    assert.equal(ben.custoOriginal, 12);
    assert.equal(ben.custoFinal, 7, "12 - 5 = 7 PM");
    assert.equal(ben.reducaoMana, 5);
    assert.equal(ben.pisoAplicado, false);

    const magiaDez = {
      name: "Chama Voraz",
      system: { dificuldade: 8, custo: 10 },
    };
    assert.equal(calcularBeneficioTatuagemMagica(magiaDez).custoFinal, 5);
  });

  await t.test("20.4.3 - Garantia de piso mínimo de 1 PM quando custo base <= 5 PM", () => {
    // Magia de custo 5 PM
    const magiaCinco = {
      name: "Toque de Choque",
      system: { dificuldade: 8, custo: 5 },
    };
    const benCinco = calcularBeneficioTatuagemMagica(magiaCinco);
    assert.equal(benCinco.custoFinal, 1, "5 PM com redução de 5 PM deve ter piso de 1 PM");
    assert.equal(benCinco.pisoAplicado, true);

    // Magia de custo 4 PM
    const magiaQuatro = {
      name: "Luz Feérica",
      system: { dificuldade: 7, custo: 4 },
    };
    const benQuatro = calcularBeneficioTatuagemMagica(magiaQuatro);
    assert.equal(benQuatro.custoFinal, 1, "4 PM reduzido por 5 PM não pode ser <= 0; piso é 1 PM");
    assert.equal(benQuatro.pisoAplicado, true);

    // Magia de custo 2 PM
    const magiaDois = {
      name: "Sussurro",
      system: { dificuldade: 6, custo: 2 },
    };
    assert.equal(calcularBeneficioTatuagemMagica(magiaDois).custoFinal, 1);
  });

  await t.test("20.4.4 - Magias explicitamente gratuitas (0 PM) mantêm 0 PM", () => {
    const magiaZero = {
      name: "Truque Menor",
      system: { dificuldade: 7, custo: 0, gratuito: true },
    };

    const benZero = calcularBeneficioTatuagemMagica(magiaZero);
    assert.equal(benZero.custoFinal, 0, "Magia originalmente gratuita deve permanecer 0 PM");
    assert.equal(benZero.dificuldadeFinal, 6, "Mas ainda usufrui da redução de dificuldade para 6 DV");
  });

  await t.test("20.4.5 - Dificuldade não pode se tornar negativa", () => {
    const magiaZeroDV = {
      name: "Magia Básica",
      system: { dificuldade: 0, custo: 6 },
    };

    const ben = calcularBeneficioTatuagemMagica(magiaZeroDV);
    assert.equal(ben.dificuldadeFinal, 0, "Dificuldade mínima é 0");
    assert.equal(ben.custoFinal, 1);
  });
});

/* ========================================================================= */
/* CASO 20.5: TATUAR OBJETO À PELE (FUSÃO E INVOCAÇÃO COM 5 PM)              */
/* ========================================================================= */
test("Caso 20.5: Tatuar Objeto (Fusão e Invocação com 5 PM e Validação)", async (t) => {
  await t.test("20.5.1 - Fusão de objeto consome 5 PM e marca item na pele", () => {
    const actor = createMockActor({
      name: "Guerreiro Tohunga",
      resources: { mana: { value: 20, max: 20 } },
    });

    const itemArma = {
      name: "Machado de Batalha",
      type: "arma",
      system: { tamanho: "medio", equipado: false },
    };

    const res = tatuarObjeto(itemArma, actor);
    assert.equal(res.sucesso, true);
    assert.equal(res.acao, "fundir");
    assert.equal(res.custoPM, 5);
    assert.equal(res.manaConsumida, 5);
    assert.equal(actor.system.resources.mana.value, 15, "20 - 5 = 15 PM restantes");
    assert.equal(itemArma.system.fundidoAPele, true);
    assert.equal(itemArma.system.tatuado, true);
    assert.equal(itemArma.system.conjurado, false);
  });

  await t.test("20.5.2 - Invocação do objeto fundido consome 5 PM e ativa estado conjurado", () => {
    const actor = createMockActor({
      resources: { mana: { value: 15, max: 20 } },
    });

    const itemArma = {
      name: "Machado de Batalha",
      system: { fundidoAPele: true, tatuado: true, conjurado: false },
    };

    const resInvocacao = conjurarObjetoTatuado(itemArma, actor);
    assert.equal(resInvocacao.sucesso, true);
    assert.equal(resInvocacao.acao, "conjurar");
    assert.equal(resInvocacao.custoPM, 5);
    assert.equal(actor.system.resources.mana.value, 10, "15 - 5 = 10 PM restantes");
    assert.equal(itemArma.system.conjurado, true);
  });

  await t.test("20.5.3 - Bloqueio quando personagem não tem 5 PM para fundir ou invocar", () => {
    const actorSemMana = createMockActor({
      resources: { mana: { value: 3, max: 20 } },
    });

    const itemEspada = {
      name: "Espada Longa",
      system: { tamanho: "medio" },
    };

    const res = tatuarObjeto(itemEspada, actorSemMana);
    assert.equal(res.sucesso, false);
    assert.equal(res.motivo, "mana_insuficiente");
    assert.match(res.erro, /Mana insuficiente/);
    assert.equal(actorSemMana.system.resources.mana.value, 3, "Mana não deve ser debitada se falhar");
  });

  await t.test("20.5.4 - Bloqueio de objeto maior do que o personagem", () => {
    const actorPequeno = createMockActor({
      details: { tamanho: "pequeno" },
      resources: { mana: { value: 30, max: 30 } },
    });

    const itemGrande = {
      name: "Lança Montada de Cavalaria Gigante",
      system: { tamanho: "grande" },
    };

    const res = tatuarObjeto(itemGrande, actorPequeno);
    assert.equal(res.sucesso, false);
    assert.equal(res.motivo, "tamanho_incompativel");
    assert.match(res.erro, /superior/i);
    assert.equal(actorPequeno.system.resources.mana.value, 30, "Mana não deve ser debitada");
  });

  await t.test("20.5.5 - Recolhimento do objeto conjurado de volta à forma de tatuagem", () => {
    const itemArma = {
      name: "Adaga de Cristal",
      system: { fundidoAPele: true, tatuado: true, conjurado: true },
    };

    const res = recolherObjetoTatuado(itemArma);
    assert.equal(res.sucesso, true);
    assert.equal(res.conjurado, false);
    assert.equal(itemArma.system.conjurado, false);
  });
});
