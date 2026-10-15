/**
 * Suíte de Testes Automatizados — Bloco 6: Sistema de Danos, Imunidades e Condições
 * Mighty Blade 3ª Edição (Foundry VTT v14)
 *
 * Sub-módulos Cobertos:
 * - Sub-módulo 6.1: Imunidade Elemental (6.1.1 Anulação de Dano para Corte, Perfuração, Contusão, Fogo, Frio, Eletricidade)
 * - Sub-módulo 6.2: Resistência Elemental (6.2.1 Divisão de Dano com Math.floor(dano / 2))
 * - Sub-módulo 6.3: Vulnerabilidade Elemental (6.3.1 Dobro de Dano: dano * 2)
 * - Sub-módulo 6.4: Anulação Mútua (6.4.1 Cancelamento Neutro: Resistência + Vulnerabilidade = 1x)
 * - Sub-módulo 6.5: Exaustão de Mana (0 PM) e Dreno de PV (6.5.1 Condição Exausto + Inaptidão; 6.5.2 Desconto do excedente em PV)
 */

import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { createMockActor } from "./test-helper.mjs";
import {
  calcularDano,
  aplicarDano,
  consumirMana,
  recuperarMana,
  temCondicao,
  adicionarCondicao,
  removerCondicao,
  isActorInapto,
  ELEMENTOS_CANONICOS,
} from "../module/helpers/danos-condicoes.mjs";
import { calcularEfeitoInaptidao } from "../module/helpers/equipamento.mjs";

describe("Bloco 6 — Sistema de Danos, Imunidades e Condições", () => {
  /* ======================================================================== */
  /* SUB-MÓDULO 6.1: IMUNIDADE ELEMENTAL                                      */
  /* ======================================================================== */
  describe("Sub-módulo 6.1 — Imunidade Elemental", () => {
    test("6.1.1 Anulação de Dano: Ter Imunidade a um elemento reduz o dano final para exatamente 0", () => {
      // Todos os 6 elementos canônicos do Mighty Blade 3e
      const elementosParaTestar = [
        { elemento: "Corte", valorDano: 20 },
        { elemento: "Perfuração", valorDano: 15 },
        { elemento: "perfuracao", valorDano: 18 },
        { elemento: "Contusão", valorDano: 30 },
        { elemento: "contusao", valorDano: 25 },
        { elemento: "Fogo", valorDano: 50 },
        { elemento: "Frio", valorDano: 25 },
        { elemento: "Eletricidade", valorDano: 40 },
      ];

      for (const { elemento, valorDano } of elementosParaTestar) {
        const perfilImune = { imunidades: [elemento] };
        const danoCalculado = calcularDano(valorDano, elemento, perfilImune);
        assert.equal(
          danoCalculado,
          0,
          `Dano de ${elemento} (${valorDano}) deve ser reduzido para exatamente 0 em alvo imune`
        );
      }

      // Danos extremos (1 e 150) e isolamento entre elementos distintos
      const perfilImuneFogo = { imunidades: ["fogo"] };
      assert.equal(calcularDano(1, "fogo", perfilImuneFogo), 0);
      assert.equal(calcularDano(150, "fogo", perfilImuneFogo), 0);
      assert.equal(calcularDano(20, "corte", perfilImuneFogo), 20, "Imunidade a Fogo não afeta Corte");
      assert.equal(calcularDano(15, "frio", perfilImuneFogo), 15, "Imunidade a Fogo não afeta Frio");

      // Integração com Ator e itens embutidos (system.efeitos) + preservação de PV
      const actor = createMockActor({
        name: "Draconiano Imune a Fogo",
        resources: { vida: { value: 60, max: 60 } },
        items: [
          {
            id: "hab-imune-fogo",
            name: "Escamas Ígneas",
            type: "habilidade",
            system: {
              efeitos: [{ tipo: "resistencia", dano: "fogo", grau: "imune" }],
            },
          },
        ],
      });

      const resultado = aplicarDano(actor, 45, "Fogo");
      assert.equal(resultado.danoFinal, 0);
      assert.equal(resultado.vidaRestante, 60);
      assert.equal(actor.system.resources.vida.value, 60);
    });
  });

  /* ======================================================================== */
  /* SUB-MÓDULO 6.2: RESISTÊNCIA ELEMENTAL                                    */
  /* ======================================================================== */
  describe("Sub-módulo 6.2 — Resistência Elemental", () => {
    test("6.2.1 Divisão de Dano: Aplica Math.floor(dano / 2) com arredondamento obrigatório para baixo (ex: 7 -> 3)", () => {
      const perfilResistenteFogo = { resistencias: ["Fogo"] };

      // Caso explícito do plano: 7 de dano de Fogo -> 3 de dano
      assert.equal(
        calcularDano(7, "Fogo", perfilResistenteFogo),
        3,
        "7 de dano de Fogo contra alvo com Resistência a Fogo deve resultar em 3 de dano"
      );

      // Outros valores ímpares e pares para todos os 6 elementos canônicos
      const perfilResistenteGeral = { resistencias: [...ELEMENTOS_CANONICOS] };
      for (const elem of ELEMENTOS_CANONICOS) {
        assert.equal(calcularDano(20, elem, perfilResistenteGeral), 10, `20 / 2 = 10 (${elem})`);
        assert.equal(calcularDano(15, elem, perfilResistenteGeral), 7, `floor(15 / 2) = 7 (${elem})`);
        assert.equal(calcularDano(25, elem, perfilResistenteGeral), 12, `floor(25 / 2) = 12 (${elem})`);
        assert.equal(calcularDano(1, elem, perfilResistenteGeral), 0, `floor(1 / 2) = 0 (${elem})`);
      }

      // Aplicação direta nos Pontos de Vida do Ator via item de habilidade/equipamento
      const actor = createMockActor({
        name: "Herói Resistente a Fogo",
        resources: { vida: { value: 60, max: 60 } },
        items: [
          {
            id: "pocao-res-fogo",
            name: "Extrato de Resistência ao Fogo",
            type: "equipamento",
            system: {
              efeitos: [{ tipo: "resistencia", dano: "fogo", grau: "resistente" }],
            },
          },
        ],
      });

      const res = aplicarDano(actor, 7, "Fogo");
      assert.equal(res.danoFinal, 3);
      assert.equal(res.vidaRestante, 57);
      assert.equal(actor.system.resources.vida.value, 57);
    });
  });

  /* ======================================================================== */
  /* SUB-MÓDULO 6.3: VULNERABILIDADE ELEMENTAL                                */
  /* ======================================================================== */
  describe("Sub-módulo 6.3 — Vulnerabilidade Elemental", () => {
    test("6.3.1 Dobro de Dano: Multiplica o dano do elemento correspondente por 2 (ex: 5 de Frio -> 10 de dano)", () => {
      const perfilVulneravelFrio = { vulnerabilidades: ["Frio"] };

      // Caso explícito do plano: 5 de dano de Frio -> 10 de dano
      assert.equal(
        calcularDano(5, "Frio", perfilVulneravelFrio),
        10,
        "5 de dano de Frio contra alvo Vulnerável a Frio deve resultar em 10 de dano"
      );

      // Validação em todos os 6 elementos canônicos
      const perfilVulneravelGeral = { vulnerabilidades: [...ELEMENTOS_CANONICOS] };
      for (const elem of ELEMENTOS_CANONICOS) {
        assert.equal(calcularDano(12, elem, perfilVulneravelGeral), 24, `12 * 2 = 24 (${elem})`);
        assert.equal(calcularDano(9, elem, perfilVulneravelGeral), 18, `9 * 2 = 18 (${elem})`);
      }

      // Aplicação direta no Ator
      const actor = createMockActor({
        name: "Criatura Vulnerável a Frio",
        resources: { vida: { value: 60, max: 60 } },
        items: [
          {
            id: "vuln-frio",
            name: "Sangue Reptiliano",
            type: "habilidade",
            system: {
              efeitos: [{ tipo: "resistencia", dano: "frio", grau: "vulneravel" }],
            },
          },
        ],
      });

      const res = aplicarDano(actor, 5, "Frio");
      assert.equal(res.danoFinal, 10);
      assert.equal(res.vidaRestante, 50);
      assert.equal(actor.system.resources.vida.value, 50);
    });
  });

  /* ======================================================================== */
  /* SUB-MÓDULO 6.4: ANULAÇÃO MÚTUA (RESISTÊNCIA + VULNERABILIDADE)           */
  /* ======================================================================== */
  describe("Sub-módulo 6.4 — Anulação Mútua (Resistência + Vulnerabilidade)", () => {
    test("6.4.1 Cancelamento Neutro: Resistência E Vulnerabilidade ao mesmo elemento se cancelam (dano 1x)", () => {
      for (const elem of ELEMENTOS_CANONICOS) {
        const perfilAmbas = {
          resistencias: [elem],
          vulnerabilidades: [elem],
        };

        assert.equal(
          calcularDano(15, elem, perfilAmbas),
          15,
          `Resistência + Vulnerabilidade para ${elem} deve se cancelar em 1x (15 -> 15)`
        );
        assert.equal(
          calcularDano(7, elem, perfilAmbas),
          7,
          `Valor ímpar (7) não deve sofrer floor nem multiplicação quando cancelado (7 -> 7)`
        );
      }

      // Combinação de itens embutidos no Ator (ex: Armadura Resistente a Fogo + Maldição Vulnerável a Fogo)
      const actor = createMockActor({
        name: "Guerreiro Amaldiçoado",
        resources: { vida: { value: 60, max: 60 } },
        items: [
          {
            id: "armadura-runica",
            name: "Cota de Malha Rúnica",
            type: "armadura",
            system: {
              efeitos: [{ tipo: "resistencia", dano: "fogo", grau: "resistente" }],
            },
          },
          {
            id: "maldicao-chamas",
            name: "Maldição de Enxofre",
            type: "habilidade",
            system: {
              efeitos: [{ tipo: "resistencia", dano: "fogo", grau: "vulneravel" }],
            },
          },
        ],
      });

      const res = aplicarDano(actor, 17, "Fogo");
      assert.equal(res.danoFinal, 17, "Dano deve ser 1x (17)");
      assert.equal(res.vidaRestante, 43);

      // Imunidade prevalece mesmo se houver Resistência e Vulnerabilidade
      const perfilImuneComAmbas = {
        imunidades: ["fogo"],
        resistencias: ["fogo"],
        vulnerabilidades: ["fogo"],
      };
      assert.equal(calcularDano(30, "fogo", perfilImuneComAmbas), 0);
    });
  });

  /* ======================================================================== */
  /* SUB-MÓDULO 6.5: EXAUSTÃO DE MANA (0 PM) E DRENO DE PV                    */
  /* ======================================================================== */
  describe("Sub-módulo 6.5 — Exaustão de Mana (0 PM) e Dreno de PV", () => {
    test("6.5.1 Condição Exausto: Atingir 0 PM ativa automaticamente Exausto e impõe Inaptidão em todos os testes", () => {
      const actor = createMockActor({
        name: "Feiticeiro Arcano",
        resources: {
          vida: { value: 60, max: 60 },
          mana: { value: 25, max: 60 },
        },
      });

      assert.equal(temCondicao(actor, "Exausto"), false);
      assert.equal(isActorInapto(actor), false);

      // Gasta exatamente os 25 PM restantes -> chega a 0 PM
      const res = consumirMana(actor, 25);
      assert.equal(res.manaGasta, 25);
      assert.equal(res.danoEmVida, 0);
      assert.equal(res.manaRestante, 0);
      assert.equal(res.exausto, true);

      // Verifica ativação automática de Exausto e Inaptidão global
      assert.equal(temCondicao(actor, "Exausto"), true, "Deve ativar a condição Exausto ao atingir 0 PM");
      assert.match(actor.system.details.condicao, /Exausto/i);
      assert.equal(isActorInapto(actor), true, "Exausto impõe Inaptidão em todos os testes");

      // Verifica que a rolagem do ator sob Exausto aplica a regra de Inaptidão (1d6)
      const rolagemExausto = calcularEfeitoInaptidao({
        inapto: isActorInapto(actor),
        baseDice: 2,
        extraDice: 1,
        attribute: 4,
      });
      assert.equal(rolagemExausto.nDice, 1);
      assert.equal(rolagemExausto.effectiveBonus, 2);
      assert.equal(rolagemExausto.formula, "1d6 + 4 + 2");

      // Recuperar Mana (> 0 PM) remove automaticamente a condição Exausto e a Inaptidão
      recuperarMana(actor, 15);
      assert.equal(actor.system.resources.mana.value, 15);
      assert.equal(temCondicao(actor, "Exausto"), false);
      assert.equal(isActorInapto(actor), false);
    });

    test("6.5.2 Desconto em PV: Gastar PM com saldo 0 ou insuficiente desconta o excedente diretamente dos PV", async () => {
      const actor = createMockActor({
        name: "Bardo em Sobrecarga Mística",
        resources: {
          vida: { value: 60, max: 60 },
          mana: { value: 10, max: 60 },
        },
      });

      // 1. Saldo parcial insuficiente (tem 10 PM, gasta 25 PM -> consome 10 PM e desconta 15 PV)
      const overdraft = await actor.consumirMana(25);
      assert.equal(overdraft.manaGasta, 10, "Consumiu os 10 PM disponíveis");
      assert.equal(overdraft.danoEmVida, 15, "Excedente de 15 PM descontado diretamente dos PV");
      assert.equal(actor.system.resources.mana.value, 0);
      assert.equal(actor.system.resources.vida.value, 45, "PV reduzido de 60 para 45");
      assert.equal(actor.isExausto(), true);
      assert.equal(actor.isInapto(), true);

      // 2. Saldo já em 0 PM (gasta mais 10 PM -> desconta integralmente 10 PV)
      const drenoDireto = await actor.consumirMana(10);
      assert.equal(drenoDireto.manaGasta, 0);
      assert.equal(drenoDireto.danoEmVida, 10);
      assert.equal(actor.system.resources.mana.value, 0);
      assert.equal(actor.system.resources.vida.value, 35, "PV reduzido de 45 para 35");
      assert.equal(actor.isExausto(), true);
    });
  });
});
