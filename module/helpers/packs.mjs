import {
  CANONICAL_RACAS,
  CANONICAL_CLASSES,
  CANONICAL_HABILIDADES,
  CANONICAL_MAGIAS,
  CANONICAL_EQUIPAMENTOS,
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
async function clearPack(pack) {
  const docs = await pack.getDocuments();
  if (docs.length) {
    await Item.deleteDocuments(docs.map((d) => d.id), { pack: pack.collection });
  }
}

/** Cria documentos em lotes para máxima performance sem sobrecarregar o LevelDB */
async function createInBatches(items, pack, batchSize = 50) {
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    await Item.createDocuments(chunk, { pack: pack.collection });
  }
}

/**
 * (Re)constrói todos os compêndios de conteúdo a partir do catálogo canônico
 * do @mighty-blade/rules-core.
 *
 * Popula:
 *   - `racas` (21 raças canônicas com atributos, lore e concessões)
 *   - `classes` (14 classes canônicas com bônus, concessões de habilidades e magias)
 *   - `habilidades` (542 habilidades de combate, técnicas, características e raciais)
 *   - `magias` (170 magias com círculos, custos, dificuldades e fontes arcanas/místicas)
 *   - `equipamentos` (373 equipamentos: armas, armaduras, escudos, poções e itens)
 *
 * @returns {Promise<void>}
 */
export async function buildCompendios() {
  const racasPack = await getWritablePack("racas");
  const classesPack = await getWritablePack("classes");
  const habPack = await getWritablePack("habilidades");
  const magPack = await getWritablePack("magias");
  const eqpPack = await getWritablePack("equipamentos");

  if (!racasPack || !classesPack || !habPack || !magPack || !eqpPack) {
    ui.notifications.error("Compêndios do sistema não encontrados. Recarregue o Foundry após declarar os packs.");
    return;
  }

  ui.notifications.info("⏳ Iniciando sincronização de 1.120+ itens canônicos do Mighty Blade 3e...");

  try {
    // 1. Limpar packs antigos
    await clearPack(racasPack);
    await clearPack(classesPack);
    await clearPack(habPack);
    await clearPack(magPack);
    await clearPack(eqpPack);

    // 2. Criar itens em lotes
    await createInBatches(CANONICAL_RACAS, racasPack);
    await createInBatches(CANONICAL_CLASSES, classesPack);
    await createInBatches(CANONICAL_HABILIDADES, habPack);
    await createInBatches(CANONICAL_MAGIAS, magPack);
    await createInBatches(CANONICAL_EQUIPAMENTOS, eqpPack);

    // 3. Re-travar os packs para proteger os dados canônicos
    await racasPack.configure({ locked: true });
    await classesPack.configure({ locked: true });
    await habPack.configure({ locked: true });
    await magPack.configure({ locked: true });
    await eqpPack.configure({ locked: true });

    const total =
      CANONICAL_RACAS.length +
      CANONICAL_CLASSES.length +
      CANONICAL_HABILIDADES.length +
      CANONICAL_MAGIAS.length +
      CANONICAL_EQUIPAMENTOS.length;

    ui.notifications.info(
      `🎉 Sucesso! ${total} itens sincronizados: ` +
      `${CANONICAL_RACAS.length} Raças, ${CANONICAL_CLASSES.length} Classes, ` +
      `${CANONICAL_HABILIDADES.length} Habilidades, ${CANONICAL_MAGIAS.length} Magias e ` +
      `${CANONICAL_EQUIPAMENTOS.length} Equipamentos!`
    );
  } catch (err) {
    console.error("MIGHTY BLADE: Erro ao reconstruir compêndios:", err);
    ui.notifications.error(`Erro ao sincronizar compêndios: ${err.message}`);
  }
}

