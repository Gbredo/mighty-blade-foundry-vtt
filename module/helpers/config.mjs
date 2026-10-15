export const MIGHTY_BLADE = {};

/**
 * O conjunto de Atributos usados no sistema.
 * @type {Object}
 */
MIGHTY_BLADE.atributos = {
  forca: "MB.Forca",
  agilidade: "MB.Agilidade",
  inteligencia: "MB.Inteligencia",
  vontade: "MB.Vontade",
};

/**
 * Tipos de Dano
 */
MIGHTY_BLADE.tiposDano = {
  corte: "MB.Corte",
  perfuracao: "MB.Perfuracao",
  contusao: "MB.Contusão",
  fogo: "MB.Fogo",
  frio: "MB.Frio",
  eletricidade: "MB.Eletricidade",
};

/**
 * 14 Classes Canônicas de Mighty Blade 3e
 * @type {string[]}
 */
MIGHTY_BLADE.canonicalClasses = [
  "Bardo", "Dracomante", "Druida", "Espadachim", "Feiticeiro",
  "Guerreiro", "Ladino", "Necromante", "Paladino", "Patrulheiro",
  "Rúnico", "Sacerdote", "Senescal", "Xamã"
];

/**
 * 26 Antecedentes Canônicos de Mighty Blade 3e
 * @type {Array<{id: string, nome: string, desc: string}>}
 */
MIGHTY_BLADE.canonicalAntecedentes = [
  { id: "apotecario", nome: "Apotecário", desc: "Recebe Herbalismo e 2 poções." },
  { id: "artesao", nome: "Artesão", desc: "+1d6 na área de produção escolhida e instrumentos." },
  { id: "cacador", nome: "Caçador", desc: "+2 em rastrear, forragear, furtividade e percepção." },
  { id: "cartografo", nome: "Cartógrafo", desc: "Recebe Cartografia, bússola e kit." },
  { id: "cozinheiro", nome: "Cozinheiro", desc: "+1d6 no preparo e comida obra-prima cura PV/PM em dobro." },
  { id: "curandeiro", nome: "Curandeiro", desc: "Recebe Médico de Campo e Kit de Cura." },
  { id: "criminoso", nome: "Criminoso", desc: "Recebe Contatos no Crime e cinto oculto." },
  { id: "devoto", nome: "Devoto", desc: "Recebe Dogma e Símbolo Sagrado." },
  { id: "escudeiro", nome: "Escudeiro", desc: "+1 em conhecimento e ataques com arma." },
  { id: "expoente", nome: "Expoente", desc: "Recebe uma Habilidade Racial extra à escolha." },
  { id: "ex-escravo", nome: "Ex-Escravo", desc: "+2 em furtividade/fadiga e Carga com Força +2." },
  { id: "fazendeiro", nome: "Fazendeiro", desc: "+2 em testes com plantas e animais." },
  { id: "fidalgo", nome: "Fidalgo", desc: "+2 em pesquisa, conhecimento, social e +100 moedas." },
  { id: "fylgja", nome: "Fylgja", desc: "Recebe Espírito Animal." },
  { id: "grumete", nome: "Grumete", desc: "+2 em navegação, escalada, natação e equilíbrio." },
  { id: "informante", nome: "Informante", desc: "Recebe Contatos Políticos e itens." },
  { id: "mascate", nome: "Mascate", desc: "Carga com Força +2, +2 contra venenos/doenças e mochila." },
  { id: "medium", nome: "Médium", desc: "Recebe Contato com Espíritos e Orbe de Cristal." },
  { id: "minerador", nome: "Minerador", desc: "+1d6 para veios de minério, picareta e kit." },
  { id: "nobre", nome: "Nobre", desc: "+200 moedas iniciais, terras, renda e status." },
  { id: "poliglota", nome: "Poliglota", desc: "Fala, lê e escreve todos os 15 Idiomas Comuns." },
  { id: "prodigio", nome: "Prodígio", desc: "Começa o jogo com o benefício Aprendiz de Classe." },
  { id: "suburbano", nome: "Suburbano", desc: "Recebe Raça Subterrânea e kit." },
  { id: "sussurrador", nome: "Sussurrador", desc: "Recebe Bênção de Ellenis." },
  { id: "vigilante", nome: "Vigilante", desc: "Duas identidades independentes, +2 em furtividade e Determinação." },
  { id: "zelote", nome: "Zelote", desc: "Recebe Sintonia Dracônica e pingente de escama." },
];

export const CANONICAL_CLASSES = MIGHTY_BLADE.canonicalClasses;
export const CANONICAL_ANTECEDENTES = MIGHTY_BLADE.canonicalAntecedentes;
