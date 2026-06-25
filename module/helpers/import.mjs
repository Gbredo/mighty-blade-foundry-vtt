import { MightyBladeActor } from "../documents/actor.mjs";

/**
 * Importa uma ficha no formato JSON canônico (schemaVersion 1.0) compartilhado
 * com o gerador de fichas. Cria um Actor "character" com os Items embutidos.
 *
 * - Só os campos de ENTRADA são usados (attributes.<a>.base, resources, details,
 *   biography); os derivados são recalculados pelo DataModel.
 * - O `slug` (da raiz e de cada item) vai para flags["mighty-blade"].slug.
 * - As concessões NÃO são reprocessadas: a ficha já vem montada (as habilidades
 *   escolhidas chegam embutidas em items[]).
 *
 * @param {object} data  Objeto JSON canônico já parseado.
 * @returns {Promise<Actor|null>}
 */
export async function importCharacter(data) {
  if (!data || typeof data !== "object") {
    ui.notifications.error("Ficha inválida: JSON não reconhecido.");
    return null;
  }

  const items = (data.items ?? []).map((it) => {
    const flags = { "mighty-blade": {} };
    if (it.slug) flags["mighty-blade"].slug = it.slug;
    return { name: it.name ?? "Item", type: it.type, img: it.img, system: it.system ?? {}, flags };
  });

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
