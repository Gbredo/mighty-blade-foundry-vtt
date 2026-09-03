import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import util from "util";
import { RACAS } from "../../MightyBlade3eWebsite/packages/rules-core/dist/data/racas.js";

const execAsync = util.promisify(exec);

async function run() {
  const PACK_DIR = path.resolve("./packs/racas_src");
  await fs.rm(PACK_DIR, { recursive: true, force: true }).catch(() => {});
  await fs.mkdir(PACK_DIR, { recursive: true });

  const racasList = Object.values(RACAS);
  console.log(`Exportando ${racasList.length} raças para JSON...`);

  for (const raca of racasList) {
    const biologiaHtml = raca.biologia ? `<p><strong>Biologia:</strong><br>${raca.biologia.replace(/\n/g, "<br>")}</p>` : "";
    const culturaHtml = raca.cultura ? `<p><strong>Cultura & Sociedade:</strong><br>${raca.cultura.replace(/\n/g, "<br>")}</p>` : "";
    const faixasHtml = raca.faixasEtarias ? `<p><strong>Faixas Etárias:</strong> Adulto aos ${raca.faixasEtarias.adulto} anos, Idoso aos ${raca.faixasEtarias.idoso} anos.</p>` : "";
    const nomesHtml = raca.nomes?.lore ? `<p><strong>Nomes Tradicionais:</strong><br>${raca.nomes.lore}</p>` : "";

    const descHtml = [biologiaHtml, culturaHtml, faixasHtml, nomesHtml].filter(Boolean).join("");

    const foundryItem = {
      name: raca.nome,
      type: "raca",
      img: "icons/svg/mystery-man.svg",
      system: {
        atributos: {
          forca: raca.atributos?.forca ?? 0,
          agilidade: raca.atributos?.agilidade ?? 0,
          inteligencia: raca.atributos?.inteligencia ?? 0,
          vontade: raca.atributos?.vontade ?? 0
        },
        habilidadeUuid: "",
        habilidadeAutomatica: {
          nome: raca.habilidadeAutomatica || "",
          descricao: "",
          tipo: "suporte",
          categoria: "caracteristica",
          custo: 0
        },
        concessoes: [],
        classesComuns: Array.isArray(raca.classesComuns) ? raca.classesComuns.join(", ") : (raca.classesComuns || ""),
        description: descHtml || `<p>Raça ${raca.nome} de Mighty Blade 3e.</p>`
      },
      flags: {
        "mighty-blade": {
          slug: raca.id || raca.slug
        }
      }
    };

    const filePath = path.join(PACK_DIR, `${raca.id || raca.slug}.json`);
    await fs.writeFile(filePath, JSON.stringify(foundryItem, null, 2));
  }

  console.log("JSONs exportados. Empacotando para LevelDB...");
  try {
    const { stdout } = await execAsync("npx fvtt package pack -n racas --in packs/racas_src --out packs");
    console.log(stdout);
    await fs.rm(PACK_DIR, { recursive: true, force: true }).catch(() => {});
    console.log("Sucesso! Compêndio Raças reconstruído.");
  } catch (err) {
    console.error("Erro ao empacotar LevelDB:", err.message);
  }
}

run().catch(console.error);
