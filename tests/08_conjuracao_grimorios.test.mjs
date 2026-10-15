/**
 * Bloco 8 — Conjuração, Magias e Grimórios / Itens de Registro
 *
 * Plano de Testes Canônico (Mighty Blade 3ª Edição):
 * - Sub-módulo 8.1: Reduções e Piso de Custo de Mana (8.1.1 Modificadores Foco Mágico -5 PM, Isnuu, Tatuagem de Tohunga -5 PM, piso 1 PM e exceção de Crítico 0 PM)
 * - Sub-módulo 8.2: Dificuldade da Magia e Inaptidão na Conjuração (8.2.1 Asseste Mágico -1, Isnuu -1, Dom da Magia -1, Tatuagem de Tohunga -1; 8.2.2 Inaptidão por Armadura)
 * - Sub-módulo 8.3: Sintonização de Equipamentos Mágicos & Gemas (8.3.1 Runa Pessoal / Selo Simples DV 8, 0 PM; 8.3.2 Trava de Propriedades Mágicas sem sintonização)
 * - Sub-módulo 8.4: Itens de Registro e Grimórios Superiores (8.4.1 Limite de Capacidade por item e INT; 8.4.2 Falha automática sem Canalizador/Registro empunhado)
 * - Sub-módulo 8.5: Símbolos Profanos e Dreno de Vida (8.5.1 Perda automática de PV sem Conhecimento Nefasto e isenção para Aziago)
 */

import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { createMockActor } from "./test-helper.mjs";
import {
  calcularCustoMana,
  calcularDificuldadeMagia,
  verificarInaptidaoConjuracao,
  verificarSintonizacao,
  sintonizarItem,
  executarRitualSintonizacao,
  calcularBonusCerneMagico,
  validarRegistroGrimorio,
  registrarMagiaGrimorio,
  validarConjuracaoMagia,
  calcularCustoSimboloProfano,
  aplicarCustoSimboloProfano,
  DIFICULDADE_SINTONIZACAO,
  CUSTO_PM_SINTONIZACAO,
  REDUCAO_PM_FOCO_MAGICO,
  REDUCAO_PM_TATUAGEM_TOHUNGA,
  REDUCAO_DIFICULDADE_ASSESTE_MAGICO,
  BONUS_DANO_CERNE_ARCANO,
  BONUS_CURA_CERNE_MISTICO,
  CUSTO_PV_SIMBOLO_PROFANO,
  PISO_MINIMO_MANA,
} from "../module/helpers/magia.mjs";

describe("Bloco 8 — Conjuração, Magias e Grimórios / Itens de Registro", () => {

  // =========================================================================
  // SUB-MÓDULO 8.1: REDUÇÕES E PISO DE CUSTO DE MANA
  // =========================================================================
  describe("Sub-módulo 8.1 — Reduções e Piso de Custo de Mana", () => {

    test("8.1.1 — Modificadores de redução (Foco Mágico -5 PM, Isnuu, Tatuagem de Tohunga -5 PM) e Piso Mínimo de 1 PM", () => {
      const bolaDeFogo = {
        name: "Bola de Fogo",
        type: "magia",
        system: { custo: 15, dificuldade: 10 },
      };

      // 1. Custo base sem modificadores
      assert.equal(calcularCustoMana(bolaDeFogo), 15);

      // 2. Foco Mágico (-5 PM via item equipado e sintonizado)
      const orbeFoco = {
        name: "Orbe de Cristal",
        type: "equipamento",
        system: {
          equipado: true,
          sintonizado: true,
          sintonizadoCom: "Merlin",
          propriedades: ["Canalizador", "Foco Mágico"],
        },
      };
      const merlin = createMockActor({
        name: "Merlin",
        details: { classe: "Feiticeiro" },
        items: [orbeFoco],
      });
      assert.equal(
        calcularCustoMana(bolaDeFogo, merlin),
        15 - REDUCAO_PM_FOCO_MAGICO,
        "Foco Mágico sintonizado deve reduzir 5 PM (15 -> 10 PM)"
      );

      // 3. Tatuagem de Tohunga (-5 PM) isolada e acumulada com Foco Mágico (-10 PM total)
      const magiaTatuada = {
        name: "Chama Primordial",
        type: "magia",
        system: { custo: 15, dificuldade: 10, tatuada: true },
      };
      assert.equal(
        calcularCustoMana(magiaTatuada),
        15 - REDUCAO_PM_TATUAGEM_TOHUNGA,
        "Magia tatuada (Tatuagem de Tohunga) reduz 5 PM (15 -> 10 PM)"
      );
      assert.equal(
        calcularCustoMana(magiaTatuada, merlin),
        15 - REDUCAO_PM_FOCO_MAGICO - REDUCAO_PM_TATUAGEM_TOHUNGA,
        "Foco Mágico (-5) + Tatuagem de Tohunga (-5) reduzem 10 PM (15 -> 5 PM)"
      );

      // 4. Piso Mínimo estrito de 1 PM quando as reduções igualam ou superam o custo base
      const magiaLeve = {
        name: "Luz",
        type: "magia",
        system: { custo: 4, dificuldade: 7, tatuada: true },
      };
      assert.equal(
        calcularCustoMana(magiaLeve, merlin, { isnuu: 2 }),
        PISO_MINIMO_MANA,
        "Mesmo com Foco Mágico (-5), Tatuagem de Tohunga (-5) e Isnuu, o piso mínimo de 1 PM é respeitado"
      );

      const magiaCusto5 = {
        name: "Dardo Místico",
        type: "magia",
        system: { custo: 5, dificuldade: 8 },
      };
      assert.equal(
        calcularCustoMana(magiaCusto5, merlin),
        1,
        "5 PM - 5 PM (Foco Mágico) deve respeitar o piso mínimo de 1 PM (nunca 0 PM)"
      );
    });

    test("8.1.2 — Exceção de Sucesso Decisivo / Crítico zera o custo (0 PM) e truques gratuitos permanecem 0 PM", () => {
      const magiaPesada = {
        name: "Tempestade Arcana",
        type: "magia",
        system: { custo: 20, dificuldade: 14 },
      };

      // Sucesso Decisivo escolhendo não gastar mana zera o custo (0 PM), ignorando o piso de 1 PM
      assert.equal(
        calcularCustoMana(magiaPesada, null, { critico: true }),
        0,
        "Sucesso Decisivo / Crítico deve permitir custo 0 PM"
      );
      assert.equal(
        calcularCustoMana(magiaPesada, null, { sucessoDecisivo: true, efeitoCritico: "semMana" }),
        0
      );

      // Se o Sucesso Decisivo escolheu dobrar o dano ('dano'), o custo normal (com piso de 1 PM) é cobrado
      assert.equal(
        calcularCustoMana(magiaPesada, null, { critico: true, efeitoCritico: "dano", focoMagico: true }),
        15
      );

      // Magia originalmente gratuita (0 PM)
      const truque = {
        name: "Prestidigitação",
        type: "magia",
        system: { custo: 0, gratuito: true },
      };
      assert.equal(calcularCustoMana(truque), 0);
    });
  });

  // =========================================================================
  // SUB-MÓDULO 8.2: DIFICULDADE DA MAGIA E INAPTIDÃO NA CONJURAÇÃO
  // =========================================================================
  describe("Sub-módulo 8.2 — Dificuldade da Magia e Inaptidão na Conjuração", () => {

    test("8.2.1 — Cálculo de Dificuldade: Base + Modificadores (Asseste Mágico -1, Isnuu -1, Dom da Magia -1, Tatuagem de Tohunga -1)", () => {
      const magia = {
        name: "Seta de Gelo",
        type: "magia",
        system: { dificuldade: 12, custo: 10 },
      };

      // Base sem modificadores
      assert.equal(calcularDificuldadeMagia(magia), 12);

      // 1. Asseste Mágico (-1) com item equipado e sintonizado
      const varinhaAsseste = {
        name: "Varinha de Teixo",
        type: "equipamento",
        system: {
          equipado: true,
          sintonizado: true,
          sintonizadoCom: "Albus",
          propriedades: ["Canalizador", "Asseste Mágico"],
        },
      };
      const albus = createMockActor({
        name: "Albus",
        details: { classe: "Feiticeiro" },
        items: [varinhaAsseste],
      });
      assert.equal(
        calcularDificuldadeMagia(magia, albus),
        12 - REDUCAO_DIFICULDADE_ASSESTE_MAGICO,
        "Asseste Mágico reduz a Dificuldade em 1 (12 -> 11)"
      );

      // 2. Isnuu (-1)
      const faenIsnuu = createMockActor({
        name: "Nim",
        details: { raca: "Faen", classe: "Feiticeiro" },
        items: [{ name: "Isnuu", type: "habilidade" }],
      });
      assert.equal(calcularDificuldadeMagia(magia, faenIsnuu), 11, "Isnuu reduz a Dificuldade em 1 (12 -> 11)");

      // 3. Dom da Magia (-1)
      const elfoDom = createMockActor({
        name: "Eldrin",
        details: { raca: "Elfo", classe: "Feiticeiro" },
        items: [{ name: "Dom da Magia", type: "habilidade" }],
      });
      assert.equal(calcularDificuldadeMagia(magia, elfoDom), 11, "Dom da Magia reduz a Dificuldade em 1 (12 -> 11)");

      // 4. Tatuagem de Tohunga (-1)
      const magiaTatuada = {
        name: "Seta de Gelo",
        type: "magia",
        system: { dificuldade: 12, custo: 10, tatuada: true },
      };
      assert.equal(
        calcularDificuldadeMagia(magiaTatuada),
        11,
        "Tatuagem de Tohunga reduz a Dificuldade em 1 (12 -> 11)"
      );

      // 5. Acúmulo completo dos 4 modificadores (-4 total: 12 -> 8)
      const arquimagoTohunga = createMockActor({
        name: "Albus",
        details: { raca: "Faen", classe: "Feiticeiro", caminho: "Tohunga" },
        items: [
          varinhaAsseste,
          { name: "Isnuu", type: "habilidade" },
          { name: "Dom da Magia", type: "habilidade" },
        ],
      });
      assert.equal(
        calcularDificuldadeMagia(magiaTatuada, arquimagoTohunga),
        8,
        "Acúmulo de Asseste Mágico (-1) + Isnuu (-1) + Dom da Magia (-1) + Tatuagem de Tohunga (-1) reduz de 12 para 8"
      );
    });

    test("8.2.2 — Inaptidão por Armadura: conjurar trajando armadura corporal sem treino impõe Inaptidão", () => {
      const armaduraCouro = {
        name: "Armadura de Couro",
        type: "armadura",
        system: { subtipo: "armadura", defesa: 1, fn: 2, equipado: true },
      };

      // Feiticeiro sem treino trajando armadura corporal fica Inapto
      const feiticeiroEmArmadura = createMockActor({
        name: "Raistlin",
        details: { classe: "Feiticeiro" },
        attributes: { forca: 2, inteligencia: 5 },
        items: [armaduraCouro],
      });
      const checkInapto = verificarInaptidaoConjuracao(feiticeiroEmArmadura);
      assert.equal(checkInapto.inapto, true, "Feiticeiro em armadura corporal sem treino deve ficar Inapto");
      assert.match(checkInapto.motivo, /sem treino\/habilidade mágica apropriada/i);

      // Escudo NÃO é armadura corporal e não impõe Inaptidão
      const escudo = {
        name: "Broquel",
        type: "armadura",
        system: { subtipo: "escudo", defesa: 1, fn: 1, equipado: true },
      };
      const feiticeiroComEscudo = createMockActor({
        name: "Mago Defensivo",
        details: { classe: "Feiticeiro" },
        attributes: { forca: 2, inteligencia: 5 },
        items: [escudo],
      });
      assert.equal(verificarInaptidaoConjuracao(feiticeiroComEscudo).inapto, false);

      // Classes com treino integrado (Rúnico e Paladino) ou habilidade 'Armadura Fiel' conjuram sem Inaptidão
      const runico = createMockActor({
        name: "Torvald",
        details: { classe: "Rúnico" },
        attributes: { forca: 4, inteligencia: 4 },
        items: [armaduraCouro],
      });
      assert.equal(verificarInaptidaoConjuracao(runico).inapto, false);

      const necromanteArmaduraFiel = createMockActor({
        name: "Kael",
        details: { classe: "Necromante" },
        attributes: { forca: 3, inteligencia: 5 },
        items: [armaduraCouro, { name: "Armadura Fiel", type: "habilidade" }],
      });
      assert.equal(verificarInaptidaoConjuracao(necromanteArmaduraFiel).inapto, false);

      // Mesmo com treino, se Força < FN da armadura, fica Inapto
      const armaduraPesada = {
        name: "Armadura Completa",
        type: "armadura",
        system: { subtipo: "armadura", defesa: 4, fn: 6, equipado: true },
      };
      const runicoSemForca = createMockActor({
        name: "Rúnico Fraco",
        details: { classe: "Rúnico" },
        attributes: { forca: 3, inteligencia: 4 },
        items: [armaduraPesada],
      });
      const checkFN = verificarInaptidaoConjuracao(runicoSemForca);
      assert.equal(checkFN.inapto, true);
      assert.match(checkFN.motivo, /Força insuficiente/i);
    });
  });

  // =========================================================================
  // SUB-MÓDULO 8.3: SINTONIZAÇÃO DE EQUIPAMENTOS MÁGICOS & GEMAS
  // =========================================================================
  describe("Sub-módulo 8.3 — Sintonização de Equipamentos Mágicos & Gemas", () => {

    test("8.3.1 — Ritual de Sintonização: Runa Pessoal (Arcana) e Selo Simples (Mística) com Dificuldade 8 e 0 PM", () => {
      const cetroArcano = {
        name: "Cetro de Safira",
        type: "equipamento",
        system: {
          sintonizado: false,
          propriedades: ["Canalizador", "Asseste Mágico", "Foco Mágico"],
        },
      };
      const mago = createMockActor({
        name: "Vahn",
        details: { classe: "Feiticeiro" },
      });

      const infoArcana = verificarSintonizacao(cetroArcano, mago);
      assert.equal(infoArcana.dificuldade, DIFICULDADE_SINTONIZACAO);
      assert.equal(infoArcana.dificuldade, 8, "Dificuldade canônica de sintonização deve ser 8");
      assert.equal(infoArcana.custoPM, CUSTO_PM_SINTONIZACAO);
      assert.equal(infoArcana.custoPM, 0, "Custo de PM da sintonização deve ser 0 PM");
      assert.equal(infoArcana.metodo, "Runa Pessoal");

      // Falha no ritual (rolagem 7 < DV 8) mantém o item não sintonizado
      const tentativaFalha = executarRitualSintonizacao(cetroArcano, mago, { totalRolado: 7 });
      assert.equal(tentativaFalha.sucesso, false);
      assert.equal(tentativaFalha.sintonizado, false);
      assert.equal(tentativaFalha.custoPM, 0);

      // Sucesso no ritual (rolagem 8 >= DV 8) sintoniza o item com o portador
      const tentativaSucesso = executarRitualSintonizacao(cetroArcano, mago, { totalRolado: 8 });
      assert.equal(tentativaSucesso.sucesso, true);
      assert.equal(tentativaSucesso.sintonizado, true);
      assert.equal(tentativaSucesso.custoPM, 0);

      // Conjurador Místico utiliza Selo Simples (DV 8, 0 PM)
      const simboloSagrado = {
        name: "Relíquia Solar",
        type: "equipamento",
        system: { sintonizado: false, propriedades: ["Canalizador", "Cerne Místico"] },
      };
      const sacerdote = createMockActor({
        name: "Elion",
        details: { classe: "Sacerdote" },
      });
      const infoMistica = verificarSintonizacao(simboloSagrado, sacerdote);
      assert.equal(infoMistica.metodo, "Selo Simples");
      assert.equal(infoMistica.dificuldade, 8);
      assert.equal(infoMistica.custoPM, 0);
    });

    test("8.3.2 — Trava de Propriedades Mágicas: Asseste Mágico, Cerne Arcano e Foco Mágico não ativam sem sintonização pelo portador atual", () => {
      const cajadoMagico = {
        name: "Cajado das Três Gemas",
        type: "arma",
        system: {
          equipado: true,
          sintonizado: false,
          propriedades: ["Canalizador", "Asseste Mágico", "Cerne Arcano", "Foco Mágico"],
        },
      };

      const portadorAtual = createMockActor({
        name: "Lyra",
        details: { classe: "Feiticeiro" },
        items: [cajadoMagico],
      });

      const magia = {
        name: "Raio Arcano",
        type: "magia",
        system: { custo: 12, dificuldade: 10 },
      };

      // 1. Não sintonizado: todas as 3 gemas ficam inativas
      const statusDesintonizado = verificarSintonizacao(cajadoMagico, portadorAtual);
      assert.equal(statusDesintonizado.sintonizado, false);
      assert.deepEqual(statusDesintonizado.propriedadesInativas, [
        "Asseste Mágico",
        "Cerne Arcano",
        "Foco Mágico",
      ]);
      assert.equal(calcularCustoMana(magia, portadorAtual), 12, "Foco Mágico inativo não reduz Mana");
      assert.equal(calcularDificuldadeMagia(magia, portadorAtual), 10, "Asseste Mágico inativo não reduz Dificuldade");
      assert.equal(calcularBonusCerneMagico(portadorAtual).bonusDano, 0, "Cerne Arcano inativo não concede +5 de dano");

      // 2. Sintonizado com OUTRO portador: continua bloqueado para Lyra
      cajadoMagico.system.sintonizado = true;
      cajadoMagico.system.sintonizadoCom = "Arquimago Antigo";
      const statusOutroPortador = verificarSintonizacao(cajadoMagico, portadorAtual);
      assert.equal(statusOutroPortador.sintonizado, false, "Sintonização de outro portador não vale para o portador atual");
      assert.equal(calcularCustoMana(magia, portadorAtual), 12);
      assert.equal(calcularDificuldadeMagia(magia, portadorAtual), 10);
      assert.equal(calcularBonusCerneMagico(portadorAtual).bonusDano, 0);

      // 3. Sintonizado pelo portador atual (Lyra): ativa Asseste Mágico (-1 DV), Foco Mágico (-5 PM) e Cerne Arcano (+5 Dano)
      sintonizarItem(cajadoMagico, portadorAtual);
      const statusSintonizado = verificarSintonizacao(cajadoMagico, portadorAtual);
      assert.equal(statusSintonizado.sintonizado, true);
      assert.equal(statusSintonizado.propriedadesInativas.length, 0);
      assert.equal(calcularCustoMana(magia, portadorAtual), 7, "Foco Mágico ativo reduz 12 -> 7 PM");
      assert.equal(calcularDificuldadeMagia(magia, portadorAtual), 9, "Asseste Mágico ativo reduz DV 10 -> 9");
      assert.equal(
        calcularBonusCerneMagico(portadorAtual).bonusDano,
        BONUS_DANO_CERNE_ARCANO,
        "Cerne Arcano ativo concede +5 de dano mágico"
      );
      assert.equal(BONUS_CURA_CERNE_MISTICO, 5);
    });
  });

  // =========================================================================
  // SUB-MÓDULO 8.4: ITENS DE REGISTRO E GRIMÓRIOS SUPERIORES
  // =========================================================================
  describe("Sub-módulo 8.4 — Itens de Registro e Grimórios Superiores", () => {

    test("8.4.1 — Limite de Capacidade: respeita limite de magias gravadas pela capacidade do item e Inteligência do conjurador", () => {
      const magoInt4 = createMockActor({
        name: "Telas",
        details: { classe: "Feiticeiro" },
        attributes: { inteligencia: 4 },
      });

      // 1. Grimório padrão escala com INT * 2 (4 * 2 = 8 magias)
      const grimorioPadrao = {
        name: "Grimório de Couro",
        type: "equipamento",
        system: { propriedades: ["Canalizador", "Registro"], equipado: true, magiasRegistradas: [] },
      };
      const checkPadrao = validarRegistroGrimorio(grimorioPadrao, ["M1", "M2", "M3"], magoInt4);
      assert.equal(checkPadrao.capacidadeMaxima, 8);
      assert.equal(checkPadrao.magiasRegistradas, 3);
      assert.equal(checkPadrao.espacoLivre, 5);
      assert.equal(checkPadrao.valido, true);

      // 2. Grimório Superior (capacidade explícita ou multiplicador superior)
      const grimorioSuperior = {
        name: "Grimório Superior de Cristal",
        type: "equipamento",
        system: {
          capacidade: 12,
          propriedades: ["Canalizador", "Registro"],
          equipado: true,
        },
      };
      const checkSuperior = validarRegistroGrimorio(grimorioSuperior, [], magoInt4);
      assert.equal(checkSuperior.capacidadeMaxima, 12);

      // 3. Bloqueio ao exceder o limite de magias gravadas
      const grimorioCompacto = {
        name: "Grimório de Bolso",
        type: "equipamento",
        system: {
          capacidade: 2,
          propriedades: ["Canalizador", "Registro"],
          equipado: true,
          magiasRegistradas: [],
        },
      };
      registrarMagiaGrimorio(grimorioCompacto, "Míssil Mágico", magoInt4);
      registrarMagiaGrimorio(grimorioCompacto, "Escudo Arcano", magoInt4);
      assert.equal(grimorioCompacto.system.magiasRegistradas.length, 2);

      assert.throws(() => {
        registrarMagiaGrimorio(grimorioCompacto, "Bola de Fogo", magoInt4);
      }, /Capacidade máxima de magias do grimório excedida/i);
    });

    test("8.4.2 — Exigência de Item Canalizador/Registro: magias com propriedade Registro ou Canalizador falham automaticamente sem o item empunhado", () => {
      const magiaRegistro = {
        name: "Runa Explosiva Maior",
        type: "magia",
        system: {
          custo: 10,
          dificuldade: 11,
          propriedades: ["Registro"],
          requerRegistro: true,
        },
      };

      const grimorio = {
        name: "Grimório Arcano",
        type: "equipamento",
        system: {
          propriedades: ["Canalizador", "Registro"],
          equipado: false, // Guardado na mochila (NÃO empunhado)
          magiasRegistradas: ["Runa Explosiva Maior"],
        },
      };

      const mago = createMockActor({
        name: "Merlin",
        details: { classe: "Feiticeiro" },
        attributes: { inteligencia: 5 },
        items: [grimorio],
      });

      // Com o grimório guardado (equipado: false), a conjuração falha automaticamente
      const checkSemEmpunhar = validarConjuracaoMagia(magiaRegistro, mago);
      assert.equal(checkSemEmpunhar.podeConjurar, false);
      assert.equal(checkSemEmpunhar.falhaAutomatica, true);
      assert.match(checkSemEmpunhar.motivo, /Falha automática na conjuração.*exige um item com a propriedade Registro empunhado/i);

      const checkGrimorioGuardado = validarRegistroGrimorio(grimorio, grimorio.system.magiasRegistradas, mago);
      assert.equal(checkGrimorioGuardado.empunhado, false);
      assert.equal(checkGrimorioGuardado.podeConjurar, false);

      // Ao empunhar o grimório (equipado: true), a conjuração passa a ser permitida
      grimorio.system.equipado = true;
      const checkEmpunhado = validarConjuracaoMagia(magiaRegistro, mago);
      assert.equal(checkEmpunhado.podeConjurar, true);
      assert.equal(checkEmpunhado.falhaAutomatica, false);
      assert.equal(checkEmpunhado.itemUtilizado.name, "Grimório Arcano");
    });
  });

  // =========================================================================
  // SUB-MÓDULO 8.5: SÍMBOLOS PROFANOS E DRENO DE VIDA
  // =========================================================================
  describe("Sub-módulo 8.5 — Símbolos Profanos e Dreno de Vida", () => {

    test("8.5.1 — Perda de PV sem Conhecimento Nefasto: desenhar Símbolos Profanos desconta PVs automaticamente exceto para Aziago com Conhecimento Nefasto", async () => {
      const simboloProfano = {
        name: "Símbolo da Ruína",
        type: "magia",
        system: { custo: 10, dificuldade: 10, custoPV: 5 },
      };

      // 1. Conjurador sem Conhecimento Nefasto sofre perda automática de 5 PV
      const conjuradorSemNefasto = createMockActor({
        name: "Cultista Novato",
        details: { classe: "Feiticeiro" },
        resources: { vida: { value: 60, max: 60 } },
        items: [],
      });

      const calculoSemNefasto = calcularCustoSimboloProfano(conjuradorSemNefasto, simboloProfano);
      assert.equal(calculoSemNefasto.temConhecimentoNefasto, false);
      assert.equal(calculoSemNefasto.perdaPV, CUSTO_PV_SIMBOLO_PROFANO);
      assert.equal(calculoSemNefasto.perdaPV, 5);
      assert.equal(calculoSemNefasto.vidaRestante, 55);

      await aplicarCustoSimboloProfano(conjuradorSemNefasto, simboloProfano);
      assert.equal(
        conjuradorSemNefasto.system.resources.vida.value,
        55,
        "Deve descontar 5 PV diretamente da Vida do personagem (60 -> 55 PV)"
      );

      // 2. Aziago com a habilidade Conhecimento Nefasto é isento da perda de PV (0 PV perdidos)
      const aziagoNefasto = createMockActor({
        name: "Malakor",
        details: { classe: "Feiticeiro", caminho: "Aziago" },
        resources: { vida: { value: 60, max: 60 } },
        items: [{ name: "Conhecimento Nefasto", type: "habilidade" }],
      });

      const calculoComNefasto = calcularCustoSimboloProfano(aziagoNefasto, simboloProfano);
      assert.equal(calculoComNefasto.temConhecimentoNefasto, true);
      assert.equal(calculoComNefasto.perdaPV, 0);
      assert.equal(calculoComNefasto.vidaRestante, 60);

      await aplicarCustoSimboloProfano(aziagoNefasto, simboloProfano);
      assert.equal(aziagoNefasto.system.resources.vida.value, 60, "Vida permanece intacta em 60 PV");
    });
  });
});
