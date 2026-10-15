/**
 * Suíte de Testes Automatizados - Subtítulo 25: Geografia, Clima e Modificadores Elementais do Ambiente
 * Grimório das Pequenas Magias — Mighty Blade 3ª Edição (Foundry VTT v14).
 *
 * Casos Canônicos Cobertos:
 * - Caso 25.1: Ambientes Gelados / Frios Rigorosos (gelado, neve, inverno_rigoroso, eishelm)
 *   * Gelo criado magicamente dura indefinidamente (duracaoInfinita: true, geloIndefinido: true)
 *   * Magias de Fogo sofrem acréscimo de +2 na Dificuldade de conjuração (+2 DV)
 * - Caso 25.2: Ambientes Quentes / Áridos (quente, arido, terras_secas, picos_orientais, verao_arkania)
 *   * Magias e objetos de Gelo duram apenas metade do tempo normal (tempoReduzidoPelaMetade: true)
 *   * Magias de Fogo causam +5 de dano adicional (danoAdicionalFogo: 5)
 * - Caso 25.3: Ambientes Subaquáticos (subaquatico, mar, rio_fundo, lago_submerso)
 *   * Magias de Fogo: Não funcionam de forma padrão (funcionaPadrao: false, fervem a água ou geram bolhas)
 *   * Magias de Gelo: Duram metade do tempo normal (exceto em profundezas polares) e flutuam (flutua: true)
 *   * Magias de Eletricidade: Afetam criaturas em raio de 10m ou área dobrada (raio10mTodasCriaturas: true, areaDobrada: true)
 * - Caso 25.4: Constantes, Normalização e Helpers Auxiliares (AMBIENTES_CANONICOS, calcularEfeitoMagiaNoAmbiente)
 * - Caso 25.5: Integração com Atores e Modelos de Dados do Foundry VTT
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  createMockActor,
  aplicarModificadoresAmbiente,
  calcularEfeitoMagiaNoAmbiente,
  normalizarAmbiente,
  extrairElementoMagia,
  normalizarElementoMagia,
  isAmbienteGelado,
  isAmbienteQuente,
  isAmbienteSubaquatico,
  AMBIENTES_CANONICOS,
  CATEGORIAS_AMBIENTE,
  MODIFICADORES_DIFICULDADE_FOGO_GELADO,
  DANO_ADICIONAL_FOGO_QUENTE,
  RAIO_ELETRICIDADE_SUBAQUATICO_METROS,
} from "./test-helper.mjs";

/* ========================================================================= */
/* CASO 25.1: AMBIENTES GELADOS / FRIOS RIGOROSOS (EISHELM)                  */
/* ========================================================================= */
test("Caso 25.1: Ambientes Gelados e Frio Extremo (Eishelm, Neve, Inverno Rigoroso)", async (t) => {
  await t.test("25.1.1 - Gelo criado magicamente dura indefinidamente em ambiente gelado", () => {
    const magiaGelo = {
      name: "Parede de Gelo",
      system: {
        elemento: "gelo",
        dificuldade: 10,
        duracao: 6, // 6 rodadas
      },
    };

    const res = aplicarModificadoresAmbiente(magiaGelo, "gelado");

    assert.equal(res.ambiente, "gelado");
    assert.equal(res.elemento, "gelo");
    assert.equal(res.duracaoInfinita, true, "duracaoInfinita deve ser true para magia de gelo no gelado");
    assert.equal(res.geloIndefinido, true, "geloIndefinido deve ser true para magia de gelo no gelado");
    assert.equal(res.tempoReduzidoPelaMetade, false, "Não deve ter tempo reduzido no gelado");
    assert.equal(res.duracaoFinal, Infinity, "duracaoFinal deve ser Infinity");
    assert.equal(res.modificadorDificuldade, 0, "Dificuldade do gelo não é penalizada no gelado");
    assert.equal(res.dificuldadeFinal, 10, "Dificuldade final permanece 10");
  });

  await t.test("25.1.2 - Reconhecimento de todos os aliases canônicos de ambientes gelados", () => {
    const aliases = ["gelado", "neve", "inverno_rigoroso", "eishelm", "frio", "polar", "geleira"];

    for (const alias of aliases) {
      const res = aplicarModificadoresAmbiente("gelo", alias);
      assert.equal(res.ambiente, "gelado", `Alias '${alias}' deve resolver para 'gelado'`);
      assert.equal(res.duracaoInfinita, true, `Alias '${alias}' deve conceder duracaoInfinita`);
      assert.equal(res.geloIndefinido, true, `Alias '${alias}' deve conceder geloIndefinido`);
    }
  });

  await t.test("25.1.3 - Magias de Fogo sofrem acréscimo de +2 na Dificuldade de conjuração (+2 DV)", () => {
    const magiaFogo = {
      name: "Bola de Fogo",
      system: {
        elemento: "fogo",
        dificuldade: 12,
        dano: 20,
      },
    };

    const res = aplicarModificadoresAmbiente(magiaFogo, "eishelm");

    assert.equal(res.ambiente, "gelado");
    assert.equal(res.elemento, "fogo");
    assert.equal(res.modificadorDificuldade, 2, "Magia de fogo deve ter +2 DV na dificuldade");
    assert.equal(res.dificuldadeOriginal, 12);
    assert.equal(res.dificuldadeFinal, 14, "Dificuldade final deve ser 12 + 2 = 14");
    assert.equal(res.danoAdicionalFogo, 0, "Fogo não tem dano adicional no gelado");
    assert.equal(res.danoFinal, 20, "Dano final permanece 20");
    assert.equal(res.funcionaPadrao, true, "Fogo ainda funciona de forma padrão no gelado (com DV mais alto)");
  });

  await t.test("25.1.4 - Dificuldade base padrão de 8 sobe para 10 para magia de fogo sem DV especificado", () => {
    const res = aplicarModificadoresAmbiente("fogo", "inverno_rigoroso");
    assert.equal(res.dificuldadeOriginal, 8, "Dificuldade default é 8");
    assert.equal(res.modificadorDificuldade, 2, "+2 DV");
    assert.equal(res.dificuldadeFinal, 10, "8 + 2 = 10");
  });

  await t.test("25.1.5 - Magias de outros elementos não sofrem alteração em ambiente gelado", () => {
    const magiaRaio = {
      name: "Relâmpago",
      system: {
        elemento: "eletricidade",
        dificuldade: 10,
        dano: 15,
        duracao: 1,
      },
    };

    const res = aplicarModificadoresAmbiente(magiaRaio, "eishelm");
    assert.equal(res.modificadorDificuldade, 0);
    assert.equal(res.dificuldadeFinal, 10);
    assert.equal(res.duracaoInfinita, false);
    assert.equal(res.geloIndefinido, false);
    assert.equal(res.funcionaPadrao, true);
  });
});

/* ========================================================================= */
/* CASO 25.2: AMBIENTES QUENTES / ÁRIDOS (TERRAS SECAS / VERÃO ARKANITANO)    */
/* ========================================================================= */
test("Caso 25.2: Ambientes Quentes e Áridos (Terras Secas, Picos Orientais, Verão Arkania)", async (t) => {
  await t.test("25.2.1 - Magias e objetos de Gelo duram metade do tempo normal (tempoReduzidoPelaMetade)", () => {
    const magiaGelo = {
      name: "Muralha Glacial",
      system: {
        elemento: "gelo",
        dificuldade: 10,
        duracao: 10, // 10 rodadas
      },
    };

    const res = aplicarModificadoresAmbiente(magiaGelo, "quente");

    assert.equal(res.ambiente, "quente");
    assert.equal(res.elemento, "gelo");
    assert.equal(res.tempoReduzidoPelaMetade, true, "tempoReduzidoPelaMetade deve ser true");
    assert.equal(res.duracaoInfinita, false);
    assert.equal(res.geloIndefinido, false);
    assert.equal(res.duracaoOriginal, 10);
    assert.equal(res.duracaoFinal, 5, "Duração final deve ser 10 / 2 = 5");
  });

  await t.test("25.2.2 - Arredondamento da metade da duração para baixo (floor)", () => {
    const objetoGelo = {
      name: "Estátua de Gelo",
      duracao: 7, // 7 horas
      elemento: "gelo",
    };

    const res = aplicarModificadoresAmbiente(objetoGelo, "terras_secas");
    assert.equal(res.tempoReduzidoPelaMetade, true);
    assert.equal(res.duracaoFinal, 3, "Math.floor(7 / 2) = 3");
  });

  await t.test("25.2.3 - Reconhecimento de todos os aliases canônicos de ambientes quentes/áridos", () => {
    const aliases = ["quente", "arido", "terras_secas", "picos_orientais", "verao_arkania", "deserto"];

    for (const alias of aliases) {
      const res = aplicarModificadoresAmbiente("gelo", alias, { duracao: 8 });
      assert.equal(res.ambiente, "quente", `Alias '${alias}' deve resolver para 'quente'`);
      assert.equal(res.tempoReduzidoPelaMetade, true);
      assert.equal(res.duracaoFinal, 4, "8 / 2 = 4");
    }
  });

  await t.test("25.2.4 - Magias de Fogo causam +5 de dano adicional (danoAdicionalFogo: 5)", () => {
    const magiaFogo = {
      name: "Lança de Chamas",
      system: {
        elemento: "fogo",
        dano: 15,
        dificuldade: 8,
      },
    };

    const res = aplicarModificadoresAmbiente(magiaFogo, "verao_arkania");

    assert.equal(res.ambiente, "quente");
    assert.equal(res.elemento, "fogo");
    assert.equal(res.danoAdicionalFogo, 5, "danoAdicionalFogo deve ser 5");
    assert.equal(res.danoAdicional, 5);
    assert.equal(res.danoOriginal, 15);
    assert.equal(res.danoFinal, 20, "Dano final deve ser 15 + 5 = 20");
    assert.equal(res.modificadorDificuldade, 0, "Sem penalidade de dificuldade no calor");
    assert.equal(res.dificuldadeFinal, 8);
  });

  await t.test("25.2.5 - Magia de fogo sem dano base ganha os +5 de dano adicional em ambiente árido", () => {
    const efeitoFogo = {
      name: "Toque Ígneo",
      elemento: "fogo",
      dano: 0,
    };

    const res = aplicarModificadoresAmbiente(efeitoFogo, "picos_orientais");
    assert.equal(res.danoAdicionalFogo, 5);
    assert.equal(res.danoFinal, 5);
  });

  await t.test("25.2.6 - Magias de outros elementos (eletricidade, cura) operam normalmente no calor", () => {
    const magiaCura = {
      name: "Luz Curativa",
      system: { elemento: "luz", dificuldade: 8, dano: 0, duracao: 1 },
    };

    const res = aplicarModificadoresAmbiente(magiaCura, "quente");
    assert.equal(res.danoAdicionalFogo, 0);
    assert.equal(res.tempoReduzidoPelaMetade, false);
    assert.equal(res.funcionaPadrao, true);
  });
});

/* ========================================================================= */
/* CASO 25.3: AMBIENTES SUBAQUÁTICOS (MAR, RIO FUNDO, LAGO SUBMERSO)         */
/* ========================================================================= */
test("Caso 25.3: Ambientes Subaquáticos (Mar, Rio Fundo, Lago Submerso)", async (t) => {
  await t.test("25.3.1 - Magias de Fogo não funcionam de forma padrão (funcionaPadrao: false)", () => {
    const magiaFogo = {
      name: "Explosão Ígnea",
      system: {
        elemento: "fogo",
        dano: 25,
        dificuldade: 10,
      },
    };

    const res = aplicarModificadoresAmbiente(magiaFogo, "subaquatico");

    assert.equal(res.ambiente, "subaquatico");
    assert.equal(res.elemento, "fogo");
    assert.equal(res.funcionaPadrao, false, "funcionaPadrao deve ser false para fogo sob a água");
    assert.equal(res.ferveAgua, true, "Deve sinalizar que ferve a água");
    assert.equal(res.bolhasFerventes, true, "Deve gerar bolhas ferventes");
    assert.ok(
      res.descricaoEfeitoAlternativo.includes("ferve") || res.descricaoEfeitoAlternativo.includes("bolhas"),
      "Descrição deve mencionar fervura ou nuvem de bolhas"
    );
  });

  await t.test("25.3.2 - Magias de Gelo debaixo d'água duram metade do tempo e flutuam (flutua: true)", () => {
    const magiaGelo = {
      name: "Esfera de Gelo",
      system: {
        elemento: "gelo",
        duracao: 8,
      },
    };

    const res = aplicarModificadoresAmbiente(magiaGelo, "mar");

    assert.equal(res.ambiente, "subaquatico");
    assert.equal(res.elemento, "gelo");
    assert.equal(res.tempoReduzidoPelaMetade, true, "Gelo normal na água derrete na metade do tempo");
    assert.equal(res.duracaoFinal, 4, "8 / 2 = 4 rodadas");
    assert.equal(res.flutua, true, "Gelo sob a água tende a flutuar (flutua: true)");
    assert.equal(res.funcionaPadrao, true);
  });

  await t.test("25.3.3 - Exceção em Profundezas Polares: gelo não sofre redução de duração e flutua", () => {
    const magiaGelo = {
      name: "Iceberg Abissal",
      system: {
        elemento: "gelo",
        duracao: 10,
      },
    };

    // Teste com opções explícitas de profundezas polares
    const resOpcao = aplicarModificadoresAmbiente(magiaGelo, "subaquatico", {
      profundezasPolares: true,
    });
    assert.equal(resOpcao.ambiente, "subaquatico");
    assert.equal(resOpcao.isProfundezasPolares, true);
    assert.equal(resOpcao.tempoReduzidoPelaMetade, false, "Em profundezas polares NÃO reduz pela metade");
    assert.equal(resOpcao.duracaoFinal, 10, "Duração original mantida integral");
    assert.equal(resOpcao.flutua, true, "Ainda tende a flutuar");

    // Teste com string de ambiente 'profundezas_polares'
    const resString = aplicarModificadoresAmbiente(magiaGelo, "profundezas_polares");
    assert.equal(resString.ambiente, "subaquatico");
    assert.equal(resString.tempoReduzidoPelaMetade, false);
    assert.equal(resString.duracaoFinal, 10);
    assert.equal(resString.flutua, true);
  });

  await t.test("25.3.4 - Magias de Eletricidade afetam criaturas em raio de 10m e dobram área", () => {
    const magiaRaio = {
      name: "Raio Bifurcado",
      system: {
        elemento: "eletricidade",
        dano: 18,
      },
    };

    const res = aplicarModificadoresAmbiente(magiaRaio, "lago_submerso");

    assert.equal(res.ambiente, "subaquatico");
    assert.equal(res.elemento, "eletricidade");
    assert.equal(res.raio10mTodasCriaturas, true, "raio10mTodasCriaturas deve ser true");
    assert.equal(res.areaDobrada, true, "areaDobrada deve ser true");
    assert.equal(res.raioAfetadoMetros, 10, "Raio afetado deve ser de 10 metros");
    assert.equal(res.funcionaPadrao, true);
    assert.ok(res.descricaoEfeitoAlternativo.includes("10 metros"));
  });

  await t.test("25.3.5 - Reconhecimento de todos os aliases canônicos subaquáticos", () => {
    const aliases = ["subaquatico", "mar", "rio_fundo", "lago_submerso", "aquatico", "submerso"];

    for (const alias of aliases) {
      const resFogo = aplicarModificadoresAmbiente("fogo", alias);
      assert.equal(resFogo.ambiente, "subaquatico", `Alias '${alias}' deve resolver para 'subaquatico'`);
      assert.equal(resFogo.funcionaPadrao, false);

      const resEletricidade = aplicarModificadoresAmbiente("eletricidade", alias);
      assert.equal(resEletricidade.raio10mTodasCriaturas, true);
      assert.equal(resEletricidade.areaDobrada, true);

      const resGelo = aplicarModificadoresAmbiente("gelo", alias);
      assert.equal(resGelo.flutua, true);
    }
  });
});

/* ========================================================================= */
/* CASO 25.4: CONSTANTES, NORMALIZAÇÃO E HELPERS AUXILIARES                  */
/* ========================================================================= */
test("Caso 25.4: Constantes Canônicas, Normalização e Funções Auxiliares", async (t) => {
  await t.test("25.4.1 - Constantes canônicas exportadas corretamente", () => {
    assert.equal(AMBIENTES_CANONICOS.GELADO, "gelado");
    assert.equal(AMBIENTES_CANONICOS.QUENTE, "quente");
    assert.equal(AMBIENTES_CANONICOS.SUBAQUATICO, "subaquatico");
    assert.equal(AMBIENTES_CANONICOS.NORMAL, "normal");

    assert.equal(MODIFICADORES_DIFICULDADE_FOGO_GELADO, 2);
    assert.equal(DANO_ADICIONAL_FOGO_QUENTE, 5);
    assert.equal(RAIO_ELETRICIDADE_SUBAQUATICO_METROS, 10);

    assert.ok(CATEGORIAS_AMBIENTE.gelado);
    assert.ok(CATEGORIAS_AMBIENTE.quente);
    assert.ok(CATEGORIAS_AMBIENTE.subaquatico);
    assert.ok(CATEGORIAS_AMBIENTE.normal);
  });

  await t.test("25.4.2 - normalizarAmbiente com diferentes formatos e caixas", () => {
    assert.equal(normalizarAmbiente("Eishelm"), "gelado");
    assert.equal(normalizarAmbiente("INVERNO_RIGOROSO"), "gelado");
    assert.equal(normalizarAmbiente("Verão Arkania"), "quente");
    assert.equal(normalizarAmbiente("Terras Secas"), "quente");
    assert.equal(normalizarAmbiente("Árido"), "quente");
    assert.equal(normalizarAmbiente("Rio Fundo"), "subaquatico");
    assert.equal(normalizarAmbiente("Lago Submerso"), "subaquatico");
    assert.equal(normalizarAmbiente("Mar de Tebryn"), "subaquatico");
    assert.equal(normalizarAmbiente("Floresta Temperada"), "normal");
    assert.equal(normalizarAmbiente(""), "normal");
    assert.equal(normalizarAmbiente(null), "normal");
    assert.equal(normalizarAmbiente({ tipo: "eishelm" }), "gelado");
    assert.equal(normalizarAmbiente({ id: "terras_secas" }), "quente");
  });

  await t.test("25.4.3 - extrairElementoMagia identifica elementos em múltiplos formatos", () => {
    assert.equal(extrairElementoMagia("gelo"), "gelo");
    assert.equal(extrairElementoMagia("Frio Rigoroso"), "gelo");
    assert.equal(extrairElementoMagia("Parede de Gelo"), "gelo");
    assert.equal(extrairElementoMagia("Bola de Fogo"), "fogo");
    assert.equal(extrairElementoMagia("Chama Sagrada"), "fogo");
    assert.equal(extrairElementoMagia("Relâmpago"), "eletricidade");
    assert.equal(extrairElementoMagia("Raio Arcano"), "eletricidade");
    assert.equal(extrairElementoMagia({ system: { elemento: "fogo" } }), "fogo");
    assert.equal(extrairElementoMagia({ tipoDano: "frio" }), "gelo");
    assert.equal(extrairElementoMagia({ name: "Cura Rápida" }), "cura rapida");
  });

  await t.test("25.4.4 - Helpers booleanos de teste de ambiente", () => {
    assert.equal(isAmbienteGelado("eishelm"), true);
    assert.equal(isAmbienteGelado("quente"), false);

    assert.equal(isAmbienteQuente("verao_arkania"), true);
    assert.equal(isAmbienteQuente("neve"), false);

    assert.equal(isAmbienteSubaquatico("mar"), true);
    assert.equal(isAmbienteSubaquatico("gelado"), false);
  });

  await t.test("25.4.5 - calcularEfeitoMagiaNoAmbiente opera como alias compatível", () => {
    const calc = calcularEfeitoMagiaNoAmbiente("fogo", "quente", { dano: 10 });
    assert.equal(calc.danoAdicionalFogo, 5);
    assert.equal(calc.danoFinal, 15);
  });
});

/* ========================================================================= */
/* CASO 25.5: INTEGRAÇÃO COM MOCK ACTOR E OBJETOS DE MAGIA FOUNDRY           */
/* ========================================================================= */
test("Caso 25.5: Integração com Mock Actor e Modelos de Dados do Foundry VTT", async (t) => {
  await t.test("25.5.1 - Invocação através do MockActor", () => {
    const actor = createMockActor({
      name: "Feiticeiro Polar",
      details: { classe: "Feiticeiro" },
    });

    const magia = {
      name: "Seta de Gelo",
      system: {
        elemento: "gelo",
        dificuldade: 8,
        duracao: 4,
      },
    };

    const res = actor.aplicarModificadoresAmbiente(magia, "eishelm");
    assert.equal(res.ambiente, "gelado");
    assert.equal(res.duracaoInfinita, true);
    assert.equal(res.geloIndefinido, true);

    const calc = actor.calcularEfeitoMagiaNoAmbiente("fogo", "verao_arkania", { dano: 20 });
    assert.equal(calc.danoFinal, 25);
  });

  await t.test("25.5.2 - Preservação de estrutura de dados do Foundry no resultado", () => {
    const spellDoc = {
      id: "spell-123",
      name: "Esfera Flamejante",
      type: "magia",
      system: {
        elemento: "fogo",
        dificuldade: 10,
        dano: 15,
        duracao: 3,
        custo: 10,
      },
    };

    const res = aplicarModificadoresAmbiente(spellDoc, "quente");
    assert.equal(res.name, "Esfera Flamejante");
    assert.equal(res.type, "magia");
    assert.equal(res.system.dano, 20); // 15 + 5
    assert.equal(res.system.dificuldade, 10);
    assert.equal(res.system.custo, 10); // Custo original intocado
  });

  await t.test("25.5.3 - Opção mutar: true altera o objeto fonte diretamente", () => {
    const spellDoc = {
      name: "Muro de Gelo",
      system: {
        elemento: "gelo",
        duracao: 12,
        dificuldade: 8,
      },
    };

    aplicarModificadoresAmbiente(spellDoc, "quente", { mutar: true });
    assert.equal(spellDoc.system.duracao, 6, "Objeto fonte foi mutado para 12 / 2 = 6");
    assert.equal(spellDoc.system.tempoReduzidoPelaMetade, true);
  });

  await t.test("25.5.4 - Clima normal ou temperado não altera parâmetros", () => {
    const spellDoc = {
      name: "Chama Mística",
      system: {
        elemento: "fogo",
        dano: 10,
        dificuldade: 8,
        duracao: 5,
      },
    };

    const res = aplicarModificadoresAmbiente(spellDoc, "temperado");
    assert.equal(res.ambiente, "normal");
    assert.equal(res.danoFinal, 10);
    assert.equal(res.dificuldadeFinal, 8);
    assert.equal(res.duracaoFinal, 5);
    assert.equal(res.funcionaPadrao, true);
    assert.equal(res.duracaoInfinita, false);
    assert.equal(res.tempoReduzidoPelaMetade, false);
    assert.equal(res.danoAdicionalFogo, 0);
  });
});
