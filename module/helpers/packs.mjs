import {
  CANONICAL_RACAS,
  CANONICAL_CLASSES,
  CANONICAL_CAMINHOS,
  CANONICAL_ORGANIZACOES,
  CANONICAL_HABILIDADES,
  CANONICAL_MAGIAS,
  CANONICAL_EQUIPAMENTOS,
  CANONICAL_DIARIOS,
} from "../data/canonical-packs-data.mjs";

/**
 * Gera um slug estável a partir de um nome (minúsculas, sem acentos, kebab-case).
 * @param {string} s
 * @returns {string}
 */
export function slugify(s) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Pega um pack do sistema e o destrava para escrita. */
async function getWritablePack(name) {
  const pack = game.packs.get(`mighty-blade.${name}`);
  if (!pack) return null;
  if (pack.locked) await pack.configure({ locked: false });
  return pack;
}

/** Apaga todos os documentos de um pack (para reconstrução idempotente). */
async function clearPack(pack, docCls = Item) {
  const docs = await pack.getDocuments();
  if (docs.length) {
    await docCls.deleteDocuments(docs.map((d) => d.id), { pack: pack.collection });
  }
}

/** Cria documentos em lotes para máxima performance sem sobrecarregar o LevelDB */
async function createInBatches(items, pack, docCls = Item, batchSize = 50) {
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    await docCls.createDocuments(chunk, { pack: pack.collection });
  }
}

/**
 * (Re)constrói todos os compêndios de conteúdo a partir do catálogo canônico
 * do @mighty-blade/rules-core.
 *
 * Popula:
 *   - `racas` (21 raças canônicas com ilustrações oficiais e links para diários)
 *   - `classes` (14 classes canônicas com ilustrações oficiais e arsenais)
 *   - `caminhos` (20 caminhos de especialização avançada)
 *   - `organizacoes` (12 organizações com brasões oficiais e estatutos)
 *   - `habilidades` (542 habilidades de combate, técnicas, características e raciais)
 *   - `magias` (170 magias com círculos, custos, dificuldades e fontes arcanas/místicas)
 *   - `equipamentos` (373 equipamentos: armas, armaduras, escudos, poções e itens)
 *   - `diarios` (67 diários em JournalEntry com biologia, cultura, faixas etárias e nomes)
 *
 * @returns {Promise<void>}
 */
export async function buildCompendios() {
  const racasPack = await getWritablePack("racas");
  const classesPack = await getWritablePack("classes");
  const caminhosPack = await getWritablePack("caminhos");
  const orgsPack = await getWritablePack("organizacoes");
  const habPack = await getWritablePack("habilidades");
  const magPack = await getWritablePack("magias");
  const eqpPack = await getWritablePack("equipamentos");
  const diariosPack = await getWritablePack("diarios");

  if (!racasPack || !classesPack || !habPack || !magPack || !eqpPack) {
    ui.notifications.error("Compêndios essenciais do sistema não encontrados. Recarregue o Foundry (F5).");
    return;
  }

  ui.notifications.info("⏳ Iniciando sincronização de 1.150+ itens canônicos e 67 diários com ilustrações...");

  try {
    // 1. Limpar packs antigos
    await clearPack(racasPack, Item);
    await clearPack(classesPack, Item);
    if (caminhosPack) await clearPack(caminhosPack, Item);
    if (orgsPack) await clearPack(orgsPack, Item);
    await clearPack(habPack, Item);
    await clearPack(magPack, Item);
    await clearPack(eqpPack, Item);
    if (diariosPack) await clearPack(diariosPack, JournalEntry);

    // 2. Criar itens em lotes
    await createInBatches(CANONICAL_RACAS, racasPack, Item);
    await createInBatches(CANONICAL_CLASSES, classesPack, Item);
    if (caminhosPack) await createInBatches(CANONICAL_CAMINHOS, caminhosPack, Item);
    if (orgsPack) await createInBatches(CANONICAL_ORGANIZACOES, orgsPack, Item);
    await createInBatches(CANONICAL_HABILIDADES, habPack, Item);
    await createInBatches(CANONICAL_MAGIAS, magPack, Item);
    await createInBatches(CANONICAL_EQUIPAMENTOS, eqpPack, Item);
    if (diariosPack) await createInBatches(CANONICAL_DIARIOS, diariosPack, JournalEntry);

    // 3. Re-travar os packs para proteger os dados canônicos
    await racasPack.configure({ locked: true });
    await classesPack.configure({ locked: true });
    if (caminhosPack) await caminhosPack.configure({ locked: true });
    if (orgsPack) await orgsPack.configure({ locked: true });
    await habPack.configure({ locked: true });
    await magPack.configure({ locked: true });
    await eqpPack.configure({ locked: true });
    if (diariosPack) await diariosPack.configure({ locked: true });

    const total =
      CANONICAL_RACAS.length +
      CANONICAL_CLASSES.length +
      CANONICAL_CAMINHOS.length +
      CANONICAL_ORGANIZACOES.length +
      CANONICAL_HABILIDADES.length +
      CANONICAL_MAGIAS.length +
      CANONICAL_EQUIPAMENTOS.length;

    ui.notifications.info(
      `🎉 Sucesso! ${total} itens e ${CANONICAL_DIARIOS.length} diários sincronizados com ilustrações oficiais!`
    );
  } catch (err) {
    console.error("MIGHTY BLADE: Erro ao reconstruir compêndios:", err);
    ui.notifications.error(`Erro ao sincronizar compêndios: ${err.message}`);
  }
}

