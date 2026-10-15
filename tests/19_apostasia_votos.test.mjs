/**
 * Suíte de Testes Automatizados - Subtítulo 19: Sistema de Apostasia, Abandono de Votos e Código Sagrado
 * Mighty Blade 3ª Edição (Foundry VTT v14)
 *
 * Casos Canônicos Cobertos:
 * - Caso 70: Processamento de Apostasia e Abandono de Votos/Códigos (processarApostasia)
 *   * Sacerdotes: perda imediata de Punições e Magias Místicas do patrono.
 *   * Dracomantes: perda imediata de Mitos dracônicos e Magias Místicas do patrono.
 *   * Paladinos: perda imediata de Punições e Código Sagrado abandonado.
 *   * Marcação estrita do ator (apostata: true, votoAbandonado: true).
 *   * Habilidades mundanas/marciais permanecem funcionais e intocadas.
 * - Caso 71: Validação de Habilidade de Apóstata e Canalização da Perda de Fé (validarHabilidadeApostata)
 *   * Pré-requisito estrito: "Ter abandonado um Voto".
 *   * Devoto fiel sem abandono é barrado.
 *   * Canalização da perda de fé como Resistência Pura (+2 RD).
 *   * Canalização da perda de fé como Resistência Mágica (+2 RM).
 * - Caso 72: Incompatibilidade Religiosa-Profana Estrita (validarIncompatibilidadeReligiosaProfana)
 *   * Pacto Infernal bloqueia estritamente aquisição de Dogma ou Conhecimento Místico.
 *   * Devoto com Dogma ou Conhecimento Místico é bloqueado de realizar Pacto Infernal.
 *   * Apóstata que abandonou sua fé sagrada pode abraçar Pactos Infernais.
 *   * Habilidades arcanas e mundanas não sofrem bloqueio religioso.
 * - Caso 73: Resiliência, Idempotência e Casos de Borda
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  createMockActor,
  processarApostasia,
  validarHabilidadeApostata,
  aplicarCanalizacaoApostata,
  validarIncompatibilidadeReligiosaProfana,
  podeConjurarMagiaOuHabilidade,
  CLASSES_RELIGIOSAS_CANONICAS,
  TIPOS_CANALIZACAO_APOSTATA,
  BONUS_CANALIZACAO_RESISTENCIA,
} from "./test-helper.mjs";

// ============================================================================
// CASO 70: PROCESSAMENTO DE APOSTASIA E ABANDONO DE VOTOS E CÓDIGOS SAGRADOS
// ============================================================================
test("Caso 70: Processamento de Apostasia e Abandono de Votos/Códigos (processarApostasia)", async (t) => {
  await t.test("70.1 - Sacerdote: Perda imediata da capacidade de conjurar Punições e Magias Místicas", () => {
    const sacerdote = createMockActor({
      name: "Sacerdote Hadorniano",
      details: {
        classe: "Sacerdote",
        caminho: "Sacerdote",
      },
      items: [
        {
          id: "item-dogma",
          name: "Dogma da Fé",
          type: "habilidade",
          system: { tipo: "dogma", patrono: "Hadorn" },
        },
        {
          id: "item-punicao-1",
          name: "Punição da Execução",
          type: "habilidade",
          system: { tipo: "punicao", capacidadeConjuracao: true },
        },
        {
          id: "item-magia-mistica",
          name: "Cura Mística",
          type: "magia",
          system: { escola: "mistica", capacidadeConjuracao: true, patrono: "Hadorn" },
        },
        {
          id: "item-golpe",
          name: "Golpe Poderoso",
          type: "habilidade",
          system: { tipo: "combate" },
        },
      ],
    });

    const punicaoAntes = sacerdote.items.find((i) => i.id === "item-punicao-1");
    const magiaAntes = sacerdote.items.find((i) => i.id === "item-magia-mistica");
    assert.equal(punicaoAntes.system.capacidadeConjuracao, true);
    assert.equal(magiaAntes.system.capacidadeConjuracao, true);

    // Processa a apostasia do sacerdote contra seu patrono Hadorn
    const res = processarApostasia(sacerdote, "Hadorn");

    assert.equal(res.sucesso, true);
    assert.equal(res.apostata, true);
    assert.equal(res.votoAbandonado, true);
    assert.equal(sacerdote.system.apostata, true);
    assert.equal(sacerdote.system.votoAbandonado, true);

    // Itens religiosos devem estar revogados e incapacitados de conjurar
    const dogmaApos = sacerdote.items.find((i) => i.id === "item-dogma");
    const punicaoApos = sacerdote.items.find((i) => i.id === "item-punicao-1");
    const magiaApos = sacerdote.items.find((i) => i.id === "item-magia-mistica");
    const golpeApos = sacerdote.items.find((i) => i.id === "item-golpe");

    assert.equal(dogmaApos.system.revogado, true);
    assert.equal(dogmaApos.system.abandonado, true);

    assert.equal(punicaoApos.system.revogado, true);
    assert.equal(punicaoApos.system.capacidadeConjuracao, false);
    assert.equal(punicaoApos.system.inaptoConjuracao, true);

    assert.equal(magiaApos.system.revogado, true);
    assert.equal(magiaApos.system.capacidadeConjuracao, false);
    assert.equal(magiaApos.system.inaptoConjuracao, true);

    // Habilidade secular de combate permanece intocada
    assert.equal(golpeApos.system.revogado, undefined);
    assert.equal(golpeApos.system.capacidadeConjuracao, undefined);
  });

  await t.test("70.2 - Dracomante: Perda imediata de Mitos dracônicos e Magias Místicas ao romper com patrono", () => {
    const dracomante = createMockActor({
      name: "Dracomante Vermelho",
      details: {
        classe: "Dracomante",
      },
      items: [
        {
          id: "item-mito-1",
          name: "Mito do Dragão Dourado",
          type: "habilidade",
          system: { subtipo: "mito", patrono: "Aurora dos Dragões" },
        },
        {
          id: "item-magia-draconica",
          name: "Sopro Místico",
          type: "magia",
          system: { escola: "mistica", patrono: "Dragão Vermelho" },
        },
        {
          id: "item-visao",
          name: "Visão no Escuro",
          type: "habilidade",
          system: { tipo: "suporte" },
        },
      ],
    });

    const res = processarApostasia(dracomante, "Dragão Vermelho");

    assert.equal(res.sucesso, true);
    assert.equal(res.apostata, true);
    assert.equal(dracomante.system.apostata, true);
    assert.equal(dracomante.system.votoAbandonado, true);

    const mitoApos = dracomante.items.find((i) => i.id === "item-mito-1");
    const magiaApos = dracomante.items.find((i) => i.id === "item-magia-draconica");
    const visaoApos = dracomante.items.find((i) => i.id === "item-visao");

    assert.equal(mitoApos.system.revogado, true);
    assert.equal(mitoApos.system.capacidadeConjuracao, false);

    assert.equal(magiaApos.system.revogado, true);
    assert.equal(magiaApos.system.capacidadeConjuracao, false);

    assert.equal(visaoApos.system.revogado, undefined);
  });

  await t.test("70.3 - Paladino: Abandono de Código Sagrado revoga Códigos e Punições", () => {
    const paladino = createMockActor({
      name: "Paladino Caído",
      details: {
        classe: "Paladino",
      },
      items: [
        {
          id: "item-codigo",
          name: "Código da Coragem",
          type: "habilidade",
          system: { tipo: "codigo" },
        },
        {
          id: "item-punicao-2",
          name: "Punição do Silêncio",
          type: "habilidade",
          system: { tipo: "punicao" },
        },
        {
          id: "item-defesa",
          name: "Bloqueio com Escudo",
          type: "habilidade",
          system: { tipo: "reacao" },
        },
      ],
    });

    const res = paladino.processarApostasia("Código da Coragem");

    assert.equal(res.sucesso, true);
    assert.equal(paladino.system.apostata, true);
    assert.equal(paladino.system.votoAbandonado, true);

    const codigoApos = paladino.items.find((i) => i.id === "item-codigo");
    const punicaoApos = paladino.items.find((i) => i.id === "item-punicao-2");
    const defesaApos = paladino.items.find((i) => i.id === "item-defesa");

    assert.equal(codigoApos.system.revogado, true);
    assert.equal(codigoApos.system.abandonado, true);
    assert.equal(punicaoApos.system.revogado, true);
    assert.equal(punicaoApos.system.capacidadeConjuracao, false);
    assert.equal(defesaApos.system.revogado, undefined);
  });

  await t.test("70.4 - Histórico e Flags de Apostasia no Foundry VTT", () => {
    const devoto = createMockActor({
      name: "Irmão Renegado",
      details: { classe: "Sacerdote" },
      items: [
        { id: "dogma", name: "Dogma da Justiça", type: "habilidade", system: { tipo: "dogma" } },
      ],
    });

    const res = processarApostasia(devoto, "Mirah");
    assert.equal(devoto.getFlag("mighty-blade", "apostata"), true);
    assert.equal(devoto.getFlag("mighty-blade", "votoAbandonado"), true);
    assert.equal(devoto.system.detalhesApostasia.patronoOuVoto, "Mirah");
    assert.ok(Array.isArray(devoto.system.detalhesApostasia.habilidadesRevogadas));
    assert.ok(devoto.system.detalhesApostasia.habilidadesRevogadas.includes("Dogma da Justiça"));
  });

  await t.test("70.5 - Consulta de conjuração via podeConjurarMagiaOuHabilidade", () => {
    const apostata = createMockActor({
      name: "Apóstata",
      details: { classe: "Sacerdote" },
      items: [
        { id: "punicao", name: "Punição da Execução", type: "habilidade", system: { tipo: "punicao" } },
        { id: "magia", name: "Luz Sagrada", type: "magia", system: { escola: "mistica" } },
        { id: "arcana", name: "Mísseis de Energia", type: "magia", system: { escola: "arcana" } },
        { id: "marcial", name: "Ataque Preciso", type: "habilidade", system: { tipo: "combate" } },
      ],
    });

    // Antes da apostasia: pode conjurar normalmente
    assert.equal(podeConjurarMagiaOuHabilidade(apostata, "Punição da Execução").permitido, true);
    assert.equal(podeConjurarMagiaOuHabilidade(apostata, "Luz Sagrada").permitido, true);

    // Processa apostasia
    processarApostasia(apostata, "Panteão");

    // Após apostasia: Punição e Magia Mística são estritamente bloqueadas
    const testePunicao = podeConjurarMagiaOuHabilidade(apostata, "Punição da Execução");
    assert.equal(testePunicao.permitido, false);
    assert.ok(testePunicao.motivo.length > 0);

    const testeMagia = podeConjurarMagiaOuHabilidade(apostata, "Luz Sagrada");
    assert.equal(testeMagia.permitido, false);
    assert.ok(testeMagia.motivo.length > 0);

    // Magia arcana e habilidade de combate permanecem permitidas
    assert.equal(podeConjurarMagiaOuHabilidade(apostata, "Mísseis de Energia").permitido, true);
    assert.equal(podeConjurarMagiaOuHabilidade(apostata, "Ataque Preciso").permitido, true);
  });
});

// ============================================================================
// CASO 71: VALIDAÇÃO DE HABILIDADE DE APÓSTATA E CANALIZAÇÃO DE PERDA DE FÉ
// ============================================================================
test("Caso 71: Validação de Habilidade de Apóstata e Canalização da Perda de Fé (validarHabilidadeApostata)", async (t) => {
  await t.test("71.1 - Rejeição estrita para devoto fiel sem abandono de voto", () => {
    const devotoFiel = createMockActor({
      name: "Clérigo Nobre",
      details: { classe: "Sacerdote" },
      items: [
        { id: "dogma", name: "Dogma", type: "habilidade", system: { tipo: "dogma" } },
      ],
    });

    const validacao = validarHabilidadeApostata(devotoFiel);
    assert.equal(validacao.permitido, false);
    assert.equal(validacao.valido, false);
    assert.ok(validacao.motivo.includes("Pré-requisito não atendido"));
    assert.equal(validacao.bonusRD, 0);
  });

  await t.test("71.2 - Aprovação com sucesso para personagem com voto abandonado", () => {
    const renegado = createMockActor({
      name: "Guerreiro Renegado",
      system: {
        votoAbandonado: true,
      },
    });

    const validacao = validarHabilidadeApostata(renegado);
    assert.equal(validacao.permitido, true);
    assert.equal(validacao.valido, true);
    assert.equal(validacao.motivo, null);
    assert.equal(validacao.canalizacaoDisponivel, true);
    assert.equal(validacao.bonusRD, BONUS_CANALIZACAO_RESISTENCIA);
    assert.equal(validacao.resistenciaMagica, BONUS_CANALIZACAO_RESISTENCIA);
  });

  await t.test("71.3 - Canalização da perda de fé como Resistência Pura (+2 RD)", () => {
    const paladinoApostata = createMockActor({
      name: "Ex-Paladino",
      details: { classe: "Paladino" },
      items: [
        {
          id: "cota-malha",
          name: "Cota de Malha",
          type: "armadura",
          system: { equipado: true, pesada: true },
        },
        { id: "cod", name: "Código da Coragem", type: "habilidade", system: { tipo: "codigo" } },
      ],
    });

    // Processa a apostasia
    paladinoApostata.processarApostasia("Código da Coragem");
    assert.equal(paladinoApostata.system.votoAbandonado, true);

    // Aplica canalização de resistência pura em RD
    const resCanalizacao = aplicarCanalizacaoApostata(paladinoApostata, "rd");
    assert.equal(resCanalizacao.sucesso, true);
    assert.equal(resCanalizacao.tipo, "rd");
    assert.equal(resCanalizacao.valor, 2);
    assert.equal(resCanalizacao.rdAnterior, 1);
    assert.equal(resCanalizacao.rdAtual, 3, "RD total deve ser 3 (1 inicial + 2 de canalização pura)");
    assert.equal(paladinoApostata.system.defesas.rd.value, 3);
  });

  await t.test("71.4 - Canalização da perda de fé como Resistência Mágica (+2 RM)", () => {
    const sacerdoteApostata = createMockActor({
      name: "Sacerdote Herético",
      details: { classe: "Sacerdote" },
      system: {
        votoAbandonado: true,
        apostata: true,
      },
    });

    const res = aplicarCanalizacaoApostata(sacerdoteApostata, "resistenciaMagica");
    assert.equal(res.sucesso, true);
    assert.equal(res.tipo, TIPOS_CANALIZACAO_APOSTATA.RESISTENCIA_MAGICA);
    assert.equal(res.valor, 2);
    assert.equal(res.resistenciaMagicaAtual, 2);
    assert.equal(sacerdoteApostata.system.resistenciaMagica, 2);
  });

  await t.test("71.5 - Tentativa de aplicar canalização sem cumprir pré-requisito falha", () => {
    const atorComum = createMockActor({
      name: "Plebeu",
      system: { votoAbandonado: false, apostata: false },
    });

    const res = aplicarCanalizacaoApostata(atorComum, "rd");
    assert.equal(res.sucesso, false);
    assert.ok(res.motivo.includes("Pré-requisito não atendido"));
    assert.equal(atorComum.system.defesas.rd?.value ?? 0, 0);
  });
});

// ============================================================================
// CASO 72: INCOMPATIBILIDADE RELIGIOSA-PROFANA ESTRITA
// ============================================================================
test("Caso 72: Incompatibilidade Religiosa-Profana Estrita (validarIncompatibilidadeReligiosaProfana)", async (t) => {
  await t.test("72.1 - Personagem com Pacto Infernal é bloqueado de adquirir Dogma", () => {
    const cultista = createMockActor({
      name: "Cultista Fanático",
      details: { caminho: "Cultista" },
      items: [
        { id: "pacto-1", name: "Pacto da Loucura", type: "habilidade", system: { tipo: "pacto" } },
      ],
    });

    const checagem = validarIncompatibilidadeReligiosaProfana(cultista, "Dogma da Fé");
    assert.equal(checagem.permitido, false);
    assert.equal(checagem.bloqueado, true);
    assert.ok(checagem.motivo.includes("Incompatibilidade Religiosa-Profana"));
    assert.ok(checagem.motivo.includes("Pacto Infernal"));
  });

  await t.test("72.2 - Personagem com Pacto Infernal é bloqueado de adquirir Conhecimento Místico ou classe Sacerdote", () => {
    const cultista = createMockActor({
      name: "Servo do Abismo",
      items: [
        { id: "pacto-2", name: "Pacto da Escuridão", type: "habilidade", system: { tipo: "pacto" } },
      ],
    });

    const checagemMistico = validarIncompatibilidadeReligiosaProfana(cultista, "Conhecimento Místico");
    assert.equal(checagemMistico.permitido, false);
    assert.equal(checagemMistico.bloqueado, true);

    const checagemSacerdote = validarIncompatibilidadeReligiosaProfana(cultista, "Sacerdote");
    assert.equal(checagemSacerdote.permitido, false);
    assert.equal(checagemSacerdote.bloqueado, true);
  });

  await t.test("72.3 - Devoto com Dogma ativo é bloqueado de realizar Pacto Infernal", () => {
    const clérigo = createMockActor({
      name: "Devoto Sagrado",
      details: { classe: "Sacerdote" },
      items: [
        { id: "dogma", name: "Dogma", type: "habilidade", system: { tipo: "dogma" } },
      ],
    });

    const checagemPacto = validarIncompatibilidadeReligiosaProfana(clérigo, "Pacto da Loucura");
    assert.equal(checagemPacto.permitido, false);
    assert.equal(checagemPacto.bloqueado, true);
    assert.ok(checagemPacto.motivo.includes("Dogma ou Conhecimento Místico ativo"));
  });

  await t.test("72.4 - Devoto com Conhecimento Místico ativo é bloqueado de realizar Pacto Infernal", () => {
    const xama = createMockActor({
      name: "Xamã Sagrado",
      items: [
        { id: "cm", name: "Conhecimento Místico", type: "habilidade" },
      ],
    });

    const checagem = validarIncompatibilidadeReligiosaProfana(xama, "Pacto da Pestilência");
    assert.equal(checagem.permitido, false);
    assert.equal(checagem.bloqueado, true);
  });

  await t.test("72.5 - Apóstata que abandonou formalmente Dogmas e Fé Sagrada pode abraçar Pacto Infernal", () => {
    const exSacerdote = createMockActor({
      name: "Ex-Sacerdote",
      details: { classe: "Sacerdote" },
      items: [
        { id: "dogma", name: "Dogma", type: "habilidade", system: { tipo: "dogma" } },
      ],
    });

    // Antes da apostasia: bloqueado
    assert.equal(validarIncompatibilidadeReligiosaProfana(exSacerdote, "Pacto da Ambição").permitido, false);

    // Formaliza a apostasia
    processarApostasia(exSacerdote, "Hadorn");
    assert.equal(exSacerdote.system.apostata, true);

    // Agora, os dogmas foram rompidos/abandonados: o Pacto Infernal é permitido!
    const checagemApos = validarIncompatibilidadeReligiosaProfana(exSacerdote, "Pacto da Ambição");
    assert.equal(checagemApos.permitido, true);
    assert.equal(checagemApos.bloqueado, false);
    assert.equal(checagemApos.motivo, null);
  });

  await t.test("72.6 - Habilidades mundanas e arcanas não geram incompatibilidade religiosa", () => {
    const guerreiro = createMockActor({
      name: "Mercenário",
      details: { classe: "Guerreiro" },
    });

    assert.equal(validarIncompatibilidadeReligiosaProfana(guerreiro, "Golpe Poderoso").permitido, true);
    assert.equal(validarIncompatibilidadeReligiosaProfana(guerreiro, "Conhecimento Arcano").permitido, true);
    assert.equal(validarIncompatibilidadeReligiosaProfana(guerreiro, "Armadura Completa").permitido, true);
  });
});

// ============================================================================
// CASO 73: RESILIÊNCIA, IDEMPOTÊNCIA E CASOS DE BORDA
// ============================================================================
test("Caso 73: Resiliência, Idempotência e Casos de Borda", async (t) => {
  await t.test("73.1 - Chamadas com argumentos inválidos retornam erros controlados", () => {
    assert.throws(() => processarApostasia(null, "Mirah"), /Ator inválido/);

    const valNulo = validarHabilidadeApostata(null);
    assert.equal(valNulo.permitido, false);

    const checNulo = validarIncompatibilidadeReligiosaProfana(null, "Dogma");
    assert.equal(checNulo.permitido, false);

    const conjNulo = podeConjurarMagiaOuHabilidade(null, "Punição");
    assert.equal(conjNulo.permitido, false);
  });

  await t.test("73.2 - Idempotência: Executar apostasia múltiplas vezes mantém integridade", () => {
    const paladino = createMockActor({
      name: "Paladino Santo",
      details: { classe: "Paladino" },
      items: [
        { id: "punicao", name: "Punição da Execução", type: "habilidade", system: { tipo: "punicao" } },
      ],
    });

    const res1 = processarApostasia(paladino, "Mirah");
    assert.equal(res1.sucesso, true);
    assert.equal(res1.habilidadesRevogadas.length, 1);

    const res2 = processarApostasia(paladino, "Mirah");
    assert.equal(res2.sucesso, true);
    assert.equal(paladino.system.apostata, true);
    assert.equal(paladino.system.votoAbandonado, true);
  });

  await t.test("73.3 - Opção removerItens: true exclui fisicamente itens revogados do inventário", () => {
    const dracomante = createMockActor({
      name: "Renegado Dracônico",
      details: { classe: "Dracomante" },
      items: [
        { id: "mito-1", name: "Mito do Dragão Dourado", type: "habilidade", system: { subtipo: "mito" } },
        { id: "fogo-1", name: "Sopro de Fogo", type: "magia", system: { escola: "mistica" } },
        { id: "arco-1", name: "Arco Curto", type: "arma" },
      ],
    });

    assert.equal(dracomante.items.length, 3);

    const res = processarApostasia(dracomante, "Dragão", { removerItens: true });
    assert.equal(res.sucesso, true);
    assert.equal(res.totalRevogados, 2);

    // Somente o Arco Curto deve restar no inventário
    assert.equal(dracomante.items.length, 1);
    assert.equal(dracomante.items[0].id, "arco-1");
  });

  await t.test("73.4 - Catálogo oficial de classes religiosas canônicas", () => {
    assert.ok(CLASSES_RELIGIOSAS_CANONICAS.includes("sacerdote"));
    assert.ok(CLASSES_RELIGIOSAS_CANONICAS.includes("dracomante"));
    assert.ok(CLASSES_RELIGIOSAS_CANONICAS.includes("paladino"));
  });
});
