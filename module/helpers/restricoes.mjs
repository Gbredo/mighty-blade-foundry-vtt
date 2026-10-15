/**
 * Motor Canônico de Restrições e Incompatibilidades Raciais e Mecânicas do Mighty Blade 3e.
 *
 * Consolida as regras oficiais do Guia Básico, Guia do Herói e Guia do Vilão para:
 * - Caso 14: Naga não pode ser Sacerdote (Fêmeas arcanas: Feiticeiro, Necromante, Rúnico; Machos combatentes/Glycon).
 * - Caso 15: Incompatibilidade de Pacto e Misticismo: Personagem com Pacto (Cultista) não pode possuir Conhecimento Místico ou Dogma, nem ser Aprendiz de Sacerdote.
 * - Caso 16: Incompatibilidade Inversa: Se um Sacerdote adquirir um Pacto, perde imediatamente Dogma/Conhecimento Místico.
 * - Caso 17: Nanismo — Restrições: Proibido para Metadílios; selecionável apenas no Nível 1; armas de duas mãos corporais são inaptas; exige ambas as mãos para armas corporais com FN >= 5.
 * - Caso 18: Intuição: Proibida para a raça Astério.
 * - Caso 19: Sentidos Apurados: Proibidos para a raça Mahok.
 * - Caso 20: Fúria Bestial: Permitida apenas se o Espírito Animal for Lobo ou Urso.
 * - Caso 21: Habilidades Exclusivas de Criação (Nível 1): Proibida a compra após a criação de: Isnuu (Faen), Fulgurante (Fira), Escamas Pesadas e Linhagem Dracônica 2 (Dragano), Braços Extras e Pele de Pedra 2 (Mahok), Olhos de Águia (Levent), Fortaleza e Duro como Pedra (Astério/Juban/Anão).
 */

import {
  norm,
  avaliarRequisitos,
  REQUISITOS_HABILIDADES_CANONICAS,
  formatarErroRequisitos,
} from "./requisitos.mjs";
import { CANONICAL_HABILIDADES, CANONICAL_MAGIAS } from "../data/canonical-packs-data.mjs";

/**
 * Habilidades canônicas exclusivas da criação de personagem (Nível 1).
 * Não podem ser adquiridas durante evolução heroica (nível > 1).
 */
export const HABILIDADES_EXCLUSIVAS_CRIACAO = {
  "isnuu": ["faen"],
  "fulgurante": ["fira"],
  "escamas pesadas": ["dragano"],
  "escamas-pesadas": ["dragano"],
  "linhagem draconica 2": ["dragano"],
  "linhagem-draconica-2": ["dragano"],
  "bracos extras": ["mahok"],
  "bracos-extras": ["mahok"],
  "pele de pedra 2": ["mahok"],
  "pele-de-pedra-2": ["mahok"],
  "olhos de aguia": ["levent"],
  "olhos-de-aguia": ["levent"],
  "fortaleza": ["asterio", "asteria", "juban", "anao"],
  "duro como pedra": ["anao"],
  "duro-como-pedra": ["anao"],
  "nanismo": ["todas exceto metadilio"],
};

/**
 * Helper para extrair a raça do ator (seja string no sistema ou item embutido).
 * @param {object} actor
 * @returns {string}
 */
export function getRacaAtor(actor) {
  if (!actor) return "";
  const rawItems = actor.items
    ? (Array.isArray(actor.items) ? actor.items : Array.from(actor.items.values()))
    : [];
  const racaDoc = rawItems.find((i) => i.type === "raca");
  return norm(racaDoc?.name || actor.system?.details?.raca || "");
}

/**
 * Helper para extrair o gênero do ator.
 * @param {object} actor
 * @returns {"macho"|"femea"|""}
 */
export function getGeneroAtor(actor) {
  if (!actor) return "";
  const raca = getRacaAtor(actor);
  if (raca.includes("macho") || raca.includes("-m")) return "macho";
  if (raca.includes("femea") || raca.includes("-f")) return "femea";

  const g = norm(actor.system?.details?.genero || actor.system?.details?.sexo || "");
  if (g === "macho" || g === "masculino" || g === "m") return "macho";
  if (g === "femea" || g === "feminino" || g === "f") return "femea";
  return "";
}

/**
 * Helper para extrair a lista de habilidades/itens do ator.
 * @param {object} actor
 * @returns {Array<object>}
 */
export function getItensAtor(actor) {
  if (!actor) return [];
  return actor.items
    ? (Array.isArray(actor.items) ? actor.items : Array.from(actor.items.values()))
    : [];
}

/**
 * Caso 14: Validação de Classe e Raça (Dimorfismo Naga e Teologia de Glycon).
 * - Naga não pode ser Sacerdote (adoração exclusiva ao Primordial Glycon e xenofobia contra o Panteão).
 * - Machos Naga não podem ser conjuradores arcanos (Feiticeiro, Necromante); são soldados combatentes.
 * - Fêmeas Naga podem ser arcanas (Feiticeiro, Necromante, Rúnico).
 *
 * @param {object} actor
 * @param {string} classeNome Nome da classe a ser verificada
 * @returns {{ permitido: boolean, motivo?: string }}
 */
export function validarClasseRaca(actor, classeNome) {
  const raca = getRacaAtor(actor);
  const nClasse = norm(classeNome);

  if (raca.includes("naga")) {
    // 1. Naga (qualquer gênero) não pode ser Sacerdote
    if (nClasse === "sacerdote") {
      return {
        permitido: false,
        motivo: "Nagas não podem escolher a classe Sacerdote: adoram exclusivamente o Primordial Glycon e rejeitam os dogmas do Panteão de Cassiopéia.",
      };
    }

    const genero = getGeneroAtor(actor);

    // 2. Macho Naga vs Magia Arcana
    if (genero === "macho") {
      const classesMagicasArcanas = ["feiticeiro", "necromante"];
      if (classesMagicasArcanas.includes(nClasse)) {
        return {
          permitido: false,
          motivo: "Machos Naga não possuem aptidão mágica/arcana (função estritamente reservada às fêmeas consortes de Glycon). Machos devem seguir classes combatentes (Espadachim, Guerreiro, Rúnico, Paladino de Glycon).",
        };
      }
    }

    // 3. Fêmeas Naga arcanas
    if (genero === "femea") {
      const classesPermitidasFemea = ["feiticeiro", "necromante", "runico", "guerreiro", "espadachim", "ladino", "paladino"];
      if (classesPermitidasFemea.includes(nClasse)) {
        return { permitido: true };
      }
    }
  }

  return { permitido: true };
}

/**
 * Caso 15: Incompatibilidade de Pacto e Misticismo.
 * Personagem com Pacto (ou Caminho Cultista) não pode possuir Conhecimento Místico ou Dogma, nem ser Aprendiz de Sacerdote.
 *
 * @param {object} actor
 * @param {string|object} itemOuTipo Nome da habilidade, classe ou objeto `{ tipo: 'aprendiz'|'habilidade', nome: string }`
 * @returns {{ permitido: boolean, motivo?: string }}
 */
export function validarIncompatibilidadePactoMisticismo(actor, itemOuTipo) {
  const itens = getItensAtor(actor);
  const caminhoAtor = norm(actor.system?.details?.caminho || "");

  const temPacto = itens.some((i) => {
    const n = norm(i.name);
    return n === "pacto" || n.startsWith("pacto ");
  }) || caminhoAtor === "cultista" || caminhoAtor === "aziago";

  const nItem = typeof itemOuTipo === "string"
    ? norm(itemOuTipo)
    : norm(itemOuTipo?.name || itemOuTipo?.nome || itemOuTipo?.classe || "");

  const isAprendiz = (typeof itemOuTipo === "object" && itemOuTipo?.tipo === "aprendiz")
    || nItem === "aprendiz de sacerdote"
    || nItem === "aprendiz: sacerdote";

  // Se o ator tem Pacto:
  if (temPacto) {
    if (nItem === "conhecimento mistico" || nItem.includes("conhecimento mistico")) {
      return {
        permitido: false,
        motivo: "Incompatibilidade Teológica: Um personagem com Pacto Infernal (Cultista) profanou sua essência e não pode possuir Conhecimento Místico.",
      };
    }

    if (nItem === "dogma" || nItem.startsWith("dogma ")) {
      return {
        permitido: false,
        motivo: "Incompatibilidade Teológica: Um servo do Inferno não pode receber nem manter Dogmas das divindades de Cassiopéia.",
      };
    }

    if (isAprendiz || nItem === "sacerdote") {
      return {
        permitido: false,
        motivo: "Incompatibilidade Teológica: Personagens com Pacto Infernal são proibidos de se tornarem Sacerdotes ou Aprendizes de Sacerdote.",
      };
    }
  }

  // Inverso: Se o personagem já tem Conhecimento Místico, Dogma ou é Sacerdote:
  const temMisticismo = itens.some((i) => {
    const n = norm(i.name);
    return n.includes("conhecimento mistico") || n.includes("dogma");
  }) || norm(actor.system?.details?.classe || "") === "sacerdote" || norm(actor.system?.details?.aprendiz || "") === "sacerdote";

  if (temMisticismo) {
    if (nItem === "pacto" || nItem.startsWith("pacto ") || nItem === "cultista") {
      return {
        permitido: false,
        motivo: "Incompatibilidade: Um devoto com Dogma ou Conhecimento Místico não pode realizar Pactos sem renunciar imediatamente à sua fé.",
      };
    }
  }

  return { permitido: true };
}

/**
 * Caso 16: Incompatibilidade Inversa.
 * Se um Sacerdote (ou devoto com Dogma/Conhecimento Místico) adquirir um Pacto,
 * perde imediatamente Dogma e Conhecimento Místico.
 *
 * @param {object} actor
 * @param {object} [pactoItem] Item de Pacto a ser concedido
 * @returns {Promise<{ sucesso: boolean, habilidadesRemovidas: string[], pactoAdicionado: string }>}
 */
export async function adicionarPacto(actor, pactoItem = { name: "Pacto", type: "habilidade" }) {
  const itens = getItensAtor(actor);

  // Localiza Conhecimento Místico e Dogmas para revogação imediata
  const conflitantes = itens.filter((i) => {
    const n = norm(i.name);
    return n.includes("conhecimento mistico") || n.includes("dogma");
  });

  const idsParaRemover = conflitantes.map((i) => i.id || i._id).filter(Boolean);
  const nomesRemovidos = conflitantes.map((i) => i.name);

  // Remove usando a API do actor se disponível
  if (idsParaRemover.length > 0 && typeof actor.deleteEmbeddedDocuments === "function") {
    await actor.deleteEmbeddedDocuments("Item", idsParaRemover);
  } else if (idsParaRemover.length > 0) {
    actor.items = itens.filter((i) => !idsParaRemover.includes(i.id || i._id));
  } else if (nomesRemovidos.length > 0) {
    actor.items = itens.filter((i) => !nomesRemovidos.includes(i.name));
  }

  // Adiciona o Pacto
  const itemPacto = {
    id: pactoItem.id || `pacto-${Date.now()}`,
    name: pactoItem.name || "Pacto",
    type: "habilidade",
    system: {
      tipo: "suporte",
      categoria: "padrao",
      custo: 0,
      requisitos: "",
      ...(pactoItem.system || {}),
    },
  };

  if (typeof actor.createEmbeddedDocuments === "function") {
    await actor.createEmbeddedDocuments("Item", [itemPacto]);
  } else {
    actor.items.push(itemPacto);
  }

  return {
    sucesso: true,
    habilidadesRemovidas: nomesRemovidos,
    pactoAdicionado: itemPacto.name,
  };
}

/**
 * Caso 17: Nanismo — Restrições.
 * 1. Proibido para Metadílios.
 * 2. Selecionável apenas no Nível 1.
 *
 * @param {object} actor
 * @returns {{ permitido: boolean, motivo?: string }}
 */
export function validarAquisicaoNanismo(actor) {
  const raca = getRacaAtor(actor);
  if (raca.includes("metadilio")) {
    return {
      permitido: false,
      motivo: "A habilidade Nanismo é proibida para a raça Metadílio (metadílios já possuem estatura diminuta natural).",
    };
  }

  const nivel = Number(actor.system?.details?.nivel) || 1;
  if (nivel > 1) {
    return {
      permitido: false,
      motivo: "A característica Nanismo só pode ser selecionada durante a criação do personagem (Nível 1).",
    };
  }

  return { permitido: true };
}

/**
 * Caso 17: Nanismo — Aptidão de Armas.
 * 3. Armas de duas mãos corporais são inaptas.
 *
 * @param {object} actor
 * @param {object} arma Item de arma do Mighty Blade
 * @returns {{ apto: boolean, motivo?: string }}
 */
export function podeEmpunharArma(actor, arma) {
  const itens = getItensAtor(actor);
  const temNanismo = itens.some((i) => norm(i.name) === "nanismo");
  if (!temNanismo) return { apto: true };

  const alcance = String(arma.system?.alcance || "").toLowerCase();
  const eCorporal = !alcance.includes("disparo");
  const props = Array.isArray(arma.system?.propriedades)
    ? arma.system.propriedades
    : [];
  const eDuasMaos = props.some((p) => norm(p) === "duasmaos" || norm(p) === "duas maos");

  if (eCorporal && eDuasMaos) {
    return {
      apto: false,
      motivo: `Armas corporais que requerem duas mãos (${arma.name}) são grandes demais para o porte de personagens com Nanismo.`,
    };
  }

  return { apto: true };
}

/**
 * Caso 17: Nanismo — Quantidade de Mãos Necessárias para Empunhar.
 * 4. Exige ambas as mãos para armas corporais com FN >= 5.
 *
 * @param {object} actor
 * @param {object} arma Item de arma
 * @returns {number} 1 ou 2 mãos
 */
export function calcularMaosArma(actor, arma) {
  const itens = getItensAtor(actor);
  const temNanismo = itens.some((i) => norm(i.name) === "nanismo");
  const fn = Number(arma.system?.fn) || 0;
  const alcance = String(arma.system?.alcance || "").toLowerCase();
  const eCorporal = !alcance.includes("disparo");
  const props = Array.isArray(arma.system?.propriedades) ? arma.system.propriedades : [];
  const eDuasMaos = props.some((p) => norm(p) === "duasmaos" || norm(p) === "duas maos");

  if (eDuasMaos) return 2;

  if (temNanismo && eCorporal && fn >= 5) {
    return 2; // Exige ambas as mãos para armas corporais com FN 5 ou mais
  }

  return 1;
}

/**
 * Caso 18: Intuição — Proibida para a raça Astério.
 *
 * @param {object} actor
 * @returns {{ permitido: boolean, motivo?: string }}
 */
export function validarIntuicao(actor) {
  const raca = getRacaAtor(actor);
  if (raca.includes("asterio") || raca.includes("asteria")) {
    return {
      permitido: false,
      motivo: "A habilidade Intuição é proibida para a raça Astério / Astéria (confiam na robustez física e lógica estoica, não na intuição).",
    };
  }
  return { permitido: true };
}

/**
 * Caso 19: Sentidos Apurados — Proibidos para a raça Mahok.
 *
 * @param {object} actor
 * @returns {{ permitido: boolean, motivo?: string }}
 */
export function validarSentidosApurados(actor) {
  const raca = getRacaAtor(actor);
  if (raca.includes("mahok")) {
    return {
      permitido: false,
      motivo: "A habilidade Sentidos Apurados é proibida para a raça Mahok (sua couraça de pedra embota a percepção sensorial fina).",
    };
  }
  return { permitido: true };
}

/**
 * Caso 20: Fúria Bestial — Permitida apenas se o Espírito Animal for Lobo ou Urso.
 *
 * @param {object} actor
 * @returns {{ permitido: boolean, motivo?: string }}
 */
export function validarFuriaBestial(actor) {
  const raca = getRacaAtor(actor);
  if (!raca.includes("aesir")) {
    return {
      permitido: false,
      motivo: "Fúria Bestial é uma habilidade racial exclusiva dos Aesir.",
    };
  }

  // Verifica o Espírito Animal em details, flags ou itens do herói
  const itens = getItensAtor(actor);
  const espDetalhe = norm(actor.system?.details?.espiritoAnimal || actor.getFlag?.("mighty-blade", "espiritoAnimal") || "");
  const espItem = itens.find((i) => {
    const n = norm(i.name);
    return n.includes("espirito animal") || n.includes("espírito animal");
  });
  const espNomeItem = espItem ? norm(espItem.name) : "";

  const isLoboOuUrso =
    espDetalhe === "lobo" ||
    espDetalhe === "urso" ||
    espNomeItem.includes("lobo") ||
    espNomeItem.includes("urso");

  if (!isLoboOuUrso) {
    return {
      permitido: false,
      motivo: "Fúria Bestial é permitida apenas se o Espírito Animal for Lobo ou Urso.",
    };
  }

  return { permitido: true };
}

/**
 * Caso 21: Habilidades Exclusivas de Criação (Nível 1).
 * Proibida a compra após a criação de:
 * Isnuu (Faen), Fulgurante (Fira), Escamas Pesadas e Linhagem Dracônica 2 (Dragano),
 * Braços Extras e Pele de Pedra 2 (Mahok), Olhos de Águia (Levent),
 * Fortaleza e Duro como Pedra (Astério/Juban/Anão).
 *
 * @param {object} actor
 * @param {string|object} habilidade Nome da habilidade ou item
 * @returns {{ permitido: boolean, motivo?: string }}
 */
export function validarHabilidadeExclusivaCriacao(actorOuNivel, habilidade) {
  const habNome = typeof habilidade === "string" ? habilidade : habilidade?.name;
  const nHab = norm(habNome);
  const racasPermitidas = HABILIDADES_EXCLUSIVAS_CRIACAO[nHab];

  if (!racasPermitidas) {
    // Não é uma habilidade exclusiva de criação da lista
    return { permitido: true, valido: true };
  }

  const nivel = typeof actorOuNivel === "number"
    ? actorOuNivel
    : Number(actorOuNivel?.system?.details?.nivel) || 1;

  if (nivel > 1) {
    const erro = `A habilidade "${habNome}" é uma característica inata exclusiva da criação do personagem e é proibida para compra após o Nível 1.`;
    return {
      permitido: false,
      valido: false,
      motivo: erro,
      erro,
    };
  }

  // Se passado apenas o nível numérico, aprova para o nível 1
  if (typeof actorOuNivel === "number") {
    return { permitido: true, valido: true };
  }

  // No nível 1, valida se o personagem tem a raça correta
  const raca = getRacaAtor(actorOuNivel);
  if (!raca) {
    return { permitido: true, valido: true }; // Sem raça definida ainda
  }

  const atendeRaca = racasPermitidas.some((rp) => {
    if (rp === "todas exceto metadilio") return !raca.includes("metadilio");
    return raca.includes(rp) || rp.includes(raca);
  });

  if (!atendeRaca) {
    const erro = `A habilidade "${habNome}" requer a raça ${racasPermitidas.join(" / ")} (personagem é ${raca}).`;
    return {
      permitido: false,
      valido: false,
      motivo: erro,
      erro,
    };
  }

  return { permitido: true, valido: true };
}

/**
 * Validador Unificado para Aquisição de Habilidade.
/**
 * Índice em memória dos itens canônicos (Habilidades e Magias) do SSOT (habilidades.base).
 */
let _canonicalLookupCache = null;
function getCanonicalLookupCache() {
  if (_canonicalLookupCache) return _canonicalLookupCache;
  const byNormMagia = new Map();
  const byNormHab = new Map();
  const byNormAny = new Map();

  for (const m of CANONICAL_MAGIAS || []) {
    const k = norm(m.name);
    const s = norm(m.flags?.["mighty-blade"]?.slug || "");
    if (k) {
      byNormMagia.set(k, m);
      byNormAny.set(k, m);
    }
    if (s) {
      byNormMagia.set(s, m);
      byNormAny.set(s, m);
    }
    for (const al of m.flags?.["mighty-blade"]?.aliases || []) {
      const ak = norm(al);
      if (ak) {
        byNormMagia.set(ak, m);
        byNormAny.set(ak, m);
      }
    }
  }

  for (const h of CANONICAL_HABILIDADES || []) {
    const k = norm(h.name);
    const s = norm(h.flags?.["mighty-blade"]?.slug || "");
    if (k) {
      byNormHab.set(k, h);
      if (!byNormAny.has(k)) byNormAny.set(k, h);
    }
    if (s) {
      byNormHab.set(s, h);
      if (!byNormAny.has(s)) byNormAny.set(s, h);
    }
    for (const al of h.flags?.["mighty-blade"]?.aliases || []) {
      const ak = norm(al);
      if (ak) {
        byNormHab.set(ak, h);
        if (!byNormAny.has(ak)) byNormAny.set(ak, h);
      }
    }
  }

  _canonicalLookupCache = { byNormMagia, byNormHab, byNormAny };
  return _canonicalLookupCache;
}

/**
 * Localiza o registro canônico (SSOT Obsidian habilidades.base) correspondente a um item ou nome.
 * @param {object|string} itemOuNome
 * @param {"magia"|"habilidade"|""} [tipoHint=""]
 * @returns {object|null}
 */
export function resolverItemCanonico(itemOuNome, tipoHint = "") {
  if (!itemOuNome) return null;
  const cache = getCanonicalLookupCache();
  const nome = typeof itemOuNome === "string" ? itemOuNome : (itemOuNome.name || itemOuNome.nome || "");
  const slug = typeof itemOuNome === "object" ? (itemOuNome.flags?.["mighty-blade"]?.slug || "") : "";
  const tipo = typeof itemOuNome === "object" ? (itemOuNome.type || tipoHint) : tipoHint;

  const k = norm(nome);
  const s = norm(slug);

  if (tipo === "magia") {
    return cache.byNormMagia.get(k) || (s && cache.byNormMagia.get(s)) || cache.byNormAny.get(k) || null;
  }
  if (tipo === "habilidade") {
    return cache.byNormHab.get(k) || (s && cache.byNormHab.get(s)) || cache.byNormAny.get(k) || null;
  }
  return cache.byNormAny.get(k) || (s && cache.byNormAny.get(s)) || null;
}

/**
 * Enriquecimento não-destrutivo de um item vindo do LevelDB ou memória com os metadados canônicos do SSOT
 * (acesso, tipoAcesso, requisitos, fonte, dificuldade, custo, fonteLivro).
 * @param {object} item
 * @param {"magia"|"habilidade"|""} [tipoHint=""]
 * @returns {object}
 */
export function enriquecerItemComSSOT(item, tipoHint = "") {
  if (!item || typeof item !== "object") return item;
  const canon = resolverItemCanonico(item, tipoHint || item.type || "");
  if (!canon) return item;

  item.system = item.system || {};
  if (!Array.isArray(item.system.acesso) || item.system.acesso.length === 0) {
    item.system.acesso = canon.system?.acesso || [];
  }
  if (!item.system.tipoAcesso && canon.system?.tipoAcesso) {
    item.system.tipoAcesso = canon.system.tipoAcesso;
  }
  if (!item.system.nivel && canon.system?.nivel) {
    item.system.nivel = canon.system.nivel;
  }
  if ((item.system.requisitos === undefined || item.system.requisitos === "") && canon.system?.requisitos) {
    item.system.requisitos = canon.system.requisitos;
  }
  if (!item.system.fonteLivro && canon.system?.fonteLivro) {
    item.system.fonteLivro = canon.system.fonteLivro;
  }
  if (canon.type === "magia" && canon.system?.fonte) {
    item.system.fonte = canon.system.fonte;
  }
  if (!item.system.dificuldadeTexto && canon.system?.dificuldadeTexto) {
    item.system.dificuldadeTexto = canon.system.dificuldadeTexto;
  }
  return item;
}

/**
 * Extrai o conjunto normalizado de tokens de acesso ativos do personagem:
 * - "geral"
 * - Raça (incluindo dimorfismo Naga ♀ / Naga ♂ e sinônimos Dragano/Draconiano, Faen/Silfo, Fauno/Sátiro)
 * - Classe Principal e Classe de Aprendiz
 * - Caminho de Especialização
 * - Organização (incluindo siglas canônicas de habilidades.base: Anel, Arpão, Fronteiras Rochosas, Sanguefrio)
 * - Antecedente
 *
 * @param {object} actor
 * @returns {Set<string>}
 */
export function obterAcessosAtor(actor) {
  const tokens = new Set(["geral"]);
  if (!actor) return tokens;

  const rawItems = getItensAtor(actor);
  const addToken = (val) => {
    const n = norm(val);
    if (!n) return;
    tokens.add(n);

    // Sinônimos de Raça no SSOT
    if (n === "dragano" || n === "draconiano") {
      tokens.add("dragano");
      tokens.add("draconiano");
    }
    if (n === "faen" || n === "silfo") {
      tokens.add("faen");
      tokens.add("silfo");
    }
    if (n === "fauno" || n === "satiro") {
      tokens.add("fauno");
      tokens.add("satiro");
    }

    // Sinônimos de Classe
    if (n === "nobre" || n === "senescal") {
      tokens.add("nobre");
      tokens.add("senescal");
    }

    // Sinônimos de Organização no SSOT (habilidades.base)
    if (n === "irmandade do anel de bronze" || n === "anel") {
      tokens.add("irmandade do anel de bronze");
      tokens.add("anel");
    }
    if (n === "o arpao" || n === "arpao") {
      tokens.add("o arpao");
      tokens.add("arpao");
    }
    if (n === "guarda das fronteiras rochosas" || n === "fronteiras rochosas") {
      tokens.add("guarda das fronteiras rochosas");
      tokens.add("fronteiras rochosas");
    }
    if (n === "cla sanguefrio" || n === "sanguefrio") {
      tokens.add("cla sanguefrio");
      tokens.add("sanguefrio");
    }
  };

  // 1. Raça e dimorfismo Naga
  const racaAtor = getRacaAtor(actor);
  if (racaAtor) {
    addToken(racaAtor);
    if (racaAtor.includes("naga")) {
      tokens.add("naga");
      const genero = getGeneroAtor(actor);
      if (genero === "femea") {
        tokens.add("naga ♀");
        tokens.add("naga femea");
        tokens.add("naga (femea)");
      } else if (genero === "macho") {
        tokens.add("naga ♂");
        tokens.add("naga macho");
        tokens.add("naga (macho)");
      }
    }
  }

  // 2. Classe Principal e Aprendiz
  for (const it of rawItems) {
    if (it.type === "classe") addToken(it.name);
    if (it.type === "caminho") addToken(it.name);
    if (it.type === "organizacao") addToken(it.name);
    if (it.type === "antecedente") addToken(it.name);
    if (it.flags?.["mighty-blade"]?.sourceAprendizClass) {
      addToken(it.flags["mighty-blade"].sourceAprendizClass);
    }
  }

  addToken(actor.system?.details?.classe);
  addToken(actor.system?.details?.aprendiz);
  addToken(actor.system?.details?.caminho);
  addToken(actor.system?.details?.organizacao);
  addToken(actor.system?.details?.antecedente);
  addToken(actor.flags?.["mighty-blade"]?.organizacao);

  return tokens;
}

/**
 * Valida se o ator possui acesso canônico (Raça, Classe, Aprendiz, Caminho, Organização ou Geral)
 * a uma Habilidade ou Magia conforme definido em `habilidades.base` (SSOT Obsidian).
 *
 * @param {object} actor
 * @param {object|string} itemOuNome
 * @param {{ resolverCanonico?: boolean, tipoHint?: string }} [opcoes={}]
 * @returns {{ permitido: boolean, motivo?: string, acessosPermitidos?: string[] }}
 */
export function validarAcessoItem(actor, itemOuNome, opcoes = {}) {
  if (!actor || !itemOuNome) return { permitido: true };
  if (actor.type === "npc") return { permitido: true };

  const resolverCanonico = opcoes.resolverCanonico !== false;
  const tipoHint = opcoes.tipoHint || (typeof itemOuNome === "object" ? itemOuNome.type : "");
  const canon = resolverCanonico ? resolverItemCanonico(itemOuNome, tipoHint) : null;

  const nomeItem = typeof itemOuNome === "string"
    ? itemOuNome
    : (itemOuNome.name || itemOuNome.nome || canon?.name || "Item");

  let rawAcessos = [];
  if (typeof itemOuNome === "object" && Array.isArray(itemOuNome.system?.acesso) && itemOuNome.system.acesso.length > 0) {
    rawAcessos = itemOuNome.system.acesso;
  } else if (typeof itemOuNome === "object" && Array.isArray(itemOuNome.flags?.["mighty-blade"]?.acesso) && itemOuNome.flags["mighty-blade"].acesso.length > 0) {
    rawAcessos = itemOuNome.flags["mighty-blade"].acesso;
  } else if (canon && Array.isArray(canon.system?.acesso)) {
    rawAcessos = canon.system.acesso;
  }

  if (!rawAcessos || rawAcessos.length === 0) {
    return { permitido: true };
  }

  const normAcessos = rawAcessos.map((a) => norm(a)).filter(Boolean);
  if (normAcessos.includes("geral")) {
    return { permitido: true, acessosPermitidos: rawAcessos };
  }

  const tokensAtor = obterAcessosAtor(actor);
  const temAcesso = rawAcessos.some((acessoRaw) => {
    const nAcesso = norm(acessoRaw);
    if (tokensAtor.has(nAcesso)) return true;
    if (acessoRaw.includes("♀") && tokensAtor.has("naga ♀")) return true;
    if (acessoRaw.includes("♂") && tokensAtor.has("naga ♂")) return true;
    return false;
  });

  if (!temAcesso) {
    return {
      permitido: false,
      acessosPermitidos: rawAcessos,
      motivo: `Acesso restrito: "${nomeItem}" é exclusiva de ${rawAcessos.join(", ")}.`,
    };
  }

  return { permitido: true, acessosPermitidos: rawAcessos };
}

/**
 * Validador Unificado para Aquisição de Habilidade.
 * Centraliza os Casos 15, 17, 18, 19, 20, 21 e o controle de Acesso do SSOT (habilidades.base).
 *
 * @param {object} actor
 * @param {string|object} habilidade
 * @returns {{ permitido: boolean, motivo?: string }}
 */
export function validarAquisicaoHabilidade(actor, habilidade) {
  const habNome = typeof habilidade === "string" ? habilidade : habilidade?.name;
  const nHab = norm(habNome);

  const nagaCheck = validarHabilidadeNaga(actor, habNome);
  if (!nagaCheck.permitido) return nagaCheck;

  if (nHab === "intuicao") {
    return validarIntuicao(actor);
  }

  if (nHab === "sentidos apurados") {
    return validarSentidosApurados(actor);
  }

  if (nHab === "nanismo") {
    return validarAquisicaoNanismo(actor);
  }

  if (nHab === "furia bestial") {
    return validarFuriaBestial(actor);
  }

  if (nHab === "furia de batalha" && getRacaAtor(actor).includes("aesir")) {
    return {
      permitido: false,
      motivo: "Fúria de Batalha não pode ser comprada por Aesires (Todas exceto Aesires).",
    };
  }

  // Validação da habilidade Diversidade (Humano): o atributo escolhido não pode repetir o de Adaptabilidade
  if (nHab === "diversidade" && typeof habilidade === "object" && habilidade !== null) {
    const itens = getItensAtor(actor);
    const adapt = itens.find((i) => norm(i.name) === "adaptabilidade" || i.flags?.["mighty-blade"]?.slug === "adaptabilidade");
    const attrAdapt =
      (adapt?.system?.efeitos || []).find((e) => e.tipo === "bonusAtributo")?.atributo ||
      adapt?.system?.bonusAtributo?.atributo ||
      adapt?.flags?.["mighty-blade"]?.advancementChoices?.atributo ||
      null;
    const attrDiv =
      habilidade.atributo ||
      (habilidade.system?.efeitos || []).find((e) => e.tipo === "bonusAtributo")?.atributo ||
      habilidade.system?.bonusAtributo?.atributo ||
      habilidade.flags?.["mighty-blade"]?.advancementChoices?.atributo ||
      null;

    if (attrAdapt && attrDiv && norm(attrAdapt) === norm(attrDiv)) {
      return {
        permitido: false,
        motivo: `Diversidade exige a escolha de um Atributo diferente do selecionado na habilidade Adaptabilidade (${attrAdapt}).`,
      };
    }
  }

  // Pacto em si é permitido: a aquisição revoga Dogma/Conhecimento Místico (Sub-módulo 3.2.2).
  if (nHab.includes("conhecimento mistico") || nHab.includes("dogma")) {
    const pactoCheck = validarIncompatibilidadePactoMisticismo(actor, habNome);
    if (!pactoCheck.permitido) return pactoCheck;
  }

  if (HABILIDADES_EXCLUSIVAS_CRIACAO[nHab] || habilidade?.system?.somenteCriacao === true) {
    if (!HABILIDADES_EXCLUSIVAS_CRIACAO[nHab]) {
      const nivel = Number(actor?.system?.details?.nivel) || 1;
      if (nivel > 1) {
        return { permitido: false, motivo: `A habilidade "${habNome}" é exclusiva da criação do personagem (Nível 1).` };
      }
      return { permitido: true };
    }
    const criacaoCheck = validarHabilidadeExclusivaCriacao(actor, habNome);
    if (!criacaoCheck.permitido) return criacaoCheck;
  }

  // Validação canônica de Acesso (Raça, Classe, Aprendiz, Caminho, Organização, Geral) quando o item
  // provém do Compêndio/Documento Foundry ou declara `acesso` explícito.
  if (typeof habilidade === "object" && habilidade !== null) {
    const isCompendiumOrExplicitAccess =
      (Array.isArray(habilidade.system?.acesso) && habilidade.system.acesso.length > 0) ||
      (Array.isArray(habilidade.flags?.["mighty-blade"]?.acesso) && habilidade.flags["mighty-blade"].acesso.length > 0) ||
      Boolean(habilidade._id || habilidade.uuid || habilidade.pack);

    if (isCompendiumOrExplicitAccess) {
      const acessoCheck = validarAcessoItem(actor, habilidade, { resolverCanonico: true, tipoHint: "habilidade" });
      if (!acessoCheck.permitido) return acessoCheck;
    }
  }

  return { permitido: true };
}

/**
 * Sub-módulo 3.1: Travas de habilidades para a raça Naga.
 * - Dogma é proibido para qualquer Naga (adoração exclusiva a Glycon).
 * - Naga Macho não acessa Conhecimento Místico (sem magias místicas tradicionais de Sacerdote).
 *
 * @param {object} actor
 * @param {string} habNome
 * @returns {{ permitido: boolean, motivo?: string }}
 */
export function validarHabilidadeNaga(actor, habNome) {
  const raca = getRacaAtor(actor);
  if (!raca.includes("naga")) return { permitido: true };
  const nHab = norm(habNome);

  if (nHab === "dogma" || nHab.startsWith("dogma ")) {
    return {
      permitido: false,
      motivo: "Nagas não podem possuir Dogma: adoram exclusivamente o Primordial Glycon e rejeitam os dogmas do Panteão de Cassiopéia.",
    };
  }

  if (getGeneroAtor(actor) === "macho" && nHab.includes("conhecimento mistico")) {
    return {
      permitido: false,
      motivo: "Nagas Machos são devotos combatentes de Glycon e não têm acesso a Conhecimento Místico (magias místicas tradicionais de Sacerdote).",
    };
  }

  return { permitido: true };
}

/**
 * Validação canônica de acesso a Magias:
 * 1. Verifica dimorfismo Naga (Nagas Machos não acessam magias místicas; Nagas não acessam magias exclusivas de Sacerdote/Dogma).
 * 2. Verifica se o personagem possui o Acesso exigido pela magia em `habilidades.base`
 *    (ex.: um Feiticeiro não tem acesso a magias exclusivas de Sacerdote, Druida, Necromante, Xamã, etc.,
 *    a menos que também possua a respectiva classe como Aprendiz ou Caminho).
 *
 * @param {object} actor
 * @param {object|string} magia Item de magia ou a fonte ("arcana"/"mistica") / nome da magia
 * @returns {{ permitido: boolean, motivo?: string }}
 */
export function validarAcessoMagia(actor, magia) {
  const raca = getRacaAtor(actor);
  const isString = typeof magia === "string";
  const nStr = isString ? norm(magia) : "";
  const isSourceLiteral = isString && (nStr.startsWith("mistic") || nStr.startsWith("arcan"));

  const canon = !isSourceLiteral ? resolverItemCanonico(magia, "magia") : null;
  const fonte = norm(
    isSourceLiteral
      ? magia
      : (magia?.system?.fonte || canon?.system?.fonte || "")
  );

  if (raca.includes("naga")) {
    const genero = getGeneroAtor(actor);
    if (genero === "macho" && fonte.startsWith("mistic")) {
      return { permitido: false, motivo: "Nagas Machos não têm acesso a magias místicas." };
    }
  }

  if (!isSourceLiteral) {
    const acessoCheck = validarAcessoItem(actor, magia, { resolverCanonico: true, tipoHint: "magia" });
    if (!acessoCheck.permitido) return acessoCheck;
  }

  return { permitido: true };
}

/**
 * Sub-módulo 3.5: Filtra a lista de habilidades oferecidas na evolução,
 * removendo as que o personagem não pode adquirir (exclusivas de criação, raciais proibidas, sem acesso etc.).
 *
 * @param {object} actor
 * @param {Array<object|string>} habilidades
 * @returns {Array<object|string>}
 */
export function filtrarHabilidadesElegiveis(actor, habilidades = []) {
  return habilidades.filter((h) => {
    if (typeof h === "object" && h?.flags?.["mighty-blade"]?.isSubFeature) return false;
    return validarAquisicaoHabilidade(actor, h).permitido;
  });
}

/**
 * Aquisição síncrona (atores em memória/mocks): valida, revoga misticismo ao receber Pacto e adiciona.
 * Para documentos Foundry use `adicionarPacto` (assíncrono).
 *
 * @param {object} actor Ator com `items` em array
 * @param {string|object} habilidade
 * @returns {{ actor: object, habilidadesRemovidas: string[] }}
 * @throws {Error} Quando a aquisição é proibida
 */
export function adquirirHabilidadeSync(actor, habilidade) {
  if (Array.isArray(habilidade)) {
    throw new Error(`Ganho de Habilidade por Nível: O personagem recebe exatamente 1 nova habilidade por nível alcançado (foram informadas ${habilidade.length}).`);
  }
  const item = typeof habilidade === "string" ? { name: habilidade, type: "habilidade" } : { ...habilidade };
  if (!item || !item.name) {
    throw new Error("Dados da habilidade inválidos.");
  }

  const rawItems = getItensAtor(actor);
  const nHab = norm(item.name);

  // 1. Não duplica habilidade já possuída (exceto se explicitamente permitido em item.allowDuplicate)
  const alreadyHas = rawItems.some((i) => i.type === "habilidade" && norm(i.name) === nHab);
  if (alreadyHas && !item.allowDuplicate) {
    throw new Error(`O herói já possui a habilidade "${item.name}".`);
  }

  // 2. Valida compatibilidade explícita de Raça e Classe (ou Aprendiz) se declarada no item
  const heroRace = getRacaAtor(actor);
  const heroClassDoc = rawItems.find((i) => i.type === "classe");
  const heroClass = norm(heroClassDoc?.name || actor.system?.details?.classe || "");
  const heroAprendiz = norm(actor.system?.details?.aprendiz || "");

  const habRace = norm(item.system?.raca || item.flags?.["mighty-blade"]?.raca || "");
  if (habRace && heroRace && !heroRace.includes(habRace) && !habRace.includes(heroRace)) {
    throw new Error(
      `Habilidade racial restrita à raça "${item.system?.raca || item.flags?.["mighty-blade"]?.raca}". O herói é "${actor.system?.details?.raca || heroRace}".`
    );
  }

  const habClass = norm(item.system?.classe || item.flags?.["mighty-blade"]?.classe || "");
  if (habClass && heroClass && habClass !== heroClass && habClass !== heroAprendiz) {
    throw new Error(
      `Habilidade de classe restrita à classe "${item.system?.classe || item.flags?.["mighty-blade"]?.classe}". O herói é "${actor.system?.details?.classe || heroClass}".`
    );
  }

  const res = validarAquisicaoHabilidade(actor, item);
  if (!res.permitido) throw new Error(res.motivo);

  // Resolve requisitos explícitos, do mapa canônico ou do compêndio
  let reqStr = item.system?.requisitos;
  if (reqStr === undefined || reqStr === "") {
    if (REQUISITOS_HABILIDADES_CANONICAS[nHab]) {
      reqStr = REQUISITOS_HABILIDADES_CANONICAS[nHab];
    } else {
      const canonical = CANONICAL_HABILIDADES?.find((h) => norm(h.name) === nHab);
      reqStr = canonical?.system?.requisitos || "";
      if (nHab.startsWith("pacto ") && norm(reqStr) === "pacto") {
        reqStr = "";
      }
    }
  }

  if (reqStr) {
    const evalResult = avaliarRequisitos(reqStr, actor);
    if (!evalResult.atende) {
      throw new Error(formatarErroRequisitos(item.name, evalResult));
    }
  }

  if (nHab === "diversidade" && item.atributo) {
    item.system = item.system || {};
    item.system.bonusAtributo = { atributo: item.atributo, valor: 1 };
    item.system.efeitos = [{ tipo: "bonusAtributo", atributo: item.atributo, valor: 1 }];
    item.flags = item.flags || {};
    item.flags["mighty-blade"] = item.flags["mighty-blade"] || {};
    item.flags["mighty-blade"].hasAdvancement = true;
    item.flags["mighty-blade"].advancementType = "escolhaAtributo";
    item.flags["mighty-blade"].advancementSummary = `+1 ${item.atributo}`;
    item.flags["mighty-blade"].advancementChoices = { atributo: item.atributo, valor: 1 };
  }

  let removidas = [];
  if (nHab === "pacto" || nHab.startsWith("pacto ")) {
    const itens = getItensAtor(actor);
    const conflitantes = itens.filter((i) => {
      const n = norm(i.name);
      return n.includes("conhecimento mistico") || n.includes("dogma");
    });
    removidas = conflitantes.map((i) => i.name);
    for (const c of conflitantes) {
      const idx = actor.items.indexOf(c);
      if (idx >= 0) actor.items.splice(idx, 1);
    }
  }

  if (typeof actor.addItem === "function") actor.addItem(item);
  else actor.items.push(item);
  actor.prepareDerivedData?.();

  return { actor, habilidadesRemovidas: removidas };
}

