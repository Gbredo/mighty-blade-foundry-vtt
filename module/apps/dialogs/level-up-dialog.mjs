import { CANONICAL_CLASSES } from "../../helpers/config.mjs";
import { NIVEIS_COM_AUMENTO_ATRIBUTO } from "../../helpers/progressao.mjs";

/**
 * Diálogo interativo para evolução de nível no Mighty Blade 3e.
 * Respeita as regras canônicas de avanço e isola a interface
 * com visual dark obsidian integrado ao Foundry VTT.
 */
export class LevelUpDialog {
  /**
   * Exibe o diálogo de evolução para o ator informado.
   * @param {Actor} actor
   * @returns {Promise<void>}
   */
  static async show(actor) {
    if (!actor) return;

    const currentLevel = Number(actor.system?.details?.nivel) || 1;
    const nextLevel = currentLevel + 1;
    const isAttributeLevel = NIVEIS_COM_AUMENTO_ATRIBUTO.includes(nextLevel);
    const currentAprendiz = actor.system?.details?.aprendiz?.trim();
    const hasAprendiz = Boolean(currentAprendiz);

    // Regra Canônica: Aprendiz só pode surgir a partir do nível 2 E não pode acumular mais de 1
    const canChooseAprendiz = !hasAprendiz && nextLevel >= 2;

    const currentClass = actor.items.find((i) => i.type === "classe")?.name || "";
    const availableClasses = CANONICAL_CLASSES.filter(
      (c) => c.toLowerCase() !== currentClass.toLowerCase()
    );

    const classOptions = availableClasses
      .map((c) => `<option value="${c}">${c}</option>`)
      .join("");

    const isFirstTimeAprendiz = canChooseAprendiz && nextLevel === 2;

    const content = `
      <form class="mb-level-up-form">
        <div class="level-up-header">
          <h2 class="level-up-title">
            <i class="fas fa-crown"></i> Evolução para o Nível ${nextLevel}
          </h2>
          <p class="level-up-subtitle">
            Escolha o benefício canônico de avanço do seu herói:
          </p>
          ${
            hasAprendiz
              ? `<div class="aprendiz-locked-banner">
                  <i class="fas fa-graduation-cap"></i> Especialização: <strong>Aprendiz de ${currentAprendiz}</strong> (Benefício de classe único).
                </div>`
              : ""
          }
        </div>

        <div class="benefit-cards-list">
          ${
            canChooseAprendiz
              ? `<label class="benefit-card card-aprendiz">
                  <input type="radio" name="benefit" value="aprendiz" ${isFirstTimeAprendiz ? "checked" : ""} />
                  <div class="benefit-content">
                    <div class="benefit-name">
                      <i class="fas fa-graduation-cap"></i> Aprendiz de Classe
                    </div>
                    <div class="benefit-desc">
                      Torne-se Aprendiz de uma classe secundária para obter sua habilidade automática (não soma atributos adicionais).
                    </div>
                    <div class="aprendiz-select-box">
                      <label><i class="fas fa-shield-halved"></i> Classe Secundária:</label>
                      <select name="aprendizClass">
                        ${classOptions}
                      </select>
                    </div>
                  </div>
                </label>`
              : ""
          }

          <label class="benefit-card card-vida">
            <input type="radio" name="benefit" value="vida" ${!isFirstTimeAprendiz ? "checked" : ""} />
            <div class="benefit-content">
              <div class="benefit-name">
                <i class="fas fa-heart"></i> +10 Pontos de Vida (PV Máximo)
              </div>
              <div class="benefit-desc">
                Aumenta sua Vida Máxima e Vida Atual em 10 pontos.
              </div>
            </div>
          </label>

          <label class="benefit-card card-mana">
            <input type="radio" name="benefit" value="mana" />
            <div class="benefit-content">
              <div class="benefit-name">
                <i class="fas fa-bolt"></i> +10 Pontos de Mana (PM Máximo)
              </div>
              <div class="benefit-desc">
                Aumenta sua Mana Máxima e Mana Atual em 10 pontos.
              </div>
            </div>
          </label>

          <label class="benefit-card card-misto">
            <input type="radio" name="benefit" value="misto" />
            <div class="benefit-content">
              <div class="benefit-name">
                <i class="fas fa-shield-heart"></i> +5 PV e +5 PM Máximos
              </div>
              <div class="benefit-desc">
                Aumenta equilibradamente tanto a Vida Máxima quanto a Mana Máxima em 5 pontos.
              </div>
            </div>
          </label>

          <label class="benefit-card card-nenhum">
            <input type="radio" name="benefit" value="nenhum" />
            <div class="benefit-content">
              <div class="benefit-name">
                <i class="fas fa-arrow-up"></i> Apenas Subir de Nível
              </div>
              <div class="benefit-desc">
                Aumenta apenas o número do nível sem aplicar modificadores de recursos.
              </div>
            </div>
          </label>
        </div>

        ${
          isAttributeLevel
            ? `<div class="attribute-increase-section" style="margin-top: 14px; padding: 12px; background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(251, 191, 36, 0.4); border-radius: 8px;">
                <div style="font-weight: bold; color: #fbbf24; margin-bottom: 4px; font-size: 0.92rem; display: flex; align-items: center; gap: 6px;">
                  <i class="fas fa-sparkles"></i> Aumento de Atributos do Nível ${nextLevel} (Regra Canônica)
                </div>
                <p style="font-size: 0.8rem; color: #cbd5e1; margin-bottom: 10px;">
                  Selecione exatamente <strong>2 atributos diferentes</strong> para receber +1 ponto cada:
                </p>
                <div style="display: flex; gap: 10px;">
                  <div style="flex: 1;">
                    <label style="font-size: 0.75rem; color: #94a3b8; display: block; margin-bottom: 3px;">1º Atributo (+1):</label>
                    <select name="attributeIncrease1" style="width: 100%; height: 32px; background: #0f172a; color: #fff; border: 1px solid #334155; border-radius: 4px; padding: 2px 6px;">
                      <option value="forca" selected>Força</option>
                      <option value="agilidade">Agilidade</option>
                      <option value="inteligencia">Inteligência</option>
                      <option value="vontade">Vontade</option>
                    </select>
                  </div>
                  <div style="flex: 1;">
                    <label style="font-size: 0.75rem; color: #94a3b8; display: block; margin-bottom: 3px;">2º Atributo (+1):</label>
                    <select name="attributeIncrease2" style="width: 100%; height: 32px; background: #0f172a; color: #fff; border: 1px solid #334155; border-radius: 4px; padding: 2px 6px;">
                      <option value="forca">Força</option>
                      <option value="agilidade" selected>Agilidade</option>
                      <option value="inteligencia">Inteligência</option>
                      <option value="vontade">Vontade</option>
                    </select>
                  </div>
                </div>
              </div>`
            : ""
        }
      </form>
    `;

    return new Dialog(
      {
        title: `Evolução: Nível ${nextLevel}`,
        content: content,
        buttons: {
          confirm: {
            icon: '<i class="fas fa-check"></i>',
            label: `Evoluir para Nível ${nextLevel}`,
            callback: async (html) => {
              const benefit = html.find('input[name="benefit"]:checked').val();
              const aprendizClass = html.find('select[name="aprendizClass"]').val();
              let attributeIncreases = null;
              if (isAttributeLevel) {
                const a1 = html.find('select[name="attributeIncrease1"]').val();
                const a2 = html.find('select[name="attributeIncrease2"]').val();
                if (a1 && a2) {
                  if (a1 === a2) {
                    ui.notifications.warn("Selecione dois atributos diferentes para o aumento de nível.");
                    return false;
                  }
                  attributeIncreases = [a1, a2];
                }
              }
              await actor.applyLevelUp({ nextLevel, benefit, aprendizClass, attributeIncreases });
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
        width: 460,
      }
    ).render(true);
  }
}
