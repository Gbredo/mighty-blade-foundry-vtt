/**
 * Bloco 9 — Propriedades Táticas de Equipamentos e Combate (Manual do Combatente)
 *
 * Plano de Testes Canônico (Mighty Blade 3ª Edição):
 * - Sub-módulo 9.1: Armas Mão-e-Meia (Bastardas)
 *   * 9.1.1 Empunhadura de Duas Mãos: FN reduzida pela metade (Math.ceil(FN / 2)) e bônus de dano (+2 ou Força via Ataque Furioso)
 *   * 9.1.2 Empunhadura de Uma Mão: Exige FN integral e aplica dano base do item
 * - Sub-módulo 9.2: Propriedades Especiais de Armas
 *   * 9.2.1 Transpor: Ignora totalmente o bônus de Defesa do Escudo do alvo e bônus de Cobertura
 *   * 9.2.2 Trespassar: Ao zerar os PVs de um oponente, transfere o dano excedente (igual à Força) para um alvo adjacente
 *   * 9.2.3 Carregar (Armas Mecânicas - Bestas/Prodds): Exige 1 Ação de Movimento para recarga e é isento de penalidade contra alvos adjacentes
 *   * 9.2.4 Gancho: Permite substituir o dano direto por um teste de Derrubar ou para anular o bônus de escudo do alvo
 * - Sub-módulo 9.3: Traje de Armadura Pesada sem Túnica
 *   * 9.3.1 Atrito & Desconforto em Combate: Trajar Armadura Pesada sem Túnica desconta automaticamente 5 PM por turno em combate
 */

import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  createMockActor,
  createCharacter,
  calcularArmaMaoEMeia,
  processarPropriedadeTranspor,
  processarPropriedadeTrespassar,
  verificarPropriedadeCarregar,
  processarPropriedadeGancho,
  verificarPenalidadeArmaduraSemTunica,
  itemPossuiPropriedade,
  equipWeapon,
  calculateAttackVsTarget,
  equipArmor,
  processCombatTurn,
} from "./test-helper.mjs";
import {
  CANONICAL_EQUIPAMENTOS,
  CANONICAL_HABILIDADES,
} from "../module/data/canonical-packs-data.mjs";

describe("Bloco 9 — Propriedades Táticas de Equipamentos e Combate", () => {
  // Helpers para clonar equipamentos e habilidades canônicos
  const getEquip = (nome) => {
    const item = CANONICAL_EQUIPAMENTOS.find((e) => e.name.toLowerCase() === nome.toLowerCase());
    if (!item) throw new Error(`Equipamento canônico não encontrado: ${nome}`);
    return JSON.parse(JSON.stringify(item));
  };

  const getHab = (nome) => {
    const hab = CANONICAL_HABILIDADES.find((h) => h.name.toLowerCase() === nome.toLowerCase());
    if (!hab) throw new Error(`Habilidade canônica não encontrada: ${nome}`);
    return JSON.parse(JSON.stringify(hab));
  };

  /* ========================================================================= */
  /* SUB-MÓDULO 9.1: ARMAS MÃO-E-MEIA (BASTARDAS)                              */
  /* ========================================================================= */
  describe("Sub-módulo 9.1 — Armas Mão-e-Meia (Bastardas)", () => {
    test("9.1.1 — Empunhadura de Duas Mãos: reduz FN pela metade (Math.ceil(FN / 2)) e aumenta dano (+2 ou Força via Ataque Furioso)", () => {
      // Exemplo canônico da especificação: Espada Bastarda (FN 5, Dano 6) empunhada com 2 mãos por Guerreiro Humano (FOR 5 / >= FN 3)
      const guerreiro = createCharacter({ raceId: "humano", classId: "guerreiro", level: 1 });
      const espadaBastarda = { name: "Espada Bastarda", fn: 5, damage: 6, category: "mao_e_meia" };

      const statusDuasMaos = equipWeapon(guerreiro, espadaBastarda, { hands: 2 });
      assert.equal(statusDuasMaos.effectiveFn, 3, "Math.ceil(5 / 2) deve ser 3");
      assert.equal(statusDuasMaos.fnEfetiva, 3);
      assert.equal(statusDuasMaos.bonusDamage, 2, "Bônus padrão de 2 mãos deve ser +2");
      assert.equal(statusDuasMaos.modifiedDamage, 8, "Dano base 6 + 2 = 8");
      assert.equal(statusDuasMaos.inapto, false, "Guerreiro tem Força >= FN efetiva (3)");

      // Armas canônicas do Compêndio com MaoEMeia:
      // 1. Espada Longa (FN 4 -> 2, Dano FOR+8 -> FOR+10)
      const espadaLonga = getEquip("Espada Longa");
      assert.equal(espadaLonga.system.fn, 4);
      assert.ok(itemPossuiPropriedade(espadaLonga, "MaoEMeia"));
      const calcEspadaLonga2M = calcularArmaMaoEMeia(espadaLonga, 2);
      assert.equal(calcEspadaLonga2M.fnEfetiva, 2, "FN 4 / 2 = 2");
      assert.equal(calcEspadaLonga2M.bonusDano, 2);
      assert.equal(calcEspadaLonga2M.danoModificado, "FOR+10");

      // 2. Machado de Batalha (FN 5 -> 3) e Mangual (FN 6 -> 3)
      const machadoBatalha = getEquip("Machado de Batalha");
      assert.equal(calcularArmaMaoEMeia(machadoBatalha, 2).fnEfetiva, 3, "Math.ceil(5 / 2) = 3");
      const mangual = getEquip("Mangual");
      assert.equal(calcularArmaMaoEMeia(mangual, 2).fnEfetiva, 3, "Math.ceil(6 / 2) = 3");

      // 3. Interação com Ataque Furioso (quando Força >= FN original de 1 mão, substitui +2 pela Força)
      const habAtaqueFurioso = getHab("Ataque Furioso");
      const guerreiroFurioso = createMockActor({
        attributes: { forca: { value: 5, base: 5 } },
        items: [habAtaqueFurioso],
      });
      const calcFurioso = calcularArmaMaoEMeia(espadaLonga, 2, guerreiroFurioso);
      assert.equal(calcFurioso.ataqueFuriosoAplicado, true, "Deve aplicar Ataque Furioso");
      assert.equal(calcFurioso.bonusDano, 5, "Soma Força (5) ao invés de +2");
      assert.equal(calcFurioso.danoModificado, "FOR+13", "FOR+8 + 5 = FOR+13");

      // Se Força < FN de 1 mão (ex: FOR 3 < FN 4), Ataque Furioso não ativa e recua para +2
      const guerreiroForca3 = createMockActor({
        attributes: { forca: { value: 3, base: 3 } },
        items: [habAtaqueFurioso],
      });
      const calcSemForca1M = calcularArmaMaoEMeia(espadaLonga, 2, guerreiroForca3);
      assert.equal(calcSemForca1M.ataqueFuriosoAplicado, false);
      assert.equal(calcSemForca1M.bonusDano, 2);
      assert.equal(calcSemForca1M.inapto, false, "Apto com 2 mãos pois FOR 3 >= FN efetiva 2");
    });

    test("9.1.2 — Empunhadura de Uma Mão: exige FN integral e aplica dano base do item", () => {
      const guerreiro = createCharacter({ raceId: "humano", classId: "guerreiro", level: 1 });
      const espadaBastarda = { name: "Espada Bastarda", fn: 5, damage: 6, category: "mao_e_meia" };

      const statusUmaMao = equipWeapon(guerreiro, espadaBastarda, { hands: 1 });
      assert.equal(statusUmaMao.effectiveFn, 5, "Com 1 mão exige FN integral (5)");
      assert.equal(statusUmaMao.bonusDamage, 0, "Com 1 mão não recebe bônus de dano adicional");
      assert.equal(statusUmaMao.modifiedDamage, 6, "Mantém dano base (6)");

      // Arma canônica Espada Longa (FN 4, Dano FOR+8) com 1 mão
      const espadaLonga = getEquip("Espada Longa");
      const calc1Mao = calcularArmaMaoEMeia(espadaLonga, 1);
      assert.equal(calc1Mao.fnEfetiva, 4);
      assert.equal(calc1Mao.bonusDano, 0);
      assert.equal(calc1Mao.danoModificado, "FOR+8");

      // Personagem com Força 2 usando Espada Longa (FN 4): Inapto com 1 mão, Apto com 2 mãos
      const heroiForca2 = createMockActor({
        attributes: { forca: { value: 2, base: 2 } },
      });
      assert.equal(calcularArmaMaoEMeia(espadaLonga, 1, heroiForca2).inapto, true);
      assert.equal(calcularArmaMaoEMeia(espadaLonga, 2, heroiForca2).inapto, false);
    });
  });

  /* ========================================================================= */
  /* SUB-MÓDULO 9.2: PROPRIEDADES ESPECIAIS DE ARMAS                           */
  /* ========================================================================= */
  describe("Sub-módulo 9.2 — Propriedades Especiais de Armas", () => {
    test("9.2.1 — Transpor: ignora totalmente o bônus de Defesa do Escudo do alvo e bônus de Cobertura", () => {
      // Exemplo da especificação: Defesa Base (5) + Agilidade (3) + Escudo (3) = 11 -> Com Transpor = 8
      const alvo = { defesaBase: 5, agilidade: 3, bonusEscudo: 3 };
      const ataqueComTranspor = calculateAttackVsTarget({ weaponProperty: "transpor" }, alvo);

      assert.equal(ataqueComTranspor.effectiveTargetDefense, 8, "Escudo (+3) deve ser totalmente ignorado");
      assert.equal(ataqueComTranspor.ignoraEscudo, true);
      assert.equal(ataqueComTranspor.bonusEscudoIgnorado, 3);

      // Validação com MockActor equipando Escudo Médio (+2 Defesa)
      const escudoMedio = getEquip("Escudo Médio");
      const defensor = createMockActor({
        attributes: { forca: { value: 3, base: 3 } },
        items: [{ ...escudoMedio, system: { ...escudoMedio.system, equipado: true } }],
      });
      assert.equal(defensor.system.defesas.bloqueio.value, 10, "Bloqueio original = 5 + 3 + 2 = 10");

      const resActor = processarPropriedadeTranspor({ arma: getEquip("Chicote") }, defensor);
      assert.equal(resActor.bonusEscudoIgnorado, 2);
      assert.equal(resActor.defesaEfetiva, 8);
      assert.equal(resActor.bloqueioEfetivo, 8);

      // Validação ignorando simultaneamente Escudo (+3) e Cobertura (+4)
      const defensorComCobertura = {
        defesaTotal: 17,
        bonusEscudo: 3,
        bonusCobertura: 4,
      };
      const resCobertura = processarPropriedadeTranspor({}, defensorComCobertura);
      assert.equal(resCobertura.ignoraCobertura, true);
      assert.equal(resCobertura.bonusCoberturaIgnorado, 4);
      assert.equal(resCobertura.bonusTotalIgnorado, 7);
      assert.equal(resCobertura.defesaEfetiva, 10, "17 - 3 (escudo) - 4 (cobertura) = 10");
    });

    test("9.2.2 — Trespassar: ao zerar os PVs de um oponente, transfere o dano excedente (igual à Força) para alvo adjacente", () => {
      // Atacante com Força 4 causa 25 de dano em alvo com 20 PVs -> Alvo zerado, transfere 4 de dano (Força)
      const resZerou = processarPropriedadeTrespassar(25, 20, 4);
      assert.equal(resZerou.alvoZerado, true);
      assert.equal(resZerou.ativou, true);
      assert.equal(resZerou.danoExcedente, 5);
      assert.equal(resZerou.danoTransferido, 4, "Dano transferido deve ser igual à Força do atacante (4)");
      assert.equal(resZerou.danoAlvoAdjacente, 4);

      // Dano exato para zerar PVs (15 de dano em 15 PV, Força 5)
      const resExato = processarPropriedadeTrespassar(15, 15, 5);
      assert.equal(resExato.alvoZerado, true);
      assert.equal(resExato.ativou, true);
      assert.equal(resExato.danoTransferido, 5);

      // Ataque que NÃO zera os PVs do alvo (18 de dano em 25 PV) -> Não ativa Trespassar
      const resNaoZerou = processarPropriedadeTrespassar(18, 25, 4);
      assert.equal(resNaoZerou.alvoZerado, false);
      assert.equal(resNaoZerou.ativou, false);
      assert.equal(resNaoZerou.danoTransferido, 0);

      // Suporte a instâncias de Actor para alvo e atacante
      const atacanteActor = createMockActor({ attributes: { forca: { value: 6, base: 6 } } });
      const alvoActor = createMockActor({ resources: { vida: { value: 12, max: 60 } } });
      const resActors = processarPropriedadeTrespassar(20, alvoActor, atacanteActor);
      assert.equal(resActors.ativou, true);
      assert.equal(resActors.danoTransferido, 6);
    });

    test("9.2.3 — Carregar (Bestas/Prodds): exige 1 Ação de Movimento para recarga e é isento de penalidade contra alvos adjacentes", () => {
      const bestaPesada = getEquip("Besta Pesada");
      assert.ok(itemPossuiPropriedade(bestaPesada, "Carregar"));

      // Sem recarga (e não previamente carregada) -> bloqueia disparo
      const semRecarga = verificarPropriedadeCarregar(bestaPesada, null);
      assert.equal(semRecarga.temPropriedadeCarregar, true);
      assert.equal(semRecarga.exigeAcaoMovimento, true);
      assert.equal(semRecarga.podeDisparar, false);

      // Gastando 1 Ação de Movimento para recarregar -> libera disparo
      const comRecarga = verificarPropriedadeCarregar(bestaPesada, "movimento");
      assert.equal(comRecarga.recarregada, true);
      assert.equal(comRecarga.podeDisparar, true);

      // Previamente carregada -> permite disparo imediato
      const prod = getEquip("Prod");
      prod.system.carregada = true;
      assert.equal(verificarPropriedadeCarregar(prod, null).podeDisparar, true);

      // Isenção de penalidade contra alvos adjacentes (Bestas/Prodds causam 100% do dano; arcos causam 50%)
      const bestaLeve = getEquip("Besta Leve");
      const checkBesta = verificarPropriedadeCarregar(bestaLeve, "movimento");
      assert.equal(checkBesta.sofrePenalidadeAdjacente, false);
      assert.equal(checkBesta.calcularDanoContraAlvoAdjacente(10), 10, "Besta causa dano integral (10) em adjacente");

      const arcoSimples = getEquip("Arco Simples");
      const checkArco = verificarPropriedadeCarregar(arcoSimples, null);
      assert.equal(checkArco.sofrePenalidadeAdjacente, true);
      assert.equal(checkArco.calcularDanoContraAlvoAdjacente(10), 5, "Arco sofre redução de 50% (5) em adjacente");
    });

    test("9.2.4 — Gancho: permite substituir o dano direto por teste de Derrubar ou para anular o bônus de escudo do alvo", () => {
      const chicote = getEquip("Chicote");
      assert.ok(itemPossuiPropriedade(chicote, "Gancho"));

      // Opção 1: Substituir dano por teste de Derrubar (Confronto -> Caído)
      const resDerrubar = processarPropriedadeGancho({ arma: chicote, dano: 8 }, "derrubar");
      assert.equal(resDerrubar.valido, true);
      assert.equal(resDerrubar.trocaDano, true);
      assert.equal(resDerrubar.danoCausado, 0);
      assert.equal(resDerrubar.efeito, "derrubar");
      assert.equal(resDerrubar.condicaoAplicada, "Caído");

      // Opção 2: Substituir dano para anular o bônus de escudo do alvo até o próximo turno
      const resEscudo = processarPropriedadeGancho({ arma: chicote, dano: 8 }, "anular_escudo");
      assert.equal(resEscudo.valido, true);
      assert.equal(resEscudo.trocaDano, true);
      assert.equal(resEscudo.danoCausado, 0);
      assert.equal(resEscudo.efeito, "anular_escudo");
      assert.equal(resEscudo.anulaEscudo, true);

      // Opção 3: Ataque normal com dano direto
      const resDano = processarPropriedadeGancho({ arma: chicote, dano: 8 }, "dano");
      assert.equal(resDano.valido, true);
      assert.equal(resDano.trocaDano, false);
      assert.equal(resDano.danoCausado, 8);

      // Arma sem Gancho rejeita a manobra
      const espadaCurta = { name: "Espada Curta", system: { propriedades: [] } };
      const resInvalido = processarPropriedadeGancho({ arma: espadaCurta }, "derrubar");
      assert.equal(resInvalido.valido, false);
      assert.equal(resInvalido.temGancho, false);
    });
  });

  /* ========================================================================= */
  /* SUB-MÓDULO 9.3: TRAJE DE ARMADURA PESADA SEM TÚNICA                       */
  /* ========================================================================= */
  describe("Sub-módulo 9.3 — Traje de Armadura Pesada sem Túnica", () => {
    test("9.3.1 — Atrito & Desconforto em Combate: trajar Armadura Pesada sem Túnica consome 5 PM por turno em combate", () => {
      // Exemplo canônico da especificação
      const ator = createCharacter({ raceId: "anao", classId: "guerreiro", level: 1 });
      // Equipa Armadura Completa (Pesada) sem Túnica
      equipArmor(ator, "Armadura Completa");

      const pmInicial = ator.stats.pm;
      processCombatTurn(ator);

      assert.equal(ator.stats.pm, pmInicial - 5, "Deve descontar 5 PM no turno por ausência de Túnica");

      // Segundo turno consecutivo sem Túnica: desconta mais 5 PM
      processCombatTurn(ator);
      assert.equal(ator.stats.pm, pmInicial - 10, "Deve acumular novo desconto de 5 PM no turno seguinte");

      // Quando veste uma Túnica por baixo da Armadura Pesada, a penalidade cessa (0 PM descontado)
      equipArmor(ator, "Túnica Pesada");
      const pmAntesComTunica = ator.stats.pm;
      const statusComTunica = processCombatTurn(ator);
      assert.equal(statusComTunica.temArmaduraPesada, true);
      assert.equal(statusComTunica.temTunica, true);
      assert.equal(statusComTunica.penalidadeAtiva, false);
      assert.equal(statusComTunica.pmDescontado, 0);
      assert.equal(ator.stats.pm, pmAntesComTunica, "Não deve descontar PM quando veste Túnica sob a Armadura Pesada");

      // Armadura Leve (ex: Armadura de Couro) sem Túnica não sofre penalidade
      const ladino = createCharacter({ raceId: "elfo", classId: "ladino", level: 1 });
      equipArmor(ladino, "Armadura de Couro");
      const pmLadino = ladino.stats.pm;
      const statusLeve = verificarPenalidadeArmaduraSemTunica(ladino, { aplicar: true });
      assert.equal(statusLeve.temArmaduraPesada, false);
      assert.equal(statusLeve.penalidadeAtiva, false);
      assert.equal(ladino.stats.pm, pmLadino);
    });
  });
});
