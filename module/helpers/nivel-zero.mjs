/**
 * Módulo de Regras Canônicas para Personagens de Nível Zero (Aspirantes e Desclassificados)
 * Mighty Blade 3e
 *
 * Subtítulo 17: Personagens de Nível Zero
 *
 * 1. Aspirantes:
 *    - Inicia com 40 PV e 40 PM (em vez de 60/60).
 *    - Atributos Iniciais da Raça + Habilidade Automática da Raça.
 *    - Habilidade Automática da Classe + apenas 1 modificador de Atributo da Classe.
 *    - Trava de Nível Zero: nenhum atributo pode exceder 5.
 *    - Ao atingir 10 XP: evolui para Nível 1.
 *      * Ganha +20 PV (40 -> 60) e +20 PM (40 -> 60).
 *      * +1 no segundo Atributo da Classe (podendo agora ultrapassar 5).
 *      * Concede as 2 novas Habilidades escolhidas.
 *
 * 2. Desclassificados:
 *    - Inicia com 30 PV e 30 PM e nenhum ponto extra de Atributo da classe.
 *    - Definido por um Antecedente (sem custo de Ponto de Atributo).
 *    - Habilidade Automática da Raça.
 *    - Ao atingir 10 XP: escolhe Classe Nível 1 e evolui para Nível 1.
 *      * Ganha Habilidade Automática da Classe, +30 PV (30 -> 60) e +30 PM (30 -> 60).
 *      * Modificadores da Classe com redutor de -1 ponto no atributo (por possuir Antecedente).
 *      * Concede 2 novas Habilidades.
 */

import {
  CANONICAL_RACAS,
  CANONICAL_CLASSES,
  CANONICAL_HABILIDADES,
} from "../data/canonical-packs-data.mjs";
import { CANONICAL_ANTECEDENTES } from "./config.mjs";

// ============================================================================
// CONSTANTES CANÔNICAS
// ============================================================================
export const PV_INICIAL_ASPIRANTE = 40;
export const PM_INICIAL_ASPIRANTE = 40;

export const PV_INICIAL_DESCLASSIFICADO = 30;
export const PM_INICIAL_DESCLASSIFICADO = 30;

export const PV_NIVEL_1 = 60;
export const PM_NIVEL_1 = 60;

export const XP_REQUISITO_NIVEL_1 = 10;
export const TETO_ATRIBUTO_NIVEL_ZERO = 5;
export const REDUTOR_ATRIBUTO_ANTECEDENTE = 1;

export const ATRIBUTOS_CANONICOS = Object.freeze([
  "forca",
  "agilidade",
  "inteligencia",
  "vontade",
]);

// ============================================================================
// FUNÇÕES AUXILIARES DE NORMALIZAÇÃO E BUSCA
// ============================================================================

/**
 * Normaliza string para comparação sem acentos, minúsculo e sem espaços extras.
 * @param {string} str
 * @returns {string}
 */
export function normalizarString(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Busca uma raça canônica por nome ou objeto.
 * @param {string|object} raca
 * @returns {object}
 */
export function buscarRaca(raca) {
  if (!raca) throw new Error("Raça não especificada.");
  if (typeof raca === "object") {
    if (raca.name && raca.system?.atributos) return JSON.parse(JSON.stringify(raca));
    if (raca.system?.atributos) return JSON.parse(JSON.stringify(raca));
  }
  const termo = normalizarString(typeof raca === "string" ? raca : raca.name);
  const encontrada = CANONICAL_RACAS.find((r) => normalizarString(r.name) === termo);
  if (!encontrada) {
    throw new Error(`Raça "${typeof raca === "string" ? raca : raca.name}" não encontrada em CANONICAL_RACAS.`);
  }
  return JSON.parse(JSON.stringify(encontrada));
}

/**
 * Busca uma classe canônica por nome ou objeto.
 * @param {string|object} classe
 * @returns {object}
 */
export function buscarClasse(classe) {
  if (!classe) throw new Error("Classe não especificada.");
  if (typeof classe === "object") {
    if (classe.name && classe.system?.atributos) return JSON.parse(JSON.stringify(classe));
    if (classe.system?.atributos) return JSON.parse(JSON.stringify(classe));
  }
  const termo = normalizarString(typeof classe === "string" ? classe : classe.name);
  const encontrada = CANONICAL_CLASSES.find((c) => normalizarString(c.name) === termo);
  if (!encontrada) {
    throw new Error(`Classe "${typeof classe === "string" ? classe : classe.name}" não encontrada em CANONICAL_CLASSES.`);
  }
  return JSON.parse(JSON.stringify(encontrada));
}

/**
 * Busca uma habilidade em CANONICAL_HABILIDADES por nome ou slug.
 * @param {string|object} hab
 * @returns {object|null}
 */
export function buscarHabilidade(hab) {
  if (!hab) return null;
  if (typeof hab === "object" && hab.name && hab.type === "habilidade") {
    return JSON.parse(JSON.stringify(hab));
  }
  const termo = normalizarString(typeof hab === "string" ? hab : hab.name || hab.slug || hab.ref);
  const encontrada = CANONICAL_HABILIDADES.find((h) => {
    const nomeH = normalizarString(h.name);
    const slugH = normalizarString(h.flags?.["mighty-blade"]?.slug);
    return nomeH === termo || slugH === termo;
  });
  if (encontrada) {
    return JSON.parse(JSON.stringify(encontrada));
  }
  if (typeof hab === "object") {
    return JSON.parse(JSON.stringify(hab));
  }
  return {
    name: hab,
    type: "habilidade",
    system: { descricao: "" },
  };
}

/**
 * Retorna a habilidade automática de uma raça.
 * @param {object} racaObj
 * @returns {object}
 */
export function obterHabilidadeAutomaticaRaca(racaObj) {
  const habAuto = racaObj.system?.habilidadeAutomatica;
  const concessoes = racaObj.system?.concessoes || [];
  const habConcessao = concessoes.find((c) => c.tipo === "habilidade" || c.tipo === "escolhaAtributo");

  const ref = habConcessao?.ref || habAuto?.nome || racaObj.name;
  let encontrada = buscarHabilidade(ref);

  if (!encontrada && habAuto?.nome) {
    encontrada = buscarHabilidade(habAuto.nome);
  }

  if (encontrada) return encontrada;

  return {
    name: habAuto?.nome || `Habilidade de ${racaObj.name}`,
    type: "habilidade",
    system: {
      descricao: habAuto?.descricao || "",
      categoria: "caracteristica",
      ...(habAuto || {}),
    },
  };
}

/**
 * Retorna a habilidade automática de uma classe.
 * @param {object} classeObj
 * @returns {object}
 */
export function obterHabilidadeAutomaticaClasse(classeObj) {
  const concessoes = classeObj.system?.concessoes || [];
  const habConcessao = concessoes.find((c) => c.tipo === "habilidade");
  const ref = habConcessao?.ref || habConcessao?.uuid;

  let encontrada = null;
  if (ref) {
    encontrada = buscarHabilidade(ref);
  }

  if (!encontrada && classeObj.system?.habilidadeAutomatica?.nome) {
    encontrada = buscarHabilidade(classeObj.system.habilidadeAutomatica.nome);
  }

  if (encontrada) return encontrada;

  return {
    name: ref || `Habilidade de ${classeObj.name}`,
    type: "habilidade",
    system: {
      classe: classeObj.name,
      descricao: "",
    },
  };
}

/**
 * Cria ou inicializa um documento de Ator base para testes e ambiente desacoplado.
 * @param {object} dadosIniciais
 * @returns {object}
 */
export function criarAtorBase(dadosIniciais = {}) {
  if (typeof globalThis.createMockActor === "function") {
    return globalThis.createMockActor(dadosIniciais);
  }

  const parseAttr = (a) => {
    if (typeof a === "number") return { value: a, base: a };
    const base = a?.base ?? a?.value ?? 0;
    const value = a?.value ?? a?.base ?? 0;
    return { value, base, ...(a || {}) };
  };

  const actor = {
    name: dadosIniciais.name || "Personagem Nível Zero",
    system: {
      attributes: {
        forca: parseAttr(dadosIniciais.attributes?.forca ?? 0),
        agilidade: parseAttr(dadosIniciais.attributes?.agilidade ?? 0),
        inteligencia: parseAttr(dadosIniciais.attributes?.inteligencia ?? 0),
        vontade: parseAttr(dadosIniciais.attributes?.vontade ?? 0),
      },
      resources: {
        vida: { value: 60, max: 60, baseMax: 60, ...(dadosIniciais.resources?.vida || {}) },
        mana: { value: 60, max: 60, baseMax: 60, ...(dadosIniciais.resources?.mana || {}) },
      },
      defesas: {
        bloqueio: { value: 0 },
        esquiva: { value: 0 },
        determinacao: { value: 0 },
      },
      subattributes: {
        deslocamento: { value: 0 },
        corrida: { value: 0 },
        carga: { value: 0, max: 0 },
      },
      details: {
        nivel: 0,
        experiencia: 0,
        raca: "",
        classe: "",
        caminho: "",
        aprendiz: "",
        antecedente: "",
        tipoNivelZero: "",
        ...(dadosIniciais.details || {}),
      },
    },
    items: dadosIniciais.items ? [...dadosIniciais.items] : [],
    effects: [],
    flags: { ...(dadosIniciais.flags || {}) },
    getFlag(scope, key) {
      return this.flags?.[scope]?.[key];
    },
    setFlag(scope, key, val) {
      this.flags[scope] = this.flags[scope] || {};
      this.flags[scope][key] = val;
    },
    prepareDerivedData() {
      const race = this.items.find((i) => i.type === "raca");
      const classe = this.items.find((i) => i.type === "classe");
      const raceAttrs = race?.system?.atributos || {};
      const classeAttrs = classe?.system?.atributos || {};

      for (const k of ATRIBUTOS_CANONICOS) {
        const base = this.system.attributes[k]?.base ?? 0;
        const rVal = Number(raceAttrs[k]) || 0;
        const cVal = Number(classeAttrs[k]) || 0;
        const val = base + rVal + cVal;
        this.system.attributes[k] = { base, value: val };
      }

      const baseVida = Number(this.system.resources.vida.baseMax) || Number(this.system.resources.vida.max) || 60;
      this.system.resources.vida.baseMax = baseVida;
      this.system.resources.vida.max = baseVida;
      this.system.resources.vida.value = Math.min(
        Math.max(Number(this.system.resources.vida.value) || 0, 0),
        baseVida
      );

      const baseMana = Number(this.system.resources.mana.baseMax) || Number(this.system.resources.mana.max) || 60;
      this.system.resources.mana.baseMax = baseMana;
      this.system.resources.mana.max = baseMana;
      this.system.resources.mana.value = Math.min(
        Math.max(Number(this.system.resources.mana.value) || 0, 0),
        baseMana
      );

      const forca = this.system.attributes.forca.value;
      const agilidade = this.system.attributes.agilidade.value;
      const vontade = this.system.attributes.vontade.value;

      this.system.defesas.bloqueio.value = 5 + forca;
      this.system.defesas.esquiva.value = 5 + agilidade;
      this.system.defesas.determinacao.value = vontade;

      this.system.subattributes.deslocamento.value = 4 + Math.floor(agilidade / 2);
      this.system.subattributes.corrida.value = this.system.subattributes.deslocamento.value * 4;
      this.system.subattributes.carga.max = forca * 10;

      return this;
    },
    async update(changes = {}) {
      for (const [key, val] of Object.entries(changes)) {
        if (globalThis.foundry?.utils?.setProperty) {
          globalThis.foundry.utils.setProperty(this, key, val);
        } else {
          const parts = key.split(".");
          let target = this;
          while (parts.length > 1) {
            const p = parts.shift();
            target[p] = target[p] || {};
            target = target[p];
          }
          target[parts[0]] = val;
        }
      }
      this.prepareDerivedData();
      return this;
    },
    addItem(item) {
      const cloned = JSON.parse(JSON.stringify(item));
      if (!cloned.id && !cloned._id) {
        cloned._id = Math.random().toString(36).substring(2, 9);
        cloned.id = cloned._id;
      }
      this.items.push(cloned);
      this.prepareDerivedData();
      return cloned;
    },
    removeItem(predicate) {
      const idx = this.items.findIndex(
        typeof predicate === "string" ? (i) => i.id === predicate || i.name === predicate : predicate
      );
      if (idx !== -1) {
        const removed = this.items.splice(idx, 1)[0];
        this.prepareDerivedData();
        return removed;
      }
      return null;
    },
  };

  actor.prepareDerivedData();
  return actor;
}

// ============================================================================
// 1. CRIAR ASPIRANTE
// ============================================================================

/**
 * Cria um personagem Aspirante (Nível Zero).
 *
 * Regras:
 * - Inicia com 40 PV e 40 PM (em vez de 60/60).
 * - Atributos Iniciais da Raça + Habilidade Automática da Raça.
 * - Habilidade Automática da Classe + apenas 1 modificador de Atributo da Classe.
 * - Trava: Atributo não pode exceder 5 no Nível Zero.
 *
 * @param {string|object} raca Nome da raça ou item de raça
 * @param {string|object} classe Nome da classe ou item de classe
 * @param {string} atributoEscolhido Chave do atributo escolhido ('forca', 'agilidade'...)
 * @param {object} [actorOptions={}] Opções extras ou ator existente ({ actor, name, ... })
 * @returns {Promise<object>} Ator Aspirante configurado
 */
export async function criarAspirante(raca, classe, atributoEscolhido, actorOptions = {}) {
  // Suporte polimórfico se actor for passado no primeiro argumento
  if (raca && typeof raca === "object" && (raca.system?.attributes || raca.items)) {
    const actorParam = raca;
    raca = classe;
    classe = atributoEscolhido;
    atributoEscolhido = arguments[3];
    actorOptions = { ...actorOptions, actor: actorParam };
  }

  const racaObj = buscarRaca(raca);
  const classeObj = buscarClasse(classe);

  if (!atributoEscolhido) {
    throw new Error("Um atributo da classe deve ser obrigatoriamente escolhido para o Aspirante.");
  }

  const attrKey = normalizarString(atributoEscolhido);
  if (!ATRIBUTOS_CANONICOS.includes(attrKey)) {
    throw new Error(`Atributo "${atributoEscolhido}" inválido. Permitidos: ${ATRIBUTOS_CANONICOS.join(", ")}.`);
  }

  // Validação: atributo deve ser concedido pela classe
  const classAttrs = classeObj.system?.atributos || {};
  const attrsDisponiveis = ATRIBUTOS_CANONICOS.filter((k) => (Number(classAttrs[k]) || 0) > 0);

  if (!attrsDisponiveis.includes(attrKey)) {
    throw new Error(
      `Atributo escolhido "${atributoEscolhido}" não é concedido pela classe ${classeObj.name}. Modificadores concedidos pela classe: ${attrsDisponiveis.join(", ")}.`
    );
  }

  // Trava de Nível Zero: Atributo não pode exceder 5
  const raceAttrVal = Number(racaObj.system?.atributos?.[attrKey]) || 0;
  if (raceAttrVal + 1 > TETO_ATRIBUTO_NIVEL_ZERO) {
    throw new Error(
      `Trava de Nível Zero: O atributo "${attrKey}" não pode exceder ${TETO_ATRIBUTO_NIVEL_ZERO} (atingiria ${raceAttrVal + 1}). Escolha outro atributo da classe.`
    );
  }

  // Determinar o segundo atributo concedido pela classe que fica pendente para o Nível 1
  const segundoAttrPendente = attrsDisponiveis.find((a) => a !== attrKey) || null;

  // Obter habilidades automáticas
  const habAutoRaca = obterHabilidadeAutomaticaRaca(racaObj);
  const habAutoClasse = obterHabilidadeAutomaticaClasse(classeObj);

  // Instanciar ator
  const ator = actorOptions.actor || (typeof globalThis.createMockActor === "function"
    ? globalThis.createMockActor({
        name: actorOptions.name || `Aspirante ${racaObj.name} ${classeObj.name}`,
        resources: {
          vida: { value: PV_INICIAL_ASPIRANTE, max: PV_INICIAL_ASPIRANTE, baseMax: PV_INICIAL_ASPIRANTE },
          mana: { value: PM_INICIAL_ASPIRANTE, max: PM_INICIAL_ASPIRANTE, baseMax: PM_INICIAL_ASPIRANTE },
        },
        details: {
          nivel: 0,
          experiencia: actorOptions.experiencia ?? 0,
          raca: racaObj.name,
          classe: classeObj.name,
          tipoNivelZero: "aspirante",
        },
      })
    : criarAtorBase({
        name: actorOptions.name || `Aspirante ${racaObj.name} ${classeObj.name}`,
        resources: {
          vida: { value: PV_INICIAL_ASPIRANTE, max: PV_INICIAL_ASPIRANTE, baseMax: PV_INICIAL_ASPIRANTE },
          mana: { value: PM_INICIAL_ASPIRANTE, max: PM_INICIAL_ASPIRANTE, baseMax: PM_INICIAL_ASPIRANTE },
        },
        details: {
          nivel: 0,
          experiencia: actorOptions.experiencia ?? 0,
          raca: racaObj.name,
          classe: classeObj.name,
          tipoNivelZero: "aspirante",
        },
      }));

  // Configurações do sistema do ator
  ator.system.resources.vida.baseMax = PV_INICIAL_ASPIRANTE;
  ator.system.resources.vida.max = PV_INICIAL_ASPIRANTE;
  ator.system.resources.vida.value = PV_INICIAL_ASPIRANTE;

  ator.system.resources.mana.baseMax = PM_INICIAL_ASPIRANTE;
  ator.system.resources.mana.max = PM_INICIAL_ASPIRANTE;
  ator.system.resources.mana.value = PM_INICIAL_ASPIRANTE;

  ator.system.details.nivel = 0;
  ator.system.details.tipoNivelZero = "aspirante";
  ator.system.details.raca = racaObj.name;
  ator.system.details.classe = classeObj.name;
  if (ator.system.details.experiencia === undefined) {
    ator.system.details.experiencia = 0;
  }

  // Item de Raça completo
  const itemRaca = {
    name: racaObj.name,
    type: "raca",
    system: {
      atributos: { ...racaObj.system.atributos },
      habilidadeAutomatica: racaObj.system.habilidadeAutomatica,
      concessoes: racaObj.system.concessoes,
    },
  };
  ator.addItem(itemRaca);

  // Item de Classe contendo APENAS o 1 modificador escolhido
  const itemClasse = {
    name: classeObj.name,
    type: "classe",
    system: {
      atributos: {
        forca: 0,
        agilidade: 0,
        inteligencia: 0,
        vontade: 0,
        [attrKey]: 1,
      },
      concessoes: classeObj.system.concessoes,
    },
    flags: {
      "mighty-blade": {
        atributosOriginaisClasse: { ...classeObj.system.atributos },
        primeiroAtributoEscolhido: attrKey,
        segundoAtributoPendente: segundoAttrPendente,
      },
    },
  };
  ator.addItem(itemClasse);

  // Adicionar Habilidades Automáticas
  if (habAutoRaca) ator.addItem(habAutoRaca);
  if (habAutoClasse) ator.addItem(habAutoClasse);

  // Gravar flags de rastreamento no ator
  ator.setFlag("mighty-blade", "tipoNivelZero", "aspirante");
  ator.setFlag("mighty-blade", "atributoEscolhidoClasse", attrKey);
  ator.setFlag("mighty-blade", "segundoAtributoPendente", segundoAttrPendente);

  ator.prepareDerivedData();
  return ator;
}

// ============================================================================
// 2. EVOLUIR ASPIRANTE PARA NÍVEL 1
// ============================================================================

/**
 * Evolui um personagem Aspirante para Nível 1 ao atingir 10 XP.
 *
 * Regras:
 * - Ao atingir 10 XP: torna-se Nível 1.
 * - Ganha +20 PV (40 -> 60) e +20 PM (40 -> 60).
 * - +1 no segundo Atributo da Classe (podendo agora ultrapassar 5).
 * - Concede as 2 novas Habilidades escolhidas.
 *
 * @param {object} aspirante Ator Aspirante de Nível Zero
 * @param {string} segundoAtributoClasse Segundo atributo da classe a receber +1
 * @param {Array<string|object>} duasNovasHabilidades Lista com exatamente 2 novas habilidades
 * @param {object} [options={}] Opções adicionais ({ ignorarXP: boolean })
 * @returns {Promise<object>} Ator evoluído para Nível 1
 */
export async function evoluirAspiranteParaNivel1(
  aspirante,
  segundoAtributoClasse,
  duasNovasHabilidades,
  options = {}
) {
  if (!aspirante) throw new Error("Aspirante não fornecido.");

  // 1. Validação de XP: 10 XP obrigatórios
  const xpAtual = Number(aspirante.system?.details?.experiencia) || 0;
  if (xpAtual < XP_REQUISITO_NIVEL_1 && !options.ignorarXP) {
    throw new Error(
      `Aspirante precisa de no mínimo ${XP_REQUISITO_NIVEL_1} XP para evoluir para Nível 1. XP atual: ${xpAtual}.`
    );
  }

  // 2. Validação das 2 novas habilidades
  if (!Array.isArray(duasNovasHabilidades) || duasNovasHabilidades.length !== 2) {
    throw new Error(
      "Devem ser fornecidas exatamente 2 novas habilidades para evoluir o Aspirante para o Nível 1."
    );
  }

  // 3. Localizar item de classe do aspirante
  const itemClasse = aspirante.items.find((i) => i.type === "classe");
  if (!itemClasse) {
    throw new Error("Item de classe não encontrado no Aspirante.");
  }

  // 4. Validação do segundo atributo
  if (!segundoAtributoClasse) {
    throw new Error("O segundo atributo da classe deve ser informado para a evolução de Nível 1.");
  }

  const segundoAttrKey = normalizarString(segundoAtributoClasse);
  if (!ATRIBUTOS_CANONICOS.includes(segundoAttrKey)) {
    throw new Error(`Atributo "${segundoAtributoClasse}" inválido. Permitidos: ${ATRIBUTOS_CANONICOS.join(", ")}.`);
  }

  // Obter atributos originais da classe
  let atributosOriginais = itemClasse.flags?.["mighty-blade"]?.atributosOriginaisClasse;
  if (!atributosOriginais) {
    const fullClasse = CANONICAL_CLASSES.find((c) => normalizarString(c.name) === normalizarString(itemClasse.name));
    atributosOriginais = fullClasse?.system?.atributos || {};
  }

  const attrsValidosClasse = ATRIBUTOS_CANONICOS.filter((k) => (Number(atributosOriginais[k]) || 0) > 0);
  const primeiroAttr =
    itemClasse.flags?.["mighty-blade"]?.primeiroAtributoEscolhido ||
    aspirante.getFlag("mighty-blade", "atributoEscolhidoClasse") ||
    ATRIBUTOS_CANONICOS.find((k) => itemClasse.system.atributos[k] === 1);

  if (segundoAttrKey === primeiroAttr) {
    throw new Error(
      `O segundo atributo da classe deve ser diferente do primeiro atributo já escolhido ("${primeiroAttr}").`
    );
  }

  if (!attrsValidosClasse.includes(segundoAttrKey)) {
    throw new Error(
      `O atributo "${segundoAtributoClasse}" não é concedido pela classe ${itemClasse.name}. Modificadores da classe: ${attrsValidosClasse.join(", ")}.`
    );
  }

  // 5. Aplicar o +1 no segundo atributo da classe (aqui PODE ultrapassar 5)
  itemClasse.system.atributos[segundoAttrKey] = 1;

  // 6. Atualizar PV e PM: Ganha +20 PV (40 -> 60) e +20 PM (40 -> 60)
  const vidaAtual = Number(aspirante.system.resources.vida.value) || 0;
  const vidaMaxAntigo = Number(aspirante.system.resources.vida.max) || PV_INICIAL_ASPIRANTE;
  const danoSofridoVida = Math.max(0, vidaMaxAntigo - vidaAtual);

  aspirante.system.resources.vida.baseMax = PV_NIVEL_1;
  aspirante.system.resources.vida.max = PV_NIVEL_1;
  aspirante.system.resources.vida.value = Math.max(0, PV_NIVEL_1 - danoSofridoVida);

  const manaAtual = Number(aspirante.system.resources.mana.value) || 0;
  const manaMaxAntigo = Number(aspirante.system.resources.mana.max) || PM_INICIAL_ASPIRANTE;
  const gastoMana = Math.max(0, manaMaxAntigo - manaAtual);

  aspirante.system.resources.mana.baseMax = PM_NIVEL_1;
  aspirante.system.resources.mana.max = PM_NIVEL_1;
  aspirante.system.resources.mana.value = Math.max(0, PM_NIVEL_1 - gastoMana);

  // 7. Avanço de Nível
  aspirante.system.details.nivel = 1;
  aspirante.system.details.tipoNivelZero = "";
  aspirante.setFlag("mighty-blade", "tipoNivelZero", null);
  aspirante.setFlag("mighty-blade", "segundoAtributoClasse", segundoAttrKey);

  // 8. Concessão das 2 novas habilidades
  for (const hab of duasNovasHabilidades) {
    const itemHab = buscarHabilidade(hab);
    aspirante.addItem(itemHab);
  }

  aspirante.prepareDerivedData();
  return aspirante;
}

// ============================================================================
// 3. CRIAR DESCLASSIFICADO
// ============================================================================

/**
 * Cria um personagem Desclassificado (Nível Zero).
 *
 * Regras:
 * - Inicia com 30 PV e 30 PM (em vez de 60/60).
 * - Nenhum ponto extra de Atributo da classe.
 * - Definido por um Antecedente (sem custo de Ponto de Atributo).
 * - Recebe a Habilidade Automática da Raça.
 *
 * @param {string|object} raca Nome da raça ou item de raça
 * @param {string|object} antecedente Nome do antecedente ou objeto
 * @param {object} [actorOptions={}] Opções extras ({ actor, name, ... })
 * @returns {Promise<object>} Ator Desclassificado configurado
 */
export async function criarDesclassificado(raca, antecedente, actorOptions = {}) {
  // Suporte polimórfico se actor for passado no primeiro argumento
  if (raca && typeof raca === "object" && (raca.system?.attributes || raca.items)) {
    const actorParam = raca;
    raca = antecedente;
    antecedente = arguments[2];
    actorOptions = { ...actorOptions, actor: actorParam };
  }

  const racaObj = buscarRaca(raca);

  if (!antecedente) {
    throw new Error("O Desclassificado deve ser obrigatoriamente definido por um Antecedente.");
  }

  const antNome =
    typeof antecedente === "string"
      ? antecedente
      : antecedente.nome || antecedente.name || antecedente.id;

  const antDesc =
    typeof antecedente === "object"
      ? antecedente.desc || antecedente.descricao || ""
      : CANONICAL_ANTECEDENTES.find((a) => normalizarString(a.nome) === normalizarString(antNome))?.desc || "";

  // Habilidade Automática da Raça
  const habAutoRaca = obterHabilidadeAutomaticaRaca(racaObj);

  // Instanciar ator
  const ator = actorOptions.actor || (typeof globalThis.createMockActor === "function"
    ? globalThis.createMockActor({
        name: actorOptions.name || `Desclassificado ${racaObj.name} (${antNome})`,
        resources: {
          vida: { value: PV_INICIAL_DESCLASSIFICADO, max: PV_INICIAL_DESCLASSIFICADO, baseMax: PV_INICIAL_DESCLASSIFICADO },
          mana: { value: PM_INICIAL_DESCLASSIFICADO, max: PM_INICIAL_DESCLASSIFICADO, baseMax: PM_INICIAL_DESCLASSIFICADO },
        },
        details: {
          nivel: 0,
          experiencia: actorOptions.experiencia ?? 0,
          raca: racaObj.name,
          classe: "",
          antecedente: antNome,
          tipoNivelZero: "desclassificado",
        },
      })
    : criarAtorBase({
        name: actorOptions.name || `Desclassificado ${racaObj.name} (${antNome})`,
        resources: {
          vida: { value: PV_INICIAL_DESCLASSIFICADO, max: PV_INICIAL_DESCLASSIFICADO, baseMax: PV_INICIAL_DESCLASSIFICADO },
          mana: { value: PM_INICIAL_DESCLASSIFICADO, max: PM_INICIAL_DESCLASSIFICADO, baseMax: PM_INICIAL_DESCLASSIFICADO },
        },
        details: {
          nivel: 0,
          experiencia: actorOptions.experiencia ?? 0,
          raca: racaObj.name,
          classe: "",
          antecedente: antNome,
          tipoNivelZero: "desclassificado",
        },
      }));

  // Configurar recursos para 30 PV e 30 PM
  ator.system.resources.vida.baseMax = PV_INICIAL_DESCLASSIFICADO;
  ator.system.resources.vida.max = PV_INICIAL_DESCLASSIFICADO;
  ator.system.resources.vida.value = PV_INICIAL_DESCLASSIFICADO;

  ator.system.resources.mana.baseMax = PM_INICIAL_DESCLASSIFICADO;
  ator.system.resources.mana.max = PM_INICIAL_DESCLASSIFICADO;
  ator.system.resources.mana.value = PM_INICIAL_DESCLASSIFICADO;

  ator.system.details.nivel = 0;
  ator.system.details.tipoNivelZero = "desclassificado";
  ator.system.details.raca = racaObj.name;
  ator.system.details.classe = "";
  ator.system.details.antecedente = antNome;
  if (ator.system.details.experiencia === undefined) {
    ator.system.details.experiencia = 0;
  }

  // Item de Raça (apenas atributos iniciais da raça, sem classe)
  const itemRaca = {
    name: racaObj.name,
    type: "raca",
    system: {
      atributos: { ...racaObj.system.atributos },
      habilidadeAutomatica: racaObj.system.habilidadeAutomatica,
      concessoes: racaObj.system.concessoes,
    },
  };
  ator.addItem(itemRaca);

  // Habilidade Automática da Raça
  if (habAutoRaca) ator.addItem(habAutoRaca);

  // Registrar item de Antecedente (sem custo de Ponto de Atributo)
  const itemAntecedente = {
    name: antNome,
    type: "habilidade",
    system: {
      categoria: "antecedente",
      descricao: antDesc,
    },
    flags: {
      "mighty-blade": {
        isAntecedente: true,
      },
    },
  };
  ator.addItem(itemAntecedente);

  // Flags
  ator.setFlag("mighty-blade", "tipoNivelZero", "desclassificado");
  ator.setFlag("mighty-blade", "antecedente", antNome);

  ator.prepareDerivedData();
  return ator;
}

// ============================================================================
// 4. EVOLUIR DESCLASSIFICADO PARA NÍVEL 1
// ============================================================================

/**
 * Evolui um Desclassificado para Nível 1 ao atingir 10 XP.
 *
 * Regras:
 * - Ao atingir 10 XP: escolhe Classe Nível 1.
 * - Ganha Habilidade Automática da Classe, +30 PV (30 -> 60) e +30 PM (30 -> 60).
 * - Modificadores da Classe com redutor de -1 ponto no atributo (por possuir Antecedente).
 * - Concede 2 novas Habilidades.
 *
 * @param {object} desclassificado Ator Desclassificado de Nível Zero
 * @param {string|object} classe Classe escolhida de Nível 1
 * @param {Array<string|object>} duasNovasHabilidades Duas novas habilidades escolhidas
 * @param {string|object} [atributoEscolhidoOuOpcoes=null] Atributo que recebe o +1 da classe (ou objeto com opções)
 * @returns {Promise<object>} Ator evoluído para Nível 1
 */
export async function evoluirDesclassificadoParaNivel1(
  desclassificado,
  classe,
  duasNovasHabilidades,
  atributoEscolhidoOuOpcoes = null
) {
  if (!desclassificado) throw new Error("Desclassificado não fornecido.");

  // Opções e atributos
  let atributoEscolhido = null;
  let options = {};
  if (typeof atributoEscolhidoOuOpcoes === "string") {
    atributoEscolhido = atributoEscolhidoOuOpcoes;
  } else if (typeof atributoEscolhidoOuOpcoes === "object" && atributoEscolhidoOuOpcoes !== null) {
    options = atributoEscolhidoOuOpcoes;
    atributoEscolhido = options.atributoEscolhido || null;
  }

  // 1. Validação de XP: 10 XP obrigatórios
  const xpAtual = Number(desclassificado.system?.details?.experiencia) || 0;
  if (xpAtual < XP_REQUISITO_NIVEL_1 && !options.ignorarXP) {
    throw new Error(
      `Desclassificado precisa de no mínimo ${XP_REQUISITO_NIVEL_1} XP para evoluir para Nível 1. XP atual: ${xpAtual}.`
    );
  }

  // 2. Validação das 2 novas habilidades
  if (!Array.isArray(duasNovasHabilidades) || duasNovasHabilidades.length !== 2) {
    throw new Error(
      "Devem ser fornecidas exatamente 2 novas habilidades para evoluir o Desclassificado para o Nível 1."
    );
  }

  // 3. Resolução da classe
  const classeObj = buscarClasse(classe);
  const classAttrs = classeObj.system?.atributos || {};
  const attrsDisponiveisClasse = ATRIBUTOS_CANONICOS.filter(
    (k) => (Number(classAttrs[k]) || 0) > 0
  );

  // 4. Modificadores da Classe com redutor de -1 ponto no atributo (por possuir Antecedente)
  // A classe normalmente concederia 2 pontos de bônus (+1 em dois atributos).
  // Com o redutor de -1, apenas 1 atributo receberá +1.
  let attrComBonus = null;
  if (atributoEscolhido) {
    const attrNormalizado = normalizarString(atributoEscolhido);
    if (!attrsDisponiveisClasse.includes(attrNormalizado)) {
      throw new Error(
        `Atributo escolhido "${atributoEscolhido}" não é um dos modificadores concedidos pela classe ${classeObj.name} (${attrsDisponiveisClasse.join(", ")}).`
      );
    }
    attrComBonus = attrNormalizado;
  } else {
    // Se não especificado explicitamente, utiliza o primeiro modificador concedido pela classe
    attrComBonus = attrsDisponiveisClasse[0];
  }

  // 5. Adicionar item da classe com modificador reduzido (+1 em apenas 1 atributo)
  const itemClasse = {
    name: classeObj.name,
    type: "classe",
    system: {
      atributos: {
        forca: 0,
        agilidade: 0,
        inteligencia: 0,
        vontade: 0,
        [attrComBonus]: 1,
      },
      concessoes: classeObj.system?.concessoes,
    },
    flags: {
      "mighty-blade": {
        redutorAntecedenteAplicado: true,
        atributoComBonus: attrComBonus,
        atributosOriginaisClasse: { ...classAttrs },
      },
    },
  };
  desclassificado.addItem(itemClasse);

  // 6. Conceder Habilidade Automática da Classe
  const habAutoClasse = obterHabilidadeAutomaticaClasse(classeObj);
  if (habAutoClasse) desclassificado.addItem(habAutoClasse);

  // 7. Ganho de Recursos: +30 PV (30 -> 60) e +30 PM (30 -> 60)
  const vidaAtual = Number(desclassificado.system.resources.vida.value) || 0;
  const vidaMaxAntigo = Number(desclassificado.system.resources.vida.max) || PV_INICIAL_DESCLASSIFICADO;
  const danoSofridoVida = Math.max(0, vidaMaxAntigo - vidaAtual);

  desclassificado.system.resources.vida.baseMax = PV_NIVEL_1;
  desclassificado.system.resources.vida.max = PV_NIVEL_1;
  desclassificado.system.resources.vida.value = Math.max(0, PV_NIVEL_1 - danoSofridoVida);

  const manaAtual = Number(desclassificado.system.resources.mana.value) || 0;
  const manaMaxAntigo = Number(desclassificado.system.resources.mana.max) || PM_INICIAL_DESCLASSIFICADO;
  const gastoMana = Math.max(0, manaMaxAntigo - manaAtual);

  desclassificado.system.resources.mana.baseMax = PM_NIVEL_1;
  desclassificado.system.resources.mana.max = PM_NIVEL_1;
  desclassificado.system.resources.mana.value = Math.max(0, PM_NIVEL_1 - gastoMana);

  // 8. Atualizar Nível e Classe
  desclassificado.system.details.nivel = 1;
  desclassificado.system.details.classe = classeObj.name;
  desclassificado.system.details.tipoNivelZero = "";
  desclassificado.setFlag("mighty-blade", "tipoNivelZero", null);
  desclassificado.setFlag("mighty-blade", "classeNivel1", classeObj.name);

  // 9. Conceder as 2 novas Habilidades
  for (const hab of duasNovasHabilidades) {
    const itemHab = buscarHabilidade(hab);
    desclassificado.addItem(itemHab);
  }

  desclassificado.prepareDerivedData();
  return desclassificado;
}
