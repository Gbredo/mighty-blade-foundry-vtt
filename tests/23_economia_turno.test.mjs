/**
 * Suíte de Testes Automatizados - Subtítulo 23: Economia Estrita do Turno
 * Mighty Blade 3ª Edição (Foundry VTT v14)
 *
 * Casos de Teste Cobertos:
 * - Caso 1: Combinação 1 — 1 Ação de Rodada Completa + Ações Livres
 *   * Válido: 1 Rodada Completa isolada
 *   * Válido: 1 Rodada Completa + múltiplas Ações Livres
 *   * Rejeição: 2 Rodadas Completas
 *   * Rejeição: 1 Rodada Completa + 1 Ação Padrão
 *   * Rejeição: 1 Rodada Completa + 1 Ação de Movimento
 *
 * - Caso 2: Combinação 2 — 1 Ação Padrão + 1 Ação de Movimento + Ações Livres
 *   * Válido: 1 Padrão + 1 Movimento (ordem direta e invertida)
 *   * Válido: 1 Padrão + 1 Movimento + Ações Livres intercaladas
 *   * Válido: 1 Padrão apenas (subconjunto permitido)
 *   * Válido: 1 Movimento apenas (subconjunto permitido)
 *   * Rejeição: 1 Padrão + 2 Movimentos (excesso)
 *
 * - Caso 3: Combinação 3 — 2 Ações de Movimento + Ações Livres (Conversão Padrão -> Movimento)
 *   * Válido: 2 Movimentos + 0 Padrão
 *   * Válido: 2 Movimentos + múltiplas Ações Livres
 *   * Rejeição: 3 Movimentos (excesso além do limite de conversão)
 *
 * - Caso 4: Regra Negativa Restritiva — Proibição Estrita de Trocar Movimento por Padrão
 *   * podeTrocarMovimentoPorPadrao === false
 *   * Rejeição: 2 Ações Padrão (proibido converter movimento em padrão)
 *   * Rejeição: 2 Ações Padrão + 1 Movimento
 *   * Rejeição: 3 Ações Padrão
 *   * Mensagem descritiva de erro sinalizando a regra restritiva
 *
 * - Caso 5: Suporte a 1 Reação por Rodada Fora do Turno
 *   * Válido: 1 Reação fora do turno
 *   * Rejeição: 2 Reações na mesma rodada (limite estrito de 1)
 *   * Rejeição: Ações de turno (Padrão/Movimento/Rodada Completa) fora do turno
 *   * Reset de Reações ao avançar a rodada de combate
 *
 * - Caso 6: Formatos de Entrada, Normalização e Ações Livres
 *   * Strings canônicas e aliases (português/inglês, maiúsculas, hífens)
 *   * Arrays de objetos e objetos com chaves de contagem
 *   * Turno vazio (passar a vez)
 *
 * - Caso 7: Controlador e Simulação Dinâmica de Turno de Combate
 *   * Validação em tempo real (ControladorEconomiaTurno e actor mock)
 *   * Cálculo de ações restantes disponíveis no turno
 *   * Integração com condições do ator (Atordoado / Morto)
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createMockActor,
  validarAcoesTurno,
  validarReacao,
  podeExecutarAcao,
  obterAcoesRestantes,
  ControladorEconomiaTurno,
  TIPOS_ACAO,
  COMBINACOES_TURNO_VALIDAS,
  LIMITE_REACOES_POR_RODADA,
  podeTrocarMovimentoPorPadrao,
  PODE_TROCAR_MOVIMENTO_POR_PADRAO,
} from './test-helper.mjs';

// ============================================================================
// CASO 1: COMBINAÇÃO 1 — 1 AÇÃO DE RODADA COMPLETA + AÇÕES LIVRES
// ============================================================================
test('Caso 1: Combinação 1 — Ação de Rodada Completa + Ações Livres', async (t) => {
  await t.test('1.1 - 1 Ação de Rodada Completa isolada é válida', () => {
    const res = validarAcoesTurno(['rodada_completa']);
    assert.equal(res.valido, true, 'Deveria ser válido');
    assert.equal(res.combinacao, COMBINACOES_TURNO_VALIDAS.RODADA_COMPLETA);
    assert.equal(res.acoes.rodadaCompleta, 1);
    assert.equal(res.acoes.padrao, 0);
    assert.equal(res.acoes.movimento, 0);
    assert.equal(res.erros.length, 0);
  });

  await t.test('1.2 - 1 Ação de Rodada Completa com múltiplas Ações Livres é válida', () => {
    const acoes = ['livre', 'rodada_completa', 'livre', 'livre'];
    const res = validarAcoesTurno(acoes);
    assert.equal(res.valido, true, 'Deveria permitir Ações Livres com Rodada Completa');
    assert.equal(res.combinacao, COMBINACOES_TURNO_VALIDAS.RODADA_COMPLETA);
    assert.equal(res.acoes.rodadaCompleta, 1);
    assert.equal(res.acoes.livre, 3);
  });

  await t.test('1.3 - Rejeita 2 Ações de Rodada Completa no mesmo turno', () => {
    const res = validarAcoesTurno(['rodada_completa', 'rodada_completa']);
    assert.equal(res.valido, false, 'Não pode realizar 2 Rodadas Completas');
    assert.ok(
      res.erros.some((e) => e.includes('no máximo 1 Ação de Rodada Completa')),
      `Mensagem esperada nos erros: ${res.motivo}`
    );
  });

  await t.test('1.4 - Rejeita Rodada Completa combinada com Ação Padrão', () => {
    const res = validarAcoesTurno(['rodada_completa', 'padrao']);
    assert.equal(res.valido, false, 'Rodada Completa não pode ser combinada com Padrão');
    assert.ok(
      res.erros.some((e) => e.includes('consome todo o turno') || e.includes('incompatível')),
      `Erro de incompatibilidade esperado: ${res.motivo}`
    );
  });

  await t.test('1.5 - Rejeita Rodada Completa combinada com Ação de Movimento', () => {
    const res = validarAcoesTurno(['rodada_completa', 'movimento']);
    assert.equal(res.valido, false, 'Rodada Completa não pode ser combinada com Movimento');
    assert.ok(
      res.erros.some((e) => e.includes('consome todo o turno') || e.includes('incompatível')),
      `Erro de incompatibilidade esperado: ${res.motivo}`
    );
  });

  await t.test('1.6 - Rejeita Rodada Completa combinada com Padrão e Movimento', () => {
    const res = validarAcoesTurno(['rodada_completa', 'padrao', 'movimento', 'livre']);
    assert.equal(res.valido, false, 'Não pode somar Padrão e Movimento a Rodada Completa');
  });
});

// ============================================================================
// CASO 2: COMBINAÇÃO 2 — 1 AÇÃO PADRÃO + 1 AÇÃO DE MOVIMENTO + AÇÕES LIVRES
// ============================================================================
test('Caso 2: Combinação 2 — 1 Ação Padrão + 1 Ação de Movimento + Ações Livres', async (t) => {
  await t.test('2.1 - 1 Ação Padrão + 1 Ação de Movimento é válida (ordem padrão)', () => {
    const res = validarAcoesTurno(['padrao', 'movimento']);
    assert.equal(res.valido, true);
    assert.equal(res.combinacao, COMBINACOES_TURNO_VALIDAS.PADRAO_E_MOVIMENTO);
    assert.equal(res.acoes.padrao, 1);
    assert.equal(res.acoes.movimento, 1);
  });

  await t.test('2.2 - 1 Ação de Movimento + 1 Ação Padrão é válida (ordem invertida)', () => {
    const res = validarAcoesTurno(['movimento', 'padrao']);
    assert.equal(res.valido, true);
    assert.equal(res.combinacao, COMBINACOES_TURNO_VALIDAS.PADRAO_E_MOVIMENTO);
  });

  await t.test('2.3 - 1 Ação Padrão + 1 Ação de Movimento + múltiplas Ações Livres', () => {
    const acoes = ['livre', 'movimento', 'livre', 'padrao', 'livre'];
    const res = validarAcoesTurno(acoes);
    assert.equal(res.valido, true);
    assert.equal(res.combinacao, COMBINACOES_TURNO_VALIDAS.PADRAO_E_MOVIMENTO);
    assert.equal(res.acoes.livre, 3);
  });

  await t.test('2.4 - Apenas 1 Ação Padrão (+ Livres) é um subconjunto válido', () => {
    const res = validarAcoesTurno(['padrao', 'livre']);
    assert.equal(res.valido, true);
    assert.equal(res.combinacao, COMBINACOES_TURNO_VALIDAS.APENAS_PADRAO);
    assert.equal(res.acoes.padrao, 1);
    assert.equal(res.acoes.movimento, 0);
  });

  await t.test('2.5 - Apenas 1 Ação de Movimento (+ Livres) é um subconjunto válido', () => {
    const res = validarAcoesTurno(['movimento']);
    assert.equal(res.valido, true);
    assert.equal(res.combinacao, COMBINACOES_TURNO_VALIDAS.APENAS_MOVIMENTO);
    assert.equal(res.acoes.movimento, 1);
    assert.equal(res.acoes.padrao, 0);
  });

  await t.test('2.6 - Rejeita 1 Ação Padrão + 2 Ações de Movimento (excesso)', () => {
    const res = validarAcoesTurno(['padrao', 'movimento', 'movimento']);
    assert.equal(res.valido, false, 'Não pode fazer 1 Padrão + 2 Movimentos');
    assert.ok(
      res.erros.some((e) => e.includes('Excesso de ações no turno') || e.includes('máximo 1 Ação de Movimento')),
      `Mensagem esperada: ${res.motivo}`
    );
  });
});

// ============================================================================
// CASO 3: COMBINAÇÃO 3 — 2 AÇÕES DE MOVIMENTO + AÇÕES LIVRES (CONVERSÃO PADRÃO -> MOVIMENTO)
// ============================================================================
test('Caso 3: Combinação 3 — 2 Ações de Movimento + Ações Livres', async (t) => {
  await t.test('3.1 - 2 Ações de Movimento sem Ação Padrão é válida (troca de padrão por movimento)', () => {
    const res = validarAcoesTurno(['movimento', 'movimento']);
    assert.equal(res.valido, true);
    assert.equal(res.combinacao, COMBINACOES_TURNO_VALIDAS.DUPLO_MOVIMENTO);
    assert.equal(res.acoes.movimento, 2);
    assert.equal(res.acoes.padrao, 0);
  });

  await t.test('3.2 - 2 Ações de Movimento + múltiplas Ações Livres é válida', () => {
    const acoes = ['livre', 'movimento', 'livre', 'movimento', 'livre'];
    const res = validarAcoesTurno(acoes);
    assert.equal(res.valido, true);
    assert.equal(res.combinacao, COMBINACOES_TURNO_VALIDAS.DUPLO_MOVIMENTO);
    assert.equal(res.acoes.movimento, 2);
    assert.equal(res.acoes.livre, 3);
  });

  await t.test('3.3 - Rejeita 3 Ações de Movimento no mesmo turno (excesso além da conversão)', () => {
    const res = validarAcoesTurno(['movimento', 'movimento', 'movimento']);
    assert.equal(res.valido, false, 'Não pode realizar 3 Movimentos');
    assert.ok(
      res.erros.some((e) => e.includes('Excesso de ações de movimento') || e.includes('máximo 2')),
      `Mensagem de excesso esperada: ${res.motivo}`
    );
  });

  await t.test('3.4 - Rejeita 4 Ações de Movimento no mesmo turno', () => {
    const res = validarAcoesTurno(['movimento', 'movimento', 'movimento', 'movimento']);
    assert.equal(res.valido, false);
  });
});

// ============================================================================
// CASO 4: REGRA NEGATIVA RESTRITIVA — PROIBIÇÃO DE TROCAR MOVIMENTO POR PADRÃO
// ============================================================================
test('Caso 4: Regra Negativa Restritiva — Proibição Estrita de Trocar Movimento por Padrão', async (t) => {
  await t.test('4.1 - Constante podeTrocarMovimentoPorPadrao é estritamente false', () => {
    assert.equal(podeTrocarMovimentoPorPadrao, false);
    assert.equal(PODE_TROCAR_MOVIMENTO_POR_PADRAO, false);
  });

  await t.test('4.2 - Rejeita categoricamente 2 Ações Padrão no mesmo turno', () => {
    const res = validarAcoesTurno(['padrao', 'padrao']);
    assert.equal(res.valido, false, '2 Ações Padrão devem ser rejeitadas');
    assert.equal(res.podeTrocarMovimentoPorPadrao, false);
    assert.ok(
      res.erros.some((e) => e.includes('PROIBIDO') && e.includes('podeTrocarMovimentoPorPadrao = false')),
      `Mensagem com regra negativa restritiva esperada: ${res.motivo}`
    );
  });

  await t.test('4.3 - Rejeita 2 Ações Padrão + 1 Ação de Movimento', () => {
    const res = validarAcoesTurno(['padrao', 'padrao', 'movimento']);
    assert.equal(res.valido, false);
    assert.equal(res.podeTrocarMovimentoPorPadrao, false);
    assert.ok(
      res.erros.some((e) => e.includes('PROIBIDO')),
      `Mensagem esperada: ${res.motivo}`
    );
  });

  await t.test('4.4 - Rejeita 3 Ações Padrão no mesmo turno', () => {
    const res = validarAcoesTurno(['padrao', 'padrao', 'padrao']);
    assert.equal(res.valido, false);
    assert.equal(res.podeTrocarMovimentoPorPadrao, false);
  });

  await t.test('4.5 - Mesmo com ações livres, 2 Ações Padrão continuam proibidas', () => {
    const res = validarAcoesTurno(['livre', 'padrao', 'livre', 'padrao', 'livre']);
    assert.equal(res.valido, false);
    assert.equal(res.podeTrocarMovimentoPorPadrao, false);
  });
});

// ============================================================================
// CASO 5: SUPORTE A 1 REAÇÃO POR RODADA FORA DO TURNO
// ============================================================================
test('Caso 5: Suporte a 1 Reação por Rodada Fora do Turno', async (t) => {
  await t.test('5.1 - 1 Reação realizada fora do turno é válida', () => {
    const res = validarReacao(1, { foraDoTurno: true });
    assert.equal(res.valido, true);
    assert.equal(res.reacoesUsadas, 1);
    assert.equal(res.reacoesRestantes, 0);
    assert.equal(res.limite, LIMITE_REACOES_POR_RODADA);
  });

  await t.test('5.2 - Rejeita 2 Reações na mesma rodada (limite de 1)', () => {
    const res = validarReacao(1, { reacoesJaGastas: 1, foraDoTurno: true });
    assert.equal(res.valido, false, 'Não pode realizar 2 reações na mesma rodada');
    assert.ok(
      res.motivo.includes('Limite de Reações excedido') || res.motivo.includes('máximo 1'),
      `Mensagem esperada: ${res.motivo}`
    );
  });

  await t.test('5.3 - Rejeita tentativa de realizar 2 reações simultâneas de uma vez', () => {
    const res = validarReacao(2, { foraDoTurno: true });
    assert.equal(res.valido, false);
  });

  await t.test('5.4 - Rejeita Reação executada dentro do turno com foraDoTurno: false', () => {
    const res = validarReacao(1, { foraDoTurno: false });
    assert.equal(res.valido, false, 'Reação deve ser fora do turno');
    assert.ok(
      res.motivo.includes('fora do turno'),
      `Mensagem esperada: ${res.motivo}`
    );
  });

  await t.test('5.5 - validarAcoesTurno fora do turno rejeita ações de turno (Padrão/Movimento/Rodada)', () => {
    const resPadrao = validarAcoesTurno(['padrao'], { foraDoTurno: true });
    assert.equal(resPadrao.valido, false);
    assert.ok(resPadrao.motivo.includes('não pode ser realizada fora do turno'));

    const resMov = validarAcoesTurno(['movimento'], { foraDoTurno: true });
    assert.equal(resMov.valido, false);

    const resRodada = validarAcoesTurno(['rodada_completa'], { foraDoTurno: true });
    assert.equal(resRodada.valido, false);
  });

  await t.test('5.6 - validarAcoesTurno fora do turno aceita 1 Reação + Ações Livres', () => {
    const res = validarAcoesTurno(['reacao', 'livre'], { foraDoTurno: true });
    assert.equal(res.valido, true);
    assert.equal(res.combinacao, 'reacao_fora_do_turno');
  });

  await t.test('5.7 - validarAcoesTurno fora do turno rejeita mais de 1 Reação', () => {
    const res = validarAcoesTurno(['reacao', 'reacao'], { foraDoTurno: true });
    assert.equal(res.valido, false);
    assert.ok(res.motivo.includes('Limite de Reações excedido'));
  });
});

// ============================================================================
// CASO 6: FORMATOS DE ENTRADA, NORMALIZAÇÃO E AÇÕES LIVRES
// ============================================================================
test('Caso 6: Formatos de Entrada, Normalização e Ações Livres', async (t) => {
  await t.test('6.1 - Aceita diferentes sinônimos e grafias de ações', () => {
    // Padrão: "padrão", "standard", "standard_action", "acao_padrao"
    assert.equal(validarAcoesTurno(['padrão', 'movimento']).valido, true);
    assert.equal(validarAcoesTurno(['standard', 'move']).valido, true);
    assert.equal(validarAcoesTurno(['acao_padrao', 'acao_movimento']).valido, true);
    assert.equal(validarAcoesTurno(['full_round']).valido, true);
    assert.equal(validarAcoesTurno(['ação de rodada completa']).valido, true);
  });

  await t.test('6.2 - Aceita objeto de contagem de ações diretamente', () => {
    const payload = {
      padrao: 1,
      movimento: 1,
      livre: 2,
    };
    const res = validarAcoesTurno(payload);
    assert.equal(res.valido, true);
    assert.equal(res.combinacao, COMBINACOES_TURNO_VALIDAS.PADRAO_E_MOVIMENTO);
    assert.equal(res.acoes.padrao, 1);
    assert.equal(res.acoes.movimento, 1);
    assert.equal(res.acoes.livre, 2);
  });

  await t.test('6.3 - Aceita array de objetos descritivos com tipo/name', () => {
    const payload = [
      { tipo: 'padrao', nome: 'Ataque com Espada Curta' },
      { tipo: 'movimento', nome: 'Mover 6 metros até o orc' },
      { tipo: 'livre', nome: 'Gritar ordem tática' },
    ];
    const res = validarAcoesTurno(payload);
    assert.equal(res.valido, true);
    assert.equal(res.combinacao, COMBINACOES_TURNO_VALIDAS.PADRAO_E_MOVIMENTO);
  });

  await t.test('6.4 - Turno vazio (passar a vez / 0 ações) é válido', () => {
    const res = validarAcoesTurno([]);
    assert.equal(res.valido, true);
    assert.equal(res.combinacao, COMBINACOES_TURNO_VALIDAS.VAZIO);
  });

  await t.test('6.5 - Turno apenas com Ações Livres é válido', () => {
    const res = validarAcoesTurno(['livre', 'livre', 'livre']);
    assert.equal(res.valido, true);
    assert.equal(res.combinacao, COMBINACOES_TURNO_VALIDAS.APENAS_LIVRE);
    assert.equal(res.acoes.livre, 3);
  });

  await t.test('6.6 - Rejeita ações com tipos desconhecidos', () => {
    const res = validarAcoesTurno(['padrao', 'teletransporte_invalido']);
    assert.equal(res.valido, false);
    assert.ok(res.motivo.includes('não reconhecido'));
  });
});

// ============================================================================
// CASO 7: CONTROLADOR DINÂMICO E SIMULAÇÃO DE TURNO DE COMBATE
// ============================================================================
test('Caso 7: Controlador Dinâmico e Simulação de Turno de Combate', async (t) => {
  await t.test('7.1 - podeExecutarAcao e obterAcoesRestantes em sequência passo a passo', () => {
    let acoes = [];

    // Início do turno: todas as opções disponíveis
    let restantes = obterAcoesRestantes(acoes);
    assert.equal(restantes.podeRodadaCompleta, true);
    assert.equal(restantes.podePadrao, true);
    assert.equal(restantes.podeMovimento, true);
    assert.equal(restantes.movimentosRestantes, 2);
    assert.equal(restantes.padraoRestante, 1);

    // Passo 1: Realiza 1 Movimento
    assert.equal(podeExecutarAcao(acoes, 'movimento').podeExecutar, true);
    acoes.push('movimento');

    // Estado intermediário: Rodada Completa fechada, mas pode 1 Padrão OU mais 1 Movimento
    restantes = obterAcoesRestantes(acoes);
    assert.equal(restantes.podeRodadaCompleta, false);
    assert.equal(restantes.podePadrao, true);
    assert.equal(restantes.podeMovimento, true);
    assert.equal(restantes.movimentosRestantes, 1);
    assert.equal(restantes.padraoRestante, 1);

    // Passo 2: Tenta executar Padrão -> Permitido
    assert.equal(podeExecutarAcao(acoes, 'padrao').podeExecutar, true);
    acoes.push('padrao');

    // Estado final: Nem Padrão nem Movimento adicionais permitidos
    restantes = obterAcoesRestantes(acoes);
    assert.equal(restantes.podePadrao, false);
    assert.equal(restantes.podeMovimento, false);
    assert.equal(restantes.podeLivre, true);

    // Passo 3: Tenta executar mais um Padrão -> Bloqueado estritamente
    const testeSegundoPadrao = podeExecutarAcao(acoes, 'padrao');
    assert.equal(testeSegundoPadrao.podeExecutar, false);
    assert.ok(testeSegundoPadrao.motivo.includes('PROIBIDO'));
  });

  await t.test('7.2 - ControladorEconomiaTurno executa ciclo de turno e rodada completo', () => {
    const ctrl = new ControladorEconomiaTurno();
    assert.equal(ctrl.podeTrocarMovimentoPorPadrao, false);
    assert.equal(ctrl.emTurno, false);

    // Tentar agir antes de iniciar turno lança erro
    assert.throws(
      () => ctrl.executarAcao('padrao'),
      /Não é possível realizar ações de turno fora do próprio turno/
    );

    // Inicia turno
    ctrl.iniciarTurno();
    assert.equal(ctrl.emTurno, true);

    // Executa Movimento e Padrão
    const res1 = ctrl.executarAcao('movimento');
    assert.equal(res1.sucesso, true);

    const res2 = ctrl.executarAcao('padrao');
    assert.equal(res2.sucesso, true);

    // Tenta executar segunda Ação Padrão -> Deve lançar erro (regra estrita)
    assert.throws(
      () => ctrl.executarAcao('padrao'),
      /PROIBIDO utilizar uma Ação de Movimento para realizar uma segunda Ação Padrão/
    );

    // Finaliza o turno
    ctrl.finalizarTurno();
    assert.equal(ctrl.emTurno, false);

    // Fora do turno: executa Reação (ex: Bloqueio ou Esquiva)
    const reacaoRes = ctrl.executarReacao({ tipo: 'bloqueio', atacante: 'Goblin' });
    assert.equal(reacaoRes.sucesso, true);
    assert.equal(ctrl.reacoesNaRodada, 1);

    // Segunda reação na mesma rodada -> Lança erro
    assert.throws(
      () => ctrl.executarReacao({ tipo: 'esquiva' }),
      /Limite de Reações excedido/
    );

    // Inicia nova rodada de combate -> Contador de reações reseta para 0
    ctrl.iniciarNovaRodada();
    assert.equal(ctrl.rodadaAtual, 2);
    assert.equal(ctrl.reacoesNaRodada, 0);

    // Agora pode reagir novamente na nova rodada
    const novaReacao = ctrl.executarReacao({ tipo: 'contra-ataque' });
    assert.equal(novaReacao.sucesso, true);
    assert.equal(ctrl.reacoesNaRodada, 1);
  });

  await t.test('7.3 - Mock Actor integrado com validarAcoesTurno e condições', () => {
    const actor = createMockActor({ name: 'Sir Roger' });

    // Personagem são e ativo valida ações normalmente
    const resAtivo = actor.validarAcoesTurno(['padrao', 'movimento']);
    assert.equal(resAtivo.valido, true);

    // Tentativa de 2 padrões no actor é rejeitada
    const resDuploPadrao = actor.validarAcoesTurno(['padrao', 'padrao']);
    assert.equal(resDuploPadrao.valido, false);
    assert.equal(resDuploPadrao.podeTrocarMovimentoPorPadrao, false);

    // Aplica condição Atordoado no personagem
    actor.aplicarCondicao('atordoado');
    assert.equal(actor.podeRealizarAcoes(), false);

    // Com Atordoado ativo, a validação de turno rejeita ações
    const resAtordoado = actor.validarAcoesTurno(['padrao']);
    assert.equal(resAtordoado.valido, false);
    assert.ok(resAtordoado.motivo.includes('incapacitado') || resAtordoado.motivo.includes('impossibilitado'));

    // E também rejeita reações
    const resReacaoAtordoado = actor.validarReacao(1, { foraDoTurno: true });
    assert.equal(resReacaoAtordoado.valido, false);
    assert.ok(resReacaoAtordoado.motivo.includes('incapacitado'));
  });
});
