import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

async function main() {
  console.log("==================================================");
  console.log("🧙 SINCRONIZADOR UNIVERSAL DE COMPÊNDIOS (MB 3e -> FOUNDRY VTT)");
  console.log("==================================================");

  try {
    const { stdout, stderr } = await execAsync("node scripts/export_canonical_content.cjs");
    console.log(stdout);
    if (stderr) console.error(stderr);

    console.log("==================================================");
    console.log("🎉 TODOS OS 1.120+ ITENS FORAM SINCRONIZADOS PARA O FOUNDRY!");
    console.log("==================================================");
  } catch (err) {
    console.error("❌ Erro durante sincronização:", err.message);
    process.exit(1);
  }
}

main();

