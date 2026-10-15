/**
 * Suíte de Testes Automatizados - Subtítulo 21: Manobras Táticas de Combate
 * Mighty Blade 3ª Edição.
 *
 * Casos de Teste Cobertos:
 * 1. processarAtaqueLocalizado(ataque, defensor):
 *    - O ataque visando membros ou pontos vitais adiciona +4 na Defesa do alvo antes da rolagem de dano/ataque.
 *    - Testado contra MockActor, objetos numéricos e estruturas defensivas completas.
 * 2. processarEncontrao(atacante, metrosPercorridos, arma, armadura):
 *    - Ação Completa; exige deslocamento mínimo de 3 metros.
 *    - Adiciona ao dano a maior FN entre arma e armadura + 1 a cada 3 metros percorridos.
 *    - Impõe -2 de Esquiva no atacante até o início do próximo turno.
 * 3. processarFintar(atacante, defensor):
 *    - Reação; o primeiro ataque causa apenas metade do dano (Math.floor(dano / 2)).
 *    - Confere bônus de +1d6 nas rolagens de ataque subsequentes contra o mesmo alvo no mesmo turno.
 *    - Bloqueio se o personagem não puder realizar reações.
 * 4. processarInterceptar(atacante, oponentePassando):
 *    - Reação ativada contra oponente tentando passar adjacente; exige confronto de Agilidade.
 *    - Se vencer, bloqueia a passagem e consome a Ação de Movimento do próximo turno do personagem.
 *    - Se perder, não bloqueia e não consome a Ação de Movimento.
 */

import test, { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  createMockActor,
  processarAtaqueLocalizado,
  processarEncontrao,
  processarFintar,
  processarInterceptar,
  MODIFICADOR_DEFESA_ATAQUE_LOCALIZADO,
  DISTANCIA_MINIMA_ENCONTRAO,
  PENALIDADE_ESQUIVA_ENCONTRAO,
  BONUS_ATAQUE_FINTAR,
  CONFRONTO_INTERCEPTAR_ATRIBUTO,
} from "./test-helper.mjs";

describe("Subtítulo 21: Manobras Táticas de Combate (Mighty Blade 3e)", () => {
  /* ------------------------------------------------------------------------- */
  /* 1. ATAQUE LOCALIZADO                                                      */
  /* ------------------------------------------------------------------------- */
  describe("1. Ataque Localizado (processarAtaqueLocalizado)", () => {
    it("1.1 - Adiciona exatamente +4 na Defesa do alvo contra o ataque", () => {
      const defensor = createMockActor({
        attributes: { forca: 6, agilidade: 4 },
      });

      const resultado = processarAtaqueLocalizado({ local: "braço" }, defensor);

      assert.equal(resultado.valido, true, "Manobra deve ser válida");
      assert.equal(resultado.bonusDefesa, 4, "Bônus de Defesa deve ser +4 canônico");
      assert.equal(resultado.modificadorDefesa, MODIFICADOR_DEFESA_ATAQUE_LOCALIZADO);
      assert.equal(resultado.defesaOriginal, 11, "Defesa base inicial do alvo é 11");
      assert.equal(resultado.defesaModificada, 15, "Defesa modificada deve ser 11 + 4 = 15");
      assert.equal(resultado.defesaFinal, 15, "Defesa final deve ser 15");
      assert.equal(resultado.bloqueioModificado, 15, "Bloqueio deve receber +4 (11 + 4 = 15)");
      assert.equal(resultado.esquivaModificada, 13, "Esquiva deve receber +4 (9 + 4 = 13)");
    });

    it("1.2 - Suporta defensor informado como número direto de Defesa", () => {
      const resultado = processarAtaqueLocalizado("cabeça", 14);

      assert.equal(resultado.defesaOriginal, 14);
      assert.equal(resultado.bonusDefesa, 4);
      assert.equal(resultado.defesaModificada, 18);
      assert.equal(resultado.local, "cabeça");
    });

    it("1.3 - Suporta objeto customizado de dados com bloqueio e esquiva", () => {
      const defensorCustom = {
        defesaTotal: 16,
        bloqueio: 16,
        esquiva: 12,
      };

      const resultado = processarAtaqueLocalizado({ pontoVital: true, local: "olhos" }, defensorCustom);

      assert.equal(resultado.defesaOriginal, 16);
      assert.equal(resultado.defesaModificada, 20);
      assert.equal(resultado.bloqueioModificado, 20);
      assert.equal(resultado.esquivaModificada, 16);
      assert.equal(resultado.local, "olhos");
    });

    it("1.4 - Funciona quando ataque ou defensor são nulos/padrão", () => {
      const resultado = processarAtaqueLocalizado(null, null);

      assert.equal(resultado.defesaOriginal, 0);
      assert.equal(resultado.defesaModificada, 4);
      assert.equal(resultado.bonusDefesa, 4);
      assert.ok(resultado.descricao.includes("+4 na Defesa"));
    });
  });

  /* ------------------------------------------------------------------------- */
  /* 2. ENCONTRÃO                                                              */
  /* ------------------------------------------------------------------------- */
  describe("2. Encontrão (processarEncontrao)", () => {
    it("2.1 - Exige deslocamento mínimo de 3 metros (falha com menos de 3m)", () => {
      const atacante = createMockActor({ attributes: { forca: 4, agilidade: 3 } });

      const falha0m = processarEncontrao(atacante, 0, 3, 2);
      assert.equal(falha0m.valido, false, "0 metros deve ser inválido");
      assert.equal(falha0m.bonusDano, 0, "Sem bônus de dano se a distância for inválida");
      assert.ok(falha0m.motivo.includes("3 metros"));

      const falha2m = processarEncontrao(atacante, 2.5, 4, 3);
      assert.equal(falha2m.valido, false, "2.5 metros deve ser inválido");
      assert.equal(falha2m.bonusDano, 0);
    });

    it("2.2 - Classifica a manobra como Ação Completa", () => {
      const atacante = createMockActor({ attributes: { forca: 3, agilidade: 2 } });
      const resultado = processarEncontrao(atacante, 3, 2, 2);

      assert.equal(resultado.tipoAcao, "completa", "Tipo de ação deve ser completa");
      assert.equal(resultado.acaoCompleta, true, "Deve ser classificado como ação completa");
    });

    it("2.3 - Adiciona ao dano a maior FN entre arma e armadura + 1 a cada 3 metros percorridos", () => {
      const atacante = createMockActor({ attributes: { forca: 4, agilidade: 2 } });

      // Caso A: Arma FN 4, Armadura FN 2, 3 metros percorridos
      // Maior FN: 4. Metros/3: floor(3/3) = 1. Bônus Dano: 4 + 1 = 5
      const resA = processarEncontrao(atacante, 3, { system: { fn: 4 } }, { system: { fn: 2 } });
      assert.equal(resA.valido, true);
      assert.equal(resA.maiorFn, 4);
      assert.equal(resA.bonusDistancia, 1);
      assert.equal(resA.bonusDano, 5, "4 + 1 = 5");

      // Caso B: Arma FN 3, Armadura FN 5 (Armadura de Placas), 6 metros percorridos
      // Maior FN: 5. Metros/3: floor(6/3) = 2. Bônus Dano: 5 + 2 = 7
      const resB = processarEncontrao(atacante, 6, 3, 5);
      assert.equal(resB.maiorFn, 5);
      assert.equal(resB.bonusDistancia, 2);
      assert.equal(resB.bonusDano, 7, "5 + 2 = 7");

      // Caso C: Arma FN 6 (Espadão), Armadura FN 4, 9 metros percorridos
      // Maior FN: 6. Metros/3: floor(9/3) = 3. Bônus Dano: 6 + 3 = 9
      const resC = processarEncontrao(atacante, 9, 6, 4);
      assert.equal(resC.maiorFn, 6);
      assert.equal(resC.bonusDistancia, 3);
      assert.equal(resC.bonusDano, 9, "6 + 3 = 9");

      // Caso D: 5 metros percorridos (floor(5/3) = 1) com FN 3
      // Bônus Dano: 3 + 1 = 4
      const resD = processarEncontrao(atacante, 5, 3, 1);
      assert.equal(resD.bonusDistancia, 1);
      assert.equal(resD.bonusDano, 4);
    });

    it("2.4 - Extrai armas e armaduras equipadas do ator se não informadas manualmente", () => {
      const atacante = createMockActor({
        attributes: { forca: 4, agilidade: 3 },
        items: [
          { type: "arma", system: { fn: 5, equipado: true } },
          { type: "armadura", system: { fn: 3, equipado: true } },
        ],
      });

      const res = processarEncontrao(atacante, 6);
      assert.equal(res.fnArma, 5, "FN da arma equipada deve ser 5");
      assert.equal(res.fnArmadura, 3, "FN da armadura equipada deve ser 3");
      assert.equal(res.maiorFn, 5);
      assert.equal(res.bonusDano, 7, "5 + 2 = 7");
    });

    it("2.5 - Impõe penalidade de -2 de Esquiva no atacante até o início do próximo turno", () => {
      const atacante = createMockActor({
        attributes: { forca: 3, agilidade: 3 }, // Esquiva padrão: 5 base + 3 agi = 8
      });

      const res = processarEncontrao(atacante, 3, 2, 1);
      assert.equal(res.penalidadeEsquiva, -2, "Penalidade deve ser -2 canônica");
      assert.equal(res.modificadorEsquiva, PENALIDADE_ESQUIVA_ENCONTRAO);
      assert.equal(res.duracaoPenalidade, "ate_inicio_proximo_turno");
      assert.equal(res.esquivaOriginal, 8, "Esquiva original é 8");
      assert.equal(res.esquivaModificada, 6, "8 - 2 = 6");
    });
  });

  /* ------------------------------------------------------------------------- */
  /* 3. FINTAR                                                                 */
  /* ------------------------------------------------------------------------- */
  describe("3. Fintar (processarFintar)", () => {
    it("3.1 - Classifica a manobra como Reação", () => {
      const atacante = createMockActor({ attributes: { agilidade: 3 } });
      const defensor = createMockActor({ attributes: { agilidade: 2 } });

      const res = processarFintar(atacante, defensor);
      assert.equal(res.tipoAcao, "reacao", "Tipo de ação deve ser reacao");
      assert.equal(res.reacao, true, "Deve ser uma reação");
    });

    it("3.2 - O primeiro ataque causa apenas metade do dano (Math.floor(dano / 2))", () => {
      const atacante = createMockActor();
      const defensor = createMockActor();

      // Passando dano numérico direto
      const res15 = processarFintar(atacante, defensor, 15);
      assert.equal(res15.danoOriginal, 15);
      assert.equal(res15.danoPrimeiroAtaque, 7, "Math.floor(15 / 2) = 7");
      assert.equal(res15.danoReduzido, 7);

      // Passando dano via objeto de opções
      const res20 = processarFintar(atacante, defensor, { dano: 20 });
      assert.equal(res20.danoOriginal, 20);
      assert.equal(res20.danoPrimeiroAtaque, 10, "Math.floor(20 / 2) = 10");

      // Usando helper retornado
      assert.equal(res15.calcularDanoPrimeiroAtaque(9), 4, "Math.floor(9 / 2) = 4");
      assert.equal(res15.reduzirDano(17), 8, "Math.floor(17 / 2) = 8");
    });

    it("3.3 - Confere bônus de +1d6 nas rolagens de ataque subsequentes contra o mesmo alvo no mesmo turno", () => {
      const atacante = createMockActor();
      const defensor = createMockActor({ name: "Orc Guerreiro" });

      const res = processarFintar(atacante, defensor, 12);
      assert.equal(res.bonusAtaquesSubsequentes, "+1d6", "Bônus deve ser +1d6");
      assert.equal(res.bonusFormula, BONUS_ATAQUE_FINTAR);
      assert.equal(res.bonusDados, 1);
      assert.equal(res.mesmoAlvo, true);
      assert.equal(res.mesmoTurno, true);
      assert.equal(res.alvo, defensor);
    });

    it("3.4 - Falha se o atacante estiver impossibilitado de realizar reações (ex: Atordoado)", () => {
      const atacante = createMockActor();
      atacante.aplicarCondicao("Atordoado"); // Atordoado impede reações

      const defensor = createMockActor();
      const res = processarFintar(atacante, defensor, 10);

      assert.equal(res.valido, false, "Atacante atordoado não pode realizar reações");
      assert.ok(res.motivo.includes("reações"));
    });
  });

  /* ------------------------------------------------------------------------- */
  /* 4. INTERCEPTAR                                                            */
  /* ------------------------------------------------------------------------- */
  describe("4. Interceptar (processarInterceptar)", () => {
    it("4.1 - É uma Reação ativada contra oponente tentando passar adjacente", () => {
      const atacante = createMockActor({ attributes: { agilidade: 3 } });
      const oponente = createMockActor({ attributes: { agilidade: 2 } });

      const res = processarInterceptar(atacante, oponente);
      assert.equal(res.tipoAcao, "reacao");
      assert.equal(res.reacao, true);
      assert.equal(res.confrontoAtributo, CONFRONTO_INTERCEPTAR_ATRIBUTO);
      assert.equal(res.confrontoAtributo, "agilidade");
    });

    it("4.2 - Se vencer o confronto de Agilidade, bloqueia a passagem e consome Ação de Movimento do próximo turno", () => {
      const atacante = createMockActor({ attributes: { agilidade: 4 } });
      const oponente = createMockActor({ attributes: { agilidade: 2 } });

      // Atacante vence confronto manual (12 vs 8)
      const resVenceu = processarInterceptar(atacante, oponente, {
        rolagemAtacante: 12,
        rolagemOponente: 8,
      });

      assert.equal(resVenceu.sucesso, true, "Atacante deve ter vencido");
      assert.equal(resVenceu.venceu, true);
      assert.equal(resVenceu.bloqueiaPassagem, true, "Bloqueia a passagem do oponente");
      assert.equal(resVenceu.passagemBloqueada, true);
      assert.equal(resVenceu.oponenteBloqueado, true);
      assert.equal(resVenceu.consomeAcaoMovimentoProximoTurno, true, "Consome ação de movimento do próximo turno");
      assert.equal(resVenceu.acaoMovimentoProximoTurnoConsumida, true);
      assert.ok(resVenceu.descricao.includes("bloqueia a passagem"));
    });

    it("4.3 - Se perder o confronto de Agilidade, o oponente não é bloqueado e não consome ação de movimento", () => {
      const atacante = createMockActor({ attributes: { agilidade: 2 } });
      const oponente = createMockActor({ attributes: { agilidade: 4 } });

      // Oponente tira 14, atacante tira 9
      const resPerdeu = processarInterceptar(atacante, oponente, {
        rolagemAtacante: 9,
        rolagemOponente: 14,
      });

      assert.equal(resPerdeu.sucesso, false, "Atacante perde o confronto");
      assert.equal(resPerdeu.venceu, false);
      assert.equal(resPerdeu.bloqueiaPassagem, false, "Não bloqueia a passagem");
      assert.equal(resPerdeu.passagemBloqueada, false);
      assert.equal(resPerdeu.oponenteBloqueado, false);
      assert.equal(resPerdeu.consomeAcaoMovimentoProximoTurno, false, "Não consome ação de movimento se falhar");
      assert.equal(resPerdeu.acaoMovimentoProximoTurnoConsumida, false);
      assert.ok(resPerdeu.descricao.includes("não é bloqueado"));
    });

    it("4.4 - Suporta forçamento de resultado ou confronto padrão de atributos", () => {
      const atacante = createMockActor({ attributes: { agilidade: 4 } });
      const oponente = createMockActor({ attributes: { agilidade: 3 } });

      // Confronto padrão usando os atributos quando rolagens não forem passadas
      const resPadrao = processarInterceptar(atacante, oponente);
      assert.equal(resPadrao.agilidadeAtacante, 4);
      assert.equal(resPadrao.agilidadeOponente, 3);
      assert.equal(resPadrao.venceu, true, "Atacante com agilidade superior vence por padrão");

      // Forçamento explícito de vitória via opção
      const resForcado = processarInterceptar(atacante, oponente, { venceu: false });
      assert.equal(resForcado.venceu, false);
      assert.equal(resForcado.bloqueiaPassagem, false);
    });

    it("4.5 - Não pode interceptar se estiver incapacitado de realizar reações (ex: Atordoado)", () => {
      const atacante = createMockActor({ attributes: { agilidade: 5 } });
      atacante.aplicarCondicao("Atordoado");
      const oponente = createMockActor({ attributes: { agilidade: 2 } });

      const res = processarInterceptar(atacante, oponente);
      assert.equal(res.valido, false, "Personagem atordoado não pode interceptar");
      assert.equal(res.sucesso, false);
      assert.equal(res.bloqueiaPassagem, false);
      assert.ok(res.motivo.includes("reações"));
    });
  });
});
