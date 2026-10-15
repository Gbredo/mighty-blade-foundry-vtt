/**
 * Bloco 10 — Sistema de Carga, Sobrecarga e Movimentação Física
 *
 * Plano de Testes Canônico (Mighty Blade 3ª Edição):
 * - Sub-módulo 10.1: Capacidade de Carga e Sobrecarga
 *   * 10.1.1 Carga GB (FOR×7 kg básica, FOR×35 kg pesada, FOR×70 kg máxima) e Variante do Combatente (FOR×20 kg)
 *   * 10.1.2 Sobrecarga Parcial (Peso > Carga Máxima): Inapto em testes físicos e de Agilidade e Deslocamento reduzido pela metade (Math.floor(Deslocamento / 2))
 *   * 10.1.3 Sobrecarga Extrema (Peso > 2 * Carga Máxima): Condição Imobilizado (Deslocamento = 0)
 * - Sub-módulo 10.2: Dano de Queda e Mitigações
 *   * 10.2.1 Cálculo Base de Queda: 6/m de Contusão (GB p.20) — não 1d6
 *   * 10.2.2 Mitigação Racial / Habilidade: Metadílios com Balofo dividem o dano total da queda por 2 (Math.floor(Dano / 2))
 * - Sub-módulo 10.3: Sufocamento e Fôlego sob Água/Fumaça
 *   * 10.3.1 Sufocamento (GB p.23): resistir mais de Força MINUTOS = teste dif. 12; código usava turnos/max(FOR,VON)
 *   * 10.3.2 Anfíbio isento de sufocamento na água; Fulgurante NÃO isenta de sufocamento (GB p.61 — só visão)
 */

import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  createMockActor,
  createCharacter,
  avaliarSobrecarga,
  calcularCapacidadeCarga,
  updateInventoryWeight,
  checkMovementStatus,
  calcularDanoQueda,
  calculateFallDamage,
  calcularFolegoSufocamento,
  processarSufocamento,
  calcularFolegoAgua,
  calcularFolegoFumaca,
} from "./test-helper.mjs";

describe("Bloco 10 — Sistema de Carga, Sobrecarga e Movimentação Física", () => {
  /* ========================================================================= */
  /* SUB-MÓDULO 10.1: CAPACIDADE DE CARGA E SOBRECARGA                         */
  /* ========================================================================= */
  describe("Sub-módulo 10.1 — Capacidade de Carga e Sobrecarga", () => {
    test("10.1.1 — Carga GB (FOR×7 kg básica, FOR×35 kg pesada, FOR×70 kg máxima) e Variante Combatente (FOR×20 kg)", () => {
      // GB p.21: Básica = FOR×7 kg (sem penalidade); Pesada = até FOR×35 kg (metade desl. + inapto);
      //          Máxima = até FOR×70 kg (imobilizado).
      // Manual do Combatente (expansão): Básica = FOR×20 kg, Máxima = FOR×40 kg.
      const guerreiro = createCharacter({ raceId: "humano", classId: "guerreiro", level: 1 }); // FOR 4
      assert.equal(guerreiro.attributes.forca, 4);

      // 1. Regra GB: Básica = FOR×7 = 28 kg
      const capPadrao = calcularCapacidadeCarga(guerreiro);
      assert.equal(capPadrao.cargaPadrao, 28, "Carga Básica GB: FOR (4) × 7 = 28 kg");
      assert.equal(guerreiro.system.subattributes.carga.basicaPadrao, 28);

      // Pesada = FOR×35 = 140 kg (5× básica); Máxima = FOR×70 = 280 kg (10× básica)
      assert.equal(guerreiro.system.subattributes.carga.pesadaPadrao, 140, "Pesada GB: FOR (4) × 35 = 140 kg");
      assert.equal(guerreiro.system.subattributes.carga.maximaPadrao, 280, "Máxima GB: FOR (4) × 70 = 280 kg");

      // 2. Regra Variante (Manual do Combatente): Básica = FOR×20 = 80 kg
      const capVariante = calcularCapacidadeCarga(guerreiro, { variante: true });
      assert.equal(capVariante.cargaVariante, 80, "Carga Básica Combatente: FOR (4) × 20 = 80 kg");
      assert.equal(capVariante.cargaMaxima, 80);
      assert.equal(capVariante.limiteImobilizadoVariante, 160, "Imobilizado Combatente = 2 × 80 = 160 kg");
      assert.equal(guerreiro.system.subattributes.carga.basicaCombatente, 80);

      // Com 30 kg: Sobrecarregado no modo GB (> 28 kg), mas Normal no modo Combatente (<= 80 kg)
      updateInventoryWeight(guerreiro, 30);
      const statusGB = checkMovementStatus(guerreiro);
      assert.equal(statusGB.sobrecarregado, true, "30 kg > 28 kg (FOR×7) → sobrecarregado no GB");

      const statusVariante = checkMovementStatus(guerreiro, { variante: true });
      assert.equal(statusVariante.sobrecarregado, false, "30 kg ≤ 80 kg (FOR×20) → normal no Combatente");
      assert.equal(statusVariante.isInaptoFisico, false);
    });

    test("10.1.2 — Sobrecarga parcial (Peso > Carga Máxima) impõe Inaptidão física/Agilidade e reduz Deslocamento pela metade", () => {
      // GB p.21: Carga Básica = FOR×7 = 28 kg; Pesada = FOR×35 = 140 kg; Máxima = FOR×70 = 280 kg.
      const ator = createCharacter({ raceId: "humano", classId: "guerreiro", level: 1 }); // FOR 4 -> Básica 28 kg, Pesada 140 kg

      // Equipamentos totalizando 30 kg (acima de 28 kg básica, abaixo de 140 kg pesada)
      updateInventoryWeight(ator, 30);
      const status = checkMovementStatus(ator);

      assert.equal(status.sobrecarregado, true);
      assert.equal(status.isInaptoFisico, true, "Deve impor Inaptidão em corrida/nado/salto/escalada/Encontrão");
      assert.equal(status.inaptoFisicoAgilidade, true);
      assert.equal(status.isImobilizado, false);
      assert.equal(status.deslocamentoEfetivo, Math.floor(ator.stats.deslocamento / 2));

      // Arredondamento para baixo em deslocamentos ímpares
      const resImpar7 = avaliarSobrecarga(30, 28, { deslocamento: 7 });
      assert.equal(resImpar7.deslocamentoEfetivo, 3, "Math.floor(7 / 2) = 3");
      const resImpar5 = avaliarSobrecarga(30, 28, { deslocamento: 5 });
      assert.equal(resImpar5.deslocamentoEfetivo, 2, "Math.floor(5 / 2) = 2");

      // Limite exato da Básica (28 kg) não gera sobrecarga; Pesada (140 kg) ainda é sobrecarga parcial
      assert.equal(avaliarSobrecarga(28, 28, { deslocamento: 6 }).sobrecarregado, false, "28 kg exatos = não sobrecarregado");
      const resLimitePesada = avaliarSobrecarga(140, 28, { deslocamento: 6 });
      assert.equal(resLimitePesada.sobrecarregado, true, "140 kg = pesada = sobrecarregado");
      assert.equal(resLimitePesada.isImobilizado, false);
      assert.equal(resLimitePesada.deslocamentoEfetivo, 3);
    });

    test("10.1.3 — Sobrecarga extrema (Peso > 2x Carga Máxima) imobiliza o personagem (Deslocamento = 0)", () => {
      // GB p.21: Máxima = FOR×70 = 280 kg; imobilizado acima disso.
      const ator = createCharacter({ raceId: "humano", classId: "guerreiro", level: 1 }); // FOR 4 -> Máxima 280 kg

      updateInventoryWeight(ator, 285); // > 280 kg (FOR×70)
      const status = checkMovementStatus(ator);

      assert.equal(status.isImobilizado, true, "Personagem deve entrar na condição Imobilizado");
      assert.equal(status.imobilizado, true);
      assert.equal(status.isInaptoFisico, true);
      assert.equal(status.deslocamentoEfetivo, 0, "Deslocamento efetivo deve ser 0");
      assert.ok(status.condicoes.includes("Imobilizado"));

      // Aplicação direta das condições ao ator via aplicarAoAtor: true (usando Máxima GB = 280 kg)
      avaliarSobrecarga(ator, null, { aplicarAoAtor: true });
      assert.ok(ator.temCondicao("Imobilizado"));
      assert.equal(ator.isInapto(), true);
    });
  });

  /* ========================================================================= */
  /* SUB-MÓDULO 10.2: DANO DE QUEDA E MITIGAÇÕES                               */
  /* ========================================================================= */
  describe("Sub-módulo 10.2 — Dano de Queda e Mitigações", () => {
    test("10.2.1 — Cálculo Base de Queda: 6 de Contusão por metro (GB p.20)", () => {
      // GB p.20: cada metro de queda causa 6 pontos de Contusão (tipo de dano).
      // Não é 1d6; é um valor fixo. O Manual do Combatente usa 4/m, mas o GB core usa 6/m.
      // Hierarquia adotada: GB core prevalece sobre Manual do Combatente para esta regra.
      const queda1m = calcularDanoQueda(1, null, { danoTotal: 6 }); // 1 metro × 6 = 6
      assert.equal(queda1m.metros, 1);
      assert.equal(queda1m.danoPorMetro, 6, "GB p.20: 6 Contusão por metro");
      assert.equal(queda1m.formula, "6 × metros");
      assert.equal(queda1m.danoFinal, 6);

      const queda5m = calcularDanoQueda(5); // 5 metros × 6 = 30
      assert.equal(queda5m.danoPorMetro, 6);
      assert.equal(queda5m.danoFinal, 30, "5 metros: 5 × 6 = 30 Contusão");

      const queda10m = calcularDanoQueda(10); // 10 metros × 6 = 60
      assert.equal(queda10m.danoFinal, 60, "10 metros: 10 × 6 = 60 Contusão");

      // Queda de 0 metros não causa dano
      assert.equal(calcularDanoQueda(0).danoFinal, 0);
    });

    test("10.2.2 — Mitigação Racial / Habilidade: Metadílios com Balofo dividem o dano total da queda por 2 (Math.floor(Dano / 2))", () => {
      // Exemplo canônico da especificação (dano par: 10 -> 5)
      const metadilio = createCharacter({
        raceId: "metadilio",
        classId: "ladino",
        abilities: ["Balofo"],
        level: 1,
      });
      const danoQuedaBruto = 10;
      const danoFinal = calculateFallDamage(metadilio, danoQuedaBruto);

      assert.equal(danoFinal, 5, "Math.floor(10 / 2) deve ser 5");

      // Dano ímpar (15 -> Math.floor(15 / 2) = 7; 1 -> Math.floor(1 / 2) = 0)
      assert.equal(calculateFallDamage(metadilio, 15), 7, "Math.floor(15 / 2) deve ser 7");
      assert.equal(calculateFallDamage(metadilio, 1), 0, "Math.floor(1 / 2) deve ser 0");

      // Metadílio SEM a habilidade Balofo sofre o dano integral
      const metadilioSemBalofo = createCharacter({
        raceId: "metadilio",
        classId: "ladino",
        level: 1,
      });
      assert.equal(calculateFallDamage(metadilioSemBalofo, 10), 10, "Sem Balofo sofre dano integral (10)");

      // Outra raça (ex: Humano) não ativa redução de Metadílio
      const humano = createCharacter({ raceId: "humano", classId: "guerreiro", level: 1 });
      assert.equal(calculateFallDamage(humano, 14), 14);
    });
  });

  /* ========================================================================= */
  /* SUB-MÓDULO 10.3: SUFOCAMENTO E FÔLEGO SOB ÁGUA/FUMAÇA                     */
  /* ========================================================================= */
  describe("Sub-módulo 10.3 — Sufocamento e Fôlego sob Água/Fumaça", () => {
    test("10.3.1 — Sufocamento (GB p.23): resistir mais de Força MINUTOS → teste dif. 12", () => {
      // GB p.23: Um personagem pode segurar a respiração por FORÇA MINUTOS sem problema.
      // Se tentar por mais tempo, deve fazer um teste de dificuldade 12 (tabela de dificuldades).
      // Falha → começa a se afogar/sufocar.
      // NOTA: o código original usava turnos e max(FOR, VON); ambos incorretos pelo GB.
      // Este teste verifica a regra do GB. O código precisa ser ajustado para refletir isso.

      // Sacerdote com Força 2 → pode segurar a respiração por 2 minutos
      const sacerdote = createMockActor({
        attributes: { forca: 2, agilidade: 2, inteligencia: 3, vontade: 5 },
        resources: { vida: { value: 60, max: 60 } },
      });

      const folegoSacerdote = calcularFolegoSufocamento(sacerdote, "agua");
      assert.equal(folegoSacerdote.minutosMaximos, 2, "Limite de minutos = Força (2), não Vontade"); // GB p.23

      // Guerreiro com Força 4 → pode segurar por 4 minutos (Força, não max(FOR,VON))
      const guerreiro = createMockActor({
        attributes: { forca: 4, agilidade: 3, inteligencia: 2, vontade: 2 },
      });
      assert.equal(calcularFolegoSufocamento(guerreiro, "agua").minutosMaximos, 4, "Guerreiro: Força 4 minutos");

      // Dentro do limite (2 minutos para Força 2): sem teste, sem penalidade
      const dentroLimite = processarSufocamento(sacerdote, 2, "agua");
      assert.equal(dentroLimite.sufocando, false);
      assert.equal(dentroLimite.danoSufocamento, 0);
      assert.equal(sacerdote.system.resources.vida.value, 60);

      // Ultrapassando o limite → requer teste dif. 12; uma falha = afogando
      const acimaLimite = processarSufocamento(sacerdote, 3, "agua"); // 3 minutos > Força 2
      assert.equal(acimaLimite.requerTeste, true, "Ultrapassa Força minutos → requer teste dif. 12");
      assert.equal(acimaLimite.dificuldadeTeste, 12, "GB p.23: dificuldade 12");
      // (resultado do teste depende do dado — o código deve expor o campo requerTeste e dificuldadeTeste)
    });

    test("10.3.2 — Anfíbio isenta de sufocamento (água); Fulgurante NÃO isenta (GB p.61)", () => {
      // 1. Habilidade Anfíbio: fôlego infinito sob a água e isenção de sufocamento
      const heroiAnfibio = createMockActor({
        attributes: { forca: 3, vontade: 2 },
        resources: { vida: { value: 60, max: 60 } },
        items: [{ name: "Anfíbio", type: "habilidade", flags: { "mighty-blade": { slug: "anfibio" } } }],
      });

      const folegoAnfibio = calcularFolegoSufocamento(heroiAnfibio, "agua");
      assert.equal(folegoAnfibio.anfibio, true);
      assert.equal(folegoAnfibio.imuneAgua, true);
      assert.equal(folegoAnfibio.turnos, Infinity);
      assert.equal(calcularFolegoAgua(heroiAnfibio), Infinity);

      const sufocamentoAnfibio = processarSufocamento(heroiAnfibio, 20, "agua");
      assert.equal(sufocamentoAnfibio.isento, true);
      assert.equal(sufocamentoAnfibio.sufocando, false);
      assert.equal(sufocamentoAnfibio.danoSufocamento, 0);
      assert.equal(heroiAnfibio.system.resources.vida.value, 60);

      // 2. Habilidade Fulgurante: NÃO isenta de sufocamento.
      // GB p.61: Fulgurante permite enxergar no escuro e é imune a efeitos de VISÃO.
      // Não menciona respiração. Isenção de sufocamento era um erro do teste anterior.
      // NLM confirmou: Fulgurante não menciona respiração; a isenção era incorreta.
      const heroiFulgurante = createMockActor({
        attributes: { forca: 2, vontade: 4 },
        resources: { vida: { value: 60, max: 60 } },
        items: [{ name: "Fulgurante", type: "habilidade", flags: { "mighty-blade": { slug: "fulgurante" } } }],
      });

      const folegoFulgurante = calcularFolegoSufocamento(heroiFulgurante, "agua");
      assert.equal(folegoFulgurante.fulgurante, false, "Fulgurante NÃO concede isenção de sufocamento"); // GB p.61
      assert.equal(folegoFulgurante.imuneAgua, false);

      // Fulgurante na água: sujeito ao sufocamento normal (limite = Força minutos)
      const sufocamentoAguaFulgurante = processarSufocamento(heroiFulgurante, 3, "agua"); // 3 min > Força 2
      assert.equal(sufocamentoAguaFulgurante.isento, false, "Fulgurante não é isento de sufocamento em água");
      assert.equal(sufocamentoAguaFulgurante.requerTeste, true, "Ultrapassou limite → requer teste dif. 12");
    });
  });
});
