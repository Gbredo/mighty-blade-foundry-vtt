/**
 * Suíte de Testes Automatizados - Subtítulo 15: Máquina de Estados e Condições do Personagem
 * Mighty Blade 3ª Edição (Foundry VTT v14)
 *
 * Casos de Teste Cobertos:
 * - Caso 40: Máquina de Estados de Saúde (Saudável, Por um Fio, Morto)
 *   * Saudável -> Por um Fio quando PV chega a 0.
 *   * Por um Fio -> Morto ao sofrer qualquer dano adicional enquanto estiver Por um Fio ou falhar no teste de sobrevivência.
 *   * Cura enquanto Por um Fio restaura para Saudável com o valor curado.
 * - Caso 41: Condição Atordoado (Ações e Reações)
 *   * Não pode realizar Ações ou Reações no turno (podeRealizarAcoes e podeRealizarReacoes retornam false).
 * - Caso 42: Condição Cego (Inaptidão e Penalidade de Defesa)
 *   * Todos os ataques e testes de percepção visual tornam-se Inaptos (1d6).
 *   * Defesa sofre penalidade (-2) refletida nos cálculos derivados.
 * - Caso 43: Condição Amedrontado (Fonte de Medo e Penalidade em Testes)
 *   * Impede aproximação da fonte de medo.
 *   * Aplica penalidade em testes (-2).
 * - Caso 44: Interações Compostas de Estados e Condições em Combate
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createMockActor,
  atualizarEstadoSaude,
  aplicarCondicao,
  removerCondicao,
  obterEstadoSaude,
  definirEstadoSaude,
  falharTesteSobrevivencia,
  passarTesteSobrevivencia,
  isMorto,
  isPorUmFio,
  isSaudavel,
  podeRealizarAcoes,
  podeRealizarReacoes,
  isAtaqueInapto,
  isPercepcaoVisualInapta,
  obterPenalidadeDefesa,
  obterPenalidadeTestes,
  obterFonteMedo,
  podeAproximarFonteMedo,
  ESTADO_SAUDAVEL,
  ESTADO_POR_UM_FIO,
  ESTADO_MORTO,
  CONDICAO_ATORDOADO,
  CONDICAO_CEGO,
  CONDICAO_AMEDRONTADO,
} from './test-helper.mjs';

// ============================================================================
// CASO 40: MÁQUINA DE ESTADOS DE SAÚDE (SAUDÁVEL, POR UM FIO, MORTO)
// ============================================================================
test('Caso 40: Máquina de Estados de Saúde', async (t) => {
  await t.test('40.1 - Personagem com PV > 0 inicia no estado Saudável', () => {
    const actor = createMockActor({
      name: 'Guerreiro Vigoroso',
      resources: { vida: { value: 60, max: 60 } },
    });

    assert.equal(obterEstadoSaude(actor), ESTADO_SAUDAVEL, 'Estado inicial deve ser Saudável');
    assert.equal(isSaudavel(actor), true, 'isSaudavel deve retornar true');
    assert.equal(isPorUmFio(actor), false, 'isPorUmFio deve retornar false');
    assert.equal(isMorto(actor), false, 'isMorto deve retornar false');
  });

  await t.test('40.2 - Saudável -> Por um Fio quando PV chega exatamente a 0', () => {
    const actor = createMockActor({
      name: 'Defensor Bravo',
      resources: { vida: { value: 45, max: 60 } },
    });

    const resultado = atualizarEstadoSaude(actor, -45);

    assert.equal(resultado.estadoAnterior, ESTADO_SAUDAVEL, 'Estado anterior era Saudável');
    assert.equal(resultado.novoEstado, ESTADO_POR_UM_FIO, 'Novo estado deve ser Por um Fio');
    assert.equal(resultado.vidaAtual, 0, 'PV atual deve ser 0');
    assert.equal(resultado.porUmFio, true, 'Propriedade porUmFio deve ser true');
    assert.equal(actor.system.resources.vida.value, 0, 'PV no modelo do Ator deve ser 0');
    assert.equal(isPorUmFio(actor), true, 'isPorUmFio(actor) deve ser true');
    assert.equal(isSaudavel(actor), false, 'isSaudavel(actor) deve ser false');
  });

  await t.test('40.3 - Saudável -> Por um Fio quando dano excede o PV restante (Overkill clampa em 0)', () => {
    const actor = createMockActor({
      name: 'Ladino Desavisado',
      resources: { vida: { value: 20, max: 60 } },
    });

    // Sofre 50 de dano tendo apenas 20 PV
    const resultado = atualizarEstadoSaude(actor, -50);

    assert.equal(resultado.novoEstado, ESTADO_POR_UM_FIO, 'Overkill reduz a 0 e deixa Por um Fio');
    assert.equal(resultado.vidaAtual, 0, 'PV não pode ser negativo');
    assert.equal(actor.system.resources.vida.value, 0, 'PV no modelo é clampado em 0');
    assert.equal(isPorUmFio(actor), true, 'Personagem está Por um Fio');
    assert.equal(isMorto(actor), false, 'Primeiro golpe fatal deixa Por um Fio, não Morto');
  });

  await t.test('40.4 - Por um Fio -> Morto ao sofrer qualquer dano adicional enquanto estiver Por um Fio', () => {
    const actor = createMockActor({
      name: 'Guerreiro Caído',
      resources: { vida: { value: 0, max: 60 } },
    });
    definirEstadoSaude(actor, ESTADO_POR_UM_FIO);

    assert.equal(isPorUmFio(actor), true, 'Pré-requisito: Ator está Por um Fio');

    // Sofre 1 ponto de dano adicional
    const resultado = atualizarEstadoSaude(actor, -1);

    assert.equal(resultado.estadoAnterior, ESTADO_POR_UM_FIO);
    assert.equal(resultado.novoEstado, ESTADO_MORTO, 'Qualquer dano adicional enquanto Por um Fio mata');
    assert.equal(resultado.morto, true, 'Propriedade morto deve ser true');
    assert.equal(isMorto(actor), true, 'isMorto(actor) deve retornar true');
    assert.equal(isPorUmFio(actor), false, 'isPorUmFio(actor) deve retornar false');
    assert.equal(actor.system.resources.vida.value, 0, 'PV continua 0');
  });

  await t.test('40.5 - Por um Fio -> Morto ao sofrer dano massivo enquanto estiver Por um Fio', () => {
    const actor = createMockActor({
      name: 'Mago Vulnerável',
      resources: { vida: { value: 0, max: 60 } },
    });
    definirEstadoSaude(actor, ESTADO_POR_UM_FIO);

    // Sofre 40 de dano enquanto Por um Fio
    const resultado = atualizarEstadoSaude(actor, -40);

    assert.equal(resultado.novoEstado, ESTADO_MORTO);
    assert.equal(isMorto(actor), true, 'Personagem morre com dano massivo em Por um Fio');
  });

  await t.test('40.6 - Por um Fio -> Morto ao falhar no teste de sobrevivência', () => {
    const actor = createMockActor({
      name: 'Paladino Agonizante',
      resources: { vida: { value: 0, max: 60 } },
    });
    definirEstadoSaude(actor, ESTADO_POR_UM_FIO);

    // Falha explícita no teste de sobrevivência
    const resultado = falharTesteSobrevivencia(actor);

    assert.equal(resultado.novoEstado, ESTADO_MORTO, 'Falha no teste de sobrevivência mata');
    assert.equal(isMorto(actor), true);
    assert.equal(actor.system.details.estadoSaude, ESTADO_MORTO);
  });

  await t.test('40.7 - Por um Fio mantém-se Por um Fio ao ter sucesso no teste de sobrevivência', () => {
    const actor = createMockActor({
      name: 'Bárbaro Resistente',
      resources: { vida: { value: 0, max: 60 } },
    });
    definirEstadoSaude(actor, ESTADO_POR_UM_FIO);

    const resultado = passarTesteSobrevivencia(actor);

    assert.equal(resultado.novoEstado, ESTADO_POR_UM_FIO, 'Sucesso mantém o personagem Por um Fio (estabilizado)');
    assert.equal(isPorUmFio(actor), true);
    assert.equal(isMorto(actor), false);
  });

  await t.test('40.8 - Cura enquanto Por um Fio restaura para Saudável com o valor curado', () => {
    const actor = createMockActor({
      name: 'Arqueiro Resgatado',
      resources: { vida: { value: 0, max: 60 } },
    });
    definirEstadoSaude(actor, ESTADO_POR_UM_FIO);

    // Recebe cura de 15 PV (ex: Poção de Cura ou magia de Sacerdote)
    const resultado = atualizarEstadoSaude(actor, 15);

    assert.equal(resultado.estadoAnterior, ESTADO_POR_UM_FIO);
    assert.equal(resultado.novoEstado, ESTADO_SAUDAVEL, 'Cura enquanto Por um Fio restaura para Saudável');
    assert.equal(resultado.vidaAtual, 15, 'PV deve ser restaurado com o valor curado (15)');
    assert.equal(actor.system.resources.vida.value, 15, 'PV no Ator deve ser 15');
    assert.equal(isSaudavel(actor), true, 'isSaudavel deve ser true');
    assert.equal(isPorUmFio(actor), false, 'isPorUmFio deve ser false');
  });

  await t.test('40.9 - Cura enquanto Por um Fio respeita o teto de PV máximo (clamping)', () => {
    const actor = createMockActor({
      name: 'Clérigo Curado',
      resources: { vida: { value: 0, max: 60 } },
    });
    definirEstadoSaude(actor, ESTADO_POR_UM_FIO);

    // Cura colossal de 100 PV tendo max 60
    const resultado = atualizarEstadoSaude(actor, 100);

    assert.equal(resultado.novoEstado, ESTADO_SAUDAVEL);
    assert.equal(resultado.vidaAtual, 60, 'Cura deve respeitar o PV máximo de 60');
    assert.equal(actor.system.resources.vida.value, 60);
  });

  await t.test('40.10 - Personagem Morto não é alterado por dano adicional nem por cura comum', () => {
    const actor = createMockActor({
      name: 'Herói Falecido',
      resources: { vida: { value: 0, max: 60 } },
    });
    definirEstadoSaude(actor, ESTADO_MORTO);

    // Tenta aplicar dano a cadáver
    const resDano = atualizarEstadoSaude(actor, -20);
    assert.equal(resDano.novoEstado, ESTADO_MORTO);
    assert.equal(isMorto(actor), true);

    // Tenta aplicar cura comum (sem flag de ressuscitar)
    const resCura = atualizarEstadoSaude(actor, 30);
    assert.equal(resCura.novoEstado, ESTADO_MORTO, 'Cura comum não revive morto');
    assert.equal(actor.system.resources.vida.value, 0, 'PV de morto permanece 0');
    assert.equal(isMorto(actor), true);
  });

  await t.test('40.11 - Ressurreição explícita (ressuscitar: true) restaura de Morto para Saudável', () => {
    const actor = createMockActor({
      name: 'Lázaro Renascido',
      resources: { vida: { value: 0, max: 60 } },
    });
    definirEstadoSaude(actor, ESTADO_MORTO);

    const res = atualizarEstadoSaude(actor, 25, { ressuscitar: true });

    assert.equal(res.novoEstado, ESTADO_SAUDAVEL, 'Ressurreição restaura para Saudável');
    assert.equal(res.vidaAtual, 25, 'PV é restaurado com o valor curado');
    assert.equal(isSaudavel(actor), true);
    assert.equal(isMorto(actor), false);
  });

  await t.test('40.12 - Condição Por um Fio e Morto refletida em details.estadoSaude, condicao e statuses', () => {
    const actor = createMockActor({
      name: 'Rastreador Teste',
      resources: { vida: { value: 10, max: 60 } },
    });

    // Fica Por um Fio
    atualizarEstadoSaude(actor, -10);
    assert.equal(actor.system.details.estadoSaude, ESTADO_POR_UM_FIO);
    assert.ok(actor.system.details.condicao.includes('Por um Fio'));

    // Morre
    atualizarEstadoSaude(actor, -1);
    assert.equal(actor.system.details.estadoSaude, ESTADO_MORTO);
    assert.ok(actor.system.details.condicao.includes('Morto'));
    assert.ok(!actor.system.details.condicao.includes('Por um Fio'));
  });
});

// ============================================================================
// CASO 41: CONDIÇÃO ATORDOADO (AÇÕES E REAÇÕES)
// ============================================================================
test('Caso 41: Condição Atordoado (Ações e Reações)', async (t) => {
  await t.test('41.1 - aplicarCondicao(actor, "Atordoado") registra nas aflições e texto de condições', () => {
    const actor = createMockActor({ name: 'Lutador' });

    aplicarCondicao(actor, CONDICAO_ATORDOADO);

    assert.ok(actor.system.details.condicao.includes('Atordoado'), 'details.condicao deve conter Atordoado');
    const aflicao = actor.system.details.aflicoes.find((a) => a.id === 'atordoado');
    assert.ok(aflicao, 'details.aflicoes deve conter registro de atordoado');
    assert.ok(aflicao.efeito.includes('Ações ou Reações'), 'Descrição da aflição deve citar Ações ou Reações');
  });

  await t.test('41.2 - Personagem Atordoado NÃO pode realizar Ações no turno (podeRealizarAcoes retorna false)', () => {
    const actor = createMockActor({ name: 'Combatente Golpeado' });
    aplicarCondicao(actor, CONDICAO_ATORDOADO);

    const podeAgir = podeRealizarAcoes(actor);
    assert.equal(podeAgir, false, 'Atordoado não pode realizar Ações no turno (deve retornar false)');
  });

  await t.test('41.3 - Personagem Atordoado NÃO pode realizar Reações no turno (podeRealizarReacoes retorna false)', () => {
    const actor = createMockActor({ name: 'Combatente Atordoado' });
    aplicarCondicao(actor, CONDICAO_ATORDOADO);

    const podeReagir = podeRealizarReacoes(actor);
    assert.equal(podeReagir, false, 'Atordoado não pode realizar Reações no turno (deve retornar false)');
  });

  await t.test('41.4 - Personagem sem Atordoado pode realizar Ações e Reações normalmente', () => {
    const actor = createMockActor({ name: 'Guerreiro Lúcido' });

    assert.equal(podeRealizarAcoes(actor), true, 'Personagem livre pode realizar Ações');
    assert.equal(podeRealizarReacoes(actor), true, 'Personagem livre pode realizar Reações');
  });

  await t.test('41.5 - Remoção de Atordoado restaura capacidade de realizar Ações e Reações', () => {
    const actor = createMockActor({ name: 'Monge Focado' });
    aplicarCondicao(actor, CONDICAO_ATORDOADO);
    assert.equal(podeRealizarAcoes(actor), false);

    removerCondicao(actor, CONDICAO_ATORDOADO);

    assert.equal(podeRealizarAcoes(actor), true, 'Após remoção, pode realizar Ações novamente');
    assert.equal(podeRealizarReacoes(actor), true, 'Após remoção, pode realizar Reações novamente');
    assert.ok(!actor.system.details.condicao.includes('Atordoado'), 'Atordoado foi retirado de details.condicao');
  });

  await t.test('41.6 - Atordoado mantém os ataques como Inaptos', () => {
    const actor = createMockActor({ name: 'Guerreiro Atordoado' });
    aplicarCondicao(actor, CONDICAO_ATORDOADO);

    assert.equal(isAtaqueInapto(actor), true, 'Ataques de personagem atordoado são Inaptos');
  });
});

// ============================================================================
// CASO 42: CONDIÇÃO CEGO (INAPTIDÃO E PENALIDADE DE DEFESA)
// ============================================================================
test('Caso 42: Condição Cego (Inaptidão e Penalidade de Defesa)', async (t) => {
  await t.test('42.1 - aplicarCondicao(actor, "Cego") registra no Ator', () => {
    const actor = createMockActor({ name: 'Ranger Emboscado' });

    aplicarCondicao(actor, CONDICAO_CEGO);

    assert.ok(actor.system.details.condicao.includes('Cego'));
    const aflicao = actor.system.details.aflicoes.find((a) => a.id === 'cego');
    assert.ok(aflicao, 'Aflição de Cego deve existir');
    assert.ok(aflicao.efeito.includes('Inaptos'), 'Deve mencionar Inaptos');
    assert.ok(aflicao.efeito.includes('-2'), 'Deve mencionar -2 na Defesa');
  });

  await t.test('42.2 - Todos os ataques tornam-se Inaptos (isAtaqueInapto retorna true)', () => {
    const actor = createMockActor({ name: 'Espadachim Cego' });
    aplicarCondicao(actor, CONDICAO_CEGO);

    assert.equal(isAtaqueInapto(actor), true, 'Todos os ataques tornam-se Inaptos para personagem Cego');
  });

  await t.test('42.3 - Testes de percepção visual tornam-se Inaptos (isPercepcaoVisualInapta retorna true)', () => {
    const actor = createMockActor({ name: 'Vigia Cego' });
    aplicarCondicao(actor, CONDICAO_CEGO);

    assert.equal(isPercepcaoVisualInapta(actor), true, 'Percepção visual torna-se Inapta para personagem Cego');
  });

  await t.test('42.4 - Defesa sofre penalidade canônica de -2 (obterPenalidadeDefesa retorna -2)', () => {
    const actor = createMockActor({ name: 'Defensor Cego' });
    aplicarCondicao(actor, CONDICAO_CEGO);

    const penalidade = obterPenalidadeDefesa(actor);
    assert.equal(penalidade, -2, 'Cego aplica penalidade de -2 na Defesa');
  });

  await t.test('42.5 - Recálculo de atributos derivados reflete a penalidade de -2 no Bloqueio e Esquiva', () => {
    // Força 3, Agilidade 3. Defesa Base = 5.
    // Bloqueio base = 5 + 3 = 8. Esquiva base = 5 + 3 = 8.
    const actor = createMockActor({
      name: 'Guerreiro com Escudo',
      attributes: { forca: 3, agilidade: 3, inteligencia: 2, vontade: 2 },
    });

    assert.equal(actor.system.defesas.bloqueio.value, 8, 'Bloqueio inicial é 8');
    assert.equal(actor.system.defesas.esquiva.value, 8, 'Esquiva inicial é 8');

    // Aplica Cego e recalcula
    aplicarCondicao(actor, CONDICAO_CEGO);
    actor.prepareDerivedData();

    assert.equal(actor.system.defesas.bloqueio.value, 6, 'Bloqueio reduz de 8 para 6 (-2)');
    assert.equal(actor.system.defesas.esquiva.value, 6, 'Esquiva reduz de 8 para 6 (-2)');
    assert.equal(actor.system.defesas.penalidadeCondicoes, -2);
  });

  await t.test('42.6 - Remoção de Cego encerra a inaptidão e anula a penalidade de Defesa', () => {
    const actor = createMockActor({
      name: 'Guerreiro Curado de Cegueira',
      attributes: { forca: 3, agilidade: 3 },
    });
    aplicarCondicao(actor, CONDICAO_CEGO);
    actor.prepareDerivedData();
    assert.equal(actor.system.defesas.bloqueio.value, 6);

    removerCondicao(actor, CONDICAO_CEGO);
    actor.prepareDerivedData();

    assert.equal(isAtaqueInapto(actor), false, 'Ataques não são mais inaptos');
    assert.equal(isPercepcaoVisualInapta(actor), false, 'Percepção visual normalizada');
    assert.equal(obterPenalidadeDefesa(actor), 0, 'Penalidade de defesa zerada');
    assert.equal(actor.system.defesas.bloqueio.value, 8, 'Bloqueio restaurado para 8');
    assert.equal(actor.system.defesas.esquiva.value, 8, 'Esquiva restaurada para 8');
  });
});

// ============================================================================
// CASO 43: CONDIÇÃO AMEDRONTADO (FONTE DE MEDO E PENALIDADE EM TESTES)
// ============================================================================
test('Caso 43: Condição Amedrontado (Fonte de Medo e Penalidade em Testes)', async (t) => {
  await t.test('43.1 - aplicarCondicao(actor, "Amedrontado", { fonte: "Dragão Vermelho" }) armazena dados', () => {
    const actor = createMockActor({ name: 'Aventureiro Aterrorizado' });

    aplicarCondicao(actor, CONDICAO_AMEDRONTADO, { fonte: 'Dragão Vermelho' });

    assert.ok(actor.system.details.condicao.includes('Amedrontado'));
    assert.equal(obterFonteMedo(actor), 'Dragão Vermelho');
  });

  await t.test('43.2 - Impede aproximação da fonte de medo (podeAproximarFonteMedo retorna false)', () => {
    const actor = createMockActor({ name: 'Guerreiro Amedrontado' });
    aplicarCondicao(actor, CONDICAO_AMEDRONTADO, { fonte: 'Dragão Vermelho' });

    const podeAproximar = podeAproximarFonteMedo(actor, 'Dragão Vermelho');
    assert.equal(podeAproximar, false, 'Não pode se aproximar da fonte do medo');

    // Se tentar se aproximar da fonte de medo em geral, também é bloqueado
    assert.equal(podeAproximarFonteMedo(actor, null), false);
  });

  await t.test('43.3 - Aplica penalidade canônica de -2 em testes (obterPenalidadeTestes retorna -2)', () => {
    const actor = createMockActor({ name: 'Ladino Aterrorizado' });
    aplicarCondicao(actor, CONDICAO_AMEDRONTADO, { fonte: 'Espectro Noturno' });

    const penalidade = obterPenalidadeTestes(actor);
    assert.equal(penalidade, -2, 'Amedrontado impõe penalidade de -2 em todos os testes');
  });

  await t.test('43.4 - Remoção de Amedrontado encerra a penalidade em testes e permite aproximação', () => {
    const actor = createMockActor({ name: 'Paladino Curado do Medo' });
    aplicarCondicao(actor, CONDICAO_AMEDRONTADO, { fonte: 'Espectro' });
    assert.equal(obterPenalidadeTestes(actor), -2);
    assert.equal(podeAproximarFonteMedo(actor, 'Espectro'), false);

    removerCondicao(actor, CONDICAO_AMEDRONTADO);

    assert.equal(obterPenalidadeTestes(actor), 0, 'Penalidade de testes removida (0)');
    assert.equal(podeAproximarFonteMedo(actor, 'Espectro'), true, 'Pode se aproximar livremente após o fim do medo');
    assert.ok(!actor.system.details.condicao.includes('Amedrontado'));
  });

  await t.test('43.5 - Personagem sem a condição Amedrontado opera livre de restrições de medo', () => {
    const actor = createMockActor({ name: 'Guerreiro Destemido' });

    assert.equal(obterPenalidadeTestes(actor), 0, 'Sem penalidade');
    assert.equal(podeAproximarFonteMedo(actor, 'Qualquer Inimigo'), true, 'Aproximação permitida');
  });
});

// ============================================================================
// CASO 44: INTERAÇÕES COMPOSTAS DE ESTADOS E CONDIÇÕES
// ============================================================================
test('Caso 44: Interações Compostas de Estados e Condições em Combate', async (t) => {
  await t.test('44.1 - Acúmulo de Cego e Amedrontado soma as restrições canônicas', () => {
    const actor = createMockActor({
      name: 'Vítima Acorrentada',
      attributes: { forca: 3, agilidade: 3 },
    });

    aplicarCondicao(actor, CONDICAO_CEGO);
    aplicarCondicao(actor, CONDICAO_AMEDRONTADO, { fonte: 'Arquimago' });
    actor.prepareDerivedData();

    assert.equal(isAtaqueInapto(actor), true, 'Ataques são Inaptos (por Cego)');
    assert.equal(obterPenalidadeDefesa(actor), -2, 'Defesa sofre -2 (por Cego)');
    assert.equal(obterPenalidadeTestes(actor), -2, 'Testes sofrem -2 (por Amedrontado)');
    assert.equal(podeAproximarFonteMedo(actor, 'Arquimago'), false, 'Impedido de aproximar (por Amedrontado)');
  });

  await t.test('44.2 - Atordoado acumulado com Cego: impede ações e mantém inaptidão e penalidade de defesa', () => {
    const actor = createMockActor({
      name: 'Combatente Debilitado',
      attributes: { forca: 2, agilidade: 2 },
    });

    aplicarCondicao(actor, CONDICAO_ATORDOADO);
    aplicarCondicao(actor, CONDICAO_CEGO);
    actor.prepareDerivedData();

    assert.equal(podeRealizarAcoes(actor), false, 'Sem ações');
    assert.equal(podeRealizarReacoes(actor), false, 'Sem reações');
    assert.equal(isAtaqueInapto(actor), true, 'Inapto');
    assert.equal(actor.system.defesas.bloqueio.value, 5, '5 + 2 - 2 = 5');
  });

  await t.test('44.3 - Ciclo completo letal: Saudável -> Dano até 0 -> Por um Fio -> Dano adicional -> Morto', () => {
    const actor = createMockActor({
      name: 'Guerreiro Trágico',
      resources: { vida: { value: 60, max: 60 } },
    });

    // Passo 1: Saudável
    assert.equal(obterEstadoSaude(actor), ESTADO_SAUDAVEL);
    assert.equal(podeRealizarAcoes(actor), true);

    // Passo 2: Sofre 60 de dano e cai Por um Fio
    const passo2 = atualizarEstadoSaude(actor, -60);
    assert.equal(passo2.novoEstado, ESTADO_POR_UM_FIO);
    assert.equal(actor.system.resources.vida.value, 0);
    assert.equal(podeRealizarAcoes(actor), false, 'Por um Fio não pode agir');

    // Passo 3: Sofre ataque de misericórdia (5 de dano adicional)
    const passo3 = atualizarEstadoSaude(actor, -5);
    assert.equal(passo3.novoEstado, ESTADO_MORTO);
    assert.equal(isMorto(actor), true);
    assert.equal(podeRealizarAcoes(actor), false, 'Morto não pode agir');
  });

  await t.test('44.4 - Ciclo de sobrevivência e cura: Saudável -> Dano -> Por um Fio -> Sucesso -> Cura -> Saudável', () => {
    const actor = createMockActor({
      name: 'Herói Resiliente',
      resources: { vida: { value: 60, max: 60 } },
    });

    // 1. Dano fatal deixa Por um Fio
    atualizarEstadoSaude(actor, -80);
    assert.equal(obterEstadoSaude(actor), ESTADO_POR_UM_FIO);

    // 2. Teste de sobrevivência bem-sucedido
    const resSobrevivencia = passarTesteSobrevivencia(actor);
    assert.equal(resSobrevivencia.novoEstado, ESTADO_POR_UM_FIO);
    assert.equal(isPorUmFio(actor), true);

    // 3. Aliado conjura cura de 30 PV
    const resCura = atualizarEstadoSaude(actor, 30);
    assert.equal(resCura.novoEstado, ESTADO_SAUDAVEL);
    assert.equal(actor.system.resources.vida.value, 30);
    assert.equal(isSaudavel(actor), true);
    assert.equal(podeRealizarAcoes(actor), true, 'Curado volta a poder agir');
  });

  await t.test('44.5 - Falha imediata de teste de sobrevivência: Saudável -> Por um Fio -> Falha -> Morto', () => {
    const actor = createMockActor({
      name: 'Ladino Desafortunado',
      resources: { vida: { value: 30, max: 60 } },
    });

    atualizarEstadoSaude(actor, -30);
    assert.equal(isPorUmFio(actor), true);

    // Falha de sobrevivência
    falharTesteSobrevivencia(actor);
    assert.equal(isMorto(actor), true);
    assert.equal(obterEstadoSaude(actor), ESTADO_MORTO);
  });

  await t.test('44.6 - Métodos de conveniência diretos no Mock Actor funcionam conforme esperado', () => {
    const actor = createMockActor({
      name: 'Campeão da Arena',
      resources: { vida: { value: 50, max: 60 } },
    });

    assert.equal(actor.obterEstadoSaude(), ESTADO_SAUDAVEL);
    assert.equal(actor.isSaudavel(), true);
    assert.equal(actor.podeRealizarAcoes(), true);

    // Método de instância atualizarEstadoSaude
    actor.atualizarEstadoSaude(-50);
    assert.equal(actor.isPorUmFio(), true);
    assert.equal(actor.podeRealizarAcoes(), false);

    // Método de instância aplicarCondicao
    actor.aplicarCondicao(CONDICAO_ATORDOADO);
    assert.equal(actor.temCondicao('atordoado'), true);

    actor.atualizarEstadoSaude(20);
    assert.equal(actor.isSaudavel(), true);
  });
});
