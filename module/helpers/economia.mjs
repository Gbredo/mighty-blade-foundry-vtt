/**
 * Subtítulo 22: Economia, Antecedentes e Progressão de Ouro (Mighty Blade 3e).
 *
 * Fontes Canônicas:
 * - Livro Básico de Regras: Criação de personagens, Antecedentes, Classes e Atributos.
 * - Guia do Vilão / Regras de Campanhas Avançadas: Progressão de moedas e compra de Antecedentes após o Nível 1.
 *
 * Regras Canônicas Principais:
 * 1. Criação no Nível 1:
 *    - Selecionar um Antecedente no Nível 1 consome 1 ponto de bônus de Atributo fornecido pela Classe.
 *    - A classe fornece originalmente +1 em dois Atributos (+2 no total); com Antecedente, fornece +1 em apenas um Atributo (+1 restante).
 *
 * 2. Aquisição Posterior (após o Nível 1):
 *    - Adquirir um Antecedente após o Nível 1 (Nível 2+) consome 1 Ponto de Evolução.
 *    - Penaliza o personagem nos Níveis 4, 7 e 10 a receber +1 em apenas 1 Atributo (em vez de +1 em dois).
 *
 * 3. Economia e Progressão de Ouro Inicial por Nível:
 *    - Campanhas iniciando acima do Nível 1 utilizam a tabela canônica de moedas iniciais:
 *      Nv 1: 500 | Nv 2: 850 | Nv 3: 1450 | Nv 4: 2450 | Nv 5: 4200 |
 *      Nv 6: 7200 | Nv 7: 12000 | Nv 8: 20500 | Nv 9: 35000 | Nv 10: 60000 moedas.
 *    - Fórmula de progressão de ouro: Ouro_N = Ouro_{N-1} + 70% do Ouro_{N-1}.
 */

import { ATRIBUTOS_CANONICOS } from "./progressao.mjs";
import { CANONICAL_CLASSES } from "../data/canonical-packs-data.mjs";
import { CANONICAL_ANTECEDENTES } from "./config.mjs";

// ============================================================================
// CONSTANTES CANÔNICAS
// ============================================================================

/**
 * Tabela canônica de ouro/moedas iniciais para campanhas iniciando em cada nível (1 a 10).
 * Valores oficiais de progressão de riqueza do Mighty Blade 3e.
 * @type {Readonly<Record<number, number>>}
 */
export const TABELA_OURO_INICIAL_POR_NIVEL = Object.freeze({
  1: 500,
  2: 850,
  3: 1450,
  4: 2450,
  5: 4200,
  6: 7200,
  7: 12000,
  8: 20500,
  9: 35000,
  10: 60000,
});

/**
 * Taxa percentual de crescimento da fórmula canônica de ouro entre níveis (+70%).
 * Fórmula: Ouro_N = Ouro_{N-1} + 70% do Ouro_{N-1} (ou Ouro_{N-1} * 1.70).
 */
export const TAXA_PROGRESSAO_OURO = 0.70;

/**
 * Valor base de moedas no Nível 1.
 */
export const OURO_BASE_NIVEL_1 = 500;

/**
 * Níveis que concedem aumento de atributo e que são afetados pela penalidade
 * da aquisição posterior de antecedente.
 */
export const NIVEIS_PENALIZADOS_ANTECEDENTE_POSTERIOR = Object.freeze([4, 7, 10]);

/**
 * Custo em pontos de bônus de atributo de classe ao escolher Antecedente na criação (Nível 1).
 */
export const CUSTO_ATRIBUTO_CRIACAO_ANTECEDENTE = 1;

/**
 * Custo em Pontos de Evolução ao adquirir Antecedente após o Nível 1.
 */
export const CUSTO_EVOLUCAO_ANTECEDENTE_POSTERIOR = 1;

/**
 * Bônus de moedas concedido por antecedentes específicos na criação.
 */
export const BONUS_MOEDAS_ANTECEDENTE = Object.freeze({
  nobre: 200,
  fidalgo: 100,
});

/**
 * Mapa canônico estático dos atributos bonificados por cada classe.
 * @type {Readonly<Record<string, string[]>>}
 */
export const BONUS_ATRIBUTOS_CLASSES = Object.freeze({
  feiticeiro: ["inteligencia", "vontade"],
  guerreiro: ["forca", "agilidade"],
  ladino: ["agilidade", "inteligencia"],
  paladino: ["forca", "vontade"],
  patrulheiro: ["agilidade", "inteligencia"],
  sacerdote: ["inteligencia", "vontade"],
  bardo: ["inteligencia", "vontade"],
  druida: ["inteligencia", "vontade"],
  espadachim: ["forca", "agilidade"],
  runico: ["forca", "inteligencia"],
  dracomante: ["forca", "vontade"],
  necromante: ["inteligencia", "vontade"],
  senescal: ["inteligencia", "vontade"],
  xama: ["forca", "vontade"],
});

// ============================================================================
// FUNÇÕES AUXILIARES DE NORMALIZAÇÃO
// ============================================================================

/**
 * Normaliza strings para comparações seguras sem acento e em caixa baixa.
 * @param {string} str
 * @returns {string}
 */
function norm(str) {
  if (typeof str !== "string") return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Retorna o bônus de moedas de um antecedente (se houver).
 * @param {string|object} antecedente
 * @returns {number} Moedas adicionais (ex.: Nobre = 200, Fidalgo = 100)
 */
export function obterBonusMoedasAntecedente(antecedente) {
  if (!antecedente) return 0;
  const nome = typeof antecedente === "string"
    ? antecedente
    : antecedente.name ?? antecedente.nome ?? antecedente.id ?? "";
  const n = norm(nome);
  if (n === "nobre") return BONUS_MOEDAS_ANTECEDENTE.nobre;
  if (n === "fidalgo") return BONUS_MOEDAS_ANTECEDENTE.fidalgo;
  return 0;
}

/**
 * Detecta se o ator possui um Antecedente selecionado.
 * @param {object} actor
 * @returns {{ temAntecedente: boolean, nome: string }}
 */
function detectarAntecedenteAtor(actor) {
  if (!actor) return { temAntecedente: false, nome: "" };

  // 1. Campo explícito em system.details.antecedente
  const antecedenteDetails = actor.system?.details?.antecedente;
  if (typeof antecedenteDetails === "string" && antecedenteDetails.trim().length > 0) {
    return { temAntecedente: true, nome: antecedenteDetails.trim() };
  }

  // 2. Propriedade direta no ator (mocks)
  if (typeof actor.antecedente === "string" && actor.antecedente.trim().length > 0) {
    return { temAntecedente: true, nome: actor.antecedente.trim() };
  }
  if (actor.temAntecedente === true) {
    return { temAntecedente: true, nome: "Antecedente" };
  }

  // 3. Documentos embutidos em actor.items
  const items = Array.isArray(actor.items)
    ? actor.items
    : (actor.items?.values ? Array.from(actor.items.values()) : []);

  const itemAntecedente = items.find(
    (i) => i.type === "antecedente" || i.system?.categoria === "antecedente"
  );
  if (itemAntecedente) {
    return { temAntecedente: true, nome: itemAntecedente.name || "Antecedente" };
  }

  return { temAntecedente: false, nome: "" };
}

/**
 * Localiza informações da classe (dados de atributos de bônus).
 * @param {object|string} classe
 * @param {object} actor
 * @returns {{ nome: string, atributos: Record<string, number>, atributosValidos: string[] }}
 */
function resolverDadosClasse(classe, actor) {
  let nomeClasse = "";
  let atributosClasse = null;

  if (typeof classe === "string") {
    nomeClasse = classe;
  } else if (classe && typeof classe === "object") {
    nomeClasse = classe.name || classe.nome || "";
    atributosClasse = classe.system?.atributos || classe.atributos || null;
  }

  // Se não foi informada classe diretamente, tenta extrair do ator
  if (!nomeClasse && actor) {
    nomeClasse = actor.system?.details?.classe || actor.classe || "";
    if (!nomeClasse && actor.items) {
      const items = Array.isArray(actor.items)
        ? actor.items
        : (actor.items.values ? Array.from(actor.items.values()) : []);
      const itemClasse = items.find((i) => i.type === "classe");
      if (itemClasse) {
        nomeClasse = itemClasse.name;
        atributosClasse = itemClasse.system?.atributos || null;
      }
    }
  }

  // Se não temos a tabela de atributos da classe, busca na lista canônica de packs
  if (!atributosClasse && nomeClasse && Array.isArray(CANONICAL_CLASSES)) {
    const can = CANONICAL_CLASSES.find((c) => norm(c.name) === norm(nomeClasse));
    if (can?.system?.atributos) {
      atributosClasse = can.system.atributos;
    }
  }

  // Identifica quais atributos recebem bônus da classe (+1)
  const atributosValidos = [];
  if (atributosClasse) {
    for (const attr of ATRIBUTOS_CANONICOS) {
      if (Number(atributosClasse[attr]) > 0) {
        atributosValidos.push(attr);
      }
    }
  } else if (nomeClasse) {
    // Fallback para mapa estático
    const estatico = BONUS_ATRIBUTOS_CLASSES[norm(nomeClasse)];
    if (Array.isArray(estatico)) {
      atributosValidos.push(...estatico);
    }
  }

  return {
    nome: nomeClasse,
    atributos: atributosClasse || {},
    atributosValidos,
  };
}

// ============================================================================
// ITEM 1: CUSTO DE ANTECEDENTE NA CRIAÇÃO (NÍVEL 1)
// ============================================================================

/**
 * Calcula e valida o custo de selecionar um Antecedente no Nível 1.
 *
 * Regra Canônica:
 * "Selecionar um Antecedente no Nível 1 consome 1 ponto de bônus de Atributo fornecido pela Classe."
 * - Por padrão, uma Classe concede +1 em dois atributos diferentes (total 2 pontos).
 * - Ao selecionar um Antecedente, 1 ponto é consumido, restando apenas 1 ponto de bônus da classe.
 *
 * @param {object|boolean|null} actor Documento do Ator, mock ou indicador de seleção
 * @param {object|string|null} [classe=null] Item de classe, nome da classe ou nulo
 * @param {object} [opcoes={}] Opções adicionais
 * @param {boolean} [opcoes.temAntecedente] Forçar se possui antecedente
 * @param {string} [opcoes.antecedente] Nome do antecedente
 * @param {string[]} [opcoes.atributosEscolhidos] Lista com atributos selecionados pelo jogador
 * @returns {{
 *   custo: number,
 *   custoPontosAtributo: number,
 *   pontosConsumidos: number,
 *   pontosRestantes: number,
 *   pontosDisponiveis: number,
 *   pontosPadraoClasse: number,
 *   temAntecedente: boolean,
 *   antecedenteNome: string,
 *   classeNome: string,
 *   atributosValidosClasse: string[],
 *   valido: boolean,
 *   erro: string|null,
 *   descricao: string,
 *   valueOf: () => number
 * }}
 */
export function calcularCustoAntecedenteCriacao(actor = null, classe = null, opcoes = {}) {
  // Determinação se há antecedente selecionado
  let temAntecedente = false;
  let antecedenteNome = "";

  if (typeof opcoes.temAntecedente === "boolean") {
    temAntecedente = opcoes.temAntecedente;
    antecedenteNome = opcoes.antecedente || (temAntecedente ? "Antecedente" : "");
  } else if (typeof actor === "boolean") {
    temAntecedente = actor;
    antecedenteNome = opcoes.antecedente || (temAntecedente ? "Antecedente" : "");
  } else if (typeof actor === "string") {
    temAntecedente = actor.trim().length > 0;
    antecedenteNome = actor.trim();
  } else if (opcoes.antecedente) {
    temAntecedente = true;
    antecedenteNome = String(opcoes.antecedente).trim();
  } else if (actor && typeof actor === "object") {
    const det = detectarAntecedenteAtor(actor);
    temAntecedente = det.temAntecedente;
    antecedenteNome = det.nome;
  }

  // Dados da classe
  const dadosClasse = resolverDadosClasse(classe, actor && typeof actor === "object" ? actor : null);

  const pontosPadraoClasse = 2;
  const custoPontosAtributo = temAntecedente ? CUSTO_ATRIBUTO_CRIACAO_ANTECEDENTE : 0;
  const pontosRestantes = pontosPadraoClasse - custoPontosAtributo;

  let valido = true;
  let erro = null;

  // Validação opcional de atributos selecionados
  const escolhidos = opcoes.atributosEscolhidos || opcoes.atributos;
  if (Array.isArray(escolhidos)) {
    if (escolhidos.length !== pontosRestantes) {
      valido = false;
      if (temAntecedente && escolhidos.length === 2) {
        erro = "Selecionar um Antecedente no Nível 1 consome 1 ponto de bônus de Atributo fornecido pela Classe. O personagem deve receber +1 em apenas 1 atributo da classe (foram selecionados 2).";
      } else {
        erro = `Quantidade incorreta de atributos selecionados: esperado ${pontosRestantes}, recebido ${escolhidos.length}.`;
      }
    } else {
      // Valida se os atributos escolhidos são atributos canônicos
      for (const attr of escolhidos) {
        if (!ATRIBUTOS_CANONICOS.includes(attr)) {
          valido = false;
          erro = `Atributo '${attr}' inválido. Permitidos: ${ATRIBUTOS_CANONICOS.join(", ")}.`;
          break;
        }
      }

      // Se atributos da classe forem conhecidos, valida se os escolhidos pertencem à classe
      if (valido && dadosClasse.atributosValidos.length > 0) {
        for (const attr of escolhidos) {
          if (!dadosClasse.atributosValidos.includes(attr)) {
            valido = false;
            erro = `O atributo '${attr}' não recebe bônus da classe ${dadosClasse.nome}. Opções válidas: ${dadosClasse.atributosValidos.join(", ")}.`;
            break;
          }
        }
      }
    }
  }

  const descricao = temAntecedente
    ? "Selecionar um Antecedente no Nível 1 consome 1 ponto de bônus de Atributo fornecido pela Classe (o personagem recebe +1 em apenas 1 Atributo em vez de dois)."
    : "Sem Antecedente selecionado: a Classe fornece os 2 pontos de bônus de Atributo padrão (+1 em dois Atributos diferentes).";

  return {
    valido,
    erro,
    custo: custoPontosAtributo,
    custoPontosAtributo,
    pontosConsumidos: custoPontosAtributo,
    pontosRestantes,
    pontosDisponiveis: pontosRestantes,
    pontosPadraoClasse,
    temAntecedente,
    antecedenteNome,
    classeNome: dadosClasse.nome,
    atributosValidosClasse: dadosClasse.atributosValidos,
    descricao,
    valueOf() {
      return this.custo;
    },
    [Symbol.toPrimitive](hint) {
      return hint === "string" ? String(this.custo) : this.custo;
    },
  };
}

// ============================================================================
// ITEM 2: VALIDAÇÃO DE ANTECEDENTE POSTERIOR (APÓS NÍVEL 1)
// ============================================================================

/**
 * Valida a aquisição ou os efeitos de possuir um Antecedente adquirido após o Nível 1.
 *
 * Regra Canônica:
 * "Adquirir após o Nível 1 consome 1 Ponto de Evolução e penaliza o personagem nos
 * Níveis 4, 7 e 10 a receber +1 em apenas 1 Atributo (em vez de +1 em dois)."
 *
 * @param {object} actor Documento do Ator Mighty Blade
 * @param {object} [opcoes={}] Opções de validação de nível ou aquisição
 * @param {number} [opcoes.nivel] Nível a validar (ex.: 4, 7 ou 10 para subida de nível)
 * @param {string[]} [opcoes.atributosEscolhidos] Atributos indicados para aumento de nível
 * @param {number} [opcoes.nivelAquisicao] Nível no qual o antecedente está sendo comprado
 * @param {boolean} [opcoes.pontoEvolucaoDisponivel=true] Se há ponto de evolução disponível
 * @param {boolean} [opcoes.adquirir=false] Se está executando a validação da compra em si
 * @returns {{
 *   valido: boolean,
 *   erro: string|null,
 *   penalidadeAtiva: boolean,
 *   consumoPontoEvolucao: number,
 *   quantidadeAtributosPermitidos: number,
 *   quantidadeAtributosPadrao: number,
 *   niveisPenalizados: readonly number[],
 *   motivo: string
 * }}
 */
export function validarAntecedentePosterior(actor = null, opcoes = {}) {
  const nivelAtor = Number(actor?.system?.details?.nivel ?? actor?.nivel ?? 1);

  // Detecta se o personagem possui flag ou marca de antecedente posterior
  const flagPosterior = Boolean(
    actor?.flags?.["mighty-blade"]?.antecedentePosterior ??
    actor?.system?.details?.antecedentePosterior ??
    actor?.antecedentePosterior ??
    opcoes.antecedentePosterior
  );

  // Verifica se o campo de evolução registra compra posterior de antecedente
  const evolucaoTexto = norm(actor?.system?.details?.evolucao || "");
  const evolucaoAntecedente = evolucaoTexto.includes("antecedente");

  const penalidadeAtiva = flagPosterior || evolucaoAntecedente;

  let valido = true;
  let erro = null;

  // --------------------------------------------------------------------------
  // Cenário A: Validação da aquisição do Antecedente após o Nível 1
  // --------------------------------------------------------------------------
  if (opcoes.adquirir || opcoes.nivelAquisicao !== undefined) {
    const nivelAquisicao = Number(opcoes.nivelAquisicao ?? nivelAtor);

    if (nivelAquisicao <= 1) {
      valido = false;
      erro = "A aquisição posterior de Antecedente só ocorre após o Nível 1 (Nível 2 ou superior). No Nível 1, aplicam-se as regras de criação de personagem.";
    }

    if (opcoes.pontoEvolucaoDisponivel === false) {
      valido = false;
      erro = "Adquirir um Antecedente após o Nível 1 consome 1 Ponto de Evolução. O herói não possui Ponto de Evolução disponível.";
    }

    // Verifica se já possui um antecedente anterior
    const { temAntecedente, nome } = detectarAntecedenteAtor(actor);
    if (temAntecedente && !penalidadeAtiva && !opcoes.substituir) {
      valido = false;
      erro = `O personagem já possui o Antecedente '${nome}'. As regras de Mighty Blade não permitem acumular múltiplos antecedentes.`;
    }

    return {
      valido,
      erro,
      penalidadeAtiva: true,
      consumoPontoEvolucao: CUSTO_EVOLUCAO_ANTECEDENTE_POSTERIOR,
      quantidadeAtributosPermitidos: 1,
      quantidadeAtributosPadrao: 2,
      niveisPenalizados: NIVEIS_PENALIZADOS_ANTECEDENTE_POSTERIOR,
      motivo: "Adquirir Antecedente após o Nível 1 consome 1 Ponto de Evolução e penaliza o personagem nos Níveis 4, 7 e 10 a receber +1 em apenas 1 Atributo (em vez de +1 em dois).",
    };
  }

  // --------------------------------------------------------------------------
  // Cenário B: Validação de aumento de Atributos nos Níveis 4, 7 e 10
  // --------------------------------------------------------------------------
  const nivelAlvo = opcoes.nivel !== undefined ? Number(opcoes.nivel) : null;
  const atributosEscolhidos = opcoes.atributosEscolhidos || opcoes.atributos;

  let quantidadeAtributosPermitidos = penalidadeAtiva ? 1 : 2;

  if (nivelAlvo !== null && NIVEIS_PENALIZADOS_ANTECEDENTE_POSTERIOR.includes(nivelAlvo)) {
    if (penalidadeAtiva) {
      quantidadeAtributosPermitidos = 1;

      if (Array.isArray(atributosEscolhidos)) {
        if (atributosEscolhidos.length === 2) {
          valido = false;
          erro = "Adquirir após o Nível 1 consome 1 Ponto de Evolução e penaliza o personagem nos Níveis 4, 7 e 10 a receber +1 em apenas 1 Atributo (em vez de +1 em dois).";
        } else if (atributosEscolhidos.length !== 1) {
          valido = false;
          erro = `Deve ser selecionado exatamente 1 atributo para incremento no Nível ${nivelAlvo} devido à penalidade de Antecedente Posterior.`;
        } else {
          const attr = atributosEscolhidos[0];
          if (!ATRIBUTOS_CANONICOS.includes(attr)) {
            valido = false;
            erro = `Atributo '${attr}' inválido. Permitidos: ${ATRIBUTOS_CANONICOS.join(", ")}.`;
          }
        }
      }
    } else {
      // Sem penalidade: regra canônica padrão exige 2 atributos distintos
      quantidadeAtributosPermitidos = 2;

      if (Array.isArray(atributosEscolhidos)) {
        if (atributosEscolhidos.length !== 2) {
          valido = false;
          erro = "Devem ser selecionados exatamente 2 atributos diferentes para incremento nos Níveis 4, 7 e 10.";
        } else {
          const [a1, a2] = atributosEscolhidos;
          if (!ATRIBUTOS_CANONICOS.includes(a1) || !ATRIBUTOS_CANONICOS.includes(a2)) {
            valido = false;
            erro = `Atributos selecionados inválidos. Permitidos: ${ATRIBUTOS_CANONICOS.join(", ")}.`;
          } else if (a1 === a2) {
            valido = false;
            erro = "Os 2 atributos selecionados devem ser diferentes (não é permitido somar +2 no mesmo atributo).";
          }
        }
      }
    }
  }

  return {
    valido,
    erro,
    penalidadeAtiva,
    consumoPontoEvolucao: CUSTO_EVOLUCAO_ANTECEDENTE_POSTERIOR,
    quantidadeAtributosPermitidos,
    quantidadeAtributosPadrao: 2,
    niveisPenalizados: NIVEIS_PENALIZADOS_ANTECEDENTE_POSTERIOR,
    motivo: penalidadeAtiva
      ? "Personagem adquiriu Antecedente após o Nível 1: consome 1 Ponto de Evolução e recebe +1 em apenas 1 Atributo nos Níveis 4, 7 e 10."
      : "Personagem não possui penalidade de Antecedente Posterior (recebe +1 em 2 Atributos nos Níveis 4, 7 e 10).",
  };
}

/**
 * Aplica a aquisição posterior de antecedente no ator, consumindo 1 ponto de evolução
 * e ativando a penalidade para os Níveis 4, 7 e 10.
 *
 * @param {object} actor Documento do Ator
 * @param {string} antecedenteNome Nome do antecedente a atribuir
 * @param {object} [opcoes={}]
 * @returns {Promise<{ sucesso: boolean, erro?: string }>}
 */
export async function aplicarAntecedentePosterior(actor, antecedenteNome, opcoes = {}) {
  if (!actor) {
    throw new Error("Ator inválido para aplicação de Antecedente Posterior.");
  }

  const validacao = validarAntecedentePosterior(actor, {
    adquirir: true,
    nivelAquisicao: opcoes.nivel ?? actor.system?.details?.nivel ?? 2,
    pontoEvolucaoDisponivel: opcoes.pontoEvolucaoDisponivel ?? true,
    antecedenteNome,
  });

  if (!validacao.valido) {
    throw new Error(validacao.erro);
  }

  const nome = (antecedenteNome || "Antecedente").trim();
  const updates = {
    "system.details.antecedente": nome,
    "system.details.antecedentePosterior": true,
    "system.details.evolucao": `Antecedente: ${nome}`,
    "flags.mighty-blade.antecedentePosterior": true,
  };

  if (typeof actor.update === "function") {
    await actor.update(updates);
  } else {
    if (!actor.system) actor.system = {};
    if (!actor.system.details) actor.system.details = {};
    actor.system.details.antecedente = nome;
    actor.system.details.antecedentePosterior = true;
    actor.system.details.evolucao = `Antecedente: ${nome}`;
    if (!actor.flags) actor.flags = {};
    if (!actor.flags["mighty-blade"]) actor.flags["mighty-blade"] = {};
    actor.flags["mighty-blade"].antecedentePosterior = true;
  }

  return {
    sucesso: true,
    antecedente: nome,
    consumoPontoEvolucao: CUSTO_EVOLUCAO_ANTECEDENTE_POSTERIOR,
    penalidadeAtributosAtiva: true,
  };
}

// ============================================================================
// ITEM 3: ECONOMIA E PROGRESSÃO DE OURO INICIAL POR NÍVEL
// ============================================================================

/**
 * Calcula o ouro inicial teórico utilizando a fórmula matemática canônica:
 * Ouro_1 = 500
 * Ouro_N = Ouro_{N-1} + 70% do Ouro_{N-1}  (ou Ouro_{N-1} * 1.70)
 *
 * @param {number} nivel Nível desejado (>= 1)
 * @returns {number} Valor de ouro calculado pela fórmula (não arredondado para tabela)
 */
export function calcularOuroPorFormula(nivel) {
  const lvl = Math.floor(Number(nivel));
  if (isNaN(lvl) || lvl <= 0) return 0;
  if (lvl === 1) return OURO_BASE_NIVEL_1;

  let ouro = OURO_BASE_NIVEL_1;
  for (let i = 2; i <= lvl; i++) {
    ouro = ouro + ouro * TAXA_PROGRESSAO_OURO;
  }
  return ouro;
}

/**
 * Retorna a quantia canônica de moedas/ouro inicial para campanhas iniciando acima do Nível 1.
 *
 * Valores Canônicos Oficiais:
 * - Nv 1:  500 moedas
 * - Nv 2:  850 moedas
 * - Nv 3:  1450 moedas
 * - Nv 4:  2450 moedas
 * - Nv 5:  4200 moedas
 * - Nv 6:  7200 moedas
 * - Nv 7:  12000 moedas
 * - Nv 8:  20500 moedas
 * - Nv 9:  35000 moedas
 * - Nv 10: 60000 moedas
 *
 * @param {number|object} nivel Nível da campanha ou Documento do Ator
 * @param {object} [opcoes={}] Opções adicionais
 * @param {boolean} [opcoes.incluirBonusAntecedente=false] Somar bônus de Nobre (+200) ou Fidalgo (+100)
 * @param {string|object} [opcoes.antecedente] Antecedente para cálculo de bônus
 * @returns {number} Quantia de moedas inicial
 */
export function calcularOuroInicialPorNivel(nivel, opcoes = {}) {
  let lvl = 1;
  let actorAntecedente = "";

  if (typeof nivel === "object" && nivel !== null) {
    lvl = Number(nivel.system?.details?.nivel ?? nivel.nivel ?? 1);
    actorAntecedente = nivel.system?.details?.antecedente || nivel.antecedente || "";
  } else {
    lvl = Number(nivel);
  }

  if (isNaN(lvl) || lvl <= 0) {
    return 0;
  }

  const nivelInteiro = Math.floor(lvl);

  // Consulta à tabela canônica de níveis 1 a 10
  let ouroBase = 0;
  if (nivelInteiro in TABELA_OURO_INICIAL_POR_NIVEL) {
    ouroBase = TABELA_OURO_INICIAL_POR_NIVEL[nivelInteiro];
  } else if (nivelInteiro > 10) {
    // Para níveis épicos (> 10), projeta a fórmula a partir do Nível 10 (60000 moedas)
    ouroBase = TABELA_OURO_INICIAL_POR_NIVEL[10];
    for (let i = 11; i <= nivelInteiro; i++) {
      ouroBase = Math.round(ouroBase * (1 + TAXA_PROGRESSAO_OURO));
    }
  } else {
    ouroBase = OURO_BASE_NIVEL_1;
  }

  // Bônus de moedas de Antecedente
  let bonusAntecedente = 0;
  if (opcoes.incluirBonusAntecedente === true) {
    const antecedenteRef = opcoes.antecedente || actorAntecedente;
    bonusAntecedente = obterBonusMoedasAntecedente(antecedenteRef);
  } else if (opcoes.antecedente && opcoes.incluirBonusAntecedente !== false) {
    bonusAntecedente = obterBonusMoedasAntecedente(opcoes.antecedente);
  }

  return ouroBase + bonusAntecedente;
}

/**
 * Aplica o ouro inicial canônico diretamente à ficha do ator.
 * @param {object} actor Documento do Ator
 * @param {number|null} [nivel=null] Nível da campanha (usa o nível atual do ator se nulo)
 * @param {object} [opcoes={}]
 * @returns {Promise<number>} Quantidade de moedas gravada
 */
export async function aplicarOuroInicial(actor, nivel = null, opcoes = {}) {
  if (!actor) {
    throw new Error("Ator inválido para aplicação de ouro inicial.");
  }

  const lvl = nivel ?? actor.system?.details?.nivel ?? 1;
  const ouro = calcularOuroInicialPorNivel(lvl, {
    ...opcoes,
    antecedente: opcoes.antecedente ?? (opcoes.incluirBonusAntecedente ? actor.system?.details?.antecedente : undefined),
  });

  if (typeof actor.update === "function") {
    await actor.update({ "system.details.dinheiro": ouro });
  } else {
    if (!actor.system) actor.system = {};
    if (!actor.system.details) actor.system.details = {};
    actor.system.details.dinheiro = ouro;
  }

  return ouro;
}
