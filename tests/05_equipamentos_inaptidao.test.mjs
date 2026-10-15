import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { createMockActor, createCharacter } from "./test-helper.mjs";
import {
  CANONICAL_EQUIPAMENTOS,
  CANONICAL_RACAS,
  CANONICAL_HABILIDADES,
} from "../module/data/canonical-packs-data.mjs";
import {
  obterMaxSlotsMao,
  obterUsoMaosItem,
  validarLimiteArmaduras,
  validarLimiteMaos,
  verificarFN,
  calcularEfeitoInaptidao,
  resolverVariante3d6Descarte,
  calcularPenalidadesArmaduraPesada,
  aplicarReducaoDanoArmaduraPesada,
  obterBonusAtletismo,
  equiparItemSeguramente,
  calcularEquipamento,
} from "../module/helpers/equipamento.mjs";

// Helpers para localizar itens canônicos
const getEquip = (nome) => {
  const item = CANONICAL_EQUIPAMENTOS.find((e) => e.name.toLowerCase() === nome.toLowerCase());
  if (!item) throw new Error(`Equipamento canônico não encontrado: ${nome}`);
  return JSON.parse(JSON.stringify(item));
};

const getRaca = (nome) => {
  const raca = CANONICAL_RACAS.find((r) => r.name.toLowerCase() === nome.toLowerCase());
  if (!raca) throw new Error(`Raça canônica não encontrada: ${nome}`);
  return JSON.parse(JSON.stringify(raca));
};

const getHab = (nome) => {
  const hab = CANONICAL_HABILIDADES.find((h) => h.name.toLowerCase() === nome.toLowerCase());
  if (!hab) throw new Error(`Habilidade canônica não encontrada: ${nome}`);
  return JSON.parse(JSON.stringify(hab));
};

describe("Bloco 5 — Equipamentos, Armas, Armaduras e Regra de Inaptidão", () => {
  /* ======================================================================== */
  /* SUB-MÓDULO 5.1: FORÇA NECESSÁRIA (FN) & MECÂNICA DE INAPTIDÃO            */
  /* ======================================================================== */
  describe("Sub-módulo 5.1 — Força Necessária (FN) & Mecânica de Inaptidão", () => {
    test("5.1.1 Detecção de Inaptidão: Se Força do Personagem < FN do Equipamento, a flag inapto é ativada na arma/armadura", () => {
      const claymore = getEquip("Claymore"); // FN 5
      const armaduraBatalha = getEquip("Armadura de Batalha"); // FN 6
      const espadaCurta = getEquip("Espada Curta"); // FN 2

      assert.equal(claymore.system.fn, 5);
      assert.equal(armaduraBatalha.system.fn, 6);
      assert.equal(espadaCurta.system.fn, 2);

      // Personagem com Força 3
      const heroiFor3 = createMockActor({
        attributes: { forca: { value: 3, base: 3 }, agilidade: { value: 3, base: 3 } },
      });

      // 1. Checagem direta em verificarFN ativa flag inapto no item
      const checkClaymore = verificarFN(heroiFor3, claymore);
      assert.equal(checkClaymore.inapto, true, "Força 3 < FN 5 deve acusar inaptidão");
      assert.equal(claymore.inapto, true, "Flag inapto deve ser ativada na arma");
      assert.equal(claymore.system.inapto, true, "Flag system.inapto deve ser ativada na arma");

      const checkEspadaCurta = verificarFN(heroiFor3, espadaCurta);
      assert.equal(checkEspadaCurta.inapto, false, "Força 3 >= FN 2 não é inapto");
      assert.equal(espadaCurta.inapto, false);
      assert.equal(espadaCurta.system.inapto, false);

      // 2. Equipar armadura e arma no ator propaga inapto nos itens e no sistema do ator
      heroiFor3.addItem(armaduraBatalha);
      heroiFor3.addItem(claymore);
      heroiFor3.equipItem("Armadura de Batalha", true);
      heroiFor3.equipItem("Claymore", true);

      const armaduraNoAtor = heroiFor3.items.find((i) => i.name === "Armadura de Batalha");
      const armaNoAtor = heroiFor3.items.find((i) => i.name === "Claymore");

      assert.equal(armaduraNoAtor.system.inapto, true, "Armadura com FN 6 equipada por Força 3 deve ter system.inapto = true");
      assert.equal(armaNoAtor.system.inapto, true, "Arma com FN 5 equipada por Força 3 deve ter system.inapto = true");
      assert.equal(heroiFor3.system.equipamento.inaptoArmadura, true);
      assert.equal(heroiFor3.system.equipamento.isInaptoGeral, true);
      assert.equal(heroiFor3.system.equipamento.itensInaptos.length, 2);

      // 3. Personagem com Força 6 (Força >= FN) desativa flag inapto
      const heroiFor6 = createMockActor({
        attributes: { forca: { value: 6, base: 6 }, agilidade: { value: 3, base: 3 } },
      });
      const armaduraForte = getEquip("Armadura de Batalha");
      heroiFor6.addItem(armaduraForte);
      heroiFor6.equipItem("Armadura de Batalha", true);

      const armaduraEquipadaForte = heroiFor6.items.find((i) => i.name === "Armadura de Batalha");
      assert.equal(armaduraEquipadaForte.system.inapto, false);
      assert.equal(heroiFor6.system.equipamento.inaptoArmadura, false);
      assert.equal(heroiFor6.system.equipamento.isInaptoGeral, false);
    });

    test("5.1.2 Penalidade nas Rolagens: Pool padrão (2d6) cai para 1d6 (ou 3d6kl2 na variante) e dados extras viram +2 fixo", () => {
      // A) Rolagem normal (2d6) vs Inapta (1d6)
      const rolagemNormal = calcularEfeitoInaptidao({
        inapto: false,
        baseDice: 2,
        extraDice: 0,
        attribute: 4,
        bonus: 0,
      });
      assert.equal(rolagemNormal.nDice, 2);
      assert.equal(rolagemNormal.formula, "2d6 + 4");

      const rolagemInapta = calcularEfeitoInaptidao({
        inapto: true,
        baseDice: 2,
        extraDice: 0,
        attribute: 4,
        bonus: 0,
      });
      assert.equal(rolagemInapta.nDice, 1, "Pool padrão 2d6 reduzido para 1d6 na Inaptidão");
      assert.equal(rolagemInapta.formula, "1d6 + 4");

      // B) Conversão de dados extras (+1d6 -> +2 fixo; +2d6 -> +4 fixo)
      const inapto1Extra = calcularEfeitoInaptidao({
        inapto: true,
        baseDice: 2,
        extraDice: 1,
        attribute: 3,
        bonus: 0,
      });
      assert.equal(inapto1Extra.nDice, 1);
      assert.equal(inapto1Extra.effectiveBonus, 2, "1 dado extra converte-se em +2 fixo");
      assert.equal(inapto1Extra.formula, "1d6 + 3 + 2");

      const inapto2Extras = calcularEfeitoInaptidao({
        inapto: true,
        baseDice: 2,
        extraDice: 2,
        attribute: 3,
        bonus: 1,
      });
      assert.equal(inapto2Extras.nDice, 1);
      assert.equal(inapto2Extras.effectiveBonus, 5, "1 base + (2 * 2 fixo) = +5");
      assert.equal(inapto2Extras.formula, "1d6 + 3 + 5");
      assert.ok(inapto2Extras.inaptoNote.includes("+2d6 → +4"));

      // C) Variante 3d6 descartando o maior dado
      const variante = calcularEfeitoInaptidao({
        inapto: true,
        extraDice: 1,
        attribute: 3,
        bonus: 0,
        usarVariante3d6: true,
      });
      assert.equal(variante.nDice, 3);
      assert.equal(variante.discardHighest, true);
      assert.equal(variante.effectiveBonus, 2, "Na variante 3d6kl2, 1 dado extra também vira +2 fixo");
      assert.equal(variante.formula, "3d6kl2 + 3 + 2");

      const descarte = resolverVariante3d6Descarte([6, 5, 2]);
      assert.equal(descarte.descartado, 6);
      assert.deepEqual(descarte.mantidos, [2, 5]);
      assert.equal(descarte.soma, 7);
    });
  });

  /* ======================================================================== */
  /* SUB-MÓDULO 5.2: LIMITE DE ARMADURAS CORPORAIS                            */
  /* ======================================================================== */
  describe("Sub-módulo 5.2 — Limite de Armaduras Corporais", () => {
    test("5.2.1 Trava de Slot Único: Personagem só pode trajar 1 Armadura Corporal (escudos usam slots de mão)", () => {
      const couro = getEquip("Armadura de Couro"); // Armadura corporal
      const escudoMedio = getEquip("Escudo Médio"); // Escudo (1 slot de mão, 0 slot de armadura)

      const heroi = createMockActor({
        attributes: { forca: { value: 4, base: 4 } },
      });

      heroi.addItem(couro);
      heroi.addItem(escudoMedio);
      heroi.equipItem("Armadura de Couro", true);
      heroi.equipItem("Escudo Médio", true);

      const statusArmaduras = validarLimiteArmaduras(heroi);
      assert.equal(statusArmaduras.valido, true, "1 Armadura Corporal + 1 Escudo respeita o limite de 1 armadura");
      assert.equal(statusArmaduras.armadurasEquipadas.length, 1);
      assert.equal(heroi.system.equipamento.armadurasVestidas, 1);
      assert.equal(heroi.system.equipamento.maosOcupadas, 1, "Escudo ocupa 1 slot de mão");
    });

    test("5.2.2 Rejeição de Segunda Armadura: Tentar equipar uma 2ª armadura bloqueia a ação ou desequipa a anterior", () => {
      const couro = getEquip("Armadura de Couro"); // Defesa +2
      const batalha = getEquip("Armadura de Batalha"); // Defesa +4

      const heroi = createMockActor({
        attributes: { forca: { value: 6, base: 6 } },
      });

      heroi.addItem(couro);
      heroi.addItem(batalha);

      // Equipa a 1ª armadura
      const eq1 = equiparItemSeguramente(heroi, "Armadura de Couro");
      assert.equal(eq1.sucesso, true);
      assert.equal(heroi.system.equipamento.bonusArmadura, 2);

      // Modo 1 (Padrão): Bloqueia a tentativa de equipar uma 2ª armadura corporal
      const eq2Bloqueado = equiparItemSeguramente(heroi, "Armadura de Batalha");
      assert.equal(eq2Bloqueado.sucesso, false, "Equipar 2ª armadura sem substituição deve ser bloqueado");
      assert.equal(eq2Bloqueado.bloqueado, true);
      assert.equal(eq2Bloqueado.erro, "O personagem só pode trajar 1 Armadura por vez.");

      const itemBatalha = heroi.items.find((i) => i.name === "Armadura de Batalha");
      assert.equal(Boolean(itemBatalha.system.equipado), false, "2ª armadura permanece desequipada");

      // Modo 2 (Substituição): Desequipa a armadura anterior automaticamente e veste a nova
      const eq2Substituido = equiparItemSeguramente(heroi, "Armadura de Batalha", { substituir: true });
      assert.equal(eq2Substituido.sucesso, true);
      assert.deepEqual(eq2Substituido.desequipados, ["Armadura de Couro"]);

      const itemCouro = heroi.items.find((i) => i.name === "Armadura de Couro");
      assert.equal(itemCouro.system.equipado, false, "Armadura anterior foi desequipada");
      assert.equal(itemBatalha.system.equipado, true, "Nova armadura foi equipada");
      assert.equal(heroi.system.equipamento.armadurasVestidas, 1);
      assert.equal(heroi.system.equipamento.bonusArmadura, 4);
    });
  });

  /* ======================================================================== */
  /* SUB-MÓDULO 5.3: SLOTS DE MÃO & EXCEÇÃO RACIAL DO MAHOK                   */
  /* ======================================================================== */
  describe("Sub-módulo 5.3 — Slots de Mão & Exceção Racial do Mahok", () => {
    test("5.3.1 Limite Padrão (2 Slots): Armas 1 mão/Escudos = 1 slot, Armas 2 mãos = 2 slots; exceder 2 slots é bloqueado", () => {
      const espadaCurta = getEquip("Espada Curta"); // 1 slot
      const escudoMedio = getEquip("Escudo Médio"); // 1 slot
      const claymore = getEquip("Claymore"); // 2 slots

      assert.equal(obterUsoMaosItem(espadaCurta), 1);
      assert.equal(obterUsoMaosItem(escudoMedio), 1);
      assert.equal(obterUsoMaosItem(claymore), 2);

      const humano = createMockActor({
        details: { raca: "Humano" },
        attributes: { forca: { value: 6, base: 6 } },
      });
      assert.equal(obterMaxSlotsMao(humano), 2);

      humano.addItem(espadaCurta);
      humano.addItem(escudoMedio);
      humano.addItem(claymore);

      // Equipa Espada Curta (1/2) + Escudo Médio (2/2)
      assert.equal(equiparItemSeguramente(humano, "Espada Curta").sucesso, true);
      assert.equal(equiparItemSeguramente(humano, "Escudo Médio").sucesso, true);
      assert.equal(humano.system.equipamento.maosOcupadas, 2);
      assert.equal(humano.system.equipamento.maosLivres, 0);

      // Tentar equipar mais um item de mão (Claymore) deve ser bloqueado no runtime
      const tentativaExcesso = equiparItemSeguramente(humano, "Claymore");
      assert.equal(tentativaExcesso.sucesso, false, "Tentar exceder 2 slots de mão deve ser bloqueado");
      assert.equal(tentativaExcesso.bloqueado, true);
      assert.match(tentativaExcesso.erro, /Limite de mãos excedido/i);

      // Desequipa Espada + Escudo e equipa Claymore (2 slots) -> Tentar equipar Escudo (2 + 1 = 3) também bloqueia
      humano.equipItem("Espada Curta", false);
      humano.equipItem("Escudo Médio", false);
      assert.equal(equiparItemSeguramente(humano, "Claymore").sucesso, true);
      assert.equal(humano.system.equipamento.maosOcupadas, 2);

      const tentativaEscudoComClaymore = equiparItemSeguramente(humano, "Escudo Médio");
      assert.equal(tentativaEscudoComClaymore.sucesso, false);
      assert.match(tentativaEscudoComClaymore.erro, /Limite de mãos excedido/i);
    });

    test("5.3.2 Exceção Mahok com Braços Extras (4 Slots): Permite empunhar duas armas de 2 mãos simultaneamente (duas Claymores)", () => {
      const racaMahok = getRaca("Mahok");
      const habBracosExtras = getHab("Braços Extras");

      const claymore1 = getEquip("Claymore");
      claymore1._id = "claymore-1";
      claymore1.id = "claymore-1";
      claymore1.name = "Claymore Mão Direita";

      const claymore2 = getEquip("Claymore");
      claymore2._id = "claymore-2";
      claymore2.id = "claymore-2";
      claymore2.name = "Claymore Mão Esquerda";

      const mahok4Bracos = createMockActor({
        name: "Korgath Quatro-Braços",
        details: { raca: "Mahok" },
        attributes: { forca: { value: 6, base: 6 } },
        items: [racaMahok, habBracosExtras, claymore1, claymore2],
      });

      assert.equal(obterMaxSlotsMao(mahok4Bracos), 4, "Mahok com Braços Extras possui 4 slots de mão");

      const eq1 = equiparItemSeguramente(mahok4Bracos, "Claymore Mão Direita");
      const eq2 = equiparItemSeguramente(mahok4Bracos, "Claymore Mão Esquerda");

      assert.equal(eq1.sucesso, true);
      assert.equal(eq2.sucesso, true);
      assert.equal(eq1.inapto, false);
      assert.equal(eq2.inapto, false);

      const validacao = validarLimiteMaos(mahok4Bracos);
      assert.equal(validacao.valido, true);
      assert.equal(validacao.maxSlots, 4);
      assert.equal(validacao.slotsOcupados, 4);
      assert.equal(validacao.slotsLivres, 0);
      assert.equal(validacao.armasDuasMaosEquipadas, 2);
      assert.equal(validacao.podeEmpunharDuasArmasDuasMaos, true);
      assert.equal(mahok4Bracos.system.equipamento.limiteMaosExcedido, false);

      // Tentar equipar um 5º slot (ex: Escudo Pequeno) em Mahok com 4/4 ocupados deve bloquear
      const escudoExtra = getEquip("Escudo Pequeno");
      mahok4Bracos.addItem(escudoExtra);
      const eq5 = equiparItemSeguramente(mahok4Bracos, "Escudo Pequeno");
      assert.equal(eq5.sucesso, false, "Mesmo Mahok com Braços Extras não pode exceder 4 slots");
    });
  });

  /* ======================================================================== */
  /* SUB-MÓDULO 5.4: PENALIDADES DE ARMADURAS PESADAS                         */
  /* ======================================================================== */
  describe("Sub-módulo 5.4 — Penalidades de Armaduras Pesadas", () => {
    test("5.4.1 Redução de Dano (RD 1): Aplica RD 1 contra danos físicos corporais/projéteis", () => {
      const armaduraBatalha = getEquip("Armadura de Batalha"); // pesada: true
      const heroi = createMockActor({
        attributes: { forca: { value: 6, base: 6 } },
      });

      // Sem armadura pesada: RD = 0
      assert.equal(heroi.system.defesas.rd.value, 0);
      assert.equal(aplicarReducaoDanoArmaduraPesada(heroi, 10, "corte").danoFinal, 10);

      // Com Armadura Pesada equipada: RD = 1
      equiparItemSeguramente(heroi, armaduraBatalha);
      assert.equal(heroi.system.equipamento.pesadaEquipada, true);
      assert.equal(heroi.system.equipamento.rd, 1);
      assert.equal(heroi.system.defesas.rd.value, 1);

      // Aplica RD 1 contra danos corporais e projéteis
      const danoCorte = aplicarReducaoDanoArmaduraPesada(heroi, 10, "corte");
      assert.equal(danoCorte.rdAplicada, 1);
      assert.equal(danoCorte.danoFinal, 9);

      const danoPerfuracao = aplicarReducaoDanoArmaduraPesada(heroi, 8, "perfuracao");
      assert.equal(danoPerfuracao.rdAplicada, 1);
      assert.equal(danoPerfuracao.danoFinal, 7);

      const danoProjetil = aplicarReducaoDanoArmaduraPesada(heroi, 6, "projetil");
      assert.equal(danoProjetil.rdAplicada, 1);
      assert.equal(danoProjetil.danoFinal, 5);
    });

    test("5.4.2 Anulação de Atletismo: Desativa os benefícios da habilidade Atletismo enquanto a armadura pesada estiver vestida", () => {
      const atletismo = getHab("Atletismo");
      const armaduraCouro = getEquip("Armadura de Couro"); // leve
      const armaduraBatalha = getEquip("Armadura de Batalha"); // pesada

      const heroi = createMockActor({
        attributes: { forca: { value: 6, base: 6 } },
        items: [atletismo, armaduraCouro, armaduraBatalha],
      });

      // Sem armadura: Atletismo concede +2
      assert.equal(obterBonusAtletismo(heroi), 2);
      assert.equal(heroi.system.equipamento.bloqueiaAtletismo, false);

      // Com armadura leve: Atletismo continua ativo (+2)
      equiparItemSeguramente(heroi, "Armadura de Couro");
      assert.equal(obterBonusAtletismo(heroi), 2);
      assert.equal(heroi.system.equipamento.bloqueiaAtletismo, false);

      // Troca para armadura pesada: Atletismo é anulado (0)
      equiparItemSeguramente(heroi, "Armadura de Batalha", { substituir: true });
      assert.equal(heroi.system.equipamento.bloqueiaAtletismo, true);
      assert.equal(obterBonusAtletismo(heroi), 0, "Armadura pesada desativa os benefícios de Atletismo");

      // Desequipa armadura pesada: Atletismo volta a funcionar (+2)
      heroi.equipItem("Armadura de Batalha", false);
      assert.equal(heroi.system.equipamento.bloqueiaAtletismo, false);
      assert.equal(obterBonusAtletismo(heroi), 2);
    });

    test("5.4.3 Restrição de Corrida: Reduz multiplicador de corrida para 3x o Deslocamento (ou 2x se Rígida)", () => {
      // Agilidade 4 -> Deslocamento base = floor(4/2) + 4 = 6m
      const corredor = createMockActor({
        attributes: { forca: { value: 8, base: 8 }, agilidade: { value: 4, base: 4 } },
      });
      assert.equal(corredor.system.subattributes.deslocamento.value, 6);

      // 1. Sem armadura pesada: Corrida = 4x Deslocamento = 24m
      assert.equal(corredor.system.equipamento.fatorCorrida, 4);
      assert.equal(corredor.system.subattributes.corrida.value, 24);

      // 2. Com Armadura Pesada padrão (Armadura de Batalha): Corrida = 3x Deslocamento = 18m
      const armaduraBatalha = getEquip("Armadura de Batalha"); // pesada: true, rigida: false
      equiparItemSeguramente(corredor, armaduraBatalha);
      assert.equal(corredor.system.equipamento.fatorCorrida, 3);
      assert.equal(corredor.system.subattributes.corrida.value, 18);

      // 3. Com Armadura Pesada Rígida (Armadura Completa): Corrida = 2x Deslocamento = 12m
      const armaduraCompleta = getEquip("Armadura Completa"); // pesada: true, rigida: true
      equiparItemSeguramente(corredor, armaduraCompleta, { substituir: true });
      assert.equal(corredor.system.equipamento.pesadaEquipada, true);
      assert.equal(corredor.system.equipamento.rigidaEquipada, true);
      assert.equal(corredor.system.equipamento.fatorCorrida, 2);
      assert.equal(corredor.system.subattributes.corrida.value, 12);
    });
  });

  /* ======================================================================== */
  /* SUB-MÓDULO 5.5: ANULAÇÃO DE BLOQUEIO EM ESCUDOS COM FN INSUFICIENTE      */
  /* ======================================================================== */
  describe("Sub-módulo 5.5 — Anulação de Bloqueio em Escudos com FN Insuficiente", () => {
    test("5.5.1 Perda do Bônus de Bloqueio: Se Força < FN do Escudo, o bônus do escudo é zerado (0%) no Bloqueio Reativo", () => {
      const escudoCorpo = getEquip("Escudo de Corpo"); // FN 5, Defesa +3, subtipo escudo
      assert.equal(escudoCorpo.system.fn, 5);
      assert.equal(escudoCorpo.system.defesa, 3);
      assert.equal(escudoCorpo.system.subtipo, "escudo");

      // Personagem com Força 3 (< FN 5)
      const heroiFraco = createMockActor({
        attributes: { forca: { value: 3, base: 3 }, agilidade: { value: 3, base: 3 } },
      });

      // Bloqueio antes do escudo: 5 (Defesa Base) + 3 (Força) = 8
      assert.equal(heroiFraco.system.defesas.bloqueio.value, 8);

      // Equipa Escudo de Corpo (FN 5 > Força 3)
      const resultadoEq = equiparItemSeguramente(heroiFraco, escudoCorpo);
      assert.equal(resultadoEq.sucesso, true);
      assert.equal(resultadoEq.inapto, true, "Escudo deve ser marcado como inapto");

      // O bônus do escudo no Bloqueio Reativo deve ser 0 (zerado)
      assert.equal(heroiFraco.system.equipamento.bonusEscudo, 0, "Bônus de escudo deve ser 0 quando Força < FN");
      assert.equal(
        heroiFraco.system.defesas.bloqueio.value,
        8,
        "Bloqueio Reativo permanece 8 (5 base + 3 força + 0 escudo)"
      );

      // Quando a Força sobe para 5 (Força >= FN 5), o bônus de +3 passa a somar no Bloqueio Reativo (8 -> 13)
      heroiFraco.system.attributes.forca.base = 5;
      heroiFraco.system.attributes.forca.value = 5;
      heroiFraco.prepareDerivedData();

      assert.equal(heroiFraco.system.equipamento.bonusEscudo, 3, "Com Força 5 >= FN 5, escudo concede +3");
      assert.equal(
        heroiFraco.system.defesas.bloqueio.value,
        13,
        "Bloqueio Reativo passa a ser 5 (Base) + 5 (Força) + 3 (Escudo) = 13"
      );
    });
  });
});
