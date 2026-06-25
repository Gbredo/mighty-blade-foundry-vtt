/**
 * Sistema de "Concessões" do Mighty Blade.
 *
 * Uma raça/classe concede coisas ao ator quando é arrastada para a ficha. Cada
 * concessão tem um `tipo`:
 *   - "habilidade":       concede uma habilidade fixa (por UUID).
 *   - "escolhaAtributo":  o jogador escolhe 1 dos 4 atributos para receber +X
 *                         (ex.: Humano / Adaptabilidade). O bônus fica gravado na
 *                         habilidade concedida em `system.bonusAtributo`.
 *   - "escolhaHabilidade": o jogador escolhe K de N habilidades de uma lista
 *                          (ex.: Dogma do Sacerdote, Pacto do Cultista, etc.).
 *
 * Formato de uma concessão no item de raça/classe (`system.concessoes`):
 *   { tipo: "habilidade",        uuid: "Item.xxxx" }
 *   { tipo: "escolhaAtributo",   uuid: "Item.xxxx", valor: 1 }
 *   { tipo: "escolhaHabilidade", opcoes: ["Item.a","Item.b"], quantidade: 1 }
 */

export const ATRIBUTOS = {
  forca: "Força",
  agilidade: "Agilidade",
  inteligencia: "Inteligência",
  vontade: "Vontade",
};

/**
 * Retorna a lista efetiva de concessões de um item de raça/classe.
 * Se o item não tiver `concessoes`, cai no campo legado `habilidadeUuid`
 * (tratado como uma única concessão de habilidade fixa).
 * @param {Item} item
 * @returns {Array<object>}
 */
export function getConcessoes(item) {
  const list = item.system?.concessoes;
  if (Array.isArray(list) && list.length) return list;
  if (item.system?.habilidadeUuid) {
    return [{ tipo: "habilidade", uuid: item.system.habilidadeUuid }];
  }
  return [];
}

/**
 * Diálogo: escolher 1 atributo que receberá um bônus.
 * @param {object} [opts]
 * @param {string} [opts.titulo]
 * @param {number} [opts.valor]
 * @returns {Promise<string|null>} chave do atributo ("forca"…) ou null se cancelado.
 */
export async function escolherAtributo({ titulo = "Concessão", valor = 1 } = {}) {
  const options = Object.entries(ATRIBUTOS)
    .map(([k, v]) => `<option value="${k}">${v}</option>`)
    .join("");
  const content = `
    <div style="display:flex;flex-direction:column;gap:8px;">
      <p style="margin:0;">${titulo}: escolha o atributo que recebe <b>+${valor}</b>.</p>
      <select name="atributo" style="width:100%;">${options}</select>
    </div>`;

  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: `${titulo} — Escolha de Atributo` },
    content,
    rejectClose: false,
    buttons: [
      {
        action: "ok",
        label: "Confirmar",
        icon: "fas fa-check",
        default: true,
        callback: (event, button, dialog) => {
          const root = button?.form ?? dialog?.element ?? button.closest("form, dialog");
          return root?.querySelector('[name="atributo"]')?.value ?? null;
        },
      },
      { action: "cancel", label: "Cancelar", icon: "fas fa-times" },
    ],
  });

  return typeof result === "string" && ATRIBUTOS[result] ? result : null;
}

/**
 * Diálogo: escolher K de N habilidades.
 * @param {object} opts
 * @param {string} [opts.titulo]
 * @param {Array<{uuid:string,name:string,img:string}>} opts.opcoes
 * @param {number} [opts.quantidade]
 * @returns {Promise<string[]|null>} UUIDs escolhidos, ou null se cancelado.
 */
export async function escolherHabilidades({ titulo = "Concessão", opcoes = [], quantidade = 1, actor = null } = {}) {
  if (!opcoes.length) return null;
  
  let actorHasExclusive = false;
  if (actor) {
    actorHasExclusive = actor.items.some(i => {
      const n = i.name.toLowerCase();
      return n.includes("dogma") || n.includes("pacto") || n.includes("conhecimento místico");
    });
  }

  const inputType = quantidade > 1 ? "checkbox" : "radio";
  const rows = opcoes
    .map((o) => {
      let disabledHtml = "";
      let exclusiveClass = "";
      if (o.isExclusive) {
        exclusiveClass = "exclusive-opt";
        if (actorHasExclusive) {
          disabledHtml = ` disabled title="Bloqueado por exclusividade mútua: Pacto, Dogma e Conhecimento Místico não podem coexistir." `;
        }
      }

      let subHtml = "";
      if (o.subChoices && o.subChoices.length > 0) {
        const subOpts = o.subChoices.map(sub => `<option value="${sub.uuid}">${sub.name}</option>`).join("");
        subHtml = `
          <div class="sub-choice-container" data-parent="${o.uuid}" style="display:none; padding-left: 40px; padding-bottom: 6px;">
            <select class="sub-choice-select" style="width:100%;" disabled>
              ${subOpts}
            </select>
          </div>
        `;
      }

      return `
        <label style="display:flex;gap:8px;align-items:center;padding:6px;border:1px solid #999;border-radius:4px;margin-bottom:4px;cursor:pointer; opacity: ${disabledHtml ? '0.5' : '1'};" ${disabledHtml}>
          <input type="${inputType}" name="opt" value="${o.uuid}" class="main-opt ${exclusiveClass}" ${disabledHtml}>
          <img src="${o.img}" width="28" height="28" style="border:none;flex:0 0 auto;">
          <span style="${disabledHtml ? 'text-decoration:line-through; color:#999;' : ''}">${o.name}</span>
        </label>
        ${subHtml}
      `;
    })
    .join("");

  const content = `
    <div style="display:flex;flex-direction:column;gap:4px;">
      <p style="margin:0 0 6px;">${titulo}: escolha <b>${quantidade}</b>.</p>
      ${rows}
    </div>
    <script>
      (function(){
        const dlg = document.currentScript.closest('.window-content');
        if(!dlg) return;
        const mainOpts = dlg.querySelectorAll('.main-opt');
        const exclusiveOpts = dlg.querySelectorAll('.exclusive-opt');
        
        mainOpts.forEach(opt => {
          opt.addEventListener('change', (e) => {
            const subContainer = dlg.querySelector(\`.sub-choice-container[data-parent="\${opt.value}"]\`);
            if(subContainer) {
              const select = subContainer.querySelector('select');
              if(opt.checked) {
                subContainer.style.display = 'block';
                select.disabled = false;
              } else {
                subContainer.style.display = 'none';
                select.disabled = true;
              }
            }
            
            if(opt.classList.contains('exclusive-opt')) {
               let anyExclusiveChecked = Array.from(exclusiveOpts).some(o => o.checked);
               exclusiveOpts.forEach(o => {
                 if(!o.checked) {
                    if(anyExclusiveChecked) {
                      o.disabled = true;
                      o.closest('label').style.opacity = '0.5';
                      o.closest('label').title = "Bloqueado por exclusividade mútua.";
                    } else {
                      if (!${actorHasExclusive}) {
                        o.disabled = false;
                        o.closest('label').style.opacity = '1';
                        o.closest('label').title = "";
                      }
                    }
                 }
               });
            }
          });
        });
      })();
    </script>
  `;

  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: `${titulo} — Escolha (${quantidade})` },
    content,
    rejectClose: false,
    buttons: [
      {
        action: "ok",
        label: "Confirmar",
        icon: "fas fa-check",
        default: true,
        callback: (event, button, dialog) => {
          const root = button?.form ?? dialog?.element ?? button.closest("form, dialog");
          const checked = Array.from(root?.querySelectorAll('[name="opt"]:checked') ?? []);
          const results = [];
          checked.forEach(el => {
             results.push(el.value);
             const subContainer = root.querySelector(`.sub-choice-container[data-parent="${el.value}"]`);
             if (subContainer) {
                const select = subContainer.querySelector('select');
                if (!select.disabled && select.value) {
                   results.push(select.value);
                }
             }
          });
          return results;
        },
      },
      { action: "cancel", label: "Cancelar", icon: "fas fa-times" },
    ],
  });

  return Array.isArray(result) && result.length ? result : null;
}

/**
 * Resolve uma referência em um Item. Aceita UUID do Foundry OU um slug estável
 * (`flags["mighty-blade"].slug`), buscando nos compêndios de Item do sistema e,
 * por fim, nos itens do mundo.
 * @param {string} ref  UUID ou slug.
 * @returns {Promise<Item|null>}
 */
export async function resolveRef(ref) {
  if (!ref) return null;

  // Tenta como UUID direto (ex.: "Item.xxxx", "Compendium.mighty-blade.racas.Item.xxxx").
  if (ref.includes(".")) {
    const doc = await fromUuid(ref).catch(() => null);
    if (doc) return doc;
  }

  // Busca por slug nos compêndios de Item.
  for (const pack of game.packs) {
    if (pack.documentName !== "Item") continue;
    const index = await pack.getIndex({ fields: ["flags.mighty-blade.slug"] });
    const entry = index.find((e) => foundry.utils.getProperty(e, "flags.mighty-blade.slug") === ref);
    if (entry) return pack.getDocument(entry._id);
  }

  // Fallback: itens do mundo.
  return game.items.find((i) => i.getFlag("mighty-blade", "slug") === ref) ?? null;
}

/**
 * Resolve uma lista de refs (UUID ou slug) em objetos simples para o diálogo.
 * @param {string[]} refs
 * @returns {Promise<Array<{uuid:string,name:string,img:string}>>}
 */
export async function resolveOpcoes(refs = []) {
  const out = [];
  for (const ref of refs) {
    const doc = await resolveRef(ref);
    if (doc) {
      const optionData = { uuid: doc.uuid, name: doc.name, img: doc.img, isExclusive: false, subChoices: null };
      const nameLower = doc.name.toLowerCase();
      if (nameLower.includes("dogma") || nameLower.includes("pacto") || nameLower.includes("conhecimento místico")) {
         optionData.isExclusive = true;
      }
      
      const concessoes = doc.system?.concessoes || [];
      const subChoiceConcessao = concessoes.find(c => c.tipo === "escolhaHabilidade");
      if (subChoiceConcessao) {
         const subOpts = [];
         for (const subRef of subChoiceConcessao.opcoes || []) {
           const subDoc = await resolveRef(subRef);
           if (subDoc) subOpts.push({ uuid: subDoc.uuid, name: subDoc.name });
         }
         optionData.subChoices = subOpts;
      }
      
      out.push(optionData);
    }
  }
  return out;
}
