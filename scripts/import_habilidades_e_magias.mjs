import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import util from "util";
import { HABILIDADES } from "../../MightyBlade3eWebsite/packages/rules-core/dist/data/habilidades.js";

const execAsync = util.promisify(exec);

async function run() {
  const HAB_DIR = path.resolve("./packs/habilidades_src");
  const MAG_DIR = path.resolve("./packs/magias_src");

  await fs.rm(HAB_DIR, { recursive: true, force: true }).catch(() => {});
  await fs.rm(MAG_DIR, { recursive: true, force: true }).catch(() => {});
  await fs.mkdir(HAB_DIR, { recursive: true });
  await fs.mkdir(MAG_DIR, { recursive: true });

  const todasHabs = Object.values(HABILIDADES);
  console.log(`Processando ${todasHabs.length} habilidades e magias...`);

  let countHabs = 0;
  let countMags = 0;

  for (const hab of todasHabs) {
    const isMagia = hab.categoria === "Magia" || hab.tipo === "Magia";
    const reqStr = Array.isArray(hab.requisitos) ? hab.requisitos.join(", ") : (hab.requisitos || "");
    const descHtml = hab.descricao ? `<p>${hab.descricao.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>` : "";

    if (isMagia) {
      countMags++;
      const foundryMagia = {
        name: hab.nome,
        type: "magia",
        img: "icons/magic/symbols/rune-sigil-horned-blue.webp",
        system: {
          fonte: hab.fonte || "arcana",
          custo: hab.custoMana ?? (hab.custo ?? 0),
          dificuldade: hab.dificuldade ?? 0,
          circulo: hab.circulo ?? 1,
          description: reqStr ? `<p><strong>Requisitos:</strong> ${reqStr}</p>${descHtml}` : descHtml
        },
        flags: {
          "mighty-blade": {
            slug: hab.id,
            tipo: hab.tipo || "Acao"
          }
        }
      };
      const filePath = path.join(MAG_DIR, `${hab.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(foundryMagia, null, 2));
    } else {
      countHabs++;
      const tipoLower = (hab.tipo || "suporte").toLowerCase();
      const catLower = (hab.categoria || "tecnica").toLowerCase();

      const foundryHab = {
        name: hab.nome,
        type: "habilidade",
        img: "icons/svg/aura.svg",
        system: {
          tipo: tipoLower.includes("acao") ? "acao" : tipoLower.includes("reacao") ? "reacao" : "suporte",
          custo: hab.custoMana ?? (hab.custo ?? 0),
          requisitos: reqStr,
          categoria: catLower.includes("caracteristica") ? "caracteristica" : catLower.includes("especial") ? "especial" : "tecnica",
          dificuldade: hab.dificuldade ?? 0,
          bonusAtributo: { atributo: "", valor: 0 },
          efeitos: hab.efeitos || [],
          description: descHtml
        },
        flags: {
          "mighty-blade": {
            slug: hab.id,
            automatica: hab.automatica ?? false
          }
        }
      };
      const filePath = path.join(HAB_DIR, `${hab.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(foundryHab, null, 2));
    }
  }

  console.log(`JSONs exportados: ${countHabs} habilidades e ${countMags} magias. Empacotando para LevelDB...`);

  try {
    const resHab = await execAsync("npx fvtt package pack -n habilidades --in packs/habilidades_src --out packs");
    console.log(resHab.stdout);
    await fs.rm(HAB_DIR, { recursive: true, force: true }).catch(() => {});
    console.log("Sucesso! Compêndio Habilidades reconstruído.");
  } catch (err) {
    console.error("Erro ao empacotar Habilidades:", err.message);
  }

  try {
    const resMag = await execAsync("npx fvtt package pack -n magias --in packs/magias_src --out packs");
    console.log(resMag.stdout);
    await fs.rm(MAG_DIR, { recursive: true, force: true }).catch(() => {});
    console.log("Sucesso! Compêndio Magias reconstruído.");
  } catch (err) {
    console.error("Erro ao empacotar Magias:", err.message);
  }
}

run().catch(console.error);
