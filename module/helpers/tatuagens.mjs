/**
 * Módulo de Regras Canônicas para Tatuagens Místicas e Registro Cutâneo (Tohunga / Escriba).
 * Mighty Blade 3ª Edição (Foundry VTT v14).
 *
 * Subtítulo 20: Tatuagens Místicas e Registro Cutâneo (Tohunga / Escriba)
 *
 * Consolida as mecânicas canônicas:
 * - Capacidade de Tatuagem por Categoria de Tamanho em Graus de Complexidade (GC):
 *   * Tamanho Médio: até 13 GC.
 *   * Tamanho Pequeno: até 10 GC.
 *   * Tamanho Grande / Gigantismo: até 15 GC.
 * - Cada Tatuagem de Tohunga (Primeira Marca, Tamoko, Tribal) ocupa 1 GC.
 * - Validação de Tatuar Magia na Pele (Registro Cutâneo):
 *   * Cada magia consome GC igual ao seu Círculo/Grau.
 *   * Bloqueia se o total de GC exceder a capacidade da pele do personagem.
 * - Benefício da Magia Tatuada na Própria Pele:
 *   * Reduz a Dificuldade em 1 ponto (-1 DV).
 *   * Reduz o Custo de Mana em 5 PM (-5 PM), garantindo o piso mínimo de 1 PM.
 * - Tatuar Objeto:
 *   * Funde o item à pele como marca permanente.
 *   * Consome 5 PM na conversão (fusão) e 5 PM na invocação (conjuração).
 *   * Impossível fundir objetos maiores do que o personagem.
 */

/* ------------------------------------------------------------------------- */
/* CONSTANTES CANÔNICAS DE TATUAGENS E REGISTRO CUTÂNEO                      */
/* ------------------------------------------------------------------------- */

export const CAPACIDADE_TATUAGEM_TAMANHO = Object.freeze({
  pequeno: 10,
  medio: 13,
  grande: 15,
});

export const GC_TATUAGEM_TOHUNGA = 1;
export const CUSTO_PM_TATUAR_OBJETO = 5;
export const CUSTO_PM_INVOCAR_OBJETO = 5;
export const REDUCAO_DIFICULDADE_TATUAGEM = 1;
export const REDUCAO_MANA_TATUAGEM = 5;
export const PISO_MANA_TATUAGEM = 1;

/**
 * Nomes e slugs canônicos de tatuagens características do caminho Tohunga.
 */
export const TATUAGENS_TOHUNGA_CANONICAS = Object.freeze([
  "primeira marca",
  "tamoko",
  "ta moko",
  "tribal de protecao",
  "tribal de poder",
  "tribal",
  "coracao de tinta",
  "kirituhi",
  "mestre da tinta",
]);

/* ------------------------------------------------------------------------- */
/* UTILITÁRIOS INTERNOS                                                      */
/* ------------------------------------------------------------------------- */

/**
 * Normaliza string para comparação uniforme (sem acentos, minúsculo, sem pontuação).
 * @param {string} s
 * @returns {string}
 */
export function normalizarTexto(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Identifica a categoria de tamanho canônica de um personagem ou ator.
 * @param {object|string} actor
 * @returns {"pequeno"|"medio"|"grande"}
 */
export function obterTamanhoPersonagem(actor) {
  if (!actor) return "medio";

  if (typeof actor === "string") {
    const s = normalizarTexto(actor);
    if (s.includes("pequen") || s === "p") return "pequeno";
    if (s.includes("grand") || s.includes("gigant") || s === "g") return "grande";
    return "medio";
  }

  // 1. Checagem direta de propriedades de tamanho
  const tamanhoStr = normalizarTexto(
    actor.system?.details?.tamanho ||
    actor.details?.tamanho ||
    actor.system?.tamanho ||
    actor.tamanho ||
    ""
  );

  if (tamanhoStr.includes("pequen")) return "pequeno";
  if (tamanhoStr.includes("grand") || tamanhoStr.includes("gigant")) return "grande";
  if (tamanhoStr.includes("med")) return "medio";

  // 2. Checagem de itens e habilidades embutidas
  const items = Array.isArray(actor.items)
    ? actor.items
    : (typeof actor.items?.values === "function" ? Array.from(actor.items.values()) : []);

  let temGigantismo = false;
  let temNanismoOuPequeno = false;

  for (const item of items) {
    const nome = normalizarTexto(item.name || item.system?.name || "");
    const slug = normalizarTexto(item.flags?.["mighty-blade"]?.slug || item.slug || "");

    if (nome === "gigantismo" || slug === "gigantismo" || nome.includes("gigantismo")) {
      temGigantismo = true;
    }
    if (
      nome === "nanismo" || slug === "nanismo" ||
      nome === "tamanho pequeno" || slug === "tamanho-pequeno" ||
      nome.includes("tamanho pequeno")
    ) {
      temNanismoOuPequeno = true;
    }
  }

  if (temGigantismo) return "grande";
  if (temNanismoOuPequeno) return "pequeno";

  // 3. Checagem de raça
  const racaDoc = items.find((i) => i.type === "raca");
  const racaNome = normalizarTexto(
    racaDoc?.name ||
    actor.system?.details?.raca ||
    actor.details?.raca ||
    actor.raca ||
    ""
  );

  if (
    racaNome.includes("metadilio") ||
    racaNome.includes("faen") ||
    racaNome.includes("silfo") ||
    racaNome.includes("halfling")
  ) {
    return "pequeno";
  }

  return "medio";
}

/**
 * Determina se um item corresponde a uma Tatuagem de Tohunga canônica.
 * @param {object} item
 * @returns {boolean}
 */
export function isTatuagemTohunga(item) {
  if (!item) return false;
  const nome = normalizarTexto(item.name || item.system?.name || "");
  const slug = normalizarTexto(item.flags?.["mighty-blade"]?.slug || item.slug || "");

  for (const canonica of TATUAGENS_TOHUNGA_CANONICAS) {
    if (nome === canonica || slug === canonica || nome.includes(canonica)) {
      return true;
    }
  }

  if (item.flags?.["mighty-blade"]?.tipoTatuagem === "tohunga") return true;
  if (item.system?.subtipoTatuagem === "tohunga") return true;

  return false;
}

/**
 * Extrai o Grau de Complexidade (GC) equivalente de uma magia (igual ao seu Círculo ou Grau).
 * @param {object|number} magia
 * @returns {number}
 */
export function obterGrauComplexidadeMagia(magia) {
  if (typeof magia === "number") return Math.max(1, Math.round(magia));
  if (!magia || typeof magia !== "object") return 1;

  const sys = magia.system || {};
  if (sys.circulo !== undefined && sys.circulo !== null && !isNaN(Number(sys.circulo))) {
    return Math.max(1, Number(sys.circulo));
  }
  if (sys.grau !== undefined && sys.grau !== null && !isNaN(Number(sys.grau))) {
    return Math.max(1, Number(sys.grau));
  }
  if (sys.nivel !== undefined && sys.nivel !== null && !isNaN(Number(sys.nivel))) {
    return Math.max(1, Number(sys.nivel));
  }
  if (magia.circulo !== undefined && !isNaN(Number(magia.circulo))) {
    return Math.max(1, Number(magia.circulo));
  }
  if (magia.grau !== undefined && !isNaN(Number(magia.grau))) {
    return Math.max(1, Number(magia.grau));
  }

  // Tenta extrair número de descrições textuais como "2º Círculo" ou "Círculo 3"
  const texto = String(sys.circulo || sys.grau || sys.nivel || magia.name || "");
  const match = texto.match(/(\d+)/);
  if (match) {
    return Math.max(1, parseInt(match[1], 10));
  }

  return 1;
}

/* ------------------------------------------------------------------------- */
/* FUNÇÕES PRINCIPAIS DO MOTOR DE TATUAGENS                                  */
/* ------------------------------------------------------------------------- */

/**
 * Calcula a capacidade cutânea total e o espaço disponível para tatuagens em um personagem.
 *
 * Regras Canônicas:
 * - Tamanho Médio: 13 Graus de Complexidade (GC).
 * - Tamanho Pequeno: 10 GC.
 * - Tamanho Grande / Gigantismo: 15 GC.
 * - Cada Tatuagem de Tohunga (Primeira Marca, Tamoko, Tribal) consome 1 GC.
 *
 * @param {object|string} actor Personagem ou identificador de tamanho
 * @param {object|boolean} [options={}] Opções adicionais (ex: { apenasNumero: true })
 * @returns {{
 *   capacidadeTotal: number,
 *   capacidadeMaxima: number,
 *   gcMaximo: number,
 *   gcTotal: number,
 *   gcUsado: number,
 *   gcDisponivel: number,
 *   gcRestante: number,
 *   tamanho: "pequeno"|"medio"|"grande",
 *   tatuagens: Array<object>,
 *   tatuagensTohunga: Array<object>
 * } | number}
 */
export function calcularCapacidadeTatuagem(actor, options = {}) {
  const tamanho = obterTamanhoPersonagem(actor);
  const capacidadeTotal = CAPACIDADE_TATUAGEM_TAMANHO[tamanho] ?? 13;

  const items = Array.isArray(actor?.items)
    ? actor.items
    : (typeof actor?.items?.values === "function" ? Array.from(actor.items.values()) : []);

  let gcUsado = 0;
  const tatuagensTohunga = [];
  const tatuagens = [];

  for (const item of items) {
    const isTohunga = isTatuagemTohunga(item);
    const isMagiaTatuada = Boolean(
      item.system?.tatuada ||
      item.flags?.["mighty-blade"]?.tatuada ||
      item.system?.isTatuagem ||
      item.type === "magia_tatuada"
    );
    const isObjetoTatuado = Boolean(
      item.system?.tatuado ||
      item.system?.fundidoAPele ||
      item.flags?.["mighty-blade"]?.tatuagem?.fundido
    );

    if (isTohunga) {
      gcUsado += GC_TATUAGEM_TOHUNGA;
      tatuagensTohunga.push(item);
      tatuagens.push({ item, nome: item.name, tipo: "tohunga", gc: GC_TATUAGEM_TOHUNGA });
    } else if (isMagiaTatuada) {
      const gcMagia = obterGrauComplexidadeMagia(item);
      gcUsado += gcMagia;
      tatuagens.push({ item, nome: item.name, tipo: "magia", gc: gcMagia });
    } else if (isObjetoTatuado) {
      const gcObj = Number(item.system?.gc ?? 1);
      gcUsado += gcObj;
      tatuagens.push({ item, nome: item.name, tipo: "objeto", gc: gcObj });
    } else if (item.type === "tatuagem" || item.system?.tipo === "tatuagem") {
      const gcOutro = Number(item.system?.gc ?? 1);
      gcUsado += gcOutro;
      tatuagens.push({ item, nome: item.name, tipo: "outro", gc: gcOutro });
    }
  }

  const gcDisponivel = Math.max(0, capacidadeTotal - gcUsado);

  const res = {
    capacidadeTotal,
    capacidadeMaxima: capacidadeTotal,
    max: capacidadeTotal,
    total: capacidadeTotal,
    gcMaximo: capacidadeTotal,
    gcTotal: capacidadeTotal,
    gcUsado,
    gcDisponivel,
    gcRestante: gcDisponivel,
    tamanho,
    tatuagens,
    tatuagensTohunga,
    valueOf() { return this.capacidadeTotal; },
    toString() { return String(this.capacidadeTotal); },
    [Symbol.toPrimitive](hint) {
      if (hint === "number") return this.capacidadeTotal;
      return String(this.capacidadeTotal);
    },
  };

  if (options === true || options?.apenasNumero) {
    return capacidadeTotal;
  }

  return res;
}

/**
 * Valida se uma nova magia pode ser registrada/tatuada na pele do personagem.
 *
 * Regras Canônicas:
 * - Cada magia consome GC igual ao seu Círculo/Grau.
 * - Bloqueia e retorna erro se o total de GC exceder a capacidade da pele do personagem.
 *
 * @param {object} actor Personagem
 * @param {object|number} magia Magia a tatuar ou Grau de Complexidade numérico
 * @param {Array|number} [tatuagensAtuais] Lista de tatuagens ou quantidade de GC já consumida
 * @returns {{
 *   valido: boolean,
 *   permitido: boolean,
 *   sucesso: boolean,
 *   bloqueado: boolean,
 *   capacidadeTotal: number,
 *   gcAtual: number,
 *   gcMagia: number,
 *   gcTotal: number,
 *   gcDisponivelAntes: number,
 *   gcDisponivelDepois: number,
 *   excedente: number,
 *   tamanho: string,
 *   erro: string|null,
 *   motivo: string|null
 * }}
 */
export function validarTatuarMagia(actor, magia, tatuagensAtuais) {
  const capInfo = calcularCapacidadeTatuagem(actor);
  const capacidadeTotal = capInfo.capacidadeTotal;

  // Grau de Complexidade (GC) da nova magia
  const gcMagia = obterGrauComplexidadeMagia(magia);

  // Determina GC das tatuagens atuais
  let gcAtual = 0;
  if (typeof tatuagensAtuais === "number") {
    gcAtual = Math.max(0, tatuagensAtuais);
  } else if (Array.isArray(tatuagensAtuais)) {
    for (const tat of tatuagensAtuais) {
      if (typeof tat === "number") {
        gcAtual += tat;
      } else if (tat?.type === "magia" || tat?.system?.circulo !== undefined || tat?.system?.grau !== undefined) {
        gcAtual += obterGrauComplexidadeMagia(tat);
      } else if (isTatuagemTohunga(tat)) {
        gcAtual += GC_TATUAGEM_TOHUNGA;
      } else if (tat?.gc !== undefined || tat?.system?.gc !== undefined) {
        gcAtual += Number(tat.gc ?? tat.system?.gc ?? 1);
      } else {
        gcAtual += 1;
      }
    }
  } else if (tatuagensAtuais !== undefined && tatuagensAtuais !== null) {
    gcAtual = Number(tatuagensAtuais) || 0;
  } else {
    // Lê as tatuagens existentes diretamente do personagem
    gcAtual = capInfo.gcUsado;
  }

  const gcTotal = gcAtual + gcMagia;
  const valido = gcTotal <= capacidadeTotal;
  const excedente = Math.max(0, gcTotal - capacidadeTotal);
  const gcDisponivelAntes = Math.max(0, capacidadeTotal - gcAtual);
  const gcDisponivelDepois = Math.max(0, capacidadeTotal - gcTotal);

  const magiaNome = magia?.name || (typeof magia === "object" ? "Magia" : `Magia (GC ${gcMagia})`);

  let erro = null;
  let motivo = null;

  if (!valido) {
    motivo = "capacidade_excedida";
    erro = `Capacidade de tatuagem na pele excedida: a magia "${magiaNome}" requer ${gcMagia} GC (Círculo/Grau), totalizando ${gcTotal} GC, mas a capacidade máxima do personagem (${capInfo.tamanho}) é de ${capacidadeTotal} GC. Excedente: ${excedente} GC.`;
  }

  return {
    valido,
    permitido: valido,
    sucesso: valido,
    bloqueado: !valido,
    capacidadeTotal,
    gcAtual,
    gcMagia,
    gcTotal,
    gcDisponivelAntes,
    gcDisponivelDepois,
    excedente,
    tamanho: capInfo.tamanho,
    erro,
    motivo,
  };
}

/**
 * Calcula os benefícios canônicos de conjurar uma magia tatuada na própria pele (Tatuar Magia / Registro Cutâneo).
 *
 * Regras Canônicas:
 * - Reduz a Dificuldade em 1 ponto (-1 DV).
 * - Reduz o Custo de Mana em 5 PM (-5 PM), com piso mínimo de 1 PM (magias com custo base 0 permanecem 0 PM).
 *
 * @param {object|number} magia Magia ou custo de mana
 * @param {object} [actor=null] Conjurador
 * @returns {{
 *   reducaoDificuldade: number,
 *   reducaoMana: number,
 *   dificuldadeOriginal: number,
 *   dificuldadeFinal: number,
 *   custoOriginal: number,
 *   custoFinal: number,
 *   pisoAplicado: boolean,
 *   dificuldade: number,
 *   custo: number,
 *   dv: number,
 *   pm: number
 * }}
 */
export function calcularBeneficioTatuagemMagica(magia, actor = null) {
  let difBase = 8;
  let custoBase = 0;
  let gratuito = false;

  if (typeof magia === "number") {
    custoBase = magia;
  } else if (magia && typeof magia === "object") {
    const sys = magia.system || {};
    difBase = Number(sys.dificuldade ?? magia.dificuldade ?? 8);
    custoBase = Number(sys.custo ?? magia.custo ?? 0);
    gratuito = Boolean(sys.gratuito || magia.gratuito || custoBase === 0);
  }

  // Redução de dificuldade: -1 DV (não desce abaixo de 0)
  const dificuldadeFinal = Math.max(0, difBase - REDUCAO_DIFICULDADE_TATUAGEM);

  // Redução de mana: -5 PM com piso de 1 PM
  let custoFinal = 0;
  let pisoAplicado = false;

  if (gratuito || custoBase === 0) {
    custoFinal = 0;
  } else {
    const custoReduzido = custoBase - REDUCAO_MANA_TATUAGEM;
    if (custoReduzido < PISO_MANA_TATUAGEM) {
      custoFinal = PISO_MANA_TATUAGEM;
      pisoAplicado = true;
    } else {
      custoFinal = custoReduzido;
    }
  }

  return {
    reducaoDificuldade: REDUCAO_DIFICULDADE_TATUAGEM,
    reducaoMana: REDUCAO_MANA_TATUAGEM,
    dificuldadeOriginal: difBase,
    dificuldadeFinal,
    custoOriginal: custoBase,
    custoFinal,
    pisoAplicado,
    dificuldade: dificuldadeFinal,
    custo: custoFinal,
    dv: dificuldadeFinal,
    pm: custoFinal,
  };
}

/**
 * Funde um item à pele na forma de tatuagem permanente ou conjura/invoca o item a partir da marca.
 *
 * Regras Canônicas:
 * - Custo de 5 PM na conversão (fusão à pele) e 5 PM na invocação (conjuração).
 * - A tatuagem ocupa a área equivalente ao tamanho natural do objeto (impossível fundir itens maiores que o personagem).
 *
 * @param {object} item Item a fundir ou conjurar
 * @param {object} [actor=null] Personagem proprietário
 * @param {object} [opcoes={}] Opções { acao: "fundir"|"conjurar", ignorarMana: boolean }
 * @returns {{
 *   sucesso: boolean,
 *   acao: "fundir"|"conjurar",
 *   custoPM: number,
 *   manaConsumida: number,
 *   manaRestante: number|null,
 *   item: object,
 *   actor: object|null,
 *   fundido: boolean,
 *   conjurado: boolean,
 *   erro?: string,
 *   motivo?: string
 * }}
 */
export function tatuarObjeto(item, actor = null, opcoes = {}) {
  if (!item) {
    return {
      sucesso: false,
      acao: "fundir",
      custoPM: CUSTO_PM_TATUAR_OBJETO,
      manaConsumida: 0,
      manaRestante: null,
      item: null,
      actor,
      fundido: false,
      conjurado: false,
      erro: "Item inválido para fusão como tatuagem.",
      motivo: "item_invalido",
    };
  }

  const acao = opcoes.acao || (opcoes.invocar || opcoes.conjurar ? "conjurar" : "fundir");
  const custoPM = CUSTO_PM_TATUAR_OBJETO; // 5 PM

  // Validação de Tamanho do Objeto vs Tamanho do Personagem
  const tamanhoItem = normalizarTexto(
    item.system?.tamanho || item.tamanho || opcoes.tamanhoItem || ""
  );
  const tamanhoActor = obterTamanhoPersonagem(actor);

  const escalaTamanho = { pequeno: 1, medio: 2, grande: 3, enorme: 4, colossal: 5 };
  const pesoItem = escalaTamanho[tamanhoItem] || 0;
  const pesoActor = escalaTamanho[tamanhoActor] || 2;

  if (pesoItem > 0 && pesoItem > pesoActor) {
    return {
      sucesso: false,
      acao,
      custoPM,
      manaConsumida: 0,
      manaRestante: actor?.system?.resources?.mana?.value ?? null,
      item,
      actor,
      fundido: false,
      conjurado: false,
      erro: `Impossível fundir à pele um objeto de porte superior ao do personagem (${tamanhoItem} vs ${tamanhoActor}).`,
      motivo: "tamanho_incompativel",
    };
  }

  // Validação de Mana
  let manaAtual = null;
  if (actor?.system?.resources?.mana) {
    manaAtual = Number(actor.system.resources.mana.value) || 0;
    if (manaAtual < custoPM && !opcoes.ignorarMana) {
      return {
        sucesso: false,
        acao,
        custoPM,
        manaConsumida: 0,
        manaRestante: manaAtual,
        item,
        actor,
        fundido: Boolean(item.system?.fundidoAPele),
        conjurado: Boolean(item.system?.conjurado),
        erro: `Mana insuficiente para ${acao === "conjurar" ? "conjurar" : "fundir"} o objeto: requer 5 PM, mas o personagem possui apenas ${manaAtual} PM.`,
        motivo: "mana_insuficiente",
      };
    }
  }

  // Consumo de Mana do Personagem
  let manaRestante = manaAtual;
  if (actor?.system?.resources?.mana && !opcoes.ignorarMana) {
    actor.system.resources.mana.value = Math.max(0, manaAtual - custoPM);
    manaRestante = actor.system.resources.mana.value;
  }

  // Atualização dos metadados do item
  item.flags = item.flags || {};
  item.flags["mighty-blade"] = item.flags["mighty-blade"] || {};
  item.flags["mighty-blade"].tatuagem = {
    fundido: true,
    conjurado: acao === "conjurar",
    custoPM,
  };

  item.system = item.system || {};
  item.system.fundidoAPele = true;
  item.system.tatuado = true;
  item.system.conjurado = acao === "conjurar";

  return {
    sucesso: true,
    acao,
    custoPM,
    manaConsumida: custoPM,
    manaRestante,
    item,
    actor,
    fundido: true,
    conjurado: acao === "conjurar",
  };
}

/**
 * Invoca/conjura um objeto fundido à pele (consome 5 PM).
 * @param {object} item
 * @param {object} [actor=null]
 * @param {object} [opcoes={}]
 * @returns {object}
 */
export function conjurarObjetoTatuado(item, actor = null, opcoes = {}) {
  return tatuarObjeto(item, actor, { ...opcoes, acao: "conjurar" });
}

/**
 * Recolhe um objeto conjurado de volta à forma de tatuagem na pele.
 * @param {object} item
 * @returns {{ sucesso: boolean, conjurado: boolean, item: object }}
 */
export function recolherObjetoTatuado(item) {
  if (!item) {
    return { sucesso: false, erro: "Item inválido.", conjurado: false };
  }
  item.system = item.system || {};
  item.system.conjurado = false;
  if (item.flags?.["mighty-blade"]?.tatuagem) {
    item.flags["mighty-blade"].tatuagem.conjurado = false;
  }
  return {
    sucesso: true,
    acao: "recolher",
    conjurado: false,
    fundido: true,
    item,
  };
}
