import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Delegando sincronização de Habilidades e Magias para scripts/export_canonical_content.cjs (SSOT: Obsidian habilidades.base)...");
execSync(`node "${path.join(__dirname, "export_canonical_content.cjs")}"`, {
  cwd: path.resolve(__dirname, ".."),
  stdio: "inherit",
});
