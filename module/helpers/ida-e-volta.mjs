/**
 * Ida e volta da ficha entre o site (Mesas do Breder) e o Foundry — contrato v1.2 (Fase 4, 18/11/2026).
 *
 * Funções PURAS (sem Actor, sem game, sem ui): dá para testar no Node.
 *   - montarDadosDoActor(ficha)     ficha canônica do site  → dados para Actor.create (+ avisos)
 *   - exportarParaCanonico(actor)   Actor (ou actor.toObject()) → ficha canônica do site
 *
 * Para onde vai cada campo: CANONICAL_CONTRATO_SITE (cópia de rules-core/src/schema/contrato-foundry.ts).
 *   - "foundry":       fica no system do Actor (o TypeDataModel declara o campo);
 *   - "foundry-items": a mochila do site (details.inventario) vira Items embutidos (arma, armadura, equipamento);
 *   - "flag-site":     guardado como veio em flags["mighty-blade"].site e devolvido sem mudança;
 *   - "envelope":      nome, imagem, versão, id do site e itens.
 *
 * Decisões do Bredo (docs/fase4-plano.md): D1 mochila ↔ Items; D2 campos só do site na flag; D3 condições,
 * afinidades temporárias e progressão no TypeDataModel, Companheiro na flag; D4 nível 0; D6 sem sincronização
 * automática (vale o último import).
 */
import {
  CANONICAL_ALIASES_HABILIDADES,
  CANONICAL_HABILIDADES_RETIRADAS,
  CANONICAL_HABILIDADES,
  CANONICAL_ALIASES_EQUIPAMENTOS,
  CANONICAL_EQUIPAMENTOS,
  CANONICAL_CONTRATO_SITE,
} from "../data/canonical-packs-data.mjs";

export const VERSAO_CONTRATO = "1.2";
const NS = "mighty-blade";
/** Tipos de Item que podem sair da mochila do site. */
export const TIPOS_DE_MOCHILA = new Set(["arma", "armadura", "equipamento"]);
/** Tipos de Item que a ficha do site aceita em items[] (rules-core, itemTypeEnum). */
const TIPOS_ITEM_SITE = new Set(["item", "habilidade", "magia", "equipamento", "arma", "armadura", "raca", "classe", "idioma"]);
/** Campos de um item da mochila do site que o Foundry não usa: viajam na flag do Item. */
const CAMPOS_INVENTARIO_SITE = ["uid", "refId", "qualidade", "material", "maoEMeiaAtivo", "sintonizado", "nomeCustomizado", "anotacoes", "isEspolio", "slot"];

const clonar = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));

function slugify(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ler(obj, caminho) {
  return caminho.split(".").reduce((acc, k) => (acc == null ? undefined : acc[k]), obj);
}

function escrever(obj, caminho, valor) {
  const partes = caminho.split(".");
  const ultimo = partes.pop();
  let alvo = obj;
  for (const p of partes) {
    if (alvo[p] == null || typeof alvo[p] !== "object") alvo[p] = {};
    alvo = alvo[p];
  }
  alvo[ultimo] = valor;
}

function apagar(obj, caminho) {
  const partes = caminho.split(".");
  const ultimo = partes.pop();
  const pai = partes.reduce((acc, k) => (acc == null ? undefined : acc[k]), obj);
  if (pai && typeof pai === "object") delete pai[ultimo];
}

/** uuid v4 (o site exige uuid no uid da mochila). */
function novoUuid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ─── Habilidades retiradas e aliases (Fase C5) ─────────────────────────────────

/**
 * Normaliza e resolve um ID antigo de habilidade no Foundry.
 */
export function resolverIdHabilidadeAntigaFoundry(id) {
  const retirada = (CANONICAL_HABILIDADES_RETIRADAS || []).find((r) => r.id === id);
  if (retirada) {
    if (retirada.substitutaId) {
      const canonSub = (CANONICAL_HABILIDADES || []).find(
        (h) => (h.flags?.[NS]?.slug || h.name) === retirada.substitutaId
      );
      return {
        idFinal: retirada.substitutaId,
        motivo: `${retirada.nome} → ${canonSub?.name ?? retirada.substitutaId}`,
        acao: "substituido",
      };
    }
    const detalhe = retirada.status === "inventada" ? "não existe nos livros" : "retirada das regras oficiais";
    return {
      idFinal: null,
      motivo: `${retirada.nome} removida (${detalhe})`,
      acao: "removido",
    };
  }

  const alias = CANONICAL_ALIASES_HABILIDADES?.[id];
  if (alias) {
    const canonOrig = (CANONICAL_HABILIDADES || []).find((h) => (h.flags?.[NS]?.slug || h.name) === id);
    const canonDest = (CANONICAL_HABILIDADES || []).find((h) => (h.flags?.[NS]?.slug || h.name) === alias);
    return {
      idFinal: alias,
      motivo: `${canonOrig?.name ?? id} → ${canonDest?.name ?? alias}`,
      acao: "alias",
    };
  }

  return { idFinal: id, acao: "inalterado" };
}

// ─── Mochila do site ↔ Items do Foundry (D1) ────────────────────────────────────

/** Acha o item do compêndio pelo id do site (flags.siteId), com o alias de id antigo resolvido. */
export function acharEquipamentoDoSite(refId, catalogo = CANONICAL_EQUIPAMENTOS, aliases = CANONICAL_ALIASES_EQUIPAMENTOS) {
  const id = aliases?.[refId] ?? refId;
  return (
    catalogo.find((e) => e.flags?.[NS]?.siteId === id) ??
    catalogo.find((e) => e.flags?.[NS]?.slug === id) ??
    null
  );
}

/** Um item da mochila do site → Item embutido do Foundry. */
export function itemDaMochila(inv, { catalogo = CANONICAL_EQUIPAMENTOS, aliases = CANONICAL_ALIASES_EQUIPAMENTOS, avisos = [] } = {}) {
  const canon = acharEquipamentoDoSite(inv.refId, catalogo, aliases);
  const refId = canon?.flags?.[NS]?.siteId ?? aliases?.[inv.refId] ?? inv.refId;
  const doSite = {};
  for (const k of CAMPOS_INVENTARIO_SITE) if (inv[k] !== undefined) doSite[k] = clonar(inv[k]);
  doSite.refId = refId;

  if (!canon) {
    avisos.push(`item "${inv.nomeCustomizado || inv.refId}" não existe no compêndio do Foundry: entrou como equipamento genérico`);
    return {
      name: inv.nomeCustomizado || inv.refId || "Item",
      type: "equipamento",
      system: { equipado: Boolean(inv.equipado), quantidade: inv.quantidade ?? 1 },
      flags: { [NS]: { inventario: doSite } },
    };
  }
  const flags = { ...clonar(canon.flags?.[NS] ?? {}), inventario: doSite };
  return {
    name: inv.nomeCustomizado || canon.name,
    type: canon.type,
    img: canon.img,
    system: { ...clonar(canon.system ?? {}), equipado: Boolean(inv.equipado), quantidade: inv.quantidade ?? 1 },
    flags: { [NS]: flags },
  };
}

/** Um Item do Foundry → item da mochila do site, ou null se não der para casar com um item do site. */
export function mochilaDoItem(item, { catalogo = CANONICAL_EQUIPAMENTOS } = {}) {
  const mb = item.flags?.[NS] ?? {};
  const doSite = clonar(mb.inventario) ?? {};
  let refId = doSite.refId ?? mb.siteId;
  if (!refId && mb.slug) refId = catalogo.find((e) => e.flags?.[NS]?.slug === mb.slug)?.flags?.[NS]?.siteId;
  if (!refId) return null;
  const canon = catalogo.find((e) => e.flags?.[NS]?.siteId === refId);
  const inv = {
    uid: doSite.uid ?? novoUuid(),
    refId,
    equipado: Boolean(item.system?.equipado),
    qualidade: doSite.qualidade ?? "Mediana",
    material: doSite.material ?? "Aco",
    maoEMeiaAtivo: doSite.maoEMeiaAtivo ?? false,
    sintonizado: doSite.sintonizado ?? false,
    isEspolio: doSite.isEspolio ?? false,
    quantidade: Number(item.system?.quantidade ?? 1),
  };
  for (const k of ["nomeCustomizado", "anotacoes", "slot"]) if (doSite[k] !== undefined) inv[k] = doSite[k];
  // Item renomeado no Foundry: o nome novo vira o nome customizado da mochila
  if (inv.nomeCustomizado === undefined && canon && item.name && item.name !== canon.name) inv.nomeCustomizado = item.name;
  return inv;
}

// ─── Site → Foundry ─────────────────────────────────────────────────────────────

/**
 * Ficha canônica do site → dados para `Actor.create`. Não muda a ficha recebida.
 * @returns {{ actorData: object, avisos: string[] }}
 */
export function montarDadosDoActor(ficha, opcoes = {}) {
  const {
    catalogo = CANONICAL_EQUIPAMENTOS,
    aliases = CANONICAL_ALIASES_EQUIPAMENTOS,
    contrato = CANONICAL_CONTRATO_SITE,
  } = opcoes;
  const data = clonar(ficha) ?? {};
  const avisos = [];
  const system = data.system ?? {};
  const site = {};

  // 1. Campos só do site → flag (D2, D3b), no mesmo caminho em que estavam
  for (const [caminho, destino] of Object.entries(contrato ?? {})) {
    if (destino !== "flag-site" || !caminho.startsWith("system.")) continue;
    const rel = caminho.slice("system.".length);
    const v = ler(system, rel);
    if (v !== undefined) {
      escrever(site, caminho, clonar(v));
      apagar(system, rel);
    }
  }
  if (data.flags && Object.keys(data.flags).length > 0) site.flags = clonar(data.flags);

  // 2. Mochila → Items (D1)
  const inventario = Array.isArray(system.details?.inventario) ? system.details.inventario : [];
  if (system.details) delete system.details.inventario;
  const itensMochila = inventario.map((inv) => itemDaMochila(inv, { catalogo, aliases, avisos }));

  // 3. Idade: o site aceita número; o Foundry guarda texto
  if (system.details && typeof system.details.idade === "number") system.details.idade = String(system.details.idade);

  // 4. Itens do envelope (raça, classe, habilidades, magias...)
  const items = [];
  const slugsVistos = new Set();
  for (const it of data.items ?? []) {
    const siteSystem = clonar(it.system ?? {});
    if (it.type !== "habilidade" && it.type !== "magia") {
      const flags = { [NS]: { siteSystem, ...(TIPOS_DE_MOCHILA.has(it.type) ? { doEnvelope: true } : {}) } };
      let eqSlug = it.slug;
      let eqName = it.name ?? "Item";
      if (eqSlug && aliases?.[eqSlug]) {
        const novoSlug = aliases[eqSlug];
        const canonEq = catalogo.find((e) => e.flags?.[NS]?.slug === novoSlug || e.flags?.[NS]?.siteId === novoSlug);
        eqSlug = canonEq?.flags?.[NS]?.slug ?? novoSlug;
        if (canonEq?.name) eqName = canonEq.name;
      }
      if (eqSlug) flags[NS].slug = eqSlug;
      if (it.flags) flags[NS].siteFlags = clonar(it.flags);
      items.push({ name: eqName, type: it.type, img: it.img, system: it.system ?? {}, flags });
      continue;
    }

    const res = resolverIdHabilidadeAntigaFoundry(it.slug);
    if (res.acao === "removido") {
      if (res.motivo) avisos.push(res.motivo);
      continue;
    }
    let finalSlug = it.slug;
    let finalName = it.name;
    if (res.acao === "substituido" || res.acao === "alias") {
      finalSlug = res.idFinal;
      const canon = (CANONICAL_HABILIDADES || []).find((h) => (h.flags?.[NS]?.slug || h.name) === finalSlug);
      if (canon?.name) finalName = canon.name;
      if (res.acao === "substituido" && res.motivo) avisos.push(res.motivo);
    }
    if (slugsVistos.has(finalSlug)) continue;
    slugsVistos.add(finalSlug);

    const flags = { [NS]: { slug: finalSlug, siteSystem } };
    const concedidaPor = it.concedidaPor || it.system?.concedidaPor;
    if (concedidaPor) flags[NS].concedidaPor = concedidaPor;
    if (it.flags) flags[NS].siteFlags = clonar(it.flags);
    items.push({ name: finalName ?? "Item", type: it.type, img: it.img, system: it.system ?? {}, flags });
  }

  const actorData = {
    name: data.name ?? "Personagem Importado",
    type: data.type ?? "character",
    img: data.img,
    system,
    items: [...items, ...itensMochila],
    flags: {
      [NS]: {
        ...(data.slug ? { slug: data.slug } : {}),
        schemaVersion: data.schemaVersion ?? null,
        ...(Object.keys(site).length > 0 ? { site } : {}),
      },
    },
  };
  return { actorData, avisos: Array.from(new Set(avisos)) };
}

// ─── Foundry → site ─────────────────────────────────────────────────────────────

function numero(v, padrao = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : padrao;
}

/**
 * Actor (documento ou `actor.toObject()`) → ficha canônica do site (v1.2).
 * Só sai dado de origem: `attributes.*.base`, PV/PM atuais e máximos, detalhes, itens. Nada derivado.
 * @returns {{ ficha: object, avisos: string[] }}
 */
export function exportarParaCanonico(actor, opcoes = {}) {
  const { catalogo = CANONICAL_EQUIPAMENTOS } = opcoes;
  const fonte = typeof actor?.toObject === "function" ? actor.toObject() : clonar(actor) ?? {};
  const avisos = [];
  const mb = fonte.flags?.[NS] ?? {};
  const site = clonar(mb.site) ?? {};
  const sys = fonte.system ?? {};
  const det = sys.details ?? {};

  const atributo = (k) => ({ base: numero(sys.attributes?.[k]?.base) });
  const recurso = (r) => {
    const max = numero(sys.resources?.[r]?.max, 60);
    return { value: Math.max(0, Math.min(numero(sys.resources?.[r]?.value, max), max)), max };
  };

  const details = {
    nivel: numero(det.nivel, 1),
    experiencia: numero(det.experiencia),
    dinheiro: Math.max(0, numero(det.dinheiro)),
    aprendiz: det.aprendiz ?? "",
    caminho: det.caminho ?? "",
    organizacao: det.organizacao ?? "",
    antecedente: det.antecedente ?? "",
    evolucao: det.evolucao ?? "",
    idiomas: det.idiomas ?? "",
    motivacao: det.motivacao ?? "",
    condicao: det.condicao ?? "",
    ...(det.idade !== undefined && det.idade !== "" ? { idade: det.idade } : {}),
    condicoesAtivas: clonar(det.condicoesAtivas) ?? [],
    resistenciasTemp: clonar(det.resistenciasTemp) ?? [],
    vulnerabilidadesTemp: clonar(det.vulnerabilidadesTemp) ?? [],
    imunidadesTemp: clonar(det.imunidadesTemp) ?? [],
    inventario: [],
    aflicoes: (det.aflicoes ?? []).map((a) => ({ id: a.id, nome: a.nome ?? "", efeito: a.efeito ?? "", duracao: a.duracao ?? "" })),
    ...(clonar(site.system?.details) ?? {}),
  };

  const items = [];
  const semCorrespondencia = [];
  for (const it of fonte.items ?? []) {
    const imb = it.flags?.[NS] ?? {};
    if (TIPOS_DE_MOCHILA.has(it.type) && !imb.doEnvelope) {
      const inv = mochilaDoItem(it, { catalogo });
      if (inv) details.inventario.push(inv);
      else {
        semCorrespondencia.push({ name: it.name, type: it.type, system: clonar(it.system) });
        avisos.push(`"${it.name}" não existe no catálogo do site: ficou guardado na ficha, fora da mochila`);
      }
      continue;
    }
    // Caminho e Organização: no site ficam nos detalhes, não em items[]
    if (it.type === "caminho" || it.type === "organizacao") {
      const campo = it.type;
      if (!details[campo]) details[campo] = imb.slug ?? slugify(it.name);
      continue;
    }
    if (!TIPOS_ITEM_SITE.has(it.type)) {
      semCorrespondencia.push({ name: it.name, type: it.type, system: clonar(it.system) });
      avisos.push(`"${it.name}" (${it.type}) não tem tipo correspondente no site: ficou guardado na ficha`);
      continue;
    }
    const saida = {
      slug: imb.slug ?? slugify(it.name),
      name: it.name || "Item",
      type: it.type,
      // o system que veio do site volta como veio; item criado no Foundry leva só os efeitos
      system: clonar(imb.siteSystem) ?? { efeitos: Array.isArray(it.system?.efeitos) ? clonar(it.system.efeitos) : [] },
    };
    if (it.img) saida.img = it.img;
    if (imb.concedidaPor) saida.concedidaPor = imb.concedidaPor;
    if (imb.siteFlags) saida.flags = clonar(imb.siteFlags);
    items.push(saida);
  }

  const system = {
    attributes: { forca: atributo("forca"), agilidade: atributo("agilidade"), inteligencia: atributo("inteligencia"), vontade: atributo("vontade") },
    resources: { vida: recurso("vida"), mana: recurso("mana") },
    details,
    ...(Array.isArray(sys.progressao) ? { progressao: clonar(sys.progressao) } : {}),
    biography: sys.biography ?? "",
  };
  // Campos só do site (D2) voltam ao lugar
  for (const [k, v] of Object.entries(site.system ?? {})) if (k !== "details") system[k] = v;

  const flags = clonar(site.flags) ?? {};
  if (semCorrespondencia.length > 0) {
    flags["mighty-blade-foundry"] = { ...(flags["mighty-blade-foundry"] ?? {}), itensSemCorrespondencia: semCorrespondencia };
  }

  const ficha = {
    schemaVersion: VERSAO_CONTRATO,
    ...(mb.slug ? { slug: mb.slug } : {}),
    name: fonte.name || "Personagem",
    type: "character",
    ...(fonte.img ? { img: fonte.img } : {}),
    system,
    items,
    flags,
  };
  return { ficha, avisos };
}
