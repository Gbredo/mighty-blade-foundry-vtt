import { MightyBladeActor } from "../documents/actor.mjs";
import {
  CANONICAL_ALIASES_HABILIDADES,
  CANONICAL_HABILIDADES_RETIRADAS,
  CANONICAL_HABILIDADES,
} from "../data/canonical-packs-data.mjs";

/**
 * Normaliza e resolve um ID antigo de habilidade no Foundry.
 */
export function resolverIdHabilidadeAntigaFoundry(id) {
  const retirada = (CANONICAL_HABILIDADES_RETIRADAS || []).find((r) => r.id === id);
  if (retirada) {
    if (retirada.substitutaId) {
      const canonSub = (CANONICAL_HABILIDADES || []).find(
        (h) => (h.flags?.["mighty-blade"]?.slug || h.name) === retirada.substitutaId
      );
      return {
        idFinal: retirada.substitutaId,
        motivo: `${retirada.nome} → ${canonSub?.name ?? retirada.substitutaId}`,
        acao: "substituido",
      };
    }
    const detalhe = retirada.status === "inventada" ? "não existe nos livros" : "retirada das regras oficiais";
    return {
      idFinal: null,
      motivo: `${retirada.nome} removida (${detalhe})`,
      acao: "removido",
    };
  }

  const alias = CANONICAL_ALIASES_HABILIDADES?.[id];
  if (alias) {
    const canonOrig = (CANONICAL_HABILIDADES || []).find(
      (h) => (h.flags?.["mighty-blade"]?.slug || h.name) === id
    );
    const canonDest = (CANONICAL_HABILIDADES || []).find(
      (h) => (h.flags?.["mighty-blade"]?.slug || h.name) === alias
    );
    return {
      idFinal: alias,
      motivo: `${canonOrig?.name ?? id} → ${canonDest?.name ?? alias}`,
      acao: "alias",
    };
  }

  return { idFinal: id, acao: "inalterado" };
}

/**
 * Importa uma ficha no formato JSON canônico compartilhado com o gerador de fichas.
 * Aplica migração de habilidades retiradas/inventadas e aliases (Fase C5).
 * Cria um Actor "character" com os Items embutidos.
 *
 * @param {object} rawData  Objeto JSON canônico já parseado.
 * @returns {Promise<Actor|null>}
 */
export async function importCharacter(rawData) {
  if (!rawData || typeof rawData !== "object") {
    ui.notifications.error("Ficha inválida: JSON não reconhecido.");
    return null;
  }

  const data = JSON.parse(JSON.stringify(rawData));
  const avisosPartes = [];

  const rawItems = data.items ?? [];
  const items = [];
  const slugsVistos = new Set();

  for (const it of rawItems) {
    if (it.type !== "habilidade" && it.type !== "magia") {
      const flags = { "mighty-blade": {} };
      if (it.slug) flags["mighty-blade"].slug = it.slug;
      items.push({ name: it.name ?? "Item", type: it.type, img: it.img, system: it.system ?? {}, flags });
      continue;
    }

    const res = resolverIdHabilidadeAntigaFoundry(it.slug);
    if (res.acao === "removido") {
      if (res.motivo) avisosPartes.push(res.motivo);
      continue;
    }

    let finalSlug = it.slug;
    let finalName = it.name;

    if (res.acao === "substituido" || res.acao === "alias") {
      finalSlug = res.idFinal;
      const canon = (CANONICAL_HABILIDADES || []).find(
        (h) => (h.flags?.["mighty-blade"]?.slug || h.name) === finalSlug
      );
      if (canon?.name) finalName = canon.name;
      if (res.acao === "substituido" && res.motivo) avisosPartes.push(res.motivo);
    }

    if (slugsVistos.has(finalSlug)) continue;
    slugsVistos.add(finalSlug);

    const flags = { "mighty-blade": {} };
    flags["mighty-blade"].slug = finalSlug;
    if (it.concedidaPor || it.system?.concedidaPor) {
      flags["mighty-blade"].concedidaPor = it.concedidaPor || it.system.concedidaPor;
    }

    items.push({
      name: finalName ?? "Item",
      type: it.type,
      img: it.img,
      system: it.system ?? {},
      flags,
    });
  }

  // Se houver avisos de migração, emite aviso único consolidado
  if (avisosPartes.length > 0) {
    const avisosUnicos = Array.from(new Set(avisosPartes));
    ui.notifications.warn(`Ficha atualizada: ${avisosUnicos.join("; ")}`);
  }

  const actorData = {
    name: data.name ?? "Personagem Importado",
    type: data.type ?? "character",
    img: data.img,
    system: data.system ?? {},
    items,
    flags: {
      "mighty-blade": {
        ...(data.slug ? { slug: data.slug } : {}),
        schemaVersion: data.schemaVersion ?? null,
      },
    },
  };

  MightyBladeActor._suppressConcessoes = true;
  try {
    const actor = await Actor.create(actorData);
    ui.notifications.info(`Ficha "${actor.name}" importada (${items.length} itens).`);
    return actor;
  } catch (err) {
    console.error("MIGHTY BLADE | Erro ao importar ficha:", err);
    ui.notifications.error(`Falha ao importar ficha: ${err.message}`);
    return null;
  } finally {
    MightyBladeActor._suppressConcessoes = false;
  }
}

/**
 * Importa a partir de um texto JSON (cola ou conteúdo de arquivo).
 * @param {string} json
 * @returns {Promise<Actor|null>}
 */
export async function importCharacterFromJSON(json) {
  let data;
  try {
    data = JSON.parse(json);
  } catch (err) {
    ui.notifications.error("JSON inválido: não foi possível interpretar o texto.");
    return null;
  }
  return importCharacter(data);
}

/**
 * Abre um diálogo para importar uma ficha: escolher um arquivo .json OU colar o
 * texto. Usado pelo botão "Importar Ficha" na aba de Atores.
 * @returns {Promise<Actor|null>}
 */
export async function openImportDialog() {
  const content = `
    <div style="display:flex;flex-direction:column;gap:8px;">
      <p style="margin:0;">Selecione um arquivo <b>.json</b> do gerador de fichas, ou cole o conteúdo abaixo.</p>
      <input type="file" name="file" accept="application/json,.json">
      <textarea name="json" rows="8" placeholder="…ou cole o JSON da ficha aqui" style="width:100%;font-family:monospace;"></textarea>
    </div>`;

  return foundry.applications.api.DialogV2.wait({
    window: { title: "Importar Ficha (Mighty Blade)" },
    content,
    rejectClose: false,
    buttons: [
      {
        action: "import",
        label: "Importar",
        icon: "fas fa-file-import",
        default: true,
        callback: async (event, button, dialog) => {
          const root = button?.form ?? dialog?.element ?? button.closest("form, dialog");
          const file = root?.querySelector('[name="file"]')?.files?.[0];
          let text = root?.querySelector('[name="json"]')?.value?.trim();
          if (file) text = await file.text();
          if (!text) {
            ui.notifications.warn("Nenhum JSON fornecido.");
            return null;
          }
          return importCharacterFromJSON(text);
        },
      },
      { action: "cancel", label: "Cancelar", icon: "fas fa-times" },
    ],
  });
}
