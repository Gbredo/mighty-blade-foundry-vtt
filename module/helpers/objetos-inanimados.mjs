/**
 * Módulo de Estatísticas de Objetos Inanimados e Alvos Específicos.
 * Subtítulo 28 - Mighty Blade 3ª Edição.
 *
 * Implementa as regras canônicas do sistema:
 * 1. Defesa Base de Objetos Inanimados conforme porte/tamanho:
 *    - Pequeno (até 1m): Defesa 6.
 *    - Médio (até 2m): Defesa 5.
 *    - Grande (até 4m): Defesa 4.
 *    - Gigante / Colossal (> 4m): Defesa 3.
 *
 * 2. Modificador de Objetos em Movimento:
 *    - Se o objeto estiver rolando, caindo ou em movimento (`emMovimento: true`),
 *      soma-se +1d6 (ou rolagem configurada/média) ao valor de Defesa do objeto.
 *
 * 3. Ataque Localizado / Alvo Específico:
 *    - Visar membros específicos, garganta, armas empunhadas ou amuletos equipados
 *      adiciona +4 na Defesa do alvo (consistente com manobras-combate.mjs).
 */

import { extrairDefesasDefensor, MODIFICADOR_DEFESA_ATAQUE_LOCALIZADO } from "./manobras-combate.mjs";

/** Defesas canônicas de objetos inanimados por tamanho */
export const DEFESA_OBJETO_PEQUENO = 6;
export const DEFESA_OBJETO_MEDIO = 5;
export const DEFESA_OBJETO_GRANDE = 4;
export const DEFESA_OBJETO_GIGANTE = 3;
export const DEFESA_OBJETO_COLOSSAL = 3;

/** Tabela de Defesa de objetos indexada por identificador de porte */
export const TABELA_DEFESA_OBJETOS = Object.freeze({
  pequeno: DEFESA_OBJETO_PEQUENO,
  medio: DEFESA_OBJETO_MEDIO,
  grande: DEFESA_OBJETO_GRANDE,
  gigante: DEFESA_OBJETO_GIGANTE,
  colossal: DEFESA_OBJETO_COLOSSAL,
  enorme: DEFESA_OBJETO_GIGANTE,
});

/** Limites superiores em metros para classificação de tamanho */
export const LIMITES_TAMANHO_OBJETO_METROS = Object.freeze({
  PEQUENO_ATE: 1.0,
  MEDIO_ATE: 2.0,
  GRANDE_ATE: 4.0,
});

/** Constantes de objetos em movimento */
export const FORMULA_MOVIMENTO_OBJETO = "+1d6";
export const MODIFICADOR_MOVIMENTO_PADRAO_MEDIA = 3;

/** Bônus de Defesa para Alvo Específico / Ataque Localizado */
export const MODIFICADOR_DEFESA_ALVO_ESPECIFICO = MODIFICADOR_DEFESA_ATAQUE_LOCALIZADO ?? 4;

/** Lista de alvos específicos canônicos e variações aceitas */
export const ALVOS_ESPECIFICOS_CANONICOS = Object.freeze([
  "membro",
  "membros",
  "membro_especifico",
  "membros_especificos",
  "braco",
  "braço",
  "perna",
  "mao",
  "mão",
  "pe",
  "pé",
  "garganta",
  "pescoco",
  "pescoço",
  "arma",
  "armas",
  "arma_empunhada",
  "armas_empunhadas",
  "item_empunhado",
  "amuleto",
  "amuletos",
  "amuleto_equipado",
  "amuletos_equipados",
  "acessorio",
  "acessório",
  "olho",
  "olhos",
  "cabeca",
  "cabeça",
  "ponto_vital",
  "pontos_vitais",
]);

/**
 * Normaliza textos removendo acentos, espaços extras e convertendo para minúsculas.
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
 * Classifica o porte e a dimensão em metros de um objeto inanimado.
 *
 * Regras:
 * - Pequeno: até 1.0 metro (inclusive)
 * - Médio: acima de 1.0 metro até 2.0 metros (inclusive)
 * - Grande: acima de 2.0 metros até 4.0 metros (inclusive)
 * - Gigante / Colossal: acima de 4.0 metros
 *
 * @param {object|string|number} objetoOuTamanho Valor numérico (metros), string de porte ou objeto com dados
 * @param {object} [opcoes={}] Opções adicionais de classificação
 * @returns {{ porte: string, dimensaoMetros: number | null }}
 */
export function classificarPorteObjeto(objetoOuTamanho, opcoes = {}) {
  // Caso 1: Fornecido diretamente como número de metros
  if (typeof objetoOuTamanho === "number") {
    const metros = objetoOuTamanho;
    if (metros <= LIMITES_TAMANHO_OBJETO_METROS.PEQUENO_ATE) {
      return { porte: "pequeno", dimensaoMetros: metros };
    }
    if (metros <= LIMITES_TAMANHO_OBJETO_METROS.MEDIO_ATE) {
      return { porte: "medio", dimensaoMetros: metros };
    }
    if (metros <= LIMITES_TAMANHO_OBJETO_METROS.GRANDE_ATE) {
      return { porte: "grande", dimensaoMetros: metros };
    }
    return { porte: "gigante", dimensaoMetros: metros };
  }

  // Caso 2: Fornecido diretamente como string de porte
  if (typeof objetoOuTamanho === "string") {
    const strNorm = normalizarTexto(objetoOuTamanho);

    // Tentar extrair valor numérico de dimensão em metros se presente na string (ex: "1.5m", "3 metros")
    const matchNumero = strNorm.match(/^([0-9]+(?:[.,][0-9]+)?)\s*(?:m|metros?)?$/);
    if (matchNumero) {
      const metros = parseFloat(matchNumero[1].replace(",", "."));
      if (!isNaN(metros)) {
        return classificarPorteObjeto(metros, opcoes);
      }
    }

    if (["pequeno", "pequena", "miudo", "miuda", "minimo", "small", "tiny", "p"].includes(strNorm)) {
      return { porte: "pequeno", dimensaoMetros: 1.0 };
    }
    if (["medio", "media", "medium", "m", "padrao"].includes(strNorm)) {
      return { porte: "medio", dimensaoMetros: 2.0 };
    }
    if (["grande", "large", "g"].includes(strNorm)) {
      return { porte: "grande", dimensaoMetros: 4.0 };
    }
    if (["gigante", "colossal", "enorme", "huge", "gargantuan", "gg"].includes(strNorm)) {
      return { porte: "gigante", dimensaoMetros: 5.0 };
    }

    return { porte: opcoes.portePadrao || "medio", dimensaoMetros: null };
  }

  // Caso 3: Objeto com propriedades
  if (objetoOuTamanho && typeof objetoOuTamanho === "object") {
    // 3.1: Verificar dimensões numéricas explícitas
    const metrosVal =
      objetoOuTamanho.metros ??
      objetoOuTamanho.tamanhoMetros ??
      objetoOuTamanho.dimensaoMetros ??
      objetoOuTamanho.dimensao ??
      objetoOuTamanho.altura ??
      objetoOuTamanho.comprimento ??
      objetoOuTamanho.largura ??
      objetoOuTamanho.dimensoes?.maior ??
      objetoOuTamanho.dimensoes?.altura ??
      objetoOuTamanho.dimensoes?.comprimento ??
      objetoOuTamanho.dimensoes?.largura ??
      objetoOuTamanho.system?.metros ??
      objetoOuTamanho.system?.tamanhoMetros ??
      objetoOuTamanho.system?.dimensoes?.maior ??
      objetoOuTamanho.system?.dimensoes?.altura;

    if (typeof metrosVal === "number" && !isNaN(metrosVal)) {
      return classificarPorteObjeto(metrosVal, opcoes);
    }

    // 3.2: Verificar porte textual
    const porteVal =
      objetoOuTamanho.porte ??
      objetoOuTamanho.tamanho ??
      objetoOuTamanho.tamanhoObjeto ??
      objetoOuTamanho.categoria ??
      objetoOuTamanho.system?.porte ??
      objetoOuTamanho.system?.tamanho;

    if (typeof porteVal === "number") {
      return classificarPorteObjeto(porteVal, opcoes);
    }

    if (typeof porteVal === "string") {
      return classificarPorteObjeto(porteVal, opcoes);
    }
  }

  // Padrão se nada especificado: Porte Médio
  return { porte: opcoes.portePadrao || "medio", dimensaoMetros: null };
}

/**
 * Calcula a Defesa de um Objeto Inanimado.
 *
 * Regras:
 * - Pequeno (até 1m): Defesa 6.
 * - Médio (até 2m): Defesa 5.
 * - Grande (até 4m): Defesa 4.
 * - Gigante / Colossal (> 4m): Defesa 3.
 *
 * Modificador de Objetos em Movimento:
 * - Se o objeto estiver rolando, caindo ou em movimento (`emMovimento: true`),
 *   soma-se +1d6 (ou rolagem configurada/média) ao valor de Defesa do objeto.
 *
 * @param {object|string|number} objeto Dados do objeto, porte em texto ou dimensão em metros
 * @param {object} [opcoes={}] Opções de cálculo e rolagem
 * @param {boolean} [opcoes.emMovimento] Se true, aplica bônus de movimento (+1d6)
 * @param {boolean} [opcoes.rolando] Alias para emMovimento
 * @param {boolean} [opcoes.caindo] Alias para emMovimento
 * @param {number} [opcoes.valorMovimento] Valor pré-determinado para o dado de movimento (ex: 4)
 * @param {number} [opcoes.dadoMovimento] Alias para valorMovimento
 * @param {boolean} [opcoes.usarMedia] Se true, utiliza a média canônica do d6 (3)
 * @param {Function} [opcoes.rolagemFn] Função personalizada para rolar o dado (ex: () => 5)
 * @returns {object} Detalhes do cálculo da Defesa do objeto
 */
export function calcularDefesaObjeto(objeto, opcoes = {}) {
  const { porte, dimensaoMetros } = classificarPorteObjeto(objeto, opcoes);

  // Determinar Defesa base conforme tabela canônica
  const defesaBase = TABELA_DEFESA_OBJETOS[porte] ?? DEFESA_OBJETO_MEDIO;

  // Verificar se o objeto está em movimento
  const emMovimento = Boolean(
    opcoes.emMovimento ??
    opcoes.rolando ??
    opcoes.caindo ??
    objeto?.emMovimento ??
    objeto?.rolando ??
    objeto?.caindo ??
    objeto?.system?.emMovimento ??
    false
  );

  let modificadorMovimento = 0;
  let formulaMovimento = "+0";

  if (emMovimento) {
    formulaMovimento = FORMULA_MOVIMENTO_OBJETO;

    if (typeof opcoes.valorMovimento === "number") {
      modificadorMovimento = Math.max(0, Math.round(opcoes.valorMovimento));
    } else if (typeof opcoes.dadoMovimento === "number") {
      modificadorMovimento = Math.max(0, Math.round(opcoes.dadoMovimento));
    } else if (typeof opcoes.rolagem === "number") {
      modificadorMovimento = Math.max(0, Math.round(opcoes.rolagem));
    } else if (typeof opcoes.rolagemFn === "function") {
      modificadorMovimento = Math.max(0, Math.round(Number(opcoes.rolagemFn()) || 0));
    } else if (opcoes.usarMedia === true) {
      modificadorMovimento = MODIFICADOR_MOVIMENTO_PADRAO_MEDIA;
    } else if (opcoes.padraoMovimento !== undefined) {
      modificadorMovimento = Math.max(0, Math.round(Number(opcoes.padraoMovimento) || 0));
    } else {
      // Rolagem padrão de 1d6 (1 a 6)
      modificadorMovimento = Math.floor(Math.random() * 6) + 1;
    }
  }

  const defesaTotal = defesaBase + modificadorMovimento;

  return {
    sucesso: true,
    valido: true,
    porte,
    tamanho: porte,
    dimensaoMetros,
    defesaBase,
    emMovimento,
    modificadorMovimento,
    formulaMovimento,
    defesaTotal,
    defesa: defesaTotal, // Alias conveniente
    objeto,
    opcoes,
    descricao: emMovimento
      ? `Objeto inanimado (${porte}, base ${defesaBase}) em movimento (+${modificadorMovimento} via ${formulaMovimento}): Defesa final ${defesaTotal}.`
      : `Objeto inanimado estático (${porte}): Defesa base ${defesaBase}.`,
  };
}

/**
 * Calcula a Defesa contra um Ataque Localizado / Alvo Específico.
 *
 * Regras:
 * - Visar membros específicos, garganta, armas empunhadas ou amuletos equipados
 *   adiciona +4 na Defesa do alvo (consistente com manobras-combate.mjs).
 *
 * @param {object|number} defensor Alvo do ataque (MockActor, Foundry Actor, Objeto Inanimado ou valor numérico de Defesa)
 * @param {string|object} [tipoAlvoEspecifico="membro"] Identificador da área ou item visado
 * @param {object} [opcoes={}] Opções adicionais
 * @param {number} [opcoes.modificadorCustomizado] Permite customizar o modificador (padrão canônico: +4)
 * @returns {object} Detalhes da Defesa modificada do alvo
 */
export function calcularDefesaAlvoEspecifico(defensor, tipoAlvoEspecifico = "membro", opcoes = {}) {
  const alvoStr = typeof tipoAlvoEspecifico === "string"
    ? tipoAlvoEspecifico
    : tipoAlvoEspecifico?.tipo ?? tipoAlvoEspecifico?.local ?? tipoAlvoEspecifico?.nome ?? "membro específico";

  const alvoNormalizado = normalizarTexto(alvoStr);

  // Extrair as defesas originais do defensor
  let defesasOriginais;

  if (typeof defensor === "number") {
    defesasOriginais = { defesa: defensor, bloqueio: defensor, esquiva: defensor };
  } else if (
    defensor &&
    typeof defensor === "object" &&
    (defensor.defesaBase !== undefined ||
      (defensor.tamanho !== undefined && !defensor.system?.attributes) ||
      (defensor.porte !== undefined && !defensor.system?.attributes))
  ) {
    // Caso de um objeto inanimado
    const calcObj = calcularDefesaObjeto(defensor, opcoes);
    defesasOriginais = {
      defesa: calcObj.defesaTotal,
      bloqueio: calcObj.defesaTotal,
      esquiva: calcObj.defesaTotal,
      objetoInfo: calcObj,
    };
  } else {
    // Personagem / MockActor / Dados genéricos
    defesasOriginais = extrairDefesasDefensor(defensor);
  }

  const bonusDefesa = typeof opcoes.modificadorCustomizado === "number"
    ? opcoes.modificadorCustomizado
    : MODIFICADOR_DEFESA_ALVO_ESPECIFICO;

  const defesaModificada = defesasOriginais.defesa + bonusDefesa;
  const bloqueioModificado = defesasOriginais.bloqueio + bonusDefesa;
  const esquivaModificada = defesasOriginais.esquiva + bonusDefesa;

  return {
    sucesso: true,
    valido: true,
    tipo: "alvo_especifico",
    tipoAlvoEspecifico: alvoStr,
    tipoAlvoNormalizado: alvoNormalizado,
    bonusDefesa,
    modificadorDefesa: bonusDefesa,
    defesaOriginal: defesasOriginais.defesa,
    defesaModificada,
    defesaFinal: defesaModificada,
    bloqueioOriginal: defesasOriginais.bloqueio,
    bloqueioModificado,
    esquivaOriginal: defesasOriginais.esquiva,
    esquivaModificada,
    defensor,
    opcoes,
    descricao: "Visar membros específicos, garganta, armas empunhadas ou amuletos equipados adiciona +4 na Defesa do alvo.",
  };
}
