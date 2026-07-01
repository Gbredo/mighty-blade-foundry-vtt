import fs from "fs/promises";
import path from "path";
import { EQUIPAMENTOS } from "../../MightyBlade3eWebsite/packages/rules-core/dist/data/equipamentos.js";

async function run() {
  const PACK_DIR = path.resolve("./packs/equipamentos");
  await fs.mkdir(PACK_DIR, { recursive: true });

  const armas = Object.values(EQUIPAMENTOS).filter(e => e.categoria === "Arma");
  console.log(`Exportando ${armas.length} armas...`);

  for (const arma of armas) {
    const foundryItem = {
      name: arma.nome,
      type: "arma",
      img: "icons/svg/sword.svg",
      system: {
        description: arma.observacoes || "",
        custo: arma.custo || 0,
        peso: arma.pesoKg || 0,
        fn: arma.fn || 0,
        alcance: arma.alcance || "Adjacente (1m)",
        dano: arma.danoBonusFor ? `FOR+${arma.danoBonusFor}` : (arma.danoFixo ? `${arma.danoFixo}` : "0"),
        tipoDano: arma.tipoDano || [],
        propriedades: arma.propriedades || [],
        quantidade: 1,
        equipado: false,
        efeitos: [],
      },
      flags: {
        "mighty-blade": {
          slug: arma.id,
        },
      },
    };

    const filePath = path.join(PACK_DIR, `${arma.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(foundryItem, null, 2));
  }

  console.log("Sucesso! Armas exportadas.");
}

run().catch(console.error);
