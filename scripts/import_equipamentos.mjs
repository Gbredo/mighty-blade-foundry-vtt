import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import util from "util";
import { EQUIPAMENTOS } from "../../MightyBlade3eWebsite/packages/rules-core/dist/data/equipamentos.js";

const execAsync = util.promisify(exec);

async function run() {
  const PACK_DIR = path.resolve("./packs/equipamentos_src");
  // Ensure fresh directory
  await fs.rm(PACK_DIR, { recursive: true, force: true }).catch(() => {});
  await fs.mkdir(PACK_DIR, { recursive: true });

  const equipamentos = Object.values(EQUIPAMENTOS);
  console.log(`Exportando ${equipamentos.length} equipamentos para JSON...`);

  for (const eqp of equipamentos) {
    const foundryItem = {
      name: eqp.nome,
      type: "arma", // mantemos o schema 'arma' que unificou tudo
      img: eqp.categoria === "Pocao" ? "icons/consumables/potions/potion-flask-corked-red.webp" : 
           eqp.categoria === "Municao" ? "icons/weapons/ammunition/arrow-head-steel.webp" :
           eqp.categoria === "Conjuracao" ? "icons/weapons/staves/staff-simple.webp" :
           eqp.categoria === "Defesa" ? (eqp.isEscudo ? "icons/equipment/shield/heater-wooden-brown.webp" : "icons/equipment/chest/breastplate-leather-brown.webp") :
           eqp.categoria === "Projetil" ? "icons/weapons/bows/bow-short-wood.webp" :
           eqp.categoria === "Arma" ? "icons/svg/sword.svg" : "icons/svg/item-bag.svg",
      system: {
        description: eqp.observacoes || "",
        custo: eqp.custo || 0,
        peso: eqp.pesoKg || 0,
        fn: eqp.fn || 0,
        alcance: eqp.alcance || "Adjacente (1m)",
        dano: eqp.danoBonusFor ? `FOR+${eqp.danoBonusFor}` : (eqp.danoFixo ? `${eqp.danoFixo}` : "0"),
        tipoDano: eqp.tipoDano || [],
        propriedades: eqp.propriedades || [],
        quantidade: 1,
        equipado: false,
        efeitos: [],
      },
      flags: {
        "mighty-blade": {
          slug: eqp.id,
        },
      },
    };

    const filePath = path.join(PACK_DIR, `${eqp.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(foundryItem, null, 2));
  }

  console.log("JSONs exportados. Empacotando para LevelDB...");
  
  // Pack leveldb
  try {
    const { stdout } = await execAsync("npx fvtt package pack -n equipamentos --in packs/equipamentos_src --out packs");
    console.log(stdout);
    
    // Clean up
    await fs.rm(PACK_DIR, { recursive: true, force: true }).catch(() => {});
    console.log("Sucesso! Compêndio Equipamentos reconstruído.");
  } catch (err) {
    console.error("Erro ao empacotar LevelDB:", err.message);
  }
}

run().catch(console.error);
