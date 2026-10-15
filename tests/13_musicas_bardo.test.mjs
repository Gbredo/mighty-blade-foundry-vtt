/**
 * Suíte de Testes Automatizados - Subtítulo 13: Músicas de Bardo, Menestrel e Concentração
 * Mighty Blade 3ª Edição (Foundry VTT v14)
 *
 * Casos de Teste Cobertos:
 * - Caso 13.1: Interrupção de Performance por Dano (teste de Vontade contra dano ou Dif 8).
 * - Caso 13.2: Bônus de Instrumentos de Sopro (+2 para Faunos, Flauta de Pã, Soprista).
 * - Caso 13.3: Exclusividade Estrita de Músicas Contínuas/Sustentadas (limite de 1 por vez).
 * - Caso 13.4: Ciclo Integrado de Performance, Combate e Interrupção do Bardo.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { createMockActor } from './test-helper.mjs';
import {
  testarInterrupcaoPerformance,
  calcularBonusInstrumentoSopro,
  validarExclusividadeMusicas,
  getMusicasAtivas,
  ativarMusica,
  desativarMusicaAtiva,
  isMusicaContinua,
  isInstrumentoSopro,
  temMaestriaInstrumentoSopro,
  DIFICULDADE_INTERRUPCAO_PADRAO,
  BONUS_INSTRUMENTO_SOPRO,
  MUSICAS_CONTINUAS_CANONICAS,
  INSTRUMENTOS_SOPRO_CANONICOS,
} from '../module/helpers/musicas-bardo.mjs';

// ============================================================================
// CASO 13.1: TESTAR INTERRUPÇÃO DE PERFORMANCE AO SOFRER DANO
// ============================================================================
test('Subtítulo 13.1: Teste de Interrupção de Performance Musical', async (t) => {
  await t.test('13.1.1 - Dano sofrido <= 0 não exige teste de interrupção e não cancela a música', () => {
    const bardo = createMockActor({
      name: 'Bardo Cantante',
      attributes: { vontade: 4 },
    });
    ativarMusica(bardo, 'Canção da Provocação');

    // Dano 0
    const resZero = testarInterrupcaoPerformance(0, bardo);
    assert.equal(resZero.exigiuTeste, false, 'Dano 0 não deve exigir teste');
    assert.equal(resZero.interrompido, false, 'Dano 0 não deve interromper performance');
    assert.equal(resZero.musicaCancelada, false, 'Música não deve ser cancelada');
    assert.deepEqual(getMusicasAtivas(bardo), ['Canção da Provocação']);

    // Dano negativo (cura ou erro de cálculo)
    const resNeg = testarInterrupcaoPerformance(-10, bardo);
    assert.equal(resNeg.exigiuTeste, false, 'Dano negativo não deve exigir teste');
    assert.equal(resNeg.interrompido, false);
  });

  await t.test('13.1.2 - Ator sem música ativa não exige teste de interrupção', () => {
    const bardoSemMusica = createMockActor({
      name: 'Bardo em Silêncio',
      attributes: { vontade: 3 },
    });

    const res = testarInterrupcaoPerformance(15, bardoSemMusica);
    assert.equal(res.exigiuTeste, false, 'Sem música ativa não deve exigir teste');
    assert.equal(res.interrompido, false);
    assert.equal(res.musicaCancelada, false);
  });

  await t.test('13.1.3 - Dano inferior a 8 exige dificuldade padrão 8', () => {
    const bardo = createMockActor({
      name: 'Bardo Menestrel',
      attributes: { vontade: 3 },
    });
    ativarMusica(bardo, 'Melodia Sonífera');

    // Dano 3 (< 8) -> Dificuldade 8
    const res3 = testarInterrupcaoPerformance(3, bardo);
    assert.equal(res3.exigiuTeste, true);
    assert.equal(res3.dificuldade, DIFICULDADE_INTERRUPCAO_PADRAO);
    assert.equal(res3.dificuldade, 8);

    // Dano 7 (< 8) -> Dificuldade 8
    const res7 = testarInterrupcaoPerformance(7, bardo);
    assert.equal(res7.dificuldade, 8);

    // Dano 8 (= 8) -> Dificuldade 8
    const res8 = testarInterrupcaoPerformance(8, bardo);
    assert.equal(res8.dificuldade, 8);
  });

  await t.test('13.1.4 - Dano superior a 8 impõe dificuldade proporcional ao dano', () => {
    const bardo = createMockActor({
      name: 'Bardo Atingido',
      attributes: { vontade: 4 },
    });
    ativarMusica(bardo, 'Canção do Triunfo');

    const res12 = testarInterrupcaoPerformance(12, bardo);
    assert.equal(res12.exigiuTeste, true);
    assert.equal(res12.dificuldade, 12, 'Dificuldade deve ser proporcional a 12 de dano');

    const res25 = testarInterrupcaoPerformance(25, bardo);
    assert.equal(res25.dificuldade, 25, 'Dificuldade deve ser proporcional a 25 de dano');
  });

  await t.test('13.1.5 - Sucesso no teste de Vontade mantém a música ativa', () => {
    const bardo = createMockActor({
      name: 'Bardo Focado',
      attributes: { vontade: 4 },
    });
    ativarMusica(bardo, 'Ritmo dos Animais');

    // Dano 10 -> Dif 10. Rolagem 12 (Sucesso!)
    const res = testarInterrupcaoPerformance(10, bardo, { resultadoTeste: 12 });
    assert.equal(res.exigiuTeste, true);
    assert.equal(res.sucesso, true);
    assert.equal(res.interrompido, false);
    assert.equal(res.musicaCancelada, false);
    assert.deepEqual(getMusicasAtivas(bardo), ['Ritmo dos Animais']);
  });

  await t.test('13.1.6 - Falha no teste de Vontade cancela imediatamente a música ativa', () => {
    const bardo = createMockActor({
      name: 'Bardo Desconcentrado',
      attributes: { vontade: 2 },
    });
    ativarMusica(bardo, 'Canção da Sereia');
    assert.deepEqual(getMusicasAtivas(bardo), ['Canção da Sereia']);

    // Dano 10 -> Dif 10. Rolagem 7 (Falha!)
    const res = testarInterrupcaoPerformance(10, bardo, { resultadoTeste: 7 });
    assert.equal(res.exigiuTeste, true);
    assert.equal(res.sucesso, false);
    assert.equal(res.interrompido, true);
    assert.equal(res.musicaCancelada, true);

    // Música deve ter sido desativada no ator
    assert.deepEqual(getMusicasAtivas(bardo), [], 'Música deve ser removida das ativas após interrupção');
  });

  await t.test('13.1.7 - Suporte a passagem de número direto como terceiro argumento', () => {
    const bardo = createMockActor({
      attributes: { vontade: 3 },
    });
    ativarMusica(bardo, 'Canção do Réquiem');

    // 3º argumento como número direto de rolagem
    const resFalha = testarInterrupcaoPerformance(9, bardo, 6);
    assert.equal(resFalha.sucesso, false);
    assert.equal(resFalha.interrompido, true);
    assert.equal(resFalha.musicaCancelada, true);

    // Reativa e testa sucesso
    ativarMusica(bardo, 'Canção do Réquiem');
    const resSucesso = testarInterrupcaoPerformance(9, bardo, 10);
    assert.equal(resSucesso.sucesso, true);
    assert.equal(resSucesso.interrompido, false);
    assert.equal(resSucesso.musicaCancelada, false);
  });

  await t.test('13.1.8 - Cancelamento atômico em ActiveEffects e flags do Foundry', () => {
    const efeito = { name: 'Canção Desesperadora', disabled: false };
    const itemMusica = { name: 'Canção Desesperadora', type: 'habilidade', system: { ativo: true } };
    const bardo = createMockActor({
      effects: [efeito],
      items: [itemMusica],
    });
    ativarMusica(bardo, 'Canção Desesperadora');

    const res = testarInterrupcaoPerformance(14, bardo, { resultadoTeste: 8 });
    assert.equal(res.interrompido, true);
    assert.equal(efeito.disabled, true, 'ActiveEffect deve ser desabilitado');
    assert.equal(itemMusica.system.ativo, false, 'Item deve ser desativado');
    assert.equal(bardo.flags['mighty-blade'].musicaAtiva, null, 'Flag deve ser limpa');
  });
});

// ============================================================================
// CASO 13.2: BÔNUS DE INSTRUMENTOS DE SOPRO (FLAUTA DE PÃ, FAUNOS, ETC.)
// ============================================================================
test('Subtítulo 13.2: Bônus de Instrumentos de Sopro', async (t) => {
  await t.test('13.2.1 - Fauno utilizando Flauta de Pã recebe +2 de bônus', () => {
    const fauno = createMockActor({
      details: { raca: 'Fauno' },
    });

    const bonus = calcularBonusInstrumentoSopro(fauno, 'Flauta de Pã');
    assert.equal(bonus, BONUS_INSTRUMENTO_SOPRO, 'Fauno com Flauta de Pã deve receber +2');
    assert.equal(bonus, 2);
  });

  await t.test('13.2.2 - Fauno utilizando outros instrumentos de sopro canônicos recebe +2', () => {
    const fauno = createMockActor({
      details: { raca: 'Fauno' },
    });

    const instrumentosSopro = [
      'Flauta Doce',
      'flauta-doce',
      'Chifre',
      'chifre',
      'Jorvik',
      'Gaita de Fole',
      'gaita-de-fole',
      'Corneta',
      'Trompete',
      'Clarinete',
    ];

    for (const inst of instrumentosSopro) {
      const bonus = calcularBonusInstrumentoSopro(fauno, inst);
      assert.equal(bonus, 2, `Fauno utilizando ${inst} deve receber +2 de bônus`);
    }
  });

  await t.test('13.2.3 - Instrumentos que NÃO são de sopro concedem bônus 0', () => {
    const fauno = createMockActor({
      details: { raca: 'Fauno' },
    });

    const outrosInstrumentos = [
      'Alaúde',
      'Harpa',
      'Bohdran',
      'Bongô',
      'Pandeiro',
      'Rabeca',
      'Tamboril',
      'Hurd Guli',
      'Lira',
      'Espada Curta',
      null,
      undefined,
    ];

    for (const inst of outrosInstrumentos) {
      const bonus = calcularBonusInstrumentoSopro(fauno, inst);
      assert.equal(bonus, 0, `Instrumento não-sopro (${inst}) deve retornar 0 de bônus`);
    }
  });

  await t.test('13.2.4 - Personagem com a habilidade Flauta de Pã recebe +2', () => {
    const humanoComFlautaDePa = createMockActor({
      details: { raca: 'Humano' },
      items: [
        {
          name: 'Flauta de Pã',
          type: 'habilidade',
          flags: { 'mighty-blade': { slug: 'flauta-de-pa' } },
        },
      ],
    });

    const bonus = calcularBonusInstrumentoSopro(humanoComFlautaDePa, 'Flauta Doce');
    assert.equal(bonus, 2, 'Possuidor da habilidade Flauta de Pã recebe +2 com instrumento de sopro');
  });

  await t.test('13.2.5 - Bardo com a habilidade Soprista recebe +2 com instrumentos de sopro', () => {
    const bardoSoprista = createMockActor({
      details: { raca: 'Humano', classe: 'Bardo' },
      items: [
        {
          name: 'Soprista',
          type: 'habilidade',
          flags: { 'mighty-blade': { slug: 'soprista' } },
        },
      ],
    });

    const bonus = calcularBonusInstrumentoSopro(bardoSoprista, 'Chifre');
    assert.equal(bonus, 2, 'Soprista deve receber +2 de bônus com sopro');
  });

  await t.test('13.2.6 - Personagem sem afinidade/maestria não recebe bônus com instrumento mundano', () => {
    const guerreiroHumano = createMockActor({
      details: { raca: 'Humano', classe: 'Guerreiro' },
      items: [],
    });

    const bonus = calcularBonusInstrumentoSopro(guerreiroHumano, 'Flauta Doce');
    assert.equal(bonus, 0, 'Humano sem habilidade de sopro não recebe bônus automático');
  });

  await t.test('13.2.7 - Opção ignorarRequisitos ou ausência de ator concede bônus padrão', () => {
    assert.equal(calcularBonusInstrumentoSopro(null, 'Flauta de Pã'), 2);
    assert.equal(calcularBonusInstrumentoSopro(null, 'Alaúde'), 0);

    const atorSemHabilidades = createMockActor();
    const bonusForcado = calcularBonusInstrumentoSopro(atorSemHabilidades, 'Flauta de Pã', {
      ignorarRequisitos: true,
    });
    assert.equal(bonusForcado, 2);
  });

  await t.test('13.2.8 - Suporte a objetos de Item ricos do Foundry com descrição/observações', () => {
    const fauno = createMockActor({ details: { raca: 'Fauno' } });

    const itemObjSopro = {
      name: 'Flauta Rústica de Bambu',
      type: 'equipamento',
      system: {
        description: 'Sopro de bambu esculpido à mão.',
        observacoes: 'Instrumento de sopro tradicional.',
      },
    };
    assert.equal(calcularBonusInstrumentoSopro(fauno, itemObjSopro), 2);

    const itemObjCorda = {
      name: 'Bandolim Antigo',
      type: 'equipamento',
      system: {
        description: 'Instrumento de cordas dedilhadas.',
        observacoes: 'Corda com corpo bojudo.',
      },
    };
    assert.equal(calcularBonusInstrumentoSopro(fauno, itemObjCorda), 0);
  });
});

// ============================================================================
// CASO 13.3: VALIDAÇÃO DE EXCLUSIVIDADE DE MÚSICAS CONTÍNUAS/SUSTENTADAS
// ============================================================================
test('Subtítulo 13.3: Exclusividade Estrita de Músicas Contínuas', async (t) => {
  await t.test('13.3.1 - Bardo sem música ativa pode ativar qualquer música contínua', () => {
    const bardo = createMockActor({
      name: 'Bardo Estreante',
      details: { classe: 'Bardo' },
    });
    assert.deepEqual(getMusicasAtivas(bardo), []);

    const res = validarExclusividadeMusicas(bardo, 'Canção da Provocação');
    assert.equal(res.permitida, true);
    assert.equal(res.conflito, null);
    assert.equal(res.erro, null);
    assert.deepEqual(getMusicasAtivas(bardo), ['Canção da Provocação']);
  });

  await t.test('13.3.2 - Bloqueio estrito: rejeita ativação de segunda música contínua', () => {
    const bardo = createMockActor({
      name: 'Bardo Ocupado',
      details: { classe: 'Bardo' },
    });
    ativarMusica(bardo, 'Canção da Provocação');
    assert.deepEqual(getMusicasAtivas(bardo), ['Canção da Provocação']);

    // Tenta ativar Melodia Sonífera enquanto Canção da Provocação está ativa
    const res = validarExclusividadeMusicas(bardo, 'Melodia Sonífera');
    assert.equal(res.permitida, false, 'Deve rejeitar a nova música contínua');
    assert.equal(res.substituida, false);
    assert.equal(res.conflito, 'Canção da Provocação');
    assert.ok(res.erro.includes('Exclusividade de Músicas violada'));
    assert.deepEqual(getMusicasAtivas(bardo), ['Canção da Provocação'], 'A anterior permanece ativa');
  });

  await t.test('13.3.3 - Reafirmação da mesma música contínua é permitida', () => {
    const bardo = createMockActor();
    ativarMusica(bardo, 'Melodia da Fúria');

    const res = validarExclusividadeMusicas(bardo, 'Melodia da Fúria');
    assert.equal(res.permitida, true, 'Manter a mesma música ativa é permitido');
    assert.equal(res.conflito, null);
    assert.deepEqual(getMusicasAtivas(bardo), ['Melodia da Fúria']);
  });

  await t.test('13.3.4 - Modo Substituição: desativa a anterior e liga a nova (desativarAnterior: true)', () => {
    const bardo = createMockActor();
    ativarMusica(bardo, 'Canção Desesperadora');
    assert.deepEqual(getMusicasAtivas(bardo), ['Canção Desesperadora']);

    // Ativa Melodia Dançante com substituição
    const res = validarExclusividadeMusicas(bardo, 'Melodia Dançante', {
      desativarAnterior: true,
    });
    assert.equal(res.permitida, true);
    assert.equal(res.substituida, true);
    assert.equal(res.musicaAnterior, 'Canção Desesperadora');
    assert.deepEqual(getMusicasAtivas(bardo), ['Melodia Dançante']);
  });

  await t.test('13.3.5 - Modo Substituição com flag alias substituir: true', () => {
    const bardo = createMockActor();
    ativarMusica(bardo, 'Canção do Triunfo');

    const res = validarExclusividadeMusicas(bardo, 'Ritmo dos Animais', {
      substituir: true,
    });
    assert.equal(res.permitida, true);
    assert.equal(res.substituida, true);
    assert.deepEqual(getMusicasAtivas(bardo), ['Ritmo dos Animais']);
  });

  await t.test('13.3.6 - Habilidades instantâneas não contínuas não sofrem bloqueio', () => {
    const bardo = createMockActor();
    ativarMusica(bardo, 'Canção da Provocação');

    // Habilidades instantâneas como Grito Estilhaçador ou Distração
    const resGrito = validarExclusividadeMusicas(bardo, 'Grito Estilhaçador');
    assert.equal(resGrito.permitida, true);
    assert.equal(resGrito.conflito, null);

    const resAtaque = validarExclusividadeMusicas(bardo, 'Ataque Desarmado');
    assert.equal(resAtaque.permitida, true);
  });

  await t.test('13.3.7 - Alternância manual: desativar a anterior permite nova ativação', () => {
    const bardo = createMockActor();
    ativarMusica(bardo, 'Melodia do Repouso');
    assert.equal(validarExclusividadeMusicas(bardo, 'Canção Exultante').permitida, false);

    // Desativa manualmente
    desativarMusicaAtiva(bardo, 'Melodia do Repouso');
    assert.deepEqual(getMusicasAtivas(bardo), []);

    // Agora pode ativar
    const resNova = validarExclusividadeMusicas(bardo, 'Canção Exultante');
    assert.equal(resNova.permitida, true);
    assert.deepEqual(getMusicasAtivas(bardo), ['Canção Exultante']);
  });
});

// ============================================================================
// CASO 13.4: CICLO COMPLETO DE COMBATE, PERFORMANCE E INTERRUPÇÃO
// ============================================================================
test('Subtítulo 13.4: Ciclo Integrado de Performance, Combate e Interrupção', async (t) => {
  await t.test('13.4.1 - Ciclo completo: Ativação -> Dano Leve Mantido -> Dano Crítico Interrompido', () => {
    // 1. Criação do Bardo Fauno com Vontade 4 e Flauta de Pã
    const faunoBardo = createMockActor({
      name: 'Pan, o Menestrel',
      details: { raca: 'Fauno', classe: 'Bardo' },
      attributes: { vontade: { value: 4 } },
      items: [
        {
          name: 'Flauta de Pã',
          type: 'equipamento',
          system: { equipado: true, subtipo: 'sopro' },
          flags: { 'mighty-blade': { slug: 'flauta-de-pa', categoria: 'Musical' } },
        },
      ],
    });

    // 2. Bardo inicia Canção da Provocação
    const inicio = validarExclusividadeMusicas(faunoBardo, 'Canção da Provocação');
    assert.equal(inicio.permitida, true);
    assert.deepEqual(getMusicasAtivas(faunoBardo), ['Canção da Provocação']);

    // 3. Tenta sobrepor Melodia Sonífera sem desativar a anterior -> Bloqueado!
    const tentativaSobrepor = validarExclusividadeMusicas(faunoBardo, 'Melodia Sonífera');
    assert.equal(tentativaSobrepor.permitida, false);
    assert.equal(tentativaSobrepor.conflito, 'Canção da Provocação');

    // 4. Bardo sofre 6 de dano de um arqueiro inimigo (< 8 -> Dif 8)
    // Rolagem: 2d6 + Vontade 4 + Sopro 2 = 11 (Sucesso!)
    const teste1 = testarInterrupcaoPerformance(6, faunoBardo, {
      resultadoTeste: 11,
      instrumento: 'Flauta de Pã',
    });
    assert.equal(teste1.exigiuTeste, true);
    assert.equal(teste1.dificuldade, 8, 'Dificuldade padrão 8 para dano 6');
    assert.equal(teste1.bonus, 2, 'Bônus de instrumento de sopro aplicado (+2)');
    assert.equal(teste1.sucesso, true);
    assert.equal(teste1.interrompido, false);
    assert.deepEqual(getMusicasAtivas(faunoBardo), ['Canção da Provocação'], 'Música continua ativa');

    // 5. Bardo sofre 16 de dano de um machado de batalha (Dificuldade proporcional: 16)
    // Rolagem falha: 2d6 + Vontade 4 + Sopro 2 = 12 (< 16 -> Falha!)
    const teste2 = testarInterrupcaoPerformance(16, faunoBardo, {
      resultadoTeste: 12,
      instrumento: 'Flauta de Pã',
    });
    assert.equal(teste2.exigiuTeste, true);
    assert.equal(teste2.dificuldade, 16, 'Dificuldade proporcional ao dano (16)');
    assert.equal(teste2.sucesso, false);
    assert.equal(teste2.interrompido, true, 'Performance interrompida pelo dano!');
    assert.equal(teste2.musicaCancelada, true);

    // 6. Confirma que a música foi cancelada
    assert.deepEqual(getMusicasAtivas(faunoBardo), [], 'Nenhuma música ativa após interrupção');

    // 7. Próximo turno: Bardo agora pode ativar livremente Melodia Sonífera
    const novaAtivacao = validarExclusividadeMusicas(faunoBardo, 'Melodia Sonífera');
    assert.equal(novaAtivacao.permitida, true);
    assert.deepEqual(getMusicasAtivas(faunoBardo), ['Melodia Sonífera']);
  });
});
