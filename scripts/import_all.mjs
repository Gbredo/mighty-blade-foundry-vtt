import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

async function main() {
  console.log("==================================================");
  console.log("🧙 SINCRONIZADOR UNIVERSAL DE COMPÊNDIOS (MB 3e -> FOUNDRY VTT)");
  console.log("==================================================");

  try {
    console.log("\n📦 1/4: Sincronizando Equipamentos e Poções...");
    const r1 = await execAsync("node scripts/import_equipamentos.mjs");
    console.log(r1.stdout);

    console.log("\n🧝 2/4: Sincronizando Raças Canônicas...");
    const r2 = await execAsync("node scripts/import_racas.mjs");
    console.log(r2.stdout);

    console.log("\n⚔️ 3/4: Sincronizando Classes Canônicas...");
    const r3 = await execAsync("node scripts/import_classes.mjs");
    console.log(r3.stdout);

    console.log("\n✨ 4/4: Sincronizando Habilidades e Grimório de Magias...");
    const r4 = await execAsync("node scripts/import_habilidades_e_magias.mjs");
    console.log(r4.stdout);

    console.log("==================================================");
    console.log("🎉 TODOS OS COMPÊNDIOS FORAM RECONSTRUÍDOS COM SUCESSO!");
    console.log("==================================================");
  } catch (err) {
    console.error("❌ Erro durante sincronização:", err.message);
    process.exit(1);
  }
}

main();
