/**
 * Módulo de Regras Canônicas para Economia Estrita do Turno (Mighty Blade 3ª Edição).
 *
 * Subtítulo 23: Economia Estrita do Turno
 *
 * Regras Canônicas de Ações por Turno:
 * 1. Combinações Válidas por Turno:
 *    - 1 Ação de Rodada Completa + Ações Livres
 *    - 1 Ação Padrão + 1 Ação de Movimento + Ações Livres
 *    - 2 Ações de Movimento + Ações Livres (troca de Ação Padrão por Ação de Movimento)
 *    - Subconjuntos válidos (apenas 1 Ação Padrão, apenas 1 Ação de Movimento, ou apenas Ações Livres)
 *
 * 2. Regra Negativa Restritiva:
 *    - É expressamente PROIBIDO utilizar uma Ação de Movimento para realizar uma segunda
 *      Ação Padrão no mesmo turno (podeTrocarMovimentoPorPadrao = false).
 *    - Combinações com 2 ou mais Ações Padrão são sempre rejeitadas.
 *
 * 3. Suporte a Reações:
 *    - Exatamente 1 Reação por rodada, realizada fora do turno do personagem.
 */

/**
 * Constantes dos Tipos Canônicos de Ação no Mighty Blade 3e.
 */
export const TIPOS_ACAO = Object.freeze({
  PADRAO: "padrao",
  MOVIMENTO: "movimento",
  RODADA_COMPLETA: "rodada_completa",
  LIVRE: "livre",
  REACAO: "reacao",
});

/**
 * Nomes canônicos das combinações válidas de turno.
 */
export const COMBINACOES_TURNO_VALIDAS = Object.freeze({
  RODADA_COMPLETA: "rodada_completa",
  PADRAO_E_MOVIMENTO: "padrao_e_movimento",
  DUPLO_MOVIMENTO: "duplo_movimento",
  APENAS_PADRAO: "apenas_padrao",
  APENAS_MOVIMENTO: "apenas_movimento",
  APENAS_LIVRE: "apenas_livre",
  VAZIO: "vazio",
});

/**
 * Limite canônico de Reações por rodada fora do turno.
 */
export const LIMITE_REACOES_POR_RODADA = 1;

/**
 * Regra Negativa Restritiva:
 * É expressamente PROIBIDO utilizar uma Ação de Movimento para realizar uma segunda
 * Ação Padrão no mesmo turno (podeTrocarMovimentoPorPadrao = false).
 */
export const podeTrocarMovimentoPorPadrao = false;
export const PODE_TROCAR_MOVIMENTO_POR_PADRAO = false;

/**
 * Normaliza strings com acentos e caixa alta para slug limpo.
 * @param {string} str
 * @returns {string}
 */
export function normalizarTexto(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Normaliza o tipo de ação informado para um dos tipos canônicos de TIPOS_ACAO.
 * Aceita variações em português, inglês, slugs com hífens e underlines.
 *
 * @param {string|object} entrada Nome ou objeto da ação
 * @returns {string|null} Tipo normalizado ou null se não for reconhecido
 */
export function normalizarTipoAcao(entrada) {
  if (!entrada) return null;

  let valor = entrada;
  if (typeof entrada === "object") {
    valor = entrada.tipo || entrada.type || entrada.acao || entrada.name || entrada.id || "";
  }

  const s = String(valor || "")
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");

  // Ação de Rodada Completa
  if (
    s === "rodada_completa" ||
    s === "rodadacompleta" ||
    s === "completa" ||
    s === "completo" ||
    s === "acao_completa" ||
    s === "acao_de_rodada_completa" ||
    s === "full_round" ||
    s === "full_round_action" ||
    s === "full"
  ) {
    return TIPOS_ACAO.RODADA_COMPLETA;
  }

  // Ação Padrão
  if (
    s === "padrao" ||
    s === "acao_padrao" ||
    s === "standard" ||
    s === "standard_action"
  ) {
    return TIPOS_ACAO.PADRAO;
  }

  // Ação de Movimento
  if (
    s === "movimento" ||
    s === "acao_movimento" ||
    s === "acao_de_movimento" ||
    s === "move" ||
    s === "move_action" ||
    s === "mov"
  ) {
    return TIPOS_ACAO.MOVIMENTO;
  }

  // Ação Livre
  if (
    s === "livre" ||
    s === "acao_livre" ||
    s === "free" ||
    s === "free_action"
  ) {
    return TIPOS_ACAO.LIVRE;
  }

  // Reação
  if (
    s === "reacao" ||
    s === "acao_reacao" ||
    s === "acao_de_reacao" ||
    s === "reaction" ||
    s === "react"
  ) {
    return TIPOS_ACAO.REACAO;
  }

  return null;
}

/**
 * Contabiliza o número de cada tipo de ação a partir de uma lista ou objeto.
 *
 * @param {Array<string|object>|object} acoesRealizadas
 * @returns {{
 *   rodadaCompleta: number,
 *   padrao: number,
 *   movimento: number,
 *   livre: number,
 *   reacao: number,
 *   desconhecidas: Array<string|object>,
 *   total: number
 * }}
 */
export function contarAcoes(acoesRealizadas) {
  const contagem = {
    rodadaCompleta: 0,
    padrao: 0,
    movimento: 0,
    livre: 0,
    reacao: 0,
    desconhecidas: [],
    total: 0,
  };

  if (!acoesRealizadas) {
    return contagem;
  }

  // Caso 1: Array de ações
  if (Array.isArray(acoesRealizadas)) {
    for (const item of acoesRealizadas) {
      contagem.total += 1;
      const tipo = normalizarTipoAcao(item);
      switch (tipo) {
        case TIPOS_ACAO.RODADA_COMPLETA:
          contagem.rodadaCompleta += 1;
          break;
        case TIPOS_ACAO.PADRAO:
          contagem.padrao += 1;
          break;
        case TIPOS_ACAO.MOVIMENTO:
          contagem.movimento += 1;
          break;
        case TIPOS_ACAO.LIVRE:
          contagem.livre += 1;
          break;
        case TIPOS_ACAO.REACAO:
          contagem.reacao += 1;
          break;
        default:
          contagem.desconhecidas.push(item);
          break;
      }
    }
    return contagem;
  }

  // Caso 2: Objeto com contadores diretos (ex: { padrao: 1, movimento: 1 })
  if (typeof acoesRealizadas === "object") {
    // Se o objeto possui uma propriedade interna `acoes` (objeto de resultado)
    const fonte = (acoesRealizadas.acoes && typeof acoesRealizadas.acoes === "object")
      ? acoesRealizadas.acoes
      : acoesRealizadas;

    for (const [chave, qtdRaw] of Object.entries(fonte)) {
      if (
        chave === "total" ||
        chave === "desconhecidas" ||
        chave === "erros" ||
        chave === "invalidos" ||
        chave === "valido" ||
        chave === "combinacao" ||
        chave === "motivo" ||
        chave === "podeTrocarMovimentoPorPadrao" ||
        chave === "acoes" ||
        chave === "restantes"
      ) {
        continue;
      }
      const qtd = Math.max(0, Number(qtdRaw) || 0);
      if (qtd === 0) continue;

      const tipo = normalizarTipoAcao(chave);
      switch (tipo) {
        case TIPOS_ACAO.RODADA_COMPLETA:
          contagem.rodadaCompleta += qtd;
          contagem.total += qtd;
          break;
        case TIPOS_ACAO.PADRAO:
          contagem.padrao += qtd;
          contagem.total += qtd;
          break;
        case TIPOS_ACAO.MOVIMENTO:
          contagem.movimento += qtd;
          contagem.total += qtd;
          break;
        case TIPOS_ACAO.LIVRE:
          contagem.livre += qtd;
          contagem.total += qtd;
          break;
        case TIPOS_ACAO.REACAO:
          contagem.reacao += qtd;
          contagem.total += qtd;
          break;
        default:
          contagem.desconhecidas.push({ [chave]: qtdRaw });
          contagem.total += qtd;
          break;
      }
    }
    return contagem;
  }

  // Caso 3: String única (ex: 'padrao')
  if (typeof acoesRealizadas === "string") {
    contagem.total = 1;
    const tipo = normalizarTipoAcao(acoesRealizadas);
    switch (tipo) {
      case TIPOS_ACAO.RODADA_COMPLETA:
        contagem.rodadaCompleta = 1;
        break;
      case TIPOS_ACAO.PADRAO:
        contagem.padrao = 1;
        break;
      case TIPOS_ACAO.MOVIMENTO:
        contagem.movimento = 1;
        break;
      case TIPOS_ACAO.LIVRE:
        contagem.livre = 1;
        break;
      case TIPOS_ACAO.REACAO:
        contagem.reacao = 1;
        break;
      default:
        contagem.desconhecidas.push(acoesRealizadas);
        break;
    }
    return contagem;
  }

  return contagem;
}

/**
 * Valida a economia estrita de ações de um turno conforme as regras do Mighty Blade 3e.
 *
 * Combinações Válidas por Turno:
 * 1. 1 Ação de Rodada Completa + Ações Livres
 * 2. 1 Ação Padrão + 1 Ação de Movimento + Ações Livres
 * 3. 2 Ações de Movimento + Ações Livres (troca de Padrão por Movimento)
 * 4. Subconjuntos válidos (apenas 1 Ação Padrão, apenas 1 Ação de Movimento, ou apenas Ações Livres)
 *
 * Regra Negativa Restritiva:
 * - É expressamente PROIBIDO utilizar uma Ação de Movimento para realizar uma segunda Ação Padrão
 *   no mesmo turno (podeTrocarMovimentoPorPadrao = false, rejeita combinação com 2 Ações Padrão).
 *
 * Suporte a Reações:
 * - Suporte a 1 Reação por rodada fora do turno (foraDoTurno: true).
 *
 * @param {Array<string|object>|object|string} acoesRealizadas Lista ou contagem de ações do turno
 * @param {object} [opcoes={}] Opções adicionais de validação
 * @param {boolean} [opcoes.foraDoTurno=false] Se a validação ocorre fora do turno do personagem
 * @param {number} [opcoes.reacoesNaRodada=0] Total de reações já gastas pelo personagem na rodada
 * @param {object} [opcoes.actor=null] Referência do Ator para checar capacidade de agir
 * @returns {{
 *   valido: boolean,
 *   combinacao: string|null,
 *   podeTrocarMovimentoPorPadrao: boolean,
 *   acoes: {
 *     rodadaCompleta: number,
 *     padrao: number,
 *     movimento: number,
 *     livre: number,
 *     reacao: number
 *   },
 *   erros: string[],
 *   motivo: string|null
 * }}
 */
export function validarAcoesTurno(acoesRealizadas, opcoes = {}) {
  const {
    foraDoTurno = false,
    reacoesNaRodada = 0,
    actor = null,
  } = opcoes;

  const contagem = contarAcoes(acoesRealizadas);
  const erros = [];
  let combinacao = null;

  // 1. Verificação de ator incapacitado (se fornecido)
  if (actor) {
    if (typeof actor.podeRealizarAcoes === "function" && !actor.podeRealizarAcoes()) {
      erros.push("Personagem está incapacitado ou impossibilitado de realizar ações no turno.");
    }
  }

  // 2. Ações desconhecidas
  if (contagem.desconhecidas.length > 0) {
    erros.push(
      `Tipo(s) de ação não reconhecido(s): ${JSON.stringify(contagem.desconhecidas)}.`
    );
  }

  // 3. Validação Fora do Turno (onde apenas Reação <= 1 e Ações Livres são permitidas)
  if (foraDoTurno) {
    if (contagem.rodadaCompleta > 0) {
      erros.push("Ação de Rodada Completa não pode ser realizada fora do turno.");
    }
    if (contagem.padrao > 0) {
      erros.push("Ação Padrão não pode ser realizada fora do turno.");
    }
    if (contagem.movimento > 0) {
      erros.push("Ação de Movimento não pode ser realizada fora do turno.");
    }

    const totalReacoes = contagem.reacao + reacoesNaRodada;
    if (totalReacoes > LIMITE_REACOES_POR_RODADA) {
      erros.push(
        `Limite de Reações excedido: permitido no máximo ${LIMITE_REACOES_POR_RODADA} Reação por rodada fora do turno (tentou ${totalReacoes}).`
      );
    }

    if (actor && typeof actor.podeRealizarReacoes === "function" && contagem.reacao > 0) {
      if (!actor.podeRealizarReacoes()) {
        erros.push("Personagem está incapacitado de realizar Reações.");
      }
    }

    const validoFora = erros.length === 0;
    return {
      valido: validoFora,
      combinacao: validoFora ? (contagem.reacao > 0 ? "reacao_fora_do_turno" : COMBINACOES_TURNO_VALIDAS.APENAS_LIVRE) : null,
      podeTrocarMovimentoPorPadrao: false,
      acoes: {
        rodadaCompleta: contagem.rodadaCompleta,
        padrao: contagem.padrao,
        movimento: contagem.movimento,
        livre: contagem.livre,
        reacao: contagem.reacao,
      },
      erros,
      motivo: erros.length > 0 ? erros.join(" ") : null,
    };
  }

  // 4. Validação Dentro do Próprio Turno

  // 4.1 Validação de Reações no turno (reação é por rodada fora do turno)
  if (contagem.reacao + reacoesNaRodada > LIMITE_REACOES_POR_RODADA) {
    erros.push(
      `Limite de Reações excedido: permitido no máximo ${LIMITE_REACOES_POR_RODADA} Reação por rodada fora do turno.`
    );
  }

  // 4.2 Ação de Rodada Completa
  if (contagem.rodadaCompleta > 0) {
    if (contagem.rodadaCompleta > 1) {
      erros.push("É permitido no máximo 1 Ação de Rodada Completa por turno.");
    }
    if (contagem.padrao > 0 || contagem.movimento > 0) {
      erros.push(
        "Ação de Rodada Completa consome todo o turno do personagem e é incompatível com Ação Padrão ou Ação de Movimento adicionais."
      );
    }

    if (erros.length === 0) {
      combinacao = COMBINACOES_TURNO_VALIDAS.RODADA_COMPLETA;
    }
  } else {
    // 4.3 Combinações de Ação Padrão e Ação de Movimento

    // REGRA NEGATIVA RESTRITIVA:
    // Proibido utilizar Ação de Movimento para realizar uma segunda Ação Padrão (podeTrocarMovimentoPorPadrao = false)
    if (contagem.padrao >= 2) {
      erros.push(
        "É expressamente PROIBIDO utilizar uma Ação de Movimento para realizar uma segunda Ação Padrão no mesmo turno (podeTrocarMovimentoPorPadrao = false). Rejeita combinação com 2 ou mais Ações Padrão."
      );
    } else if (contagem.padrao === 1) {
      if (contagem.movimento === 0) {
        combinacao = COMBINACOES_TURNO_VALIDAS.APENAS_PADRAO;
      } else if (contagem.movimento === 1) {
        // Combinação 2: 1 Ação Padrão + 1 Ação de Movimento + Ações Livres
        combinacao = COMBINACOES_TURNO_VALIDAS.PADRAO_E_MOVIMENTO;
      } else {
        // contagem.movimento > 1 com 1 Ação Padrão
        erros.push(
          `Excesso de ações no turno: com 1 Ação Padrão, é permitida no máximo 1 Ação de Movimento (foram realizadas ${contagem.movimento}).`
        );
      }
    } else {
      // contagem.padrao === 0
      if (contagem.movimento === 0) {
        combinacao = contagem.livre > 0
          ? COMBINACOES_TURNO_VALIDAS.APENAS_LIVRE
          : COMBINACOES_TURNO_VALIDAS.VAZIO;
      } else if (contagem.movimento === 1) {
        combinacao = COMBINACOES_TURNO_VALIDAS.APENAS_MOVIMENTO;
      } else if (contagem.movimento === 2) {
        // Combinação 3: 2 Ações de Movimento + Ações Livres (trocou Padrão por Movimento)
        combinacao = COMBINACOES_TURNO_VALIDAS.DUPLO_MOVIMENTO;
      } else {
        // contagem.movimento > 2
        erros.push(
          `Excesso de ações de movimento: permitido no máximo 2 Ações de Movimento por turno (foram realizadas ${contagem.movimento}).`
        );
      }
    }
  }

  const valido = erros.length === 0;

  return {
    valido,
    combinacao: valido ? combinacao : null,
    podeTrocarMovimentoPorPadrao: false,
    acoes: {
      rodadaCompleta: contagem.rodadaCompleta,
      padrao: contagem.padrao,
      movimento: contagem.movimento,
      livre: contagem.livre,
      reacao: contagem.reacao,
    },
    erros,
    motivo: erros.length > 0 ? erros.join(" ") : null,
  };
}

/**
 * Valida a execução de uma Reação conforme a regra canônica:
 * "Suporte a 1 Reação por rodada fora do turno."
 *
 * @param {number|Array|object} reacoesTentadas Reações a realizar
 * @param {object} [opcoes={}]
 * @param {number} [opcoes.reacoesJaGastas=0] Reações já utilizadas nesta rodada
 * @param {boolean} [opcoes.foraDoTurno=true] Se está sendo executada fora do próprio turno
 * @param {object} [opcoes.actor=null] Ator opcional para checagem de condições
 * @returns {{
 *   valido: boolean,
 *   reacoesUsadas: number,
 *   reacoesRestantes: number,
 *   limite: number,
 *   motivo: string|null
 * }}
 */
export function validarReacao(reacoesTentadas = 1, opcoes = {}) {
  const {
    reacoesJaGastas = 0,
    foraDoTurno = true,
    actor = null,
  } = opcoes;

  let qtd = 1;
  if (typeof reacoesTentadas === "number") {
    qtd = Math.max(0, reacoesTentadas);
  } else if (Array.isArray(reacoesTentadas)) {
    qtd = reacoesTentadas.length;
  } else if (typeof reacoesTentadas === "object" && reacoesTentadas !== null) {
    qtd = Math.max(0, Number(reacoesTentadas.reacao || reacoesTentadas.qtd || 1));
  }

  const erros = [];

  if (actor && typeof actor.podeRealizarReacoes === "function" && !actor.podeRealizarReacoes()) {
    erros.push("Personagem está incapacitado de realizar Reações (atordoado, inconsciente, por um fio ou morto).");
  }

  if (!foraDoTurno) {
    erros.push("Reações devem ser realizadas fora do turno do personagem.");
  }

  const total = reacoesJaGastas + qtd;
  if (total > LIMITE_REACOES_POR_RODADA) {
    erros.push(
      `Limite de Reações excedido: permitido no máximo ${LIMITE_REACOES_POR_RODADA} Reação por rodada (já usadas: ${reacoesJaGastas}, tentadas: ${qtd}, total: ${total}).`
    );
  }

  const valido = erros.length === 0;

  return {
    valido,
    reacoesUsadas: total,
    reacoesRestantes: Math.max(0, LIMITE_REACOES_POR_RODADA - total),
    limite: LIMITE_REACOES_POR_RODADA,
    motivo: erros.length > 0 ? erros.join(" ") : null,
  };
}

/**
 * Avalia se uma nova ação específica pode ser executada dado o histórico atual de ações do turno.
 *
 * @param {Array<string|object>|object} acoesAtuais Ações já executadas neste turno
 * @param {string|object} novaAcao Ação pretendida
 * @param {object} [opcoes={}]
 * @returns {{
 *   podeExecutar: boolean,
 *   motivo: string|null,
 *   estadoProjetado: object
 * }}
 */
export function podeExecutarAcao(acoesAtuais, novaAcao, opcoes = {}) {
  const tipoNova = normalizarTipoAcao(novaAcao);
  if (!tipoNova) {
    return {
      podeExecutar: false,
      motivo: `Tipo de ação desconhecido: ${JSON.stringify(novaAcao)}.`,
      estadoProjetado: null,
    };
  }

  const contagemAtual = contarAcoes(acoesAtuais);

  // Projeta o novo estado
  const contagemProjetada = { ...contagemAtual };
  if (tipoNova === TIPOS_ACAO.RODADA_COMPLETA) contagemProjetada.rodadaCompleta += 1;
  else if (tipoNova === TIPOS_ACAO.PADRAO) contagemProjetada.padrao += 1;
  else if (tipoNova === TIPOS_ACAO.MOVIMENTO) contagemProjetada.movimento += 1;
  else if (tipoNova === TIPOS_ACAO.LIVRE) contagemProjetada.livre += 1;
  else if (tipoNova === TIPOS_ACAO.REACAO) contagemProjetada.reacao += 1;

  const validacao = validarAcoesTurno(contagemProjetada, opcoes);

  return {
    podeExecutar: validacao.valido,
    motivo: validacao.motivo,
    estadoProjetado: validacao,
  };
}

/**
 * Retorna as ações que o personagem ainda tem disponíveis no turno.
 *
 * @param {Array<string|object>|object} acoesAtuais
 * @returns {{
 *   podeRodadaCompleta: boolean,
 *   podePadrao: boolean,
 *   podeMovimento: boolean,
 *   podeLivre: boolean,
 *   movimentosRestantes: number,
 *   padraoRestante: number,
 *   rodadaCompletaRestante: number
 * }}
 */
export function obterAcoesRestantes(acoesAtuais) {
  const contagem = contarAcoes(acoesAtuais);

  const testeRodada = podeExecutarAcao(contagem, TIPOS_ACAO.RODADA_COMPLETA);
  const testePadrao = podeExecutarAcao(contagem, TIPOS_ACAO.PADRAO);
  const testeMovimento = podeExecutarAcao(contagem, TIPOS_ACAO.MOVIMENTO);

  let padraoRestante = 0;
  if (testePadrao.podeExecutar) padraoRestante = 1;

  let movimentosRestantes = 0;
  if (testeMovimento.podeExecutar) {
    // Se não gastou padrão nem movimento, pode fazer até 2 movimentos
    if (contagem.padrao === 0 && contagem.movimento === 0 && contagem.rodadaCompleta === 0) {
      movimentosRestantes = 2;
    } else if (contagem.padrao === 0 && contagem.movimento === 1) {
      movimentosRestantes = 1;
    } else if (contagem.padrao === 1 && contagem.movimento === 0) {
      movimentosRestantes = 1;
    }
  }

  return {
    podeRodadaCompleta: testeRodada.podeExecutar,
    podePadrao: testePadrao.podeExecutar,
    podeMovimento: testeMovimento.podeExecutar,
    podeLivre: true,
    movimentosRestantes,
    padraoRestante,
    rodadaCompletaRestante: testeRodada.podeExecutar ? 1 : 0,
  };
}

/**
 * Controlador de Economia de Ações por Turno e Rodada.
 * Gerencia o ciclo de vida completo do turno de combate de um personagem.
 */
export class ControladorEconomiaTurno {
  /**
   * @param {object} [opcoes={}]
   * @param {object} [opcoes.actor=null] Ator vinculado
   */
  constructor(opcoes = {}) {
    this.actor = opcoes.actor || null;
    this.emTurno = false;
    this.acoesNoTurno = [];
    this.reacoesNaRodada = 0;
    this.rodadaAtual = 1;
  }

  get podeTrocarMovimentoPorPadrao() {
    return false;
  }

  /**
   * Inicia o turno do personagem.
   */
  iniciarTurno() {
    this.emTurno = true;
    this.acoesNoTurno = [];
    return this.obterStatus();
  }

  /**
   * Finaliza o turno do personagem.
   */
  finalizarTurno() {
    const status = this.obterStatus();
    this.emTurno = false;
    return status;
  }

  /**
   * Inicia uma nova rodada de combate (reseta o contador de Reações).
   */
  iniciarNovaRodada() {
    this.rodadaAtual += 1;
    this.reacoesNaRodada = 0;
    this.acoesNoTurno = [];
    this.emTurno = false;
  }

  /**
   * Executa uma ação durante o turno.
   * Lança exceção se violar as regras canônicas de economia de ações.
   *
   * @param {string|object} acao
   * @returns {object} Validação da ação
   */
  executarAcao(acao) {
    if (!this.emTurno) {
      throw new Error("Não é possível realizar ações de turno fora do próprio turno do personagem.");
    }

    const checagem = podeExecutarAcao(this.acoesNoTurno, acao, { actor: this.actor });
    if (!checagem.podeExecutar) {
      throw new Error(`Ação ilegal no turno: ${checagem.motivo}`);
    }

    this.acoesNoTurno.push(acao);
    return {
      sucesso: true,
      acao,
      acoesRealizadas: [...this.acoesNoTurno],
      restantes: obterAcoesRestantes(this.acoesNoTurno),
    };
  }

  /**
   * Executa uma Reação fora do turno.
   *
   * @param {object} [detalhes={}]
   * @returns {object}
   */
  executarReacao(detalhes = {}) {
    if (this.emTurno) {
      throw new Error("Reações canônicas devem ser realizadas fora do turno do personagem.");
    }

    const validacao = validarReacao(1, {
      reacoesJaGastas: this.reacoesNaRodada,
      foraDoTurno: true,
      actor: this.actor,
    });

    if (!validacao.valido) {
      throw new Error(`Reação ilegal: ${validacao.motivo}`);
    }

    this.reacoesNaRodada += 1;
    return {
      sucesso: true,
      reacoesNaRodada: this.reacoesNaRodada,
      reacoesRestantes: Math.max(0, LIMITE_REACOES_POR_RODADA - this.reacoesNaRodada),
      detalhes,
    };
  }

  /**
   * Obtém o status consolidado de ações e reações.
   */
  obterStatus() {
    const validacao = validarAcoesTurno(this.acoesNoTurno, {
      foraDoTurno: !this.emTurno,
      reacoesNaRodada: this.reacoesNaRodada,
      actor: this.actor,
    });

    return {
      emTurno: this.emTurno,
      rodada: this.rodadaAtual,
      acoesRealizadas: [...this.acoesNoTurno],
      contagem: validacao.acoes,
      combinacao: validacao.combinacao,
      valido: validacao.valido,
      reacoesNaRodada: this.reacoesNaRodada,
      reacoesRestantes: Math.max(0, LIMITE_REACOES_POR_RODADA - this.reacoesNaRodada),
      restantes: obterAcoesRestantes(this.acoesNoTurno),
      podeTrocarMovimentoPorPadrao: false,
    };
  }
}
