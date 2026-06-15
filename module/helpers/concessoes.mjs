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
export async function escolherHabilidades({ titulo = "Concessão", opcoes = [], quantidade = 1 } = {}) {
  if (!opcoes.length) return null;
  const inputType = quantidade > 1 ? "checkbox" : "radio";
  const rows = opcoes
    .map(
      (o) => `
      <label style="display:flex;gap:8px;align-items:center;padding:6px;border:1px solid #999;border-radius:4px;margin-bottom:4px;cursor:pointer;">
        <input type="${inputType}" name="opt" value="${o.uuid}">
        <img src="${o.img}" width="28" height="28" style="border:none;flex:0 0 auto;">
        <span>${o.name}</span>
      </label>`
    )
    .join("");
  const content = `
    <div style="display:flex;flex-direction:column;gap:4px;">
      <p style="margin:0 0 6px;">${titulo}: escolha <b>${quantidade}</b>.</p>
      ${rows}
    </div>`;

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
          return [...(root?.querySelectorAll('[name="opt"]:checked') ?? [])].map((el) => el.value);
        },
      },
      { action: "cancel", label: "Cancelar", icon: "fas fa-times" },
    ],
  });

  return Array.isArray(result) && result.length ? result.slice(0, quantidade) : null;
}

/**
 * Resolve uma lista de UUIDs em objetos simples para exibição no diálogo.
 * @param {string[]} uuids
 * @returns {Promise<Array<{uuid:string,name:string,img:string}>>}
 */
export async function resolveOpcoes(uuids = []) {
  const out = [];
  for (const uuid of uuids) {
    const doc = await fromUuid(uuid);
    if (doc) out.push({ uuid, name: doc.name, img: doc.img });
  }
  return out;
}
