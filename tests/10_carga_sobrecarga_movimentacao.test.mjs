/**
 * Bloco 10 — Sistema de Carga, Sobrecarga e Movimentação Física
 *
 * Plano de Testes Canônico (Mighty Blade 3ª Edição):
 * - Sub-módulo 10.1: Capacidade de Carga e Sobrecarga
 *   * 10.1.1 Carga Máxima Padrão (Força * 10 kg - Guia Básico) e Variante (Força * 20 kg - Manual do Combatente)
 *   * 10.1.2 Sobrecarga Parcial (Peso > Carga Máxima): Inapto em testes físicos e de Agilidade e Deslocamento reduzido pela metade (Math.floor(Deslocamento / 2))
 *   * 10.1.3 Sobrecarga Extrema (Peso > 2 * Carga Máxima): Condição Imobilizado (Deslocamento = 0)
 * - Sub-módulo 10.2: Dano de Queda e Mitigações
 *   * 10.2.1 Cálculo Base de Queda: 1d6 por metro de queda
 *   * 10.2.2 Mitigação Racial / Habilidade: Metadílios com Balofo dividem o dano total da queda por 2 (Math.floor(Dano / 2))
 * - Sub-módulo 10.3: Sufocamento e Fôlego sob Água/Fumaça
 *   * 10.3.1 Limite de Turnos sem Respirar: Turnos máximos = Vontade (ou Força, Math.max(FOR, VON)) e exaustão/dano automático ao ultrapassar o limite
 *   * 10.3.2 Exceções Habilidades / Raças: Personagens com Anfíbio ou Fulgurante são isentos de sufocamento
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
    test("10.1.1 — Carga Máxima Padrão (FOR * 10 kg) e Variante do Manual do Combatente (FOR * 20 kg)", () => {
      const guerreiro = createCharacter({ raceId: "humano", classId: "guerreiro", level: 1 }); // FOR 4
      assert.equal(guerreiro.attributes.forca, 4);

      // 1. Regra Padrão (Guia Básico): Força * 10 kg = 40 kg
      const capPadrao = calcularCapacidadeCarga(guerreiro);
      assert.equal(capPadrao.cargaPadrao, 40, "Carga Máxima Padrão deve ser FOR (4) * 10 = 40 kg");
      assert.equal(capPadrao.cargaMaxima, 40);
      assert.equal(capPadrao.limiteImobilizadoPadrao, 80, "Limite de imobilização padrão = 2 * 40 = 80 kg");
      assert.equal(guerreiro.system.subattributes.carga.basicaPadrao, 40);

      // 2. Regra Variante (Manual do Combatente): Força * 20 kg = 80 kg
      const capVariante = calcularCapacidadeCarga(guerreiro, { variante: true });
      assert.equal(capVariante.cargaVariante, 80, "Carga Máxima Variante deve ser FOR (4) * 20 = 80 kg");
      assert.equal(capVariante.cargaMaxima, 80);
      assert.equal(capVariante.limiteImobilizadoVariante, 160, "Limite de imobilização variante = 2 * 80 = 160 kg");
      assert.equal(guerreiro.system.subattributes.carga.basicaCombatente, 80);

      // Com 60 kg: Sobrecarregado no modo Padrão (> 40 kg), mas Normal no modo Variante (<= 80 kg)
      updateInventoryWeight(guerreiro, 60);
      const statusPadrao = checkMovementStatus(guerreiro);
      assert.equal(statusPadrao.sobrecarregado, true);

      const statusVariante = checkMovementStatus(guerreiro, { variante: true });
      assert.equal(statusVariante.sobrecarregado, false);
      assert.equal(statusVariante.isInaptoFisico, false);
      assert.equal(statusVariante.deslocamentoEfetivo, guerreiro.stats.deslocamento);
    });

    test("10.1.2 — Sobrecarga parcial (Peso > Carga Máxima) impõe Inaptidão física/Agilidade e reduz Deslocamento pela metade", () => {
      const ator = createCharacter({ raceId: "humano", classId: "guerreiro", level: 1 }); // FOR 4 -> Carga Max 40 kg

      // Equipamentos totalizando 45 kg (acima de 40 kg, abaixo de 80 kg)
      updateInventoryWeight(ator, 45);
      const status = checkMovementStatus(ator);

      assert.equal(status.sobrecarregado, true);
      assert.equal(status.isInaptoFisico, true, "Deve impor Inaptidão em testes físicos e de Agilidade");
      assert.equal(status.inaptoFisicoAgilidade, true);
      assert.equal(status.isImobilizado, false);
      assert.equal(status.deslocamentoEfetivo, Math.floor(ator.stats.deslocamento / 2));

      // Validação de arredondamento para baixo (Math.floor) em deslocamentos ímpares (7m -> 3m, 5m -> 2m)
      const resImpar7 = avaliarSobrecarga(45, 40, { deslocamento: 7 });
      assert.equal(resImpar7.deslocamentoEfetivo, 3, "Math.floor(7 / 2) = 3");
      const resImpar5 = avaliarSobrecarga(45, 40, { deslocamento: 5 });
      assert.equal(resImpar5.deslocamentoEfetivo, 2, "Math.floor(5 / 2) = 2");

      // Limite exato da Carga Máxima (40 kg) não gera sobrecarga; limite exato de 2x (80 kg) ainda é sobrecarga parcial
      assert.equal(avaliarSobrecarga(40, 40, { deslocamento: 6 }).sobrecarregado, false);
      const resLimite2x = avaliarSobrecarga(80, 40, { deslocamento: 6 });
      assert.equal(resLimite2x.sobrecarregado, true);
      assert.equal(resLimite2x.isImobilizado, false);
      assert.equal(resLimite2x.deslocamentoEfetivo, 3);
    });

    test("10.1.3 — Sobrecarga extrema (Peso > 2x Carga Máxima) imobiliza o personagem (Deslocamento = 0)", () => {
      const ator = createCharacter({ raceId: "humano", classId: "guerreiro", level: 1 }); // FOR 4 -> Max 40 kg

      updateInventoryWeight(ator, 85); // > 80 kg (2 * 40 kg)
      const status = checkMovementStatus(ator);

      assert.equal(status.isImobilizado, true, "Personagem deve entrar na condição Imobilizado");
      assert.equal(status.imobilizado, true);
      assert.equal(status.isInaptoFisico, true);
      assert.equal(status.deslocamentoEfetivo, 0, "Deslocamento efetivo deve ser 0");
      assert.ok(status.condicoes.includes("Imobilizado"));

      // Aplicação direta das condições ao ator via aplicarAoAtor: true
      avaliarSobrecarga(ator, null, { aplicarAoAtor: true });
      assert.ok(ator.temCondicao("Imobilizado"));
      assert.equal(ator.isInapto(), true);
    });
  });

  /* ========================================================================= */
  /* SUB-MÓDULO 10.2: DANO DE QUEDA E MITIGAÇÕES                               */
  /* ========================================================================= */
  describe("Sub-módulo 10.2 — Dano de Queda e Mitigações", () => {
    test("10.2.1 — Cálculo Base de Queda: 1d6 de dano por metro de queda", () => {
      const queda1m = calcularDanoQueda(1, null, { danoTotal: 4 });
      assert.equal(queda1m.metros, 1);
      assert.equal(queda1m.dados, 1);
      assert.equal(queda1m.formula, "1d6");
      assert.equal(queda1m.danoFinal, 4);

      const queda5m = calcularDanoQueda(5, null, { danoTotal: 18 });
      assert.equal(queda5m.dados, 5);
      assert.equal(queda5m.formula, "5d6");
      assert.equal(queda5m.danoFinal, 18);

      const queda10m = calcularDanoQueda(10, null, { danoTotal: 35 });
      assert.equal(queda10m.dados, 10);
      assert.equal(queda10m.formula, "10d6");
      assert.equal(queda10m.danoFinal, 35);

      // Queda de 0 metros não causa dano
      assert.equal(calcularDanoQueda(0, null, { danoTotal: 10 }).danoFinal, 0);
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
    test("10.3.1 — Limite de Turnos sem Respirar (Vontade ou Força) e exaustão/dano automático ao ultrapassar o limite", () => {
      // Conjurador com Vontade 5 e Força 2 -> Sustenta a respiração por 5 turnos
      const sacerdote = createMockActor({
        attributes: { forca: 2, agilidade: 2, inteligencia: 3, vontade: 5 },
        resources: { vida: { value: 60, max: 60 } },
      });

      const folegoSacerdote = calcularFolegoSufocamento(sacerdote, "agua");
      assert.equal(folegoSacerdote.turnosMaximos, 5, "Limite de turnos deve ser igual à Vontade (5)");

      // Guerreiro com Força 4 e Vontade 2 -> Sustenta por 4 turnos (Math.max(FOR, VON))
      const guerreiro = createMockActor({
        attributes: { forca: 4, agilidade: 3, inteligencia: 2, vontade: 2 },
      });
      assert.equal(calcularFolegoSufocamento(guerreiro, "agua").turnosMaximos, 4);

      // Dentro do limite (5 turnos sem respirar para limite 5): sem exaustão nem dano
      const dentroLimite = processarSufocamento(sacerdote, 5, "agua");
      assert.equal(dentroLimite.sufocando, false);
      assert.equal(dentroLimite.exausto, false);
      assert.equal(dentroLimite.danoSufocamento, 0);
      assert.equal(sacerdote.system.resources.vida.value, 60);

      // Ultrapassando o limite (7 turnos sem respirar -> 2 turnos excedentes): impõe Exausto e dano automático em PV
      const acimaLimite = processarSufocamento(sacerdote, 7, "agua", { danoPorTurno: 5 });
      assert.equal(acimaLimite.sufocando, true);
      assert.equal(acimaLimite.exausto, true);
      assert.equal(acimaLimite.turnosExcedentes, 2);
      assert.equal(acimaLimite.danoSufocamento, 10, "2 turnos excedentes * 5 PV = 10 PV");
      assert.equal(sacerdote.temCondicao("Exausto"), true, "Deve aplicar a condição Exausto");
      assert.equal(sacerdote.system.resources.vida.value, 50, "PV deve cair de 60 para 50");
    });

    test("10.3.2 — Exceções de Habilidades / Raças: Anfíbio e Fulgurante isentam de sufocamento", () => {
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

      // 2. Habilidade Fulgurante: fôlego infinito e isenção de sufocamento (fumaça e submersão testada)
      const heroiFulgurante = createMockActor({
        attributes: { forca: 2, vontade: 4 },
        resources: { vida: { value: 60, max: 60 } },
        items: [{ name: "Fulgurante", type: "habilidade", flags: { "mighty-blade": { slug: "fulgurante" } } }],
      });

      const folegoFulgurante = calcularFolegoSufocamento(heroiFulgurante, "fumaca");
      assert.equal(folegoFulgurante.fulgurante, true);
      assert.equal(folegoFulgurante.imuneFumaca, true);
      assert.equal(folegoFulgurante.turnos, Infinity);
      assert.equal(calcularFolegoFumaca(heroiFulgurante), Infinity);

      const sufocamentoFumaca = processarSufocamento(heroiFulgurante, 20, "fumaca");
      assert.equal(sufocamentoFumaca.isento, true);
      assert.equal(sufocamentoFumaca.sufocando, false);
      assert.equal(sufocamentoFumaca.danoSufocamento, 0);

      const sufocamentoAguaFulgurante = processarSufocamento(heroiFulgurante, 20, "agua");
      assert.equal(sufocamentoAguaFulgurante.isento, true);
      assert.equal(sufocamentoAguaFulgurante.sufocando, false);
      assert.equal(heroiFulgurante.system.resources.vida.value, 60);
    });
  });
});
