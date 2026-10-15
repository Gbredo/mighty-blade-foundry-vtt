/**
 * Suíte de Testes Automatizados — Bloco 2: Cálculos de Estatísticas Derivadas
 *
 * Estrutura Modular:
 * - Sub-módulo 2.1 — Vitalidade e Mana (PV e PM): Base 60/60 + bônus cumulativos de raças e habilidades
 * - Sub-módulo 2.2 — Determinação: Vontade + Modificadores (Cabeça Dura, Pacto da Loucura, Espelhar Loucura)
 * - Sub-módulo 2.3 — Defesa Base & Prevalência: Padrão 5, Nanismo 6, Forma da Raposa 7 (maior prevalece, nunca soma)
 * - Sub-módulo 2.4 — Esquiva e Bloqueio Reativos: Defesa Base + Atributo + Armadura + Bônus específicos / FN
 * - Sub-módulo 2.5 — Deslocamento e Carga Física: ⌊Agilidade / 2⌋ + 4 (+1 Fauno/Tailox/Gnoll) e Força x 10kg / 20kg
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  createMockActor,
  calcularPV,
  calcularPM,
  calcularCarga,
  calcularDeslocamento,
  calcularDeterminacao,
  calcularDefesaBase,
  calcularEsquiva,
  calcularBloqueio,
  calcularEstatisticasDerivadas,
} from "./test-helper.mjs";

test("Bloco 2 — Cálculos de Estatísticas Derivadas", async (t) => {

  // =========================================================================
  // Sub-módulo 2.1 — Vitalidade e Mana (PV e PM)
  // =========================================================================
  await t.test("Sub-módulo 2.1 — Vitalidade e Mana (PV e PM)", async (st) => {
    await st.test("2.1.1 Personagem Nível 1 sem bônus inicia com 60 PV e 60 PM (base)", () => {
      const actor = createMockActor({ details: { nivel: 1 } });
      assert.equal(actor.system.resources.vida.max, 60, "PV máximo deve ser 60 no Nível 1");
      assert.equal(actor.system.resources.vida.value, 60, "PV atual deve iniciar em 60");
      assert.equal(actor.system.resources.mana.max, 60, "PM máximo deve ser 60 no Nível 1");
      assert.equal(actor.system.resources.mana.value, 60, "PM atual deve iniciar em 60");

      const resPV = calcularPV(actor);
      assert.equal(resPV.base, 60);
      assert.equal(resPV.bonus, 0);
      assert.equal(resPV.max, 60);

      const resPM = calcularPM(actor);
      assert.equal(resPM.base, 60);
      assert.equal(resPM.bonus, 0);
      assert.equal(resPM.max, 60);
    });

    await st.test("2.1.2 Habilidade 'Durão' concede +5 PV (total 65 PV)", () => {
      const actor = createMockActor({ details: { nivel: 1 } });
      actor.addItem({
        name: "Durão",
        type: "habilidade",
        system: { description: "Você tem Determinação +2 e +5 Pontos de Vida." },
      });

      assert.equal(actor.system.resources.vida.max, 65, "60 base + 5 Durão = 65 PV");
      const res = calcularPV(actor);
      assert.equal(res.max, 65);
      assert.equal(res.bonus, 5);
    });

    await st.test("2.1.3 Habilidade 'Sangue Orc' concede +10 PV (total 70 PV)", () => {
      const actor = createMockActor({ details: { nivel: 1 } });
      actor.addItem({
        name: "Sangue Orc",
        type: "habilidade",
        system: { description: "Você recebe +10 Pontos de Vida." },
      });

      assert.equal(actor.system.resources.vida.max, 70, "60 base + 10 Sangue Orc = 70 PV");
    });

    await st.test("2.1.4 Habilidade 'Mente Expandida' concede +10 PM (total 70 PM)", () => {
      const actor = createMockActor({ details: { nivel: 1 } });
      actor.addItem({
        name: "Mente Expandida",
        type: "habilidade",
        system: { description: "Ganha +10 Pontos de Mana." },
      });

      assert.equal(actor.system.resources.mana.max, 70, "60 base + 10 Mente Expandida = 70 PM");
    });

    await st.test("2.1.5 Habilidades 'Herança Feérica' e 'Intelecto Élfico' concedem +10 PM cada", () => {
      const actor = createMockActor({ details: { nivel: 1 } });
      actor.addItem({
        name: "Herança Feérica",
        type: "habilidade",
        system: { description: "+10 Pontos de Mana pela ancestralidade." },
      });
      assert.equal(actor.system.resources.mana.max, 70, "60 + 10 Herança Feérica = 70 PM");

      actor.addItem({
        name: "Intelecto Élfico",
        type: "habilidade",
        system: { description: "+10 PM adicionais pela mente aguçada." },
      });
      assert.equal(actor.system.resources.mana.max, 80, "60 + 10 + 10 = 80 PM");
    });

    await st.test("2.1.6 Efeitos declarativos 'bonusPV' e 'bonusPM' somam aos máximos", () => {
      const actor = createMockActor({ details: { nivel: 1 } });
      actor.addItem({
        name: "Amuleto de Vitalidade",
        type: "equipamento",
        system: { efeitos: [{ tipo: "bonusPV", valor: 15 }] },
      });
      actor.addItem({
        name: "Cristal de Mana",
        type: "equipamento",
        system: { efeitos: [{ tipo: "bonusPM", valor: 25 }] },
      });

      assert.equal(actor.system.resources.vida.max, 75, "60 base + 15 bônus declarativo = 75 PV");
      assert.equal(actor.system.resources.mana.max, 85, "60 base + 25 bônus declarativo = 85 PM");
    });

    await st.test("2.1.7 Acúmulo cumulativo de múltiplos bônus de habilidades em PV e PM", () => {
      const actor = createMockActor({ details: { nivel: 1 } });
      actor.addItem({ name: "Durão", type: "habilidade", system: {} }); // +5 PV
      actor.addItem({ name: "Sangue Orc", type: "habilidade", system: {} }); // +10 PV
      actor.addItem({ name: "Mente Expandida", type: "habilidade", system: {} }); // +10 PM
      actor.addItem({ name: "Reserva Mística", type: "habilidade", system: {} }); // +10 PM

      // PV: 60 + 5 + 10 = 75 PV
      assert.equal(actor.system.resources.vida.max, 75);
      // PM: 60 + 10 + 10 = 80 PM
      assert.equal(actor.system.resources.mana.max, 80);
    });

    await st.test("2.1.8 Remoção de itens/habilidades de PV e PM recalcula os valores reativamente", () => {
      const actor = createMockActor({ details: { nivel: 1 } });
      actor.addItem({ name: "Durão", type: "habilidade", system: {} });
      actor.addItem({ name: "Mente Expandida", type: "habilidade", system: {} });
      assert.equal(actor.system.resources.vida.max, 65);
      assert.equal(actor.system.resources.mana.max, 70);

      actor.removeItem("Durão");
      actor.removeItem("Mente Expandida");
      assert.equal(actor.system.resources.vida.max, 60, "Retorna para 60 PV base");
      assert.equal(actor.system.resources.mana.max, 60, "Retorna para 60 PM base");
    });
  });

  // =========================================================================
  // Sub-módulo 2.2 — Determinação
  // =========================================================================
  await t.test("Sub-módulo 2.2 — Determinação", async (st) => {
    await st.test("2.2.1 Determinação pura é exatamente igual ao valor de Vontade", () => {
      const actorVon3 = createMockActor({ attributes: { vontade: 3 } });
      assert.equal(actorVon3.system.defesas.determinacao.value, 3, "Vontade 3 resulta em Determinação 3");

      const actorVon5 = createMockActor({ attributes: { vontade: 5 } });
      assert.equal(actorVon5.system.defesas.determinacao.value, 5, "Vontade 5 resulta em Determinação 5");

      const res = calcularDeterminacao(actorVon3);
      assert.equal(res.vontade, 3);
      assert.equal(res.bonus, 0);
      assert.equal(res.value, 3);
    });

    await st.test("2.2.2 Habilidade 'Durão' concede +2 na Determinação", () => {
      const actor = createMockActor({ attributes: { vontade: 3 } });
      actor.addItem({
        name: "Durão",
        type: "habilidade",
        system: { description: "Você tem Determinação +2 e +5 Pontos de Vida." },
      });

      assert.equal(actor.system.defesas.determinacao.value, 5, "3 Vontade + 2 Durão = 5");
      assert.equal(actor.system.defesas.determinacao.bonus, 2);
    });

    await st.test("2.2.3 Habilidade 'Cabeça Dura' concede +2 na Determinação", () => {
      const actor = createMockActor({ attributes: { vontade: 4 } });
      actor.addItem({
        name: "Cabeça Dura",
        type: "habilidade",
        system: { efeitos: [{ tipo: "bonusDefesa", defesa: "determinacao", valor: 2 }] },
      });

      assert.equal(actor.system.defesas.determinacao.value, 6, "4 Vontade + 2 Cabeça Dura = 6");
    });

    await st.test("2.2.4 Habilidades 'Pacto da Loucura' e 'Espelhar Loucura' concedem +2 na Determinação", () => {
      const actor = createMockActor({ attributes: { vontade: 2 } });
      actor.addItem({
        name: "Pacto da Loucura",
        type: "habilidade",
        system: { description: "Graças a isso, você tem Determinação +2..." },
      });
      assert.equal(actor.system.defesas.determinacao.value, 4, "2 Vontade + 2 Pacto = 4");

      actor.addItem({
        name: "Espelhar Loucura",
        type: "habilidade",
        system: { description: "+2 em Determinação contra efeitos mentais." },
      });
      assert.equal(actor.system.defesas.determinacao.value, 6, "2 Vontade + 2 Pacto + 2 Espelhar = 6");
    });

    await st.test("2.2.5 Efeito declarativo 'bonusDefesa: determinacao' soma na Determinação", () => {
      const actor = createMockActor({ attributes: { vontade: 3 } });
      actor.addItem({
        name: "Pingente da Convicção",
        type: "equipamento",
        system: { efeitos: [{ tipo: "bonusDefesa", defesa: "determinacao", valor: 3 }] },
      });

      assert.equal(actor.system.defesas.determinacao.value, 6, "3 Vontade + 3 bônus = 6");
    });

    await st.test("2.2.6 Acúmulo de múltiplos modificadores na Determinação", () => {
      const actor = createMockActor({ attributes: { vontade: 3 } });
      actor.addItem({ name: "Durão", type: "habilidade", system: {} }); // +2
      actor.addItem({ name: "Cabeça Dura", type: "habilidade", system: {} }); // +2
      actor.addItem({ name: "Pacto da Loucura", type: "habilidade", system: {} }); // +2

      // Vontade 3 + 2 (Durão) + 2 (Cabeça Dura) + 2 (Pacto) = 9
      assert.equal(actor.system.defesas.determinacao.value, 9, "3 Vontade + 6 bônus = 9");
      assert.equal(actor.system.defesas.determinacao.bonus, 6);
    });
  });

  // =========================================================================
  // Sub-módulo 2.3 — Defesa Base & Prevalência
  // =========================================================================
  await t.test("Sub-módulo 2.3 — Defesa Base & Prevalência", async (st) => {
    await st.test("2.3.1 Personagem padrão possui Defesa Base igual a 5", () => {
      const actor = createMockActor();
      assert.equal(actor.system.defesas.defesaBase, 5, "Defesa base padrão deve ser 5");
      assert.equal(calcularDefesaBase(actor), 5);
    });

    await st.test("2.3.2 Habilidade 'Nanismo' substitui a Defesa Base por 6", () => {
      const actor = createMockActor();
      actor.addItem({
        name: "Nanismo",
        type: "habilidade",
        flags: { "mighty-blade": { slug: "nanismo" } },
        system: { description: "Seu bônus automático de Defesa é 6 ao invés de 5." },
      });

      assert.equal(actor.system.defesas.defesaBase, 6, "Nanismo eleva a Defesa Base para 6");
      assert.equal(calcularDefesaBase(actor), 6);
    });

    await st.test("2.3.3 Habilidade 'Forma da Raposa' (Tailox) substitui a Defesa Base por 7", () => {
      const actor = createMockActor({ details: { raca: "Tailox" } });
      actor.addItem({
        name: "Forma da Raposa",
        type: "habilidade",
        flags: { "mighty-blade": { slug: "forma-da-raposa" } },
        system: { description: "Bônus de Defesa base 7 (em vez de 5)." },
      });

      assert.equal(actor.system.defesas.defesaBase, 7, "Forma da Raposa eleva a Defesa Base para 7");
      assert.equal(calcularDefesaBase(actor), 7);
    });

    await st.test("2.3.4 Princípio de Prevalência do Maior Valor: Nunca somar bases (maior substitui)", () => {
      const actor = createMockActor();
      actor.addItem({ name: "Nanismo", type: "habilidade", system: {} }); // base 6
      actor.addItem({ name: "Forma da Raposa", type: "habilidade", system: {} }); // base 7

      // Prevalência estrita: max(5, 6, 7) = 7 (e NUNCA 5 + 6 + 7 = 18 ou 6 + 7 = 13)
      assert.equal(actor.system.defesas.defesaBase, 7, "A maior Defesa Base (7) deve prevalecer sem somar");
      assert.equal(calcularDefesaBase(actor), 7);
    });

    await st.test("2.3.5 Efeito declarativo 'defesaBase' maior substitui; menor não reduz base 5", () => {
      const actorSuperior = createMockActor();
      actorSuperior.addItem({
        name: "Forma Divina",
        type: "habilidade",
        system: { efeitos: [{ tipo: "defesaBase", valor: 8 }] },
      });
      assert.equal(actorSuperior.system.defesas.defesaBase, 8, "Base 8 substitui base 5");

      const actorInferior = createMockActor();
      actorInferior.addItem({
        name: "Fragilidade Temporária",
        type: "habilidade",
        system: { efeitos: [{ tipo: "defesaBase", valor: 4 }] },
      });
      assert.equal(actorInferior.system.defesas.defesaBase, 5, "Base 4 não rebaixa base padrão 5");
    });
  });

  // =========================================================================
  // Sub-módulo 2.4 — Esquiva e Bloqueio Reativos
  // =========================================================================
  await t.test("Sub-módulo 2.4 — Esquiva e Bloqueio Reativos", async (st) => {
    await st.test("2.4.1 Esquiva pura com Defesa Base padrão (5) + Agilidade", () => {
      const actor = createMockActor({ attributes: { agilidade: 3 } });
      // 5 (base) + 3 (Agi) = 8
      assert.equal(actor.system.defesas.esquiva.value, 8, "5 base + 3 Agi = 8 de Esquiva");

      const res = calcularEsquiva(actor);
      assert.equal(res.defesaBase, 5);
      assert.equal(res.agilidade, 3);
      assert.equal(res.bonusArmadura, 0);
      assert.equal(res.bonusEsquiva, 0);
      assert.equal(res.value, 8);
    });

    await st.test("2.4.2 Esquiva com Nanismo (Base 6) e Forma da Raposa (Base 7) + Agilidade", () => {
      const actorNanismo = createMockActor({ attributes: { agilidade: 3 } });
      actorNanismo.addItem({ name: "Nanismo", type: "habilidade", system: {} });
      assert.equal(actorNanismo.system.defesas.esquiva.value, 9, "6 base + 3 Agi = 9");

      const actorRaposa = createMockActor({ attributes: { agilidade: 4 } });
      actorRaposa.addItem({ name: "Forma da Raposa", type: "habilidade", system: {} });
      assert.equal(actorRaposa.system.defesas.esquiva.value, 11, "7 base + 4 Agi = 11");
    });

    await st.test("2.4.3 Esquiva com Armadura equipada e bônus de Esquiva ('Dançarino do Ar')", () => {
      const actor = createMockActor({ attributes: { agilidade: 3 } });
      actor.addItem({
        name: "Armadura Batida",
        type: "armadura",
        system: { equipado: true, subtipo: "armadura", defesa: 2 },
      });
      actor.addItem({
        name: "Dançarino do Ar",
        type: "habilidade",
        system: { description: "Ganha +1 em testes de Esquiva." },
      });

      // 5 (base) + 3 (Agi) + 2 (Armadura) + 1 (Dançarino do Ar) = 11
      assert.equal(actor.system.defesas.esquiva.value, 11, "5 base + 3 Agi + 2 Armadura + 1 Dançarino = 11");
    });

    await st.test("2.4.4 Desequipar a armadura reduz a Esquiva reativamente", () => {
      const actor = createMockActor({ attributes: { agilidade: 2 } });
      const armadura = actor.addItem({
        name: "Armadura de Couro",
        type: "armadura",
        system: { equipado: true, subtipo: "armadura", defesa: 2 },
      });
      assert.equal(actor.system.defesas.esquiva.value, 9); // 5 + 2 + 2 = 9

      actor.equipItem(armadura, false);
      assert.equal(actor.system.defesas.esquiva.value, 7, "5 + 2 + 0 = 7 após desequipar");
    });

    await st.test("2.4.5 Bloqueio puro com Defesa Base padrão (5) + Força", () => {
      const actor = createMockActor({ attributes: { forca: 4 } });
      // 5 (base) + 4 (Força) = 9
      assert.equal(actor.system.defesas.bloqueio.value, 9, "5 base + 4 Força = 9 de Bloqueio");

      const res = calcularBloqueio(actor);
      assert.equal(res.defesaBase, 5);
      assert.equal(res.forca, 4);
      assert.equal(res.bonusArmadura, 0);
      assert.equal(res.bonusEscudo, 0);
      assert.equal(res.bonusBloqueio, 0);
      assert.equal(res.value, 9);
    });

    await st.test("2.4.6 Bloqueio com Armadura e Escudo equipados (atendendo à FN)", () => {
      const actor = createMockActor({ attributes: { forca: 4 } });
      actor.addItem({
        name: "Cota de Malha",
        type: "armadura",
        system: { equipado: true, subtipo: "armadura", defesa: 3, fn: 3 },
      });
      actor.addItem({
        name: "Escudo Médio",
        type: "armadura",
        system: { equipado: true, subtipo: "escudo", defesa: 2, fn: 2 },
      });

      // 5 (base) + 4 (Força) + 3 (Armadura) + 2 (Escudo) = 14
      assert.equal(actor.system.defesas.bloqueio.value, 14, "5 base + 4 Força + 3 Armadura + 2 Escudo = 14");
    });

    await st.test("2.4.7 Bloqueio com bônus de Habilidade ('Mestre em Escudo')", () => {
      const actor = createMockActor({ attributes: { forca: 3 } });
      actor.addItem({
        name: "Escudo Leve",
        type: "armadura",
        system: { equipado: true, subtipo: "escudo", defesa: 1, fn: 1 },
      });
      actor.addItem({
        name: "Mestre em Escudo",
        type: "habilidade",
        system: { efeitos: [{ tipo: "bonusDefesa", defesa: "bloqueio", valor: 2 }] },
      });

      // 5 (base) + 3 (Força) + 1 (Escudo) + 2 (Habilidade) = 11
      assert.equal(actor.system.defesas.bloqueio.value, 11, "5 base + 3 Força + 1 Escudo + 2 Bônus = 11");
    });

    await st.test("2.4.8 Escudo com FN > Força perde o bônus no Bloqueio", () => {
      const actor = createMockActor({ attributes: { forca: 2 } });
      actor.addItem({
        name: "Pavês Pesado",
        type: "armadura",
        system: { equipado: true, subtipo: "escudo", defesa: 3, fn: 5 }, // FN 5 > Força 2
      });

      // Como FN 5 > Força 2, escudo não soma: 5 (base) + 2 (Força) + 0 = 7
      assert.equal(actor.system.defesas.bloqueio.value, 7, "Escudo sem FN cumprida não soma no Bloqueio");
    });
  });

  // =========================================================================
  // Sub-módulo 2.5 — Deslocamento e Carga Física
  // =========================================================================
  await t.test("Sub-módulo 2.5 — Deslocamento e Carga Física", async (st) => {
    await st.test("2.5.1 Deslocamento padrão por Agilidade: ⌊Agilidade / 2⌋ + 4", () => {
      const tabela = [
        { agi: 0, esperado: 4 }, // floor(0/2) + 4 = 4
        { agi: 1, esperado: 4 }, // floor(1/2) + 4 = 4
        { agi: 2, esperado: 5 }, // floor(2/2) + 4 = 5
        { agi: 3, esperado: 5 }, // floor(3/2) + 4 = 5
        { agi: 4, esperado: 6 }, // floor(4/2) + 4 = 6
        { agi: 5, esperado: 6 }, // floor(5/2) + 4 = 6
        { agi: 6, esperado: 7 }, // floor(6/2) + 4 = 7
      ];

      for (const { agi, esperado } of tabela) {
        const actor = createMockActor({ attributes: { agilidade: agi } });
        assert.equal(
          actor.system.subattributes.deslocamento.value,
          esperado,
          `Agilidade ${agi} deve resultar em Deslocamento ${esperado}`
        );
      }
    });

    await st.test("2.5.2 Bônus racial de Fauno (+1 Deslocamento, 'Patas com Cascos')", () => {
      const actor = createMockActor({
        attributes: { agilidade: 2 },
        details: { raca: "Fauno" },
      });
      actor.addItem({ name: "Patas com Cascos", type: "habilidade", system: {} });

      // Base 5 + Bônus 1 = 6
      assert.equal(actor.system.subattributes.deslocamento.value, 6, "Fauno com Agi 2 tem Deslocamento 6");
      assert.equal(actor.system.subattributes.deslocamento.bonus, 1);
    });

    await st.test("2.5.3 Bônus racial de Tailox (+1 Deslocamento, 'Pernas Vulpinas')", () => {
      const actor = createMockActor({
        attributes: { agilidade: 3 },
        details: { raca: "Tailox" },
      });
      actor.addItem({ name: "Pernas Vulpinas", type: "habilidade", system: {} });

      // Base 5 + Bônus 1 = 6
      assert.equal(actor.system.subattributes.deslocamento.value, 6, "Tailox com Agi 3 tem Deslocamento 6");
    });

    await st.test("2.5.4 Bônus racial de Gnoll (+1 Deslocamento, 'Salteador')", () => {
      const actor = createMockActor({
        attributes: { agilidade: 4 },
        details: { raca: "Gnoll" },
      });
      actor.addItem({ name: "Salteador", type: "habilidade", system: {} });

      // Base 6 + Bônus 1 = 7
      assert.equal(actor.system.subattributes.deslocamento.value, 7, "Gnoll com Agi 4 tem Deslocamento 7");
    });

    await st.test("2.5.5 Carga básica padrão: Força × 10 kg", () => {
      const actorForca3 = createMockActor({ attributes: { forca: 3 } });
      assert.equal(actorForca3.system.subattributes.carga.basica, 30, "Força 3 x 10 = 30 kg");
      assert.equal(actorForca3.system.subattributes.carga.basicaPadrao, 30);

      const actorForca4 = createMockActor({ attributes: { forca: 4 } });
      assert.equal(actorForca4.system.subattributes.carga.basica, 40, "Força 4 x 10 = 40 kg");

      const res = calcularCarga(actorForca3);
      assert.equal(res.basicaPadrao, 30);
    });

    await st.test("2.5.6 Carga básica Manual do Combatente: Força × 20 kg (e máxima Força × 40 kg)", () => {
      const actorForca3 = createMockActor({ attributes: { forca: 3 } });
      assert.equal(actorForca3.system.subattributes.carga.basicaCombatente, 60, "Força 3 x 20 = 60 kg");

      const actorForca5 = createMockActor({ attributes: { forca: 5 } });
      assert.equal(actorForca5.system.subattributes.carga.basicaCombatente, 100, "Força 5 x 20 = 100 kg");

      const res = calcularCarga(actorForca3, { manualDoCombatente: true });
      assert.equal(res.basica, 60, "Com flag do Combatente ativada, a carga básica é 60 kg");
      assert.equal(res.maximaCombatente, 120, "Carga máxima do Combatente é Força x 40 = 120 kg");
    });

    await st.test("2.5.7 Habilidade 'Coração da Montanha' soma +2 na Força para fins de carga", () => {
      const actor = createMockActor({ attributes: { forca: 4 } });
      actor.addItem({ name: "Coração da Montanha", type: "habilidade", system: {} });

      // Força real = 4, Força para Carga = 4 + 2 = 6
      assert.equal(actor.system.subattributes.carga.forcaEfetiva, 6);
      assert.equal(actor.system.subattributes.carga.basica, 60, "Força efetiva 6 x 10 = 60 kg padrão");
      assert.equal(actor.system.subattributes.carga.basicaCombatente, 120, "Força efetiva 6 x 20 = 120 kg Combatente");
    });

    await st.test("2.5.8 Carga máxima absoluta é o dobro da carga básica", () => {
      const actor = createMockActor({ attributes: { forca: 4 } });
      assert.equal(actor.system.subattributes.carga.maxima, 80, "Força 4 x 20 = 80 kg carga máxima padrão");
      assert.equal(actor.system.subattributes.carga.maximaCombatente, 160, "Força 4 x 40 = 160 kg carga máxima Combatente");
    });
  });

  // =========================================================================
  // Teste de Integração Completo de Estatísticas Derivadas
  // =========================================================================
  await t.test("Integração Completa: Personagem nível 1 com raça, habilidades e equipamentos", () => {
    const heroi = createMockActor({
      name: "Gimli, o Bravo",
      details: { nivel: 1, raca: "Fauno" },
      attributes: {
        forca: 4,
        agilidade: 3,
        inteligencia: 2,
        vontade: 3,
      },
    });

    heroi.addItem({ name: "Durão", type: "habilidade", system: {} }); // +5 PV, +2 Determinação
    heroi.addItem({ name: "Patas com Cascos", type: "habilidade", system: {} }); // +1 Deslocamento
    heroi.addItem({
      name: "Armadura de Couro Fervido",
      type: "armadura",
      system: { equipado: true, subtipo: "armadura", defesa: 2, fn: 2 },
    });
    heroi.addItem({
      name: "Escudo de Madeira",
      type: "armadura",
      system: { equipado: true, subtipo: "escudo", defesa: 1, fn: 1 },
    });

    // Verificações simultâneas de todas as estatísticas derivadas
    assert.equal(heroi.system.resources.vida.max, 65, "PV: 60 + 5 Durão = 65");
    assert.equal(heroi.system.resources.mana.max, 60, "PM: 60 base = 60");
    assert.equal(heroi.system.subattributes.carga.basica, 40, "Carga básica: Força 4 x 10 = 40 kg");
    assert.equal(heroi.system.subattributes.carga.basicaCombatente, 80, "Carga Combatente: Força 4 x 20 = 80 kg");
    assert.equal(heroi.system.subattributes.deslocamento.value, 6, "Deslocamento: floor(3/2) + 4 + 1 Fauno = 6");
    assert.equal(heroi.system.defesas.determinacao.value, 5, "Determinação: Vontade 3 + 2 Durão = 5");
    assert.equal(heroi.system.defesas.defesaBase, 5, "Defesa Base: 5 padrão");
    assert.equal(heroi.system.defesas.esquiva.value, 10, "Esquiva: 5 base + 3 Agi + 2 Armadura = 10");
    assert.equal(heroi.system.defesas.bloqueio.value, 12, "Bloqueio: 5 base + 4 Força + 2 Armadura + 1 Escudo = 12");

    const resumo = calcularEstatisticasDerivadas(heroi);
    assert.equal(resumo.pv.max, 65);
    assert.equal(resumo.pm.max, 60);
    assert.equal(resumo.carga.basica, 40);
    assert.equal(resumo.deslocamento.value, 6);
    assert.equal(resumo.determinacao.value, 5);
    assert.equal(resumo.esquiva.value, 10);
    assert.equal(resumo.bloqueio.value, 12);
  });
});
