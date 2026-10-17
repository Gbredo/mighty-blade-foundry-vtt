import { CANONICAL_HABILIDADES, CANONICAL_MAGIAS } from "../module/data/canonical-packs-data.mjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");

console.log("==================================================");
console.log("🔍 VERIFICAÇÃO LOTE 5 — ACESSO R1 NOS COMPÊNDIOS");
console.log("==================================================");

let erros = 0;

const allItems = [...CANONICAL_HABILIDADES, ...CANONICAL_MAGIAS];
const allNames = new Set(allItems.map((i) => i.name));

// 1. Itens que NÃO devem estar
const naoDevemEstar = ["Força Interior", "Ameaçador", "Sangrar", "Mágica", "Ilusório", "Invocação Infernal"];
console.log("\n1. Verificando itens que NÃO devem existir nos compêndios:");
for (const nome of naoDevemEstar) {
  const achou = allNames.has(nome);
  if (achou) {
    console.error(`  ❌ ERRO: "${nome}" foi encontrado nos compêndios!`);
    erros++;
  } else {
    console.log(`  ✅ OK: "${nome}" ausente como esperado.`);
  }
}

// 2. Itens que DEVEM estar
const devemEstar = [
  "Ameaçador (Naga)",
  "Ameaçador (Orc)",
  "Faça-os Sangrar",
  "Luz Mágica",
  "Som Ilusório",
  "Círculo de Invocação Infernal",
];
console.log("\n2. Verificando itens que DEVEM existir nos compêndios:");
for (const nome of devemEstar) {
  const achou = allNames.has(nome);
  if (!achou) {
    console.error(`  ❌ ERRO: "${nome}" NÃO foi encontrado nos compêndios!`);
    erros++;
  } else {
    console.log(`  ✅ OK: "${nome}" presente no compêndio.`);
  }
}

// 3. Marca da Justiça tem acesso só [Sacerdote]
console.log("\n3. Verificando acesso de 'Marca da Justiça':");
const marca = allItems.find((i) => i.name === "Marca da Justiça");
if (!marca) {
  console.error("  ❌ ERRO: 'Marca da Justiça' não foi encontrada!");
  erros++;
} else {
  const acesso = marca.system?.acesso || [];
  const acessoOk = acesso.length === 1 && acesso[0] === "Sacerdote";
  if (acessoOk) {
    console.log(`  ✅ OK: 'Marca da Justiça' possui acesso exclusivo [Sacerdote]: ${JSON.stringify(acesso)}`);
  } else {
    console.error(`  ❌ ERRO: 'Marca da Justiça' possui acesso inesperado: ${JSON.stringify(acesso)} (esperado: ["Sacerdote"])`);
    erros++;
  }
}

// 4. Total de habilidades principais
console.log("\n4. Verificando contagem de habilidades principais:");
const habsPrincipais = CANONICAL_HABILIDADES.filter((h) => !h.flags?.["mighty-blade"]?.isSubFeature);
console.log(`  Total de habilidades principais: ${habsPrincipais.length} (esperado: 553)`);
console.log(`  Total de magias: ${CANONICAL_MAGIAS.length} (esperado: 164)`);

if (habsPrincipais.length !== 553) {
  console.error(`  ❌ DIVERGÊNCIA: contagem de habilidades principais é ${habsPrincipais.length}, diferente de 553!`);
  erros++;
} else {
  console.log(`  ✅ OK: contagem exata de 553 habilidades principais.`);
}

console.log("\n==================================================");
if (erros === 0) {
  console.log("🎉 TODAS AS VERIFICAÇÕES DO LOTE 5 PASSARAM COM SUCESSO!");
  console.log("==================================================");
  process.exit(0);
} else {
  console.error(`❌ FORAM ENCONTRADOS ${erros} ERROS DE VERIFICAÇÃO!`);
  console.log("==================================================");
  process.exit(1);
}
