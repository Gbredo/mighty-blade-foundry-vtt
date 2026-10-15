/**
 * Suíte de Testes Automatizados - Subtítulo 24: Resolução de Dados, Graus de Sucesso e Dupla Inaptidão
 * Mighty Blade 3ª Edição (Foundry VTT v14)
 *
 * Casos de Teste Cobertos:
 *
 * - Caso 1: Critérios de Sucesso Decisivo (Acerto Crítico)
 *   * 1.1: 2 ou mais dados 6 em 2d6 resultam em Sucesso Decisivo ([6, 6])
 *   * 1.2: 2 ou mais dados 6 em pools maiores resultam em Sucesso Decisivo ([6, 6, 3], [6, 6, 6, 1])
 *   * 1.3: Menos de 2 dados 6 ([6, 5], [6, 4, 3]) não configuram Sucesso Decisivo
 *   * 1.4: 1d6 (rolagem de Inapto) com resultado 6 nunca pode ser Sucesso Decisivo
 *   * 1.5: Sucesso Decisivo garante sucesso automático mesmo com total abaixo da DV
 *
 * - Caso 2: Benefícios de Sucesso Decisivo em Magias
 *   * 2.1: Opção 1: Custo de Mana reduzido a 0 PM (custoZeroPM: true)
 *   * 2.2: Opção 2: Dano da magia multiplicado por 2 (danoMultiplicado2: true, multiplicador: 2)
 *   * 2.3: Opção 3: Área ou duração multiplicada por 2 (areaOuDuracaoMultiplicada2: true)
 *   * 2.4: O jogador deve escolher exatamente 1 benefício; seleção múltipla lança erro
 *   * 2.5: Lista de benefícios disponíveis exibida quando não especificado de antemão
 *   * 2.6: Suporte a sinônimos e grafias alternativas para escolha do benefício de magia
 *
 * - Caso 3: Sucesso Decisivo em Ataques Físicos e Multiplicador de Dano
 *   * 3.1: Ataque físico padrão em Sucesso Decisivo multiplica o dano por 2 (danoMultiplicado2: true)
 *   * 3.2: Ataque comum sem Sucesso Decisivo mantém multiplicador 1x
 *
 * - Caso 4: Regra de Adição de Multiplicadores de Dano
 *   * 4.1: Helper calcularMultiplicadorDanoCritico com 2x base + 2x habilidade resulta em 4x (aditivo)
 *   * 4.2: Nunca multiplicação exponencial (2 + 3 = 5x, jamais 2 * 3 = 6x)
 *   * 4.3: Suporte a múltiplos multiplicadores extras em array ([2, 2] -> 6x)
 *   * 4.4: calcularMultiplicadorDanoCritico com objeto ou parâmetros padrão
 *   * 4.5: Integração de multiplicadorExtra em avaliarRolagemDados para ataque físico e magia de dano
 *
 * - Caso 5: Critérios de Falha Crítica
 *   * 5.1: Todos os dados 1 em 2d6 ([1, 1]) configuram Falha Crítica e falha automática
 *   * 5.2: Todos os dados 1 em 3d6 ([1, 1, 1]) configuram Falha Crítica
 *   * 5.3: 1d6 de Inapto resultando em [1] é Falha Crítica
 *   * 5.4: Presença de 1s sem ser todos 1 ([1, 2], [1, 1, 5]) NÃO é Falha Crítica
 *   * 5.5: Falha Crítica aplica efeito colateral grave (efeitoColateralGrave: true)
 *   * 5.6: Falha Crítica causa falha automática mesmo se modificadores superassem a DV
 *
 * - Caso 6: Trava Absoluta de Dupla Inaptidão
 *   * 6.1: 2 fontes de inaptidão impõem falha automática sem rolagem (0% de chance de sucesso)
 *   * 6.2: 3 ou mais fontes de inaptidão mantêm falha automática
 *   * 6.3: 1 fonte de inaptidão (inaptidão simples) permite a rolagem normalmente
 *   * 6.4: 0 fontes de inaptidão permite rolagem normal
 *   * 6.5: avaliarRolagemDados com duplaInaptidao: true ou fontesInaptidao retorna imediatamente sem rolar
 *   * 6.6: verificarDuplaInaptidao integrado a ator com condições (Distraído + arma com FN excessiva)
 *
 * - Caso 7: Resolução de Confrontos Opostos e Empates
 *   * 7.1: Regra 1 - Sucesso Decisivo vence automaticamente resultado sem Sucesso Decisivo (mesmo com menor total)
 *   * 7.2: Regra 2 - Ambos com Sucesso Decisivo: vence a maior soma total (Dados + Atributo)
 *   * 7.3: Regra 2 - Ambos sem Sucesso Decisivo: vence a maior soma total
 *   * 7.4: Regra 3 - Empate na soma total: vence quem tem o Atributo mais alto
 *   * 7.5: Regra 4 - Empate na soma e Atributos idênticos: desempate rápido com 1d6
 *   * 7.6: Desempate de 1d6 determinístico via opções de injeção para testes
 *   * 7.7: Confronto contra participante com Falha Crítica ou Falha Automática concede vitória ao oponente
 *
 * - Caso 8: Integração com Mock Actor e Fluxo Completo
 *   * 8.1: actor.avaliarRolagemDados para ataque e magia
 *   * 8.2: actor.verificarDuplaInaptidao com condições e itens
 *   * 8.3: Confronto oposto entre dois atores mock (resolverConfrontoOposto)
 */

import test, { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  createMockActor,
  avaliarRolagemDados,
  calcularMultiplicadorDanoCritico,
  verificarDuplaInaptidao,
  resolverConfrontoOposto,
  normalizarBeneficioMagia,
  BENEFICIOS_CRITICO_MAGIA,
  MOTIVOS_VITORIA_CONFRONTO,
  CRITERIO_CRITICO_MIN_SEIS,
  CRITERIO_FALHA_CRITICA_VALOR,
  MULTIPLICADOR_CRITICO_BASE,
} from "./test-helper.mjs";

describe("Subtítulo 24: Resolução de Dados, Graus de Sucesso e Dupla Inaptidão", () => {
  /* ------------------------------------------------------------------------- */
  /* CASO 1: CRITÉRIOS DE SUCESSO DECISIVO (ACERTO CRÍTICO)                     */
  /* ------------------------------------------------------------------------- */
  describe("Caso 1: Critérios de Sucesso Decisivo (Acerto Crítico)", () => {
    it("1.1 - 2 ou mais dados 6 em 2d6 resultam em Sucesso Decisivo ([6, 6])", () => {
      const resultado = avaliarRolagemDados([6, 6], 3);

      assert.equal(resultado.sucessoDecisivo, true, "Deve ser Sucesso Decisivo com [6, 6]");
      assert.equal(resultado.acertoCritico, true, "acertoCritico deve ser true");
      assert.equal(resultado.falhaCritica, false, "Não deve ser falha crítica");
      assert.equal(resultado.sucesso, true, "Sucesso Decisivo garante sucesso");
      assert.equal(resultado.total, 15, "Soma de dados (12) + atributo (3) = 15");
    });

    it("1.2 - 2 ou mais dados 6 em pools maiores resultam em Sucesso Decisivo", () => {
      const res3d6 = avaliarRolagemDados([6, 6, 3], 2);
      assert.equal(res3d6.sucessoDecisivo, true, "3d6 com dois 6 deve ser Sucesso Decisivo");
      assert.equal(res3d6.total, 17, "6 + 6 + 3 + 2 = 17");

      const res4d6 = avaliarRolagemDados([6, 6, 6, 1], 4);
      assert.equal(res4d6.sucessoDecisivo, true, "4d6 com três 6 deve ser Sucesso Decisivo");
      assert.equal(res4d6.total, 23, "6 + 6 + 6 + 1 + 4 = 23");
    });

    it("1.3 - Menos de 2 dados 6 ([6, 5], [6, 4, 3]) não configuram Sucesso Decisivo", () => {
      const res1Seis = avaliarRolagemDados([6, 5], 3);
      assert.equal(res1Seis.sucessoDecisivo, false, "Apenas um 6 não é Sucesso Decisivo");
      assert.equal(res1Seis.acertoCritico, false);

      const resPool = avaliarRolagemDados([6, 4, 3], 2);
      assert.equal(resPool.sucessoDecisivo, false, "3d6 com apenas um 6 não é Sucesso Decisivo");
    });

    it("1.4 - 1d6 (rolagem de Inapto) com resultado 6 nunca pode ser Sucesso Decisivo", () => {
      const resInapto = avaliarRolagemDados([6], 4);
      assert.equal(
        resInapto.sucessoDecisivo,
        false,
        "Impossível obter Sucesso Decisivo com apenas 1 dado rolado"
      );
      assert.equal(resInapto.total, 10, "6 + 4 = 10");
    });

    it("1.5 - Sucesso Decisivo garante sucesso automático mesmo com total abaixo da DV", () => {
      // Dificuldade altíssima DV 30, total 16
      const res = avaliarRolagemDados([6, 6], 4, { dificuldade: 30 });
      assert.equal(res.sucessoDecisivo, true);
      assert.equal(
        res.sucesso,
        true,
        "Sucesso Decisivo deve vencer qualquer dificuldade (sucesso automático)"
      );
    });
  });

  /* ------------------------------------------------------------------------- */
  /* CASO 2: BENEFÍCIOS DE SUCESSO DECISIVO EM MAGIAS                          */
  /* ------------------------------------------------------------------------- */
  describe("Caso 2: Benefícios de Sucesso Decisivo em Magias", () => {
    it("2.1 - Opção 1: Custo de Mana reduzido a 0 PM (custoZeroPM: true)", () => {
      const res = avaliarRolagemDados([6, 6], 4, {
        isMagia: true,
        beneficioMagia: "custoZeroPM",
      });

      assert.equal(res.sucessoDecisivo, true);
      assert.equal(res.custoZeroPM, true, "Deve aplicar custoZeroPM: true");
      assert.equal(res.danoMultiplicado2, false, "Não deve multiplicar dano");
      assert.equal(res.areaOuDuracaoMultiplicada2, false, "Não deve multiplicar área/duração");
      assert.equal(res.beneficioEscolhido, BENEFICIOS_CRITICO_MAGIA.CUSTO_ZERO_PM);
    });

    it("2.2 - Opção 2: Dano da magia multiplicado por 2 (danoMultiplicado2: true)", () => {
      const res = avaliarRolagemDados([6, 6, 2], 3, {
        isMagia: true,
        beneficioMagia: "danoMultiplicado2",
      });

      assert.equal(res.sucessoDecisivo, true);
      assert.equal(res.danoMultiplicado2, true, "Deve aplicar danoMultiplicado2: true");
      assert.equal(res.multiplicadorDano, 2, "Multiplicador de dano deve ser 2x");
      assert.equal(res.custoZeroPM, false, "Custo não deve ser zerado");
      assert.equal(res.areaOuDuracaoMultiplicada2, false);
      assert.equal(res.beneficioEscolhido, BENEFICIOS_CRITICO_MAGIA.DANO_MULTIPLICADO_2);
    });

    it("2.3 - Opção 3: Área ou duração multiplicada por 2 (areaOuDuracaoMultiplicada2: true)", () => {
      const res = avaliarRolagemDados([6, 6], 5, {
        isMagia: true,
        beneficioMagia: "areaOuDuracaoMultiplicada2",
      });

      assert.equal(res.sucessoDecisivo, true);
      assert.equal(res.areaOuDuracaoMultiplicada2, true, "Deve aplicar areaOuDuracaoMultiplicada2: true");
      assert.equal(res.custoZeroPM, false);
      assert.equal(res.danoMultiplicado2, false);
      assert.equal(res.beneficioEscolhido, BENEFICIOS_CRITICO_MAGIA.AREA_DURACAO_MULTIPLICADA_2);
    });

    it("2.4 - O jogador deve escolher exatamente 1 benefício; seleção múltipla lança erro", () => {
      assert.throws(
        () => {
          avaliarRolagemDados([6, 6], 3, {
            isMagia: true,
            beneficioMagia: ["custoZeroPM", "danoMultiplicado2"],
          });
        },
        /Em Magias, o jogador deve escolher exatamente 1 benefício/i,
        "Deve rejeitar seleção múltipla de benefícios em magias"
      );

      assert.throws(
        () => {
          avaliarRolagemDados([6, 6], 3, {
            isMagia: true,
            beneficioMagia: { custoZeroPM: true, areaOuDuracaoMultiplicada2: true },
          });
        },
        /Em Magias, o jogador deve escolher exatamente 1 benefício/i
      );
    });

    it("2.5 - Lista de benefícios disponíveis exibida quando não especificado de antemão", () => {
      const res = avaliarRolagemDados([6, 6], 3, { isMagia: true });

      assert.equal(res.sucessoDecisivo, true);
      assert.equal(res.beneficioEscolhido, null, "Nenhum benefício selecionado ainda");
      assert.deepEqual(
        res.beneficiosDisponiveisMagia,
        [
          BENEFICIOS_CRITICO_MAGIA.CUSTO_ZERO_PM,
          BENEFICIOS_CRITICO_MAGIA.DANO_MULTIPLICADO_2,
          BENEFICIOS_CRITICO_MAGIA.AREA_DURACAO_MULTIPLICADA_2,
        ],
        "Deve expor os 3 benefícios canônicos disponíveis"
      );
    });

    it("2.6 - Suporte a sinônimos e grafias alternativas para escolha do benefício de magia", () => {
      const resCustoZero = avaliarRolagemDados([6, 6], 2, {
        isMagia: true,
        beneficioMagia: "custo_zero",
      });
      assert.equal(resCustoZero.custoZeroPM, true);

      const resDanoDobro = avaliarRolagemDados([6, 6], 2, {
        isMagia: true,
        beneficioMagia: "dano_dobrado",
      });
      assert.equal(resDanoDobro.danoMultiplicado2, true);

      const resAreaDobro = avaliarRolagemDados([6, 6], 2, {
        isMagia: true,
        beneficioMagia: "area_duracao",
      });
      assert.equal(resAreaDobro.areaOuDuracaoMultiplicada2, true);
    });
  });

  /* ------------------------------------------------------------------------- */
  /* CASO 3: SUCESSO DECISIVO EM ATAQUES FÍSICOS                               */
  /* ------------------------------------------------------------------------- */
  describe("Caso 3: Sucesso Decisivo em Ataques Físicos e Multiplicador de Dano", () => {
    it("3.1 - Ataque físico padrão em Sucesso Decisivo multiplica o dano por 2", () => {
      const res = avaliarRolagemDados([6, 6], 4, { tipo: "ataque" });

      assert.equal(res.sucessoDecisivo, true);
      assert.equal(res.danoMultiplicado2, true, "Ataque físico crítico deve ter dano multiplicado por 2");
      assert.equal(res.multiplicadorDano, 2, "Multiplicador de dano deve ser 2x");
      assert.equal(res.custoZeroPM, false, "Não deve aplicar benefícios de magia em ataque físico");
    });

    it("3.2 - Ataque comum sem Sucesso Decisivo mantém multiplicador 1x", () => {
      const res = avaliarRolagemDados([5, 4], 4, { tipo: "ataque" });

      assert.equal(res.sucessoDecisivo, false);
      assert.equal(res.danoMultiplicado2, false);
      assert.equal(res.multiplicadorDano, 1, "Dano normal sem crítico tem multiplicador 1x");
    });
  });

  /* ------------------------------------------------------------------------- */
  /* CASO 4: REGRA DE ADIÇÃO DE MULTIPLICADORES DE DANO                        */
  /* ------------------------------------------------------------------------- */
  describe("Caso 4: Regra de Adição de Multiplicadores de Dano", () => {
    it("4.1 - calcularMultiplicadorDanoCritico com 2x base + 2x habilidade resulta em 4x (aditivo)", () => {
      // Ex: Ataque Devastador (2x dano) em acerto crítico (2x): 2 + 2 = 4x
      const mult = calcularMultiplicadorDanoCritico(2, 2);
      assert.equal(mult, 4, "2x base + 2x Ataque Devastador deve resultar em 4x o dano");
    });

    it("4.2 - Nunca multiplicação exponencial (2 + 3 = 5x, jamais 2 * 3 = 6x)", () => {
      // Habilidade que dá 3x dano + crítico 2x = 5x (não 6x)
      const mult = calcularMultiplicadorDanoCritico(2, 3);
      assert.equal(mult, 5, "2 + 3 = 5x o dano (aditivo, não exponencial)");
      assert.notEqual(mult, 6, "Não deve realizar multiplicação exponencial (2 * 3 = 6)");
    });

    it("4.3 - Suporte a múltiplos multiplicadores extras em array ([2, 2] -> 6x)", () => {
      const mult = calcularMultiplicadorDanoCritico(2, [2, 2]);
      assert.equal(mult, 6, "2 base + 2 extra + 2 extra = 6x");
    });

    it("4.4 - calcularMultiplicadorDanoCritico com objeto ou parâmetros padrão", () => {
      assert.equal(calcularMultiplicadorDanoCritico(), 2, "Padrão sem argumentos deve ser 2x");
      assert.equal(calcularMultiplicadorDanoCritico(2, 0), 2, "2x com 0 extra é 2x");
      assert.equal(
        calcularMultiplicadorDanoCritico({ base: 2, extra: 2 }),
        4,
        "Deve suportar objeto como argumento"
      );
    });

    it("4.5 - Integração de multiplicadorExtra em avaliarRolagemDados para ataque físico e magia de dano", () => {
      // Ataque físico crítico com habilidade de dano dobrado (multiplicadorExtra: 2)
      const resAtaque = avaliarRolagemDados([6, 6], 4, {
        tipo: "ataque",
        multiplicadorExtra: 2,
      });
      assert.equal(resAtaque.sucessoDecisivo, true);
      assert.equal(resAtaque.multiplicadorDano, 4, "2 base + 2 extra = 4x");

      // Magia crítica com escolha de dano multiplicado e habilidade extra
      const resMagia = avaliarRolagemDados([6, 6], 3, {
        isMagia: true,
        beneficioMagia: "danoMultiplicado2",
        multiplicadorExtra: 3,
      });
      assert.equal(resMagia.sucessoDecisivo, true);
      assert.equal(resMagia.multiplicadorDano, 5, "2 base + 3 extra = 5x");
    });
  });

  /* ------------------------------------------------------------------------- */
  /* CASO 5: CRITÉRIOS DE FALHA CRÍTICA                                         */
  /* ------------------------------------------------------------------------- */
  describe("Caso 5: Critérios de Falha Crítica", () => {
    it("5.1 - Todos os dados 1 em 2d6 ([1, 1]) configuram Falha Crítica e falha automática", () => {
      const res = avaliarRolagemDados([1, 1], 4);

      assert.equal(res.falhaCritica, true, "Deve ser Falha Crítica para [1, 1]");
      assert.equal(res.falhaAutomatica, true, "Falha Crítica impõe falha automática");
      assert.equal(res.sucesso, false, "Sucesso deve ser false");
      assert.equal(res.sucessoDecisivo, false);
      assert.equal(res.efeitoColateralGrave, true, "Deve aplicar efeito colateral grave");
      assert.ok(res.efeitoColateral, "Deve conter descrição de efeito colateral");
    });

    it("5.2 - Todos os dados 1 em 3d6 ([1, 1, 1]) configuram Falha Crítica", () => {
      const res = avaliarRolagemDados([1, 1, 1], 2);

      assert.equal(res.falhaCritica, true, "[1, 1, 1] deve ser Falha Crítica");
      assert.equal(res.falhaAutomatica, true);
      assert.equal(res.sucesso, false);
    });

    it("5.3 - 1d6 de Inapto resultando em [1] é Falha Crítica", () => {
      const res = avaliarRolagemDados([1], 5);

      assert.equal(res.falhaCritica, true, "1d6 de Inapto tirando 1 é Falha Crítica");
      assert.equal(res.falhaAutomatica, true);
      assert.equal(res.sucesso, false);
      assert.equal(res.efeitoColateralGrave, true);
    });

    it("5.4 - Presença de 1s sem ser todos 1 ([1, 2], [1, 1, 5]) NÃO é Falha Crítica", () => {
      const res2d6 = avaliarRolagemDados([1, 2], 3);
      assert.equal(res2d6.falhaCritica, false, "[1, 2] não é falha crítica");
      assert.equal(res2d6.falhaAutomatica, false);

      const res3d6 = avaliarRolagemDados([1, 1, 5], 4);
      assert.equal(res3d6.falhaCritica, false, "[1, 1, 5] não é falha crítica");
      assert.equal(res3d6.falhaAutomatica, false);
    });

    it("5.5 - Falha Crítica aplica efeito colateral grave e suporta mensagem personalizada", () => {
      const res = avaliarRolagemDados([1, 1], 2, {
        efeitoColateral: "A arma escorrega e se crava no tronco de uma árvore.",
      });

      assert.equal(res.efeitoColateralGrave, true);
      assert.equal(res.efeitoColateral, "A arma escorrega e se crava no tronco de uma árvore.");
    });

    it("5.6 - Falha Crítica causa falha automática mesmo se modificadores superassem a DV", () => {
      // [1, 1] + 10 = total 12 contra DV 8: normalmente seria sucesso, mas falha crítica impõe falha
      const res = avaliarRolagemDados([1, 1], 10, { dificuldade: 8 });

      assert.equal(res.falhaCritica, true);
      assert.equal(res.total, 12, "Soma total seria 12");
      assert.equal(res.sucesso, false, "Falha crítica força sucesso = false independentemente da DV");
      assert.equal(res.falhaAutomatica, true);
    });
  });

  /* ------------------------------------------------------------------------- */
  /* CASO 6: TRAVA ABSOLUTA DE DUPLA INAPTIDÃO                                  */
  /* ------------------------------------------------------------------------- */
  describe("Caso 6: Trava Absoluta de Dupla Inaptidão", () => {
    it("6.1 - 2 fontes de inaptidão impõem falha automática sem rolagem (0% de chance de sucesso)", () => {
      const checagem = verificarDuplaInaptidao(["Distraído", "Arma com FN > Força"]);

      assert.equal(checagem.duplaInaptidao, true, "Deve assinalar duplaInaptidao: true");
      assert.equal(checagem.falhaAutomatica, true, "Deve assinalar falhaAutomatica: true");
      assert.equal(checagem.chanceSucesso, 0, "0% de chance de sucesso");
      assert.equal(checagem.permitida, false, "Ação não é permitida / bloqueada");
      assert.equal(checagem.podeRolar, false, "Rolagem é estritamente proibida");
      assert.equal(checagem.totalFontes, 2);
    });

    it("6.2 - 3 ou mais fontes de inaptidão mantêm falha automática", () => {
      const checagem = verificarDuplaInaptidao(["Distraído", "Cego", "Exausto"]);

      assert.equal(checagem.duplaInaptidao, true);
      assert.equal(checagem.falhaAutomatica, true);
      assert.equal(checagem.chanceSucesso, 0);
      assert.equal(checagem.totalFontes, 3);
    });

    it("6.3 - 1 fonte de inaptidão (inaptidão simples) permite a rolagem normalmente", () => {
      const checagem = verificarDuplaInaptidao(["Distraído"]);

      assert.equal(checagem.duplaInaptidao, false, "1 fonte não é dupla inaptidão");
      assert.equal(checagem.falhaAutomatica, false);
      assert.equal(checagem.permitida, true);
      assert.equal(checagem.podeRolar, true, "Pode rolar dados (rolará 1d6 conforme inaptidão simples)");
      assert.equal(checagem.totalFontes, 1);
    });

    it("6.4 - 0 fontes de inaptidão permite rolagem normal", () => {
      const checagem = verificarDuplaInaptidao([]);

      assert.equal(checagem.duplaInaptidao, false);
      assert.equal(checagem.falhaAutomatica, false);
      assert.equal(checagem.podeRolar, true);
      assert.equal(checagem.totalFontes, 0);
    });

    it("6.5 - avaliarRolagemDados com duplaInaptidao: true ou fontesInaptidao retorna imediatamente sem rolar", () => {
      const resDireto = avaliarRolagemDados([], 4, { duplaInaptidao: true });
      assert.equal(resDireto.duplaInaptidao, true);
      assert.equal(resDireto.falhaAutomatica, true);
      assert.equal(resDireto.sucesso, false);
      assert.equal(resDireto.podeRolar, false);
      assert.equal(resDireto.chanceSucesso, 0);

      const resFontes = avaliarRolagemDados([6, 6], 4, {
        fontesInaptidao: ["Distraído", "Arma FN Excessiva"],
      });
      assert.equal(resFontes.duplaInaptidao, true);
      assert.equal(resFontes.falhaAutomatica, true);
      assert.equal(resFontes.sucesso, false);
      assert.equal(resFontes.sucessoDecisivo, false, "Trava de inaptidão invalida até rolagens acidentais");
    });

    it("6.6 - verificarDuplaInaptidao integrado a ator com condições (Distraído + arma com FN excessiva)", () => {
      const ator = createMockActor({
        attributes: { forca: { value: 3 } },
      });
      ator.aplicarCondicao("Distraído");

      const machadoPesado = {
        name: "Machado de Batalha",
        type: "arma",
        system: { fn: 5 },
      };

      const checagem = verificarDuplaInaptidao(ator, { item: machadoPesado });

      assert.equal(
        checagem.duplaInaptidao,
        true,
        "Distraído + Força 3 < FN 5 deve ativar Trava de Dupla Inaptidão"
      );
      assert.equal(checagem.falhaAutomatica, true);
      assert.equal(checagem.podeRolar, false);
      assert.ok(
        checagem.fontes.some((f) => String(f).includes("Distraído")),
        "Deve listar a condição Distraído"
      );
      assert.ok(
        checagem.fontes.some((f) => String(f).includes("FN Excessiva")),
        "Deve listar a FN Excessiva do item"
      );
    });
  });

  /* ------------------------------------------------------------------------- */
  /* CASO 7: RESOLUÇÃO DE CONFRONTOS OPOSTOS E EMPATES                          */
  /* ------------------------------------------------------------------------- */
  describe("Caso 7: Resolução de Confrontos Opostos e Empates", () => {
    it("7.1 - Regra 1: Sucesso Decisivo vence automaticamente resultado sem Sucesso Decisivo (mesmo com menor total)", () => {
      // Participante A tem Sucesso Decisivo [6, 6] + atributo 2 = total 14
      // Participante B tem resultado normal [5, 5, 5] + atributo 4 = total 19
      const partA = { nome: "Guerreiro A", dados: [6, 6], atributo: 2, total: 14, sucessoDecisivo: true };
      const partB = { nome: "Oponente B", dados: [5, 5, 5], atributo: 4, total: 19, sucessoDecisivo: false };

      const confronto = resolverConfrontoOposto(partA, partB);

      assert.equal(confronto.vencedor, "A", "Guerreiro A deve vencer por Sucesso Decisivo");
      assert.equal(confronto.vencedorNome, "Guerreiro A");
      assert.equal(confronto.motivo, MOTIVOS_VITORIA_CONFRONTO.SUCESSO_DECISIVO);
      assert.equal(confronto.empate, false);

      // Invertendo a ordem: participante B é o que tem Sucesso Decisivo
      const confrontoInvertido = resolverConfrontoOposto(partB, partA);
      assert.equal(confrontoInvertido.vencedor, "B");
      assert.equal(confrontoInvertido.vencedorNome, "Guerreiro A");
    });

    it("7.2 - Regra 2: Ambos com Sucesso Decisivo: vence a maior soma total (Dados + Atributo)", () => {
      // Ambos têm [6, 6]. A tem atributo 4 (total 16), B tem atributo 6 (total 18)
      const partA = { nome: "Herói A", dados: [6, 6], atributo: 4, total: 16, sucessoDecisivo: true };
      const partB = { nome: "Herói B", dados: [6, 6], atributo: 6, total: 18, sucessoDecisivo: true };

      const confronto = resolverConfrontoOposto(partA, partB);

      assert.equal(confronto.vencedor, "B", "Herói B deve vencer por maior soma total");
      assert.equal(confronto.vencedorNome, "Herói B");
      assert.equal(confronto.motivo, MOTIVOS_VITORIA_CONFRONTO.MAIOR_TOTAL);
    });

    it("7.3 - Regra 2: Ambos sem Sucesso Decisivo: vence a maior soma total", () => {
      const partA = { nome: "Soldado A", dados: [4, 5], atributo: 3, total: 12, sucessoDecisivo: false };
      const partB = { nome: "Soldado B", dados: [3, 4], atributo: 3, total: 10, sucessoDecisivo: false };

      const confronto = resolverConfrontoOposto(partA, partB);

      assert.equal(confronto.vencedor, "A", "Soldado A deve vencer por maior soma total (12 vs 10)");
      assert.equal(confronto.vencedorNome, "Soldado A");
      assert.equal(confronto.motivo, MOTIVOS_VITORIA_CONFRONTO.MAIOR_TOTAL);
    });

    it("7.4 - Regra 3: Empate na soma total: vence quem tem o Atributo mais alto", () => {
      // Total de ambos é 15. A rolou 12 nos dados + atributo 3 = 15. B rolou 10 nos dados + atributo 5 = 15.
      const partA = { nome: "Lutador A", dados: [6, 6], atributo: 3, total: 15, sucessoDecisivo: false };
      const partB = { nome: "Lutador B", dados: [5, 5], atributo: 5, total: 15, sucessoDecisivo: false };

      const confronto = resolverConfrontoOposto(partA, partB);

      assert.equal(confronto.vencedor, "B", "Lutador B vence pelo atributo mais alto (5 vs 3)");
      assert.equal(confronto.vencedorNome, "Lutador B");
      assert.equal(confronto.motivo, MOTIVOS_VITORIA_CONFRONTO.MAIOR_ATRIBUTO);
      assert.equal(confronto.empate, false);
    });

    it("7.5 - Regra 4: Empate na soma e Atributos idênticos: desempate rápido com 1d6", () => {
      // Total 14 e Atributo 4 em ambos
      const partA = { nome: "Duelista A", dados: [5, 5], atributo: 4, total: 14 };
      const partB = { nome: "Duelista B", dados: [5, 5], atributo: 4, total: 14 };

      // Executa o desempate automático
      const confronto = resolverConfrontoOposto(partA, partB);

      // Como rola 1d6 aleatório, deve ter acionado desempate ou empate estrito
      assert.ok(confronto.dadosDesempate, "Deve registrar dados de desempate");
      assert.ok(
        confronto.motivo === MOTIVOS_VITORIA_CONFRONTO.DESEMPATE_1D6 ||
          confronto.motivo === MOTIVOS_VITORIA_CONFRONTO.EMPATE,
        "Deve resolver via desempate de 1d6 ou empate"
      );
    });

    it("7.6 - Desempate de 1d6 determinístico via opções de injeção para testes", () => {
      const partA = { nome: "Duelista A", total: 14, atributo: 4 };
      const partB = { nome: "Duelista B", total: 14, atributo: 4 };

      // A rola 5, B rola 2 no 1d6 de desempate
      const confrontoA = resolverConfrontoOposto(partA, partB, {
        dadoDesempateA: 5,
        dadoDesempateB: 2,
      });

      assert.equal(confrontoA.vencedor, "A");
      assert.equal(confrontoA.vencedorNome, "Duelista A");
      assert.equal(confrontoA.motivo, MOTIVOS_VITORIA_CONFRONTO.DESEMPATE_1D6);
      assert.deepEqual(confrontoA.dadosDesempate, { a: 5, b: 2 });

      // Invertendo: B rola 6, A rola 1 no 1d6 de desempate
      const confrontoB = resolverConfrontoOposto(partA, partB, {
        dadoDesempateA: 1,
        dadoDesempateB: 6,
      });

      assert.equal(confrontoB.vencedor, "B");
      assert.equal(confrontoB.vencedorNome, "Duelista B");
      assert.equal(confrontoB.motivo, MOTIVOS_VITORIA_CONFRONTO.DESEMPATE_1D6);
    });

    it("7.7 - Confronto contra participante com Falha Crítica ou Falha Automática concede vitória ao oponente", () => {
      const partA = { nome: "Atacante A", falhaCritica: true, falhaAutomatica: true, total: 2 };
      const partB = { nome: "Defensor B", total: 8, atributo: 2, falhaCritica: false };

      const confronto = resolverConfrontoOposto(partA, partB);

      assert.equal(confronto.vencedor, "B", "Defensor B vence devido à Falha Crítica de A");
      assert.equal(confronto.motivo, MOTIVOS_VITORIA_CONFRONTO.FALHA_AUTOMATICA_OPONENTE);

      // Participante com Dupla Inaptidão contra outro
      const partC = { nome: "Inapto C", duplaInaptidao: true, falhaAutomatica: true, total: 0 };
      const confrontoInapto = resolverConfrontoOposto(partB, partC);
      assert.equal(confrontoInapto.vencedor, "A");
      assert.equal(confrontoInapto.vencedorNome, "Defensor B");
    });
  });

  /* ------------------------------------------------------------------------- */
  /* CASO 8: INTEGRAÇÃO COM MOCK ACTOR E FLUXO COMPLETO                        */
  /* ------------------------------------------------------------------------- */
  describe("Caso 8: Integração com Mock Actor e Fluxo Completo", () => {
    it("8.1 - actor.avaliarRolagemDados para ataque e magia", () => {
      const mago = createMockActor({
        name: "Mago Canônico",
        attributes: { inteligencia: { value: 4 } },
      });

      const rolagemMagica = mago.avaliarRolagemDados([6, 6], 4, {
        isMagia: true,
        beneficioMagia: "custoZeroPM",
      });

      assert.equal(rolagemMagica.sucessoDecisivo, true);
      assert.equal(rolagemMagica.custoZeroPM, true);
      assert.equal(rolagemMagica.total, 16);
    });

    it("8.2 - actor.verificarDuplaInaptidao com condições e itens", () => {
      const guerreiro = createMockActor({
        name: "Guerreiro Forte",
        attributes: { forca: { value: 4 } },
      });

      // Sem condições: não é inapto
      assert.equal(guerreiro.verificarDuplaInaptidao().duplaInaptidao, false);

      // 1 condição (Distraído): inaptidão simples, não é dupla inaptidão
      guerreiro.aplicarCondicao("Distraído");
      assert.equal(guerreiro.verificarDuplaInaptidao().duplaInaptidao, false);
      assert.equal(guerreiro.verificarDuplaInaptidao().podeRolar, true);

      // Equipamento com FN 6 (FN > Força 4): segunda fonte de inaptidão
      const espadrao = { name: "Espadão", type: "arma", system: { fn: 6 } };
      const checagemDupla = guerreiro.verificarDuplaInaptidao({ item: espadrao });

      assert.equal(
        checagemDupla.duplaInaptidao,
        true,
        "Deve travar por dupla inaptidão ao somar Distraído e FN excessiva"
      );
      assert.equal(checagemDupla.falhaAutomatica, true);
      assert.equal(checagemDupla.podeRolar, false);
    });

    it("8.3 - Confronto oposto entre dois atores mock", () => {
      const atorA = createMockActor({
        name: "Herói A",
        attributes: { forca: { value: 4 } },
      });
      const atorB = createMockActor({
        name: "Monstro B",
        attributes: { forca: { value: 3 } },
      });

      // Ambos tiram o mesmo total na rolagem, mas Herói A tem Força 4 vs Força 3
      const rolagemA = { ...atorA.avaliarRolagemDados([5, 5], 4), atributo: 4, nome: atorA.name };
      const rolagemB = { ...atorB.avaliarRolagemDados([6, 5], 3), atributo: 3, nome: atorB.name };

      // Total A: 10 + 4 = 14. Total B: 11 + 3 = 14.
      assert.equal(rolagemA.total, 14);
      assert.equal(rolagemB.total, 14);

      const confronto = resolverConfrontoOposto(rolagemA, rolagemB);

      assert.equal(confronto.vencedor, "A", "Herói A vence pelo atributo de Força mais alto");
      assert.equal(confronto.motivo, MOTIVOS_VITORIA_CONFRONTO.MAIOR_ATRIBUTO);
    });
  });
});
