import { MightyBladeActor } from "../documents/actor.mjs";
import MightyBladeCharacterData from "../data/actor-character.mjs";
import { montarDadosDoActor, exportarParaCanonico, resolverIdHabilidadeAntigaFoundry, bonusRecursosPeloDataModel } from "./ida-e-volta.mjs";

// Mantido para quem já importava daqui (testes, macros).
export { resolverIdHabilidadeAntigaFoundry, montarDadosDoActor, exportarParaCanonico };

/**
 * Importa uma ficha do gerador (JSON canônico do site).
 * Cria um Actor "character" com os Items embutidos. A mochila do site vira Items (arma, armadura,
 * equipamento) e os campos só do site ficam guardados na ficha para voltar no "Exportar para o site".
 *
 * @param {object} rawData  Objeto JSON canônico já parseado.
 * @returns {Promise<Actor|null>}
 */
export async function importCharacter(rawData) {
  if (!rawData || typeof rawData !== "object") {
    ui.notifications.error("Ficha inválida: JSON não reconhecido.");
    return null;
  }

  const { actorData, avisos } = montarDadosDoActor(rawData, {
    bonusRecursos: bonusRecursosPeloDataModel(MightyBladeCharacterData.prototype),
  });

  // Se houver avisos de migração, emite aviso único consolidado
  if (avisos.length > 0) ui.notifications.warn(`Ficha atualizada: ${avisos.join("; ")}`);

  MightyBladeActor._suppressConcessoes = true;
  try {
    const actor = await Actor.create(actorData);
    ui.notifications.info(`Ficha "${actor.name}" importada (${actorData.items.length} itens).`);
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
 * Baixa a ficha do Actor no formato do site (contrato v1.2). No site, "Importar" pergunta se
 * atualiza a ficha de origem (quando o arquivo traz o id dela) ou cria uma cópia.
 * @param {Actor} actor
 * @returns {object|null} a ficha exportada
 */
export function exportarActorParaSite(actor) {
  if (!actor || actor.type !== "character") {
    ui.notifications.warn("Só fichas de personagem podem ir para o site.");
    return null;
  }
  const { ficha, avisos } = exportarParaCanonico(actor);
  const nomeArquivo = `${(actor.name || "Personagem").replace(/\s+/g, "_")}.json`;
  foundry.utils.saveDataToFile(JSON.stringify(ficha, null, 2), "application/json", nomeArquivo);
  if (avisos.length > 0) ui.notifications.warn(`Exportada com avisos: ${avisos.join("; ")}`);
  else ui.notifications.info(`Ficha "${actor.name}" exportada para o site.`);
  return ficha;
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
