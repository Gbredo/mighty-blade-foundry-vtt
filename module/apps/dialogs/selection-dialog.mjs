import { CANONICAL_CLASSES, CANONICAL_ANTECEDENTES } from "../../helpers/config.mjs";

/**
 * Diálogos modulares para seleção de detalhes canônicos do personagem.
 * Isola a interface do usuário da folha do ator, delegando as mutações
 * diretamente para a camada de domínio (MightyBladeActor).
 */
export class SelectionDialog {
  /**
   * Abre o diálogo para escolha da classe secundária de Aprendiz.
   * @param {Actor} actor
   * @returns {Promise<void>}
   */
  static async chooseAprendiz(actor) {
    if (!actor) return;

    const currentAprendiz = actor.system?.details?.aprendiz?.trim();
    if (currentAprendiz) {
      ui.notifications.warn(
        `O herói já é Aprendiz de ${currentAprendiz}. As regras do Mighty Blade não permitem acumular múltiplos aprendizes de classe.`
      );
      return;
    }

    const currentLevel = Number(actor.system?.details?.nivel) || 1;
    if (currentLevel < 2) {
      ui.notifications.warn(
        "Um personagem só pode se tornar Aprendiz de Classe a partir do Nível 2 (ou caso possua o antecedente canônico Prodígio)."
      );
      return;
    }

    const currentClass = actor.items.find((i) => i.type === "classe")?.name || "";

    const availableClasses = CANONICAL_CLASSES.filter(
      (c) => c.toLowerCase() !== currentClass.toLowerCase()
    );

    const options = availableClasses
      .map((c) => `<option value="${c}">${c}</option>`)
      .join("");

    return new Dialog(
      {
        title: "Aprendiz de Classe",
        content: `
          <form style="padding: 10px;">
            <p style="font-size: 0.85rem; color: #cbd5e1; margin: 0 0 10px 0;">
              Selecione a classe secundária na qual seu herói é <strong>Aprendiz</strong> (adquire a habilidade automática, sem atributos):
            </p>
            <div style="margin-bottom: 10px;">
              <label style="font-size: 0.78rem; font-weight: 700; color: #38bdf8; display: block; margin-bottom: 4px;">Classe Secundária:</label>
              <select name="aprendiz" style="width: 100%; padding: 5px 8px; border-radius: 4px; background: #0f172a; color: #f1f5f9; border: 1px solid #334155; font-size: 0.85rem;">
                <option value="">— Selecione uma classe —</option>
                ${options}
              </select>
            </div>
          </form>
        `,
        buttons: {
          confirm: {
            icon: '<i class="fas fa-check"></i>',
            label: "Confirmar Aprendiz",
            callback: async (html) => {
              const val = html.find('select[name="aprendiz"]').val();
              if (val) {
                await actor.setAprendiz(val);
              }
            },
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: "Cancelar",
          },
        },
        default: "confirm",
      },
      {
        classes: ["mighty-blade", "dialog", "level-up-dialog-dnd", "mb-sheet-dark"],
        width: 380,
      }
    ).render(true);
  }

  /**
   * Abre o diálogo para escolha canônica ou personalizada de Antecedente.
   * @param {Actor} actor
   * @returns {Promise<void>}
   */
  static async chooseAntecedente(actor) {
    if (!actor) return;

    const currentAntecedente = actor.system?.details?.antecedente || "";

    const options = CANONICAL_ANTECEDENTES
      .map(
        (a) =>
          `<option value="${a.nome}" ${
            a.nome.toLowerCase() === currentAntecedente.toLowerCase() ? "selected" : ""
          }>${a.nome} — ${a.desc}</option>`
      )
      .join("");

    return new Dialog(
      {
        title: "Escolher Antecedente",
        content: `
          <form style="padding: 10px;">
            <p style="font-size: 0.85rem; color: #94a3b8; margin: 0 0 10px 0;">
              Escolha o Antecedente de criação do seu herói ou digite um personalizado:
            </p>
            <div style="margin-bottom: 10px;">
              <label style="font-size: 0.78rem; font-weight: 700; color: #fbbf24; display: block; margin-bottom: 4px;">Antecedente Canônico:</label>
              <select name="antecedenteSelect" id="mb-antecedente-select" style="width: 100%; padding: 5px 8px; border-radius: 4px; background: #0f172a; color: #f1f5f9; border: 1px solid #334155; font-size: 0.85rem;">
                <option value="">— Escolha um antecedente —</option>
                ${options}
                <option value="__custom__">Outro / Personalizado...</option>
              </select>
            </div>
            <div id="mb-custom-antecedente-wrap" style="margin-bottom: 10px; display: none;">
              <label style="font-size: 0.78rem; font-weight: 700; color: #94a3b8; display: block; margin-bottom: 4px;">Nome Personalizado:</label>
              <input type="text" name="customAntecedente" placeholder="Ex: Desertor, Forasteiro..." value="${currentAntecedente}" style="width: 100%; padding: 4px 8px; font-size: 0.85rem;" />
            </div>
          </form>
        `,
        render: (html) => {
          const select = html.find("#mb-antecedente-select");
          const customWrap = html.find("#mb-custom-antecedente-wrap");
          select.on("change", () => {
            if (select.val() === "__custom__") customWrap.slideDown(150);
            else customWrap.slideUp(150);
          });
        },
        buttons: {
          confirm: {
            icon: '<i class="fas fa-check"></i>',
            label: "Confirmar",
            callback: async (html) => {
              const selectVal = html.find('select[name="antecedenteSelect"]').val();
              let chosen = selectVal;
              if (selectVal === "__custom__") {
                chosen = html.find('input[name="customAntecedente"]').val().trim();
              }
              if (chosen) {
                await actor.setAntecedente(chosen);
              }
            },
          },
          clear: {
            icon: '<i class="fas fa-trash"></i>',
            label: "Limpar",
            callback: async () => {
              await actor.setAntecedente("");
            },
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: "Cancelar",
          },
        },
        default: "confirm",
      },
      {
        classes: ["mighty-blade", "dialog", "level-up-dialog-dnd", "mb-sheet-dark"],
        width: 500,
      }
    ).render(true);
  }
}
