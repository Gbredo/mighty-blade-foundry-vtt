import { RACES_DATA } from "./create-races.mjs";

/**
 * Gera um slug estável a partir de um nome (minúsculas, sem acentos, kebab-case).
 * @param {string} s
 * @returns {string}
 */
export function slugify(s) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // remove acentos
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

/**
 * (Re)constrói os compêndios de conteúdo a partir dos dados internos. Cada Item
 * recebe `flags["mighty-blade"].slug`; as raças referenciam suas habilidades por
 * `ref` (slug) nas concessões — o motor resolve slug→UUID na hora de conceder.
 *
 * Hoje popula `racas` + `habilidades` (a partir de RACES_DATA). `classes`/`magias`
 * ficam declarados e prontos para receber conteúdo (do site ou manual).
 * @returns {Promise<void>}
 */
export async function buildCompendios() {
  const racasPack = await getWritablePack("racas");
  const habPack = await getWritablePack("habilidades");
  if (!racasPack || !habPack) {
    ui.notifications.error("Compêndios não encontrados. Recarregue o Foundry após declarar os packs.");
    return;
  }

  await clearPack(racasPack);
  await clearPack(habPack);

  let nHab = 0;
  let nRaca = 0;

  for (const raceData of RACES_DATA) {
    const raceSlug = slugify(raceData.name);
    const ab = raceData.system.habilidadeAutomatica;
    const concessoes = [];

    if (ab?.nome) {
      const abSlug = slugify(ab.nome);
      await Item.create(
        {
          name: ab.nome,
          type: "habilidade",
          img: raceData.img,
          system: {
            description: ab.descricao,
            tipo: ab.tipo || "suporte",
            categoria: ab.categoria || "caracteristica",
            custo: ab.custo || 0,
            requisitos: `Raça: ${raceData.name}`,
            efeitos: [],
          },
          flags: { "mighty-blade": { slug: abSlug } },
        },
        { pack: habPack.collection }
      );
      nHab++;

      // Humano: Adaptabilidade é uma escolha de atributo; as demais são fixas.
      if (raceData.name === "Humano") concessoes.push({ tipo: "escolhaAtributo", ref: abSlug, valor: 1 });
      else concessoes.push({ tipo: "habilidade", ref: abSlug });
    }

    await Item.create(
      {
        name: raceData.name,
        type: "raca",
        img: raceData.img,
        system: { ...raceData.system, habilidadeUuid: "", concessoes },
        flags: { "mighty-blade": { slug: raceSlug } },
      },
      { pack: racasPack.collection }
    );
    nRaca++;
  }

  ui.notifications.info(`Compêndios reconstruídos: ${nRaca} raças e ${nHab} habilidades (com slugs).`);
}
