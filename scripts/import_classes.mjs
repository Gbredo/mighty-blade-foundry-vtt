import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import util from "util";
import { CLASSES } from "../../MightyBlade3eWebsite/packages/rules-core/dist/data/classes.js";

const execAsync = util.promisify(exec);

async function run() {
  const PACK_DIR = path.resolve("./packs/classes_src");
  await fs.rm(PACK_DIR, { recursive: true, force: true }).catch(() => {});
  await fs.mkdir(PACK_DIR, { recursive: true });

  const classesList = Object.values(CLASSES);
  console.log(`Exportando ${classesList.length} classes para JSON...`);

  for (const classe of classesList) {
    const descHtml = classe.descricao ? `<p>${classe.descricao.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>` : "";
    const habsHtml = classe.listaHabilidades && classe.listaHabilidades.length > 0 
      ? `<p><strong>Habilidades Disponíveis:</strong> ${classe.listaHabilidades.join(", ")}</p>` 
      : "";

    const foundryItem = {
      name: classe.nome,
      type: "classe",
      img: "icons/svg/shield.svg",
      system: {
        atributos: {
          forca: classe.bonusAtributos?.forca ?? 0,
          agilidade: classe.bonusAtributos?.agilidade ?? 0,
          inteligencia: classe.bonusAtributos?.inteligencia ?? 0,
          vontade: classe.bonusAtributos?.vontade ?? 0
        },
        habilidadeUuid: "",
        concessoes: [],
        vida: classe.vidaInicial ?? 0,
        mana: classe.manaInicial ?? 0,
        equipamentoInicial: "",
        description: `${descHtml}${habsHtml}`
      },
      flags: {
        "mighty-blade": {
          slug: classe.id,
          conjurador: classe.conjurador ?? false,
          racasComuns: classe.racasComuns || ""
        }
      }
    };

    const filePath = path.join(PACK_DIR, `${classe.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(foundryItem, null, 2));
  }

  console.log("JSONs exportados. Empacotando para LevelDB...");
  try {
    const { stdout } = await execAsync("npx fvtt package pack -n classes --in packs/classes_src --out packs");
    console.log(stdout);
    await fs.rm(PACK_DIR, { recursive: true, force: true }).catch(() => {});
    console.log("Sucesso! Compêndio Classes reconstruído.");
  } catch (err) {
    console.error("Erro ao empacotar LevelDB:", err.message);
  }
}

run().catch(console.error);
