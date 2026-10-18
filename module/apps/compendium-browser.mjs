import {
  slugify,
  RACAS_FORJA_MAP,
  CLASSES_FORJA_MAP,
  CAMINHOS_FORJA_SLUGS,
  ORGANIZACOES_FORJA_MAP,
  resolveItemImage,
} from "../helpers/forja-art.mjs";
import { avaliarRequisitos, norm } from "../helpers/requisitos.mjs";
import {
  validarClasseRaca,
  validarIncompatibilidadePactoMisticismo,
  validarAquisicaoHabilidade,
  validarAcessoMagia,
  enriquecerItemComSSOT,
} from "../helpers/restricoes.mjs";
import {
  CANONICAL_RACAS,
  CANONICAL_CLASSES,
  CANONICAL_CAMINHOS,
  CANONICAL_ORGANIZACOES,
  CANONICAL_HABILIDADES,
  CANONICAL_MAGIAS,
  CANONICAL_EQUIPAMENTOS,
  CANONICAL_HABILIDADES_GERAIS_IDS,
  CANONICAL_HABILIDADES_POR_NIVEL,
} from "../data/canonical-packs-data.mjs";

export { resolveItemImage, CANONICAL_HABILIDADES_POR_NIVEL };

/**
 * Calcula o total de habilidades e magias escolhidas e o limite canônico para o nível do ator.
 * Não contam: automáticas (de raça/classe/caminho), sub-features e itens concedidos por concessões.
 *
 * @param {object} actor
 * @returns {{ escolhidas: number, limite: number, esgotado: boolean }}
 */
export function calcularEspacosHabilidades(actor) {
  if (!actor) return { escolhidas: 0, limite: 3, esgotado: false };

  const rawItems = actor.items
    ? (Array.isArray(actor.items) ? actor.items : Array.from(actor.items.values()))
    : [];

  const autoIds = new Set();
  const getActorItem = (type) => rawItems.find((i) => i.type === type);

  // 1. Raça
  const racaDoc = getActorItem("raca");
  const racaNome = racaDoc?.name || actor.system?.details?.raca || "";
  const racaCanon = CANONICAL_RACAS.find((r) => norm(r.name) === norm(racaNome) || r.flags?.["mighty-blade"]?.slug === slugify(racaNome));
  const rConcessoes = [...(racaDoc?.system?.concessoes || []), ...(racaCanon?.system?.concessoes || [])];
  for (const c of rConcessoes) {
    if (c.tipo === "habilidade" && c.ref) autoIds.add(slugify(c.ref));
    if (c.tipo === "escolhaAtributo" && c.ref) autoIds.add(slugify(c.ref));
    if (c.tipo === "origemDraconica" && c.ref) autoIds.add(slugify(c.ref));
  }
  if (racaDoc?.system?.habilidadeAutomatica?.nome) autoIds.add(slugify(racaDoc.system.habilidadeAutomatica.nome));
  if (racaCanon?.system?.habilidadeAutomatica?.nome) autoIds.add(slugify(racaCanon.system.habilidadeAutomatica.nome));

  // 2. Classe
  const classeDoc = getActorItem("classe");
  const classeNome = classeDoc?.name || actor.system?.details?.classe || "";
  const classeCanon = CANONICAL_CLASSES.find((c) => norm(c.name) === norm(classeNome) || c.flags?.["mighty-blade"]?.slug === slugify(classeNome));
  const cConcessoes = [...(classeDoc?.system?.concessoes || []), ...(classeCanon?.system?.concessoes || [])];
  for (const c of cConcessoes) {
    if (c.tipo === "habilidade" && c.ref) autoIds.add(slugify(c.ref));
  }
  if (classeDoc?.system?.habilidadeAutomatica) autoIds.add(slugify(classeDoc.system.habilidadeAutomatica));
  if (classeCanon?.system?.habilidadeAutomatica) autoIds.add(slugify(classeCanon.system.habilidadeAutomatica));
  for (const h of (classeDoc?.system?.habilidadesAutomaticas || [])) autoIds.add(slugify(h));
  for (const h of (classeCanon?.system?.habilidadesAutomaticas || [])) autoIds.add(slugify(h));

  // 3. Caminho
  const camDoc = getActorItem("caminho");
  const camNome = camDoc?.name || actor.system?.details?.caminho || "";
  const camCanon = CANONICAL_CAMINHOS.find((c) => norm(c.name) === norm(camNome) || c.flags?.["mighty-blade"]?.slug === slugify(camNome));
  const camConcessoes = [...(camDoc?.system?.concessoes || []), ...(camCanon?.system?.concessoes || [])];
  for (const c of camConcessoes) {
    if (c.tipo === "habilidade" && c.ref) autoIds.add(slugify(c.ref));
  }
  if (camDoc?.system?.habilidadeAutomatica) autoIds.add(slugify(camDoc.system.habilidadeAutomatica));
  if (camCanon?.system?.habilidadeAutomatica) autoIds.add(slugify(camCanon.system.habilidadeAutomatica));

  // Contagem de itens escolhidos (habilidade ou magia)
  let escolhidas = 0;
  for (const item of rawItems) {
    if (item.type !== "habilidade" && item.type !== "magia" && item.type !== "feature" && item.type !== "spell") continue;
    if (item.system?.categoria === "antecedente") continue;

    const mbFlags = item.flags?.["mighty-blade"] || {};
    // Não contam: sub-features, automáticas explícitas
    if (mbFlags.isSubFeature || item.isSubFeature || mbFlags.parentAbilityId) continue;
    if (mbFlags.automatica || item.system?.nivel === "Automática" || item.system?.nivel === "automatica") continue;

    const s = mbFlags.slug || slugify(item.name || "");
    if (autoIds.has(s)) continue;

    escolhidas++;
  }

  // 4. Habilidades Virtuais (Automáticas que foram substituídas por Caminho ou Habilidades com 'sobrescreve')
  const idsSobrescritos = new Set();
  for (const item of rawItems) {
    const mbFlags = item.flags?.["mighty-blade"] || {};
    const sob = item.system?.sobrescreve || mbFlags.sobrescreve || item.system?.substitui || mbFlags.substitui;
    if (Array.isArray(sob)) {
      for (const s of sob) idsSobrescritos.add(slugify(s));
    } else if (typeof sob === "string" && sob) {
      idsSobrescritos.add(slugify(sob));
    }

    const itemSlug = mbFlags.slug || slugify(item.name || "");
    const canonHab = CANONICAL_HABILIDADES.find((h) => (h.flags?.["mighty-blade"]?.slug || slugify(h.name)) === itemSlug);
    const canonSob = canonHab?.system?.sobrescreve || canonHab?.flags?.["mighty-blade"]?.sobrescreve;
    if (Array.isArray(canonSob)) {
      for (const s of canonSob) idsSobrescritos.add(slugify(s));
    } else if (typeof canonSob === "string" && canonSob) {
      idsSobrescritos.add(slugify(canonSob));
    }
  }

  // Caminho do personagem: se substitui ou sobrescreve automáticas
  const camSob = camDoc?.system?.sobrescreve || camDoc?.flags?.["mighty-blade"]?.sobrescreve ||
                 camCanon?.system?.sobrescreve || camCanon?.flags?.["mighty-blade"]?.sobrescreve ||
                 camDoc?.system?.substitui || camCanon?.system?.substitui;
  if (Array.isArray(camSob)) {
    for (const s of camSob) idsSobrescritos.add(slugify(s));
  } else if (typeof camSob === "string" && camSob) {
    idsSobrescritos.add(slugify(camSob));
  }

  // Se o Caminho define explicitamente que substitui a habilidade automática da classe
  if (camDoc?.system?.substituiAutomaticaClasse || camCanon?.system?.substituiAutomaticaClasse ||
      camDoc?.system?.substituiAutomatica || camCanon?.system?.substituiAutomatica) {
    if (classeDoc?.system?.habilidadeAutomatica) idsSobrescritos.add(slugify(classeDoc.system.habilidadeAutomatica));
    if (classeCanon?.system?.habilidadeAutomatica) idsSobrescritos.add(slugify(classeCanon.system.habilidadeAutomatica));
    for (const h of (classeDoc?.system?.habilidadesAutomaticas || [])) idsSobrescritos.add(slugify(h));
    for (const h of (classeCanon?.system?.habilidadesAutomaticas || [])) idsSobrescritos.add(slugify(h));
  }

  // Automáticas que foram substituídas/perdidas
  let totalSubstituidas = 0;
  for (const autoId of autoIds) {
    if (idsSobrescritos.has(autoId)) {
      totalSubstituidas++;
    }
  }

  const nivelNum = Number(actor.system?.details?.nivel) || 1;
  const baseLimite = CANONICAL_HABILIDADES_POR_NIVEL?.[nivelNum] ?? CANONICAL_HABILIDADES_POR_NIVEL?.["1"] ?? 3;
  // Como no site: virtuaisGanhasAteAgora = Math.min(totalPerdido, nivel)
  const virtuais = Math.min(totalSubstituidas, nivelNum);
  const limite = baseLimite + virtuais;

  return {
    escolhidas,
    limite,
    baseLimite,
    virtuais,
    totalSubstituidas,
    esgotado: escolhidas >= limite,
  };
}

/**
 * Retorna as sub-abas disponíveis e suas respectivas listas de itens para um personagem nas abas de Habilidades e Magias.
 *
 * @param {object} actor Personagem alvo
 * @param {string} filterType 'habilidade' | 'magia'
 * @param {Array<object>} allCandidateItems Todos os itens do catálogo/compêndio
 * @returns {Array<{ id: string, label: string, ids: string[], items: Array<object> }>}
 */
export function obterSubAbasCompendio(actor, filterType = "habilidade", allCandidateItems = []) {
  if (!actor) return [];

  // Se a lista de candidatos estiver vazia, utiliza o catálogo canônico completo
  if (!allCandidateItems || allCandidateItems.length === 0) {
    allCandidateItems = [...CANONICAL_HABILIDADES, ...CANONICAL_MAGIAS];
  }

  const rawItems = actor.items
    ? (Array.isArray(actor.items) ? actor.items : Array.from(actor.items.values()))
    : [];

  const getActorItem = (type) => rawItems.find((i) => i.type === type);
  const racaDoc = getActorItem("raca");
  const racaNome = racaDoc?.name || actor.system?.details?.raca || "";

  const classeDoc = getActorItem("classe");
  const classeNome = classeDoc?.name || actor.system?.details?.classe || "";

  const caminhoDoc = getActorItem("caminho");
  const caminhoNome = caminhoDoc?.name || actor.system?.details?.caminho || "";

  const orgDoc = getActorItem("organizacao");
  const orgNome = orgDoc?.name || actor.system?.details?.organizacao || "";

  const itemMap = new Map();
  for (const item of allCandidateItems) {
    const slug = item.flags?.["mighty-blade"]?.slug || slugify(item.name || "");
    if (slug && !itemMap.has(slug)) {
      itemMap.set(slug, item);
    }
    const n = norm(item.name || "");
    if (n && !itemMap.has(n)) {
      itemMap.set(n, item);
    }
  }

  const findItem = (idOrSlug) => {
    const s = slugify(idOrSlug);
    if (itemMap.has(s)) return itemMap.get(s);
    const n = norm(idOrSlug);
    if (itemMap.has(n)) return itemMap.get(n);
    return null;
  };

  const subTabs = [];

  // 1. Gerais
  const geralIds = [...(CANONICAL_HABILIDADES_GERAIS_IDS || [])];
  const geralItems = geralIds.map(findItem).filter(Boolean);
  subTabs.push({
    id: "geral",
    label: "Gerais",
    ids: geralIds,
    items: filterType === "magia" ? geralItems.filter((i) => i.type === "magia") : geralItems,
  });

  // 2. Raça (se houver)
  if (racaNome) {
    const racaItems = allCandidateItems.filter((i) => {
      const isAuto = i.flags?.["mighty-blade"]?.automatica || i.system?.nivel === "Automática" || i.system?.nivel === "automatica";
      if (isAuto) return false;
      const req = String(i.system?.requisitos || "");
      const acesso = Array.isArray(i.system?.acesso) ? i.system.acesso : [];
      const matchesReq = norm(req).includes(norm(racaNome));
      const matchesAcesso = (i.system?.tipoAcesso === "Raça" || i.flags?.["mighty-blade"]?.tipoAcesso === "Raça") &&
        acesso.some((a) => norm(a) === norm(racaNome));
      return matchesReq || matchesAcesso;
    });

    const racaIds = racaItems.map((i) => i.flags?.["mighty-blade"]?.slug || slugify(i.name || ""));
    subTabs.push({
      id: "raca",
      label: racaNome,
      ids: racaIds,
      items: filterType === "magia" ? racaItems.filter((i) => i.type === "magia") : racaItems,
    });
  }

  // 3. Classe (se houver)
  if (classeNome) {
    const canonicalClass = CANONICAL_CLASSES.find(
      (c) => norm(c.name) === norm(classeNome) || c.flags?.["mighty-blade"]?.slug === slugify(classeNome)
    );
    const rawLista = (classeDoc?.system?.listaHabilidades && classeDoc.system.listaHabilidades.length > 0)
      ? classeDoc.system.listaHabilidades
      : (canonicalClass?.system?.listaHabilidades || []);

    const autoIds = new Set();
    if (Array.isArray(canonicalClass?.system?.concessoes)) {
      for (const c of canonicalClass.system.concessoes) {
        if (c.tipo === "habilidade" && c.ref) autoIds.add(slugify(c.ref));
      }
    }
    if (Array.isArray(canonicalClass?.system?.habilidadesAutomaticas)) {
      for (const h of canonicalClass.system.habilidadesAutomaticas) {
        autoIds.add(slugify(h));
      }
    }
    if (Array.isArray(classeDoc?.system?.concessoes)) {
      for (const c of classeDoc.system.concessoes) {
        if (c.tipo === "habilidade" && c.ref) autoIds.add(slugify(c.ref));
      }
    }

    const classeIds = [...rawLista];
    const classeItems = classeIds.map((id) => {
      const found = findItem(id);
      if (found) return found;
      return {
        name: id.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        type: "habilidade",
        flags: { "mighty-blade": { slug: id, automatica: false } },
        system: { requisitos: "", description: "" },
        meetsPrereq: true,
      };
    }).filter(Boolean);

    subTabs.push({
      id: "classe",
      label: classeNome,
      ids: classeIds,
      items: filterType === "magia" ? classeItems.filter((i) => i.type === "magia") : classeItems,
    });
  }

  // 4. Caminho (se houver)
  if (caminhoNome) {
    const canonicalCaminho = CANONICAL_CAMINHOS.find(
      (c) => norm(c.name) === norm(caminhoNome) || c.flags?.["mighty-blade"]?.slug === slugify(caminhoNome)
    );
    const rawLista = (caminhoDoc?.system?.listaHabilidades && caminhoDoc.system.listaHabilidades.length > 0)
      ? caminhoDoc.system.listaHabilidades
      : (canonicalCaminho?.system?.listaHabilidades || []);

    const autoHab = slugify(caminhoDoc?.system?.habilidadeAutomatica || canonicalCaminho?.system?.habilidadeAutomatica || "");
    const caminhoIds = rawLista.filter((id) => slugify(id) !== autoHab);
    const caminhoItems = caminhoIds.map(findItem).filter(Boolean);

    subTabs.push({
      id: "caminho",
      label: caminhoNome,
      ids: caminhoIds,
      items: filterType === "magia" ? caminhoItems.filter((i) => i.type === "magia") : caminhoItems,
    });
  }

  // 5. Organização (se houver)
  if (orgNome) {
    const canonicalOrg = CANONICAL_ORGANIZACOES.find(
      (o) => norm(o.name) === norm(orgNome) || o.flags?.["mighty-blade"]?.slug === slugify(orgNome)
    );
    const rawLista = (orgDoc?.system?.listaHabilidades && orgDoc.system.listaHabilidades.length > 0)
      ? orgDoc.system.listaHabilidades
      : (canonicalOrg?.system?.listaHabilidades || []);

    const orgIds = [...rawLista];
    const orgItems = orgIds.map(findItem).filter(Boolean);

    subTabs.push({
      id: "organizacao",
      label: orgNome,
      ids: orgIds,
      items: filterType === "magia" ? orgItems.filter((i) => i.type === "magia") : orgItems,
    });
  }

  return subTabs;
}

/**
 * Filtra dinamicamente os itens de um compêndio com base nas restrições canônicas e de acesso (habilidades.base) do personagem
 * (esconde magias e habilidades de outras classes/raças/caminhos/organizações, esconde Sacerdote para Nagas/Cultistas,
 * oculta Nanismo e habilidades exclusivas de criação nos Níveis 2+, etc.).
 *
 * @param {Array<object>} items Lista de documentos ou objetos de itens
 * @param {string} filterType Tipo ativo ('raca', 'classe', 'habilidade', 'magia', etc.)
 * @param {object} actor Personagem alvo
 * @returns {Array<object>}
 */
export function filtrarItensCompendioParaAtor(items = [], filterType, actor) {
  if (!actor) return items;

  return items.filter((item) => {
    const type = item.type || filterType;
    if (type === "classe" || filterType === "classe") {
      if (!validarClasseRaca(actor, item.name).permitido) return false;
      if (!validarIncompatibilidadePactoMisticismo(actor, item.name).permitido) return false;
      return true;
    }

    if (type === "habilidade" || filterType === "habilidade") {
      if (item.flags?.["mighty-blade"]?.isSubFeature) return false;
      enriquecerItemComSSOT(item, "habilidade");
      return validarAquisicaoHabilidade(actor, item).permitido;
    }

    if (type === "magia" || filterType === "magia") {
      enriquecerItemComSSOT(item, "magia");
      return validarAcessoMagia(actor, item).permitido;
    }

    return true;
  });
}

export class MightyBladeCompendiumBrowser extends (typeof Application !== "undefined" ? Application : class Application {}) {
  constructor(options = {}) {
    super(options);
    this.filterType = options.type || "raca"; // 'raca', 'classe', 'caminho', etc.
    this.targetActor = options.actor;
    this.selectedId = null;
    this.subTab = options.subTab || "geral";
    this.onlyEligible = options.onlyEligible ?? true;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "mighty-blade-browser",
      title: "Navegador de Compêndio",
      template: "systems/mighty-blade/templates/apps/compendium-browser.hbs",
      width: 930,
      height: 560,
      resizable: true,
      classes: ["mighty-blade", "browser"],
    });
  }

  /**
   * Avalia restrições de raça, classe/acesso, nível, pacto e pré-requisitos para um item específico.
   * @param {object} item
   * @returns {{ permitido: boolean, falhas: string[] }}
   */
  _evaluateItemForActor(item) {
    if (!item || !this.targetActor) return { permitido: true, falhas: [] };
    const falhas = [];
    const type = item.type || this.filterType;

    if (type === "habilidade" || type === "magia") {
      enriquecerItemComSSOT(item, type);
    }

    if (type === "classe") {
      const rCheck = validarClasseRaca(this.targetActor, item.name);
      if (!rCheck.permitido) falhas.push(rCheck.motivo);
      const pCheck = validarIncompatibilidadePactoMisticismo(this.targetActor, item.name);
      if (!pCheck.permitido) falhas.push(pCheck.motivo);
    } else if (type === "habilidade") {
      const hCheck = validarAquisicaoHabilidade(this.targetActor, item);
      if (!hCheck.permitido) falhas.push(hCheck.motivo);
    } else if (type === "magia") {
      const mCheck = validarAcessoMagia(this.targetActor, item);
      if (!mCheck.permitido) falhas.push(mCheck.motivo);
    }

    if (item.system?.requisitos) {
      const evalResult = avaliarRequisitos(item.system.requisitos, this.targetActor);
      if (!evalResult.atende) {
        falhas.push(...evalResult.falhas);
      }
    }

    return { permitido: falhas.length === 0, falhas };
  }

  /**
   * Retorna a lista de sub-abas disponíveis para o personagem atual nas abas de habilidades ou magias.
   * @returns {Array<object>}
   */
  getSubTabs() {
    if (!this.targetActor || (this.filterType !== "habilidade" && this.filterType !== "magia")) {
      return [];
    }
    return obterSubAbasCompendio(this.targetActor, this.filterType);
  }

  async getData() {
    // Prioriza o compêndio do sistema; cai nos itens do mundo se o pack estiver vazio.
    const packMap = {
      raca: "mighty-blade.racas",
      classe: "mighty-blade.classes",
      caminho: "mighty-blade.caminhos",
      organizacao: "mighty-blade.organizacoes",
      habilidade: "mighty-blade.habilidades",
      magia: "mighty-blade.magias",
      equipamento: "mighty-blade.equipamentos",
      arma: "mighty-blade.equipamentos",
      armadura: "mighty-blade.equipamentos",
    };

    let items = [];
    let subTabs = null;

    if (this.targetActor && (this.filterType === "habilidade" || this.filterType === "magia")) {
      const habPack = typeof game !== "undefined" && game.packs ? game.packs.get("mighty-blade.habilidades") : null;
      const magPack = typeof game !== "undefined" && game.packs ? game.packs.get("mighty-blade.magias") : null;
      const habDocs = habPack ? await habPack.getDocuments() : [];
      const magDocs = magPack ? await magPack.getDocuments() : [];
      let candidatePool = [...habDocs, ...magDocs];
      if (!candidatePool.length) {
        candidatePool = [...CANONICAL_HABILIDADES, ...CANONICAL_MAGIAS];
      }

      const calculatedSubTabs = obterSubAbasCompendio(this.targetActor, this.filterType, candidatePool);
      if (calculatedSubTabs.length > 0) {
        if (!calculatedSubTabs.some((s) => s.id === this.subTab)) {
          this.subTab = calculatedSubTabs[0].id;
        }

        subTabs = calculatedSubTabs.map((s) => ({
          ...s,
          active: s.id === this.subTab,
        }));

        const activeSub = calculatedSubTabs.find((s) => s.id === this.subTab) || calculatedSubTabs[0];
        items = activeSub.items;
      }
    } else {
      const packName = packMap[this.filterType] || "mighty-blade.racas";
      const pack = typeof game !== "undefined" && game.packs ? game.packs.get(packName) : null;
      items = pack ? await pack.getDocuments() : [];
      if (!items.length && typeof game !== "undefined" && game.items) {
        items = game.items.filter((i) => i.type === this.filterType);
      }
      if (!items.length) {
        const canonicalFallback = {
          raca: CANONICAL_RACAS,
          classe: CANONICAL_CLASSES,
          caminho: CANONICAL_CAMINHOS,
          organizacao: CANONICAL_ORGANIZACOES,
          habilidade: CANONICAL_HABILIDADES,
          magia: CANONICAL_MAGIAS,
          equipamento: CANONICAL_EQUIPAMENTOS,
          arma: CANONICAL_EQUIPAMENTOS.filter((e) => e.type === "arma"),
          armadura: CANONICAL_EQUIPAMENTOS.filter((e) => e.type === "armadura"),
        };
        items = canonicalFallback[this.filterType] || [];
      }

      if (this.filterType === "arma" || this.filterType === "armadura") {
        items = items.filter((i) => i.type === this.filterType);
      } else if (this.filterType === "equipamento") {
        items = items.filter((i) => i.type === "equipamento" || i.type === "arma" || i.type === "armadura");
      }

      if (this.targetActor) {
        items = filtrarItensCompendioParaAtor(items, this.filterType, this.targetActor);
      }
    }

    let espacosInfo = null;
    if (this.targetActor) {
      espacosInfo = calcularEspacosHabilidades(this.targetActor);
    }

    const rawActorItems = this.targetActor?.items
      ? (Array.isArray(this.targetActor.items) ? this.targetActor.items : Array.from(this.targetActor.items.values()))
      : [];
    const ownedSlugs = new Set(
      rawActorItems
        .filter((i) => i.type === "habilidade" || i.type === "magia" || i.type === "feature" || i.type === "spell")
        .map((i) => i.flags?.["mighty-blade"]?.slug || slugify(i.name || ""))
        .filter(Boolean)
    );

    items = items.map((i) => {
      const obj = (typeof i.toObject === "function") ? i.toObject() : { ...i };
      if (obj.type === "habilidade" || obj.type === "magia") {
        enriquecerItemComSSOT(obj, obj.type);
      }
      obj.img = resolveItemImage(i);
      obj.uuid = i.uuid || `Compendium.mighty-blade.${obj.type === "magia" ? "magias" : "habilidades"}.${obj._id || slugify(obj.name)}`;

      const itemSlug = obj.flags?.["mighty-blade"]?.slug || slugify(obj.name || "");
      obj.alreadyOwned = ownedSlugs.has(itemSlug);

      if (this.targetActor) {
        const reqStr = obj.system?.requisitos || "";
        const evalResult = avaliarRequisitos(reqStr, this.targetActor);
        const restEval = this._evaluateItemForActor(obj);
        obj.meetsPrereq = evalResult.atende && restEval.permitido && !obj.alreadyOwned;
        obj.prereqEval = evalResult;
        if (!restEval.permitido && restEval.falhas?.length > 0) {
          obj.ineligivelMotivo = restEval.falhas.join(" | ");
        } else if (!evalResult.atende && evalResult.falhas?.length > 0) {
          obj.ineligivelMotivo = evalResult.falhas.join(" | ");
        }
      } else {
        obj.meetsPrereq = true;
        obj.prereqEval = { atende: true, itens: [], falhas: [] };
      }

      return obj;
    });

    // Checkbox "Apenas elegíveis" (ligado por padrão): esconde os itens com "Requisitos pendentes" ou já possuídos
    if (this.targetActor && (this.filterType === "habilidade" || this.filterType === "magia") && this.onlyEligible) {
      items = items.filter((i) => i.meetsPrereq);
    }

    items = items.sort((a, b) => a.name.localeCompare(b.name));

    const categories = [
      { id: "raca", label: "Raças", icon: "fas fa-users", active: this.filterType === "raca" },
      { id: "classe", label: "Classes", icon: "fas fa-shield-halved", active: this.filterType === "classe" },
      { id: "caminho", label: "Caminhos", icon: "fas fa-signs-post", active: this.filterType === "caminho" },
      { id: "organizacao", label: "Organizações", icon: "fas fa-landmark", active: this.filterType === "organizacao" },
      { id: "habilidade", label: "Habilidades", icon: "fas fa-bolt", active: this.filterType === "habilidade" },
      { id: "magia", label: "Magias", icon: "fas fa-wand-sparkles", active: this.filterType === "magia" },
      { id: "equipamento", label: "Equipamentos", icon: "fas fa-sack-dollar", active: this.filterType === "equipamento" },
    ];

    const isHabOrMagia = this.filterType === "habilidade" || this.filterType === "magia";

    return {
      items,
      categories,
      activeType: this.filterType,
      subTabs,
      activeSubTab: this.subTab,
      onlyEligible: this.onlyEligible,
      hasSubTabs: !!subTabs,
      espacosInfo,
      showEspacos: isHabOrMagia && !!espacosInfo,
      espacosTexto: espacosInfo ? `${espacosInfo.escolhidas} / ${espacosInfo.limite}` : "",
      limiteEsgotado: isHabOrMagia && !!espacosInfo?.esgotado,
    };
  }

  activateListeners(html) {
    super.activateListeners(html);

    const listItems = html.find(".item-list .item");
    const detailsContent = html.find(".details-content");
    const selectButton = html.find(".select-button");
    const searchInput = html.find("input[name='search']");
    const syncButton = html.find(".sync-packs-button");

    // Alternar abas de categorias
    html.find(".browser-tab-btn").on("click", (ev) => {
      ev.preventDefault();
      const tab = ev.currentTarget.dataset.tab;
      if (tab && tab !== this.filterType) {
        this.filterType = tab;
        this.subTab = "geral";
        this.selectedId = null;
        this.render(false);
      }
    });

    // Alternar sub-abas
    html.find(".browser-subtab-btn").on("click", (ev) => {
      ev.preventDefault();
      const subtab = ev.currentTarget.dataset.subtab;
      if (subtab && subtab !== this.subTab) {
        this.subTab = subtab;
        this.selectedId = null;
        this.render(false);
      }
    });

    // Alternar filtro "Apenas elegíveis"
    html.find("input[name='only-eligible']").on("change", (ev) => {
      this.onlyEligible = ev.currentTarget.checked;
      this.selectedId = null;
      this.render(false);
    });

    // Botão de Sincronização direta
    syncButton.on("click", async (ev) => {
      ev.preventDefault();
      if (game.mightyBlade?.buildCompendios) {
        await game.mightyBlade.buildCompendios();
        this.render(true);
      }
    });

    // Search Filter
    searchInput.on("keyup", (ev) => {
      const query = ev.target.value.toLowerCase();
      listItems.each((i, el) => {
        const li = $(el);
        const name = li.find(".item-name").text().toLowerCase();
        if (name.includes(query)) {
          li.show();
        } else {
          li.hide();
        }
      });
    });

    // Exibe detalhes tanto ao passar o mouse quanto ao focar/clicar
    listItems.hover(async (ev) => {
      const li = $(ev.currentTarget);
      const item = await fromUuid(li.data("item-id"));
      if (item) await this._renderDetails(item, detailsContent);
    });

    // Clique para selecionar (ou inspecionar)
    listItems.click(async (ev) => {
      const li = $(ev.currentTarget);
      const radio = li.find("input[type='radio']");
      const itemId = li.data("item-id");
      const item = await fromUuid(itemId);

      if (item) {
        await this._renderDetails(item, detailsContent);
      }

      const itemType = item?.type || this.filterType;
      const isHabOrMagia = itemType === "habilidade" || itemType === "magia";

      // 1. Checagem de item já possuído no ator
      if (item && this.targetActor && isHabOrMagia) {
        const itemSlug = item.flags?.["mighty-blade"]?.slug || slugify(item.name || "");
        const rawItems = this.targetActor.items
          ? (Array.isArray(this.targetActor.items) ? this.targetActor.items : Array.from(this.targetActor.items.values()))
          : [];
        const alreadyHas = rawItems.some((i) => {
          if (i.type !== "habilidade" && i.type !== "magia" && i.type !== "feature" && i.type !== "spell") return false;
          const s = i.flags?.["mighty-blade"]?.slug || slugify(i.name || "");
          return s === itemSlug;
        });

        if (alreadyHas) {
          radio.prop("checked", false);
          this.selectedId = null;
          selectButton.prop("disabled", true);
          listItems.removeClass("selected");
          li.addClass("prereq-blocked");

          html.find(".selection-status").html(
            `<span style="color:#ef4444;"><i class="fas fa-ban"></i> <strong>${item.name}</strong> já está na ficha.</span>`
          );
          ui.notifications.warn(`${item.name} já está na ficha.`);
          return;
        }

        // 2. Checagem de limite de espaços por nível
        const espacos = calcularEspacosHabilidades(this.targetActor);
        if (espacos.esgotado) {
          radio.prop("checked", false);
          this.selectedId = null;
          selectButton.prop("disabled", true);
          listItems.removeClass("selected");

          html.find(".selection-status").html(
            `<span style="color:#ef4444;"><i class="fas fa-lock"></i> Sem espaços de habilidade neste nível (${espacos.escolhidas}/${espacos.limite})</span>`
          );
          ui.notifications.warn("Sem espaços de habilidade neste nível.");
          return;
        }
      }

      // Validação estrita de restrições e pré-requisitos para este herói
      if (item && this.targetActor) {
        const check = this._evaluateItemForActor(item);
        if (!check.permitido) {
          // Bloqueia a seleção imediata
          radio.prop("checked", false);
          this.selectedId = null;
          selectButton.prop("disabled", true);
          listItems.removeClass("selected");
          li.addClass("prereq-blocked");

          html.find(".selection-status").html(
            `<span style="color:#ef4444;"><i class="fas fa-lock"></i> <strong>${item.name}:</strong> Bloqueado (${check.falhas.length} pendência${check.falhas.length > 1 ? "s" : ""})</span>`
          );

          ui.notifications.warn(
            `O personagem ${this.targetActor.name} não pode selecionar "${item.name}": ${check.falhas.join(", ")}`
          );
          return;
        }
      }

      // Atende aos requisitos ou é item sem restrições
      listItems.removeClass("prereq-blocked");
      radio.prop("checked", true);

      listItems.removeClass("selected");
      li.addClass("selected");

      this.selectedId = itemId;
      selectButton.prop("disabled", false);

      html.find(".selection-status").html(
        `<span style="color:#22c55e;"><i class="fas fa-check-circle"></i> Selecionado: <strong>${item ? item.name : ""}</strong></span>`
      );
    });

    // Confirm selection com salvaguarda estrita
    selectButton.click(async (ev) => {
      if (!this.selectedId) return;
      const item = await fromUuid(this.selectedId);
      if (!item || !this.targetActor) return;

      const itemType = item.type || this.filterType;
      const isHabOrMagia = itemType === "habilidade" || itemType === "magia";

      // Verificação de duplicata
      if (isHabOrMagia) {
        const itemSlug = item.flags?.["mighty-blade"]?.slug || slugify(item.name || "");
        const rawItems = this.targetActor.items
          ? (Array.isArray(this.targetActor.items) ? this.targetActor.items : Array.from(this.targetActor.items.values()))
          : [];
        const alreadyHas = rawItems.some((i) => {
          if (i.type !== "habilidade" && i.type !== "magia" && i.type !== "feature" && i.type !== "spell") return false;
          const s = i.flags?.["mighty-blade"]?.slug || slugify(i.name || "");
          return s === itemSlug;
        });

        if (alreadyHas) {
          ui.notifications.warn(`${item.name} já está na ficha.`);
          return;
        }

        // Verificação de limite de espaços
        const espacos = calcularEspacosHabilidades(this.targetActor);
        if (espacos.esgotado) {
          ui.notifications.warn("Sem espaços de habilidade neste nível.");
          return;
        }
      }

      // Salvaguarda final contra bypass
      const check = this._evaluateItemForActor(item);
      if (!check.permitido) {
        ui.notifications.error(
          `Não é possível adotar "${item.name}". Restrições/Pré-requisitos não atendidos:\n${check.falhas.join("\n")}`
        );
        return;
      }

      // Fecha o navegador imediatamente para que modais de Avanço (Humano/Dragano/etc.) abram em destaque no centro da tela
      this.close();

      if (["raca", "classe", "caminho", "organizacao"].includes(this.filterType)) {
        const existing = this.targetActor.items.find(
          (i) => i.type === this.filterType
        );
        if (existing) {
          await existing.delete();
        }
      }

      // Cria uma cópia do item no ator
      const itemData = typeof item.toObject === "function" ? item.toObject() : foundry.utils.deepClone(item);
      if (!itemData.flags) itemData.flags = {};
      if (!itemData.flags["mighty-blade"]) itemData.flags["mighty-blade"] = {};

      if (itemType === "habilidade" || itemType === "magia") {
        const mb = itemData.flags["mighty-blade"];
        const rawItems = this.targetActor.items
          ? (Array.isArray(this.targetActor.items) ? this.targetActor.items : Array.from(this.targetActor.items.values()))
          : [];
        const getActorItem = (t) => rawItems.find((i) => i.type === t);

        if (this.subTab === "raca") {
          const rDoc = getActorItem("raca");
          mb.sourceRaceId = rDoc?.flags?.["mighty-blade"]?.slug || rDoc?.id || slugify(rDoc?.name || this.targetActor.system?.details?.raca || "");
        } else if (this.subTab === "classe") {
          const cDoc = getActorItem("classe");
          mb.sourceClasseId = cDoc?.flags?.["mighty-blade"]?.slug || cDoc?.id || slugify(cDoc?.name || this.targetActor.system?.details?.classe || "");
        } else if (this.subTab === "caminho") {
          const camDoc = getActorItem("caminho");
          mb.sourceCaminhoId = camDoc?.flags?.["mighty-blade"]?.slug || camDoc?.id || slugify(camDoc?.name || this.targetActor.system?.details?.caminho || "");
        } else if (this.subTab === "organizacao") {
          const orgDoc = getActorItem("organizacao");
          mb.sourceOrganizacaoId = orgDoc?.flags?.["mighty-blade"]?.slug || orgDoc?.id || slugify(orgDoc?.name || this.targetActor.system?.details?.organizacao || "");
        } else if (this.subTab === "geral") {
          mb.origem = "geral";
        }
      }

      await this.targetActor.createEmbeddedDocuments("Item", [
        itemData,
      ]);

      // Sincroniza metadados no ator para caminhos e organizações
      if (this.filterType === "caminho") {
        await this.targetActor.update({ "system.details.caminho": item.name });
      } else if (this.filterType === "organizacao") {
        await this.targetActor.update({ "system.details.organizacao": item.name });
      }
    });
  }

  /**
   * Renderiza os detalhes do item selecionado ou sob foco, incluindo arte oficial
   * e o painel de verificação tátil de pré-requisitos do Mighty Blade 3e.
   * @param {Item} item
   * @param {JQuery} detailsContent
   */
  async _renderDetails(item, detailsContent) {
    if (!item) return;
    if (item.type === "habilidade" || item.type === "magia") {
      enriquecerItemComSSOT(item, item.type);
    }

    // Render description com sanitização de lore crua legada
    const TextEditor = foundry.applications.ux.TextEditor.implementation;
    let rawDesc = item.system?.description ?? "";

    // Se a descrição contém faixas etárias até nomes (lore crua que deve ficar no diário)
    if (item.type === "raca" && (rawDesc.includes("Faixas Etárias") || rawDesc.includes("Biologia:") || rawDesc.includes("Dimorfismo Sexual") || rawDesc.includes("Nomes e Tradições"))) {
      const slug = item.flags?.["mighty-blade"]?.slug || slugify(item.name);
      rawDesc = `
        <div class="mb-item-summary">
          <p class="mb-lead-lore" style="font-size:0.95rem;color:#cbd5e1;margin-bottom:8px;">
            Raça canônica <strong>${item.name}</strong> de Mighty Blade 3e.
          </p>
          <div class="mb-journal-link-card" style="margin: 12px 0; padding: 12px 14px; background: rgba(217, 119, 6, 0.14); border: 1px solid rgba(217, 119, 6, 0.45); border-radius: 8px; display: flex; align-items: center; justify-content: space-between; gap: 12px;">
            <div>
              <div style="font-weight: 700; color: #f59e0b; font-size: 0.95rem;">
                <i class="fas fa-book-open"></i> Biologia, Cultura e Nomes
              </div>
              <div style="font-size: 0.78rem; color: #94a3b8; margin-top: 2px;">
                Faixas etárias, anatomia, sociedade e regras de patronímicos.
              </div>
            </div>
            <a class="content-link open-lore-journal-btn" data-slug="${slug}" data-type="JournalEntry" style="background:#d97706;color:#0f172a;padding:6px 14px;border-radius:6px;font-weight:700;text-decoration:none;cursor:pointer;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
              <i class="fas fa-book"></i> Abrir Diário
            </a>
          </div>
        </div>
      `;
    }

    const description = await TextEditor.enrichHTML(rawDesc);

    // Arte oficial com destaque Dark Obsidian (ilustrações grandes da Forja vs ícones compactos)
    const itemImg = resolveItemImage(item);
    const isForjaIllustration = Boolean(itemImg && itemImg.includes("assets/forja/"));
    let imgBanner = "";
    if (isForjaIllustration) {
      imgBanner = `
        <div class="browser-hero-art" style="text-align:center;margin-bottom:12px;padding:8px;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.1);border-radius:8px;">
          <img src="${itemImg}" alt="${item.name}" onerror="this.onerror=null;this.src='systems/mighty-blade/assets/icons/gear.svg';" style="max-height:170px;max-width:100%;object-fit:contain;background:#ffffff;border-radius:6px;padding:6px;box-shadow:0 4px 12px rgba(0,0,0,0.5);display:inline-block;" />
        </div>
      `;
    }

    // Painel de Pré-Requisitos interativo com status claro
    let prereqHtml = "";
    if (item.system?.requisitos) {
      if (this.targetActor) {
        const evalResult = avaliarRequisitos(item.system.requisitos, this.targetActor);
        const statusHeader = evalResult.atende
          ? `<div style="color:#22c55e;font-weight:700;display:flex;align-items:center;gap:6px;margin-bottom:6px;"><i class="fas fa-check-circle"></i> Todos os pré-requisitos atendidos</div>`
          : `<div style="color:#ef4444;font-weight:700;display:flex;align-items:center;gap:6px;margin-bottom:6px;"><i class="fas fa-times-circle"></i> Pré-requisitos não atendidos (${evalResult.falhas.length} pendência${evalResult.falhas.length > 1 ? "s" : ""})</div>`;

        const itemsList = evalResult.itens
          .map((it) => {
            const icon = it.atende
              ? `<i class="fas fa-check" style="color:#22c55e;margin-top:2px;"></i>`
              : `<i class="fas fa-xmark" style="color:#ef4444;margin-top:2px;"></i>`;
            const color = it.atende ? "#86efac" : "#fca5a5";
            return `<li style="display:flex;align-items:flex-start;gap:6px;margin-bottom:4px;font-size:0.83rem;color:${color};">${icon} <div><strong>${it.texto}:</strong> ${it.detalhe}</div></li>`;
          })
          .join("");

        prereqHtml = `
          <div class="prereq-card" style="margin-top:10px;padding:10px 12px;background:rgba(0,0,0,0.4);border:1px solid ${evalResult.atende ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.4)"};border-radius:6px;">
            <div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;margin-bottom:6px;font-weight:700;">Pré-Requisitos — ${this.targetActor.name}</div>
            ${statusHeader}
            <ul style="list-style:none;margin:0;padding:0;">${itemsList}</ul>
          </div>
        `;
      } else {
        prereqHtml = `
          <div class="item-meta" style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);">
            <b>Pré-Requisitos:</b> ${item.system.requisitos}
          </div>`;
      }
    }

    const titleHeaderHtml = isForjaIllustration
      ? `<h2>${item.name}</h2>`
      : `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid rgba(245,158,11,0.25);">
          <img src="${itemImg}" alt="${item.name}" width="38" height="38" onerror="this.onerror=null;this.src='systems/mighty-blade/assets/icons/gear.svg';" style="width:38px !important;height:38px !important;object-fit:contain;border-radius:6px;border:1px solid rgba(255,255,255,0.12);background:rgba(15,23,42,0.7);" />
          <h2 style="margin:0;border:none;padding:0;">${item.name}</h2>
        </div>`;

    // Build details HTML
    let detailsHtml = `
      ${imgBanner}
      ${titleHeaderHtml}
      <div class="item-description">${description}</div>
    `;

    // Metadados específicos por tipo de item
    if (item.type === "raca") {
      const at = item.system.atributos || {};
      detailsHtml += `
        <div class="item-meta" style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);">
          <b>Atributos Iniciais:</b> FOR ${at.forca || 0} | AGI ${at.agilidade || 0} | INT ${at.inteligencia || 0} | VON ${at.vontade || 0}
        </div>`;
      if (item.system.habilidadeAutomatica?.nome) {
        detailsHtml += `
          <div class="item-meta" style="margin-top:4px;">
            <b>Habilidade Automática:</b> ${item.system.habilidadeAutomatica.nome}
          </div>`;
      }
      if (item.system.classesComuns) {
        detailsHtml += `<div class="item-meta" style="margin-top:4px;"><strong>Classes Comuns:</strong> ${item.system.classesComuns}</div>`;
      }
    } else if (item.type === "classe") {
      const at = item.system.atributos || {};
      detailsHtml += `
        <div class="item-meta" style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);">
          <b>Bônus de Atributos:</b> FOR +${at.forca || 0} | AGI +${at.agilidade || 0} | INT +${at.inteligencia || 0} | VON +${at.vontade || 0}
        </div>`;
    } else if (item.type === "caminho") {
      if (prereqHtml) detailsHtml += prereqHtml;
      if (item.system.racasComuns) {
        detailsHtml += `<div class="item-meta" style="margin-top:6px;"><strong>Raças Comuns:</strong> ${item.system.racasComuns}</div>`;
      }
    } else if (item.type === "organizacao") {
      detailsHtml += `
        <div class="item-meta" style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);">
          <b>Tipo:</b> ${item.system.tipo || "Ordem"} · <b>Sede:</b> ${item.system.sede || "Não especificada"}
        </div>`;
      if (item.system.lideranca) {
        detailsHtml += `<div class="item-meta" style="margin-top:4px;"><b>Liderança:</b> ${item.system.lideranca}</div>`;
      }
    } else if (item.type === "magia") {
      const acessosStr = Array.isArray(item.system?.acesso) && item.system.acesso.length ? item.system.acesso.join(", ") : "Geral";
      const difLabel = item.system?.dificuldadeTexto || item.system?.dificuldade || "N/A";
      detailsHtml += `
        <div class="item-meta" style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);">
          <b>Círculo:</b> ${item.system.circulo || 1} (${item.system.nivel || "Nv1"}) · <b>Fonte:</b> ${item.system.fonte === "mistica" ? "Mística" : "Arcana"} · <b>Custo:</b> ${item.system.custo || 0} PM · <b>DV:</b> ${difLabel}
        </div>
        <div class="item-meta" style="margin-top:4px;">
          <b>Acesso Canônico:</b> ${acessosStr}${item.system?.fonteLivro ? ` · <b>Livro:</b> ${item.system.fonteLivro}` : ""}
        </div>`;
      if (prereqHtml) detailsHtml += prereqHtml;
    } else if (item.type === "arma") {
      detailsHtml += `
        <div class="item-meta" style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);">
          <b>Dano:</b> ${item.system.dano || "0"} · <b>FN:</b> ${item.system.fn || 0} · <b>Alcance:</b> ${item.system.alcance || "Adjacente (1m)"}
        </div>`;
    } else if (item.type === "armadura") {
      detailsHtml += `
        <div class="item-meta" style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);">
          <b>Defesa:</b> +${item.system.defesa || 0} · <b>FN:</b> ${item.system.fn || 0} · <b>Tipo:</b> ${item.system.subtipo || "armadura"}
        </div>`;
    } else if (item.type === "habilidade") {
      const acessosStr = Array.isArray(item.system?.acesso) && item.system.acesso.length ? item.system.acesso.join(", ") : "Geral";
      detailsHtml += `
        <div class="item-meta" style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.1);">
          <b>Tipo:</b> ${item.system.tipo || "suporte"} · <b>Categoria:</b> ${item.system.categoria || "tecnica"} · <b>Custo:</b> ${item.system.custo || 0} PM
        </div>
        <div class="item-meta" style="margin-top:4px;">
          <b>Acesso Canônico:</b> ${acessosStr}${item.system?.fonteLivro ? ` · <b>Livro:</b> ${item.system.fonteLivro}` : ""}
        </div>`;
      if (prereqHtml) detailsHtml += prereqHtml;
    }

    detailsContent.html(detailsHtml);
    this._activateJournalLinks(item, detailsContent);
  }

  /**
   * Conecta os botões e links de abertura de diários da Lore oficial.
   * @param {Item} item
   * @param {JQuery} detailsContent
   */
  _activateJournalLinks(item, detailsContent) {
    detailsContent.find(".open-lore-journal-btn, a[data-uuid]").on("click", async (evClick) => {
      evClick.preventDefault();
      evClick.stopPropagation();
      const target = $(evClick.currentTarget);
      const slug = target.data("slug") || item.flags?.["mighty-blade"]?.slug || slugify(item.name);
      const nameLower = item.name.toLowerCase();

      // 1. Prioridade: Buscar no Diário do mundo
      const worldJournal =
        game.journal.getName("bio e cultura") ||
        game.journal.getName("Biologia e Cultura das Raças") ||
        game.journal.find((j) => {
          const jName = j.name.toLowerCase();
          return jName.includes("bio") || jName.includes("cultura");
        });

      if (worldJournal) {
        const page = worldJournal.pages.find((p) => {
          const pName = p.name.toLowerCase();
          return pName === nameLower || pName === slug || p.flags?.["mighty-blade"]?.slug === slug;
        });
        if (page) {
          worldJournal.sheet.render(true, { pageId: page.id });
          return;
        }
      }

      // 2. Tentar UUID direto fornecido
      const uuid = target.data("uuid") || target.attr("data-uuid");
      if (uuid) {
        const doc = await fromUuid(uuid);
        if (doc) {
          doc.sheet.render(true);
          return;
        }
      }

      // 3. Fallback: compêndio de diários (mighty-blade.diarios)
      const diariosPack = game.packs.get("mighty-blade.diarios");
      if (diariosPack) {
        const docs = await diariosPack.getDocuments();
        const match = docs.find((d) => d.flags?.["mighty-blade"]?.slug === slug || d.name.toLowerCase().includes(nameLower));
        if (match) {
          match.sheet.render(true);
          return;
        }
        const masterDoc = docs.find((d) => d.flags?.["mighty-blade"]?.master || d.name.toLowerCase().includes("bio"));
        if (masterDoc) {
          const page = masterDoc.pages.find((p) => {
            const pName = p.name.toLowerCase();
            return pName === nameLower || pName === slug;
          });
          if (page) {
            masterDoc.sheet.render(true, { pageId: page.id });
            return;
          }
          masterDoc.sheet.render(true);
          return;
        }
      }

      // 4. Fallback absoluto: Criar diário no mundo sob demanda
      if (item.type === "raca") {
        const lore = item.flags?.["mighty-blade"]?.lore;
        let content = `<div style="text-align:center;margin-bottom:16px;"><img src="${resolveItemImage(item)}" alt="${item.name}" style="max-height:260px;border-radius:8px;background:#ffffff;padding:8px;box-shadow:0 4px 12px rgba(0,0,0,0.5);" /></div>`;
        if (lore?.faixasEtarias) {
          const f = lore.faixasEtarias;
          content += `<h2>Faixas Etárias & Ciclo de Vida</h2><ul><li><strong>Filhote:</strong> ${f.filhote} anos</li><li><strong>Adulto:</strong> ${f.adulto} anos</li><li><strong>Idoso:</strong> ${f.idoso} anos</li><li><strong>Ancião:</strong> ${f.anciao} anos</li></ul><hr>`;
        }
        if (lore?.biologia) {
          content += `<h2>Biologia & Fisiologia</h2><p>${lore.biologia.replace(/\n/g, "<br>")}</p><hr>`;
        }
        if (lore?.cultura) {
          content += `<h2>Cultura & Sociedade</h2><p>${lore.cultura.replace(/\n/g, "<br>")}</p><hr>`;
        }
        if (lore?.nomes) {
          content += `<h2>Nomes & Tradições</h2>`;
          if (lore.nomes.lore) content += `<p>${lore.nomes.lore}</p>`;
          if (lore.nomes.masculinos?.length) content += `<h4>Masculinos:</h4><p>${lore.nomes.masculinos.join(", ")}</p>`;
          if (lore.nomes.femininos?.length) content += `<h4>Femininos:</h4><p>${lore.nomes.femininos.join(", ")}</p>`;
        }

        try {
          const newDoc = await JournalEntry.create({
            name: `Diário: ${item.name}`,
            pages: [{
              name: `${item.name} — Biologia, Cultura e Nomes`,
              type: "text",
              text: { content, format: 1 },
            }],
          });
          if (newDoc) {
            newDoc.sheet.render(true);
          }
        } catch (e) {
          console.error("MIGHTY BLADE: Erro ao criar diário sob demanda:", e);
        }
      }
    });
  }
}
