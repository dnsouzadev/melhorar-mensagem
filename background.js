/* Melhorar Mensagem — processos de fundo (service worker no Chrome, script no Firefox)
 *
 * Responsabilidades:
 *   1. Criar o item "✨ Melhorar mensagem" no menu de contexto de campos editáveis.
 *   2. Ao clicar, avisar o content script da aba (todo o resto acontece lá).
 */

const api = globalThis.browser ?? globalThis.chrome;

const ID_MENU = "melhorar-mensagem";

api.runtime.onInstalled.addListener((detalhes) => {
  criarMenus();
  if (detalhes && detalhes.reason === "install") abrirConfiguracaoInicial();
});

async function abrirConfiguracaoInicial() {
  const { setupDone } = await api.storage.local.get({ setupDone: false });
  if (setupDone) return;
  api.tabs.create({ url: api.runtime.getURL("onboarding.html") });
}
if (api.runtime.onStartup) api.runtime.onStartup.addListener(criarMenus);

function criarMenus() {
  // removeAll antes de recriar evita erro de ID duplicado ao recarregar a extensão.
  api.contextMenus.removeAll(() => {
    api.contextMenus.create({
      id: ID_MENU,
      title: "✨ Melhorar mensagem",
      contexts: ["editable"],
    });
  });
}

api.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== ID_MENU || !tab || tab.id == null) return;
  // Content scripts rodam em todos os frames; o frame que tem a seleção responde.
  api.tabs.sendMessage(tab.id, { type: "melhorar" }, () => {
    // Sem o void, o Chrome reclama de lastError não verificado quando a aba
    // não tem content script (ex.: páginas internas). Sem ação necessária.
    void api.runtime.lastError;
  });
});

/* ------------------------------------------------------------------ */
/* IA do navegador (Chrome 138+: Prompt API com Gemini Nano local)     */
/* ------------------------------------------------------------------ */

/* Espelho de SYSTEM_PROMPT do content.js (sem processo de build, ficam duplicados). */
const SYSTEM_PROMPT = [
  "Você é um revisor de mensagens que o usuário vai enviar para outra pessoa (cliente, colega etc.).",
  "Reescreva o texto recebido assim:",
  "1. Corrija ortografia, gramática e pontuação.",
  "2. Deixe a mensagem clara, direta e profissional, removendo gírias e redundâncias.",
  "3. Mantenha exatamente o sentido original, bem como nomes próprios, números, links e códigos.",
  "4. Responda no mesmo idioma do texto original.",
  "5. Devolva SOMENTE o texto final: sem aspas, sem comentários, sem explicações.",
].join(" ");

let sessaoIA = null;

api.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "navegador-prompt") {
    iaNavegador(msg.texto, msg.temperature).then(
      (texto) => sendResponse({ ok: true, texto }),
      (err) => sendResponse({ ok: false, erro: String((err && err.message) || err) })
    );
    return true; // resposta chega depois (enviada assincronamente)
  }
});

async function iaNavegador(texto, temperatura = 0.3) {
  if (typeof LanguageModel === "undefined") {
    throw new Error("IA do navegador indisponível (requer Chrome 138 ou superior).");
  }
  const estado = await LanguageModel.availability();
  if (estado === "unavailable") {
    throw new Error(
      "IA do navegador não disponível neste dispositivo (confira os requisitos: Chrome 138+, 16 GB de RAM ou GPU de 4 GB, 22 GB livres)."
    );
  }
  if (estado === "downloadable" || estado === "downloading") {
    throw new Error("O modelo local ainda não está pronto — abra as Opções da extensão e clique em “Baixar modelo”.");
  }

  // Em extensões, temperatura tem que ir junto com topK (ou nenhum dos dois).
  let params = null;
  try { params = await LanguageModel.params(); } catch { /* segue sem ajuste */ }

  const base = { initialPrompts: [{ role: "system", content: SYSTEM_PROMPT }] };
  let opcoes = base;
  if (params) {
    opcoes = {
      ...base,
      topK: params.defaultTopK,
      temperature: Math.min(
        params.defaultTemperature * (0.5 + (Number(temperatura) || 0.3)),
        params.maxTemperature
      ),
    };
  }

  if (!sessaoIA) {
    try { sessaoIA = await LanguageModel.create(opcoes); }
    catch { sessaoIA = await LanguageModel.create(base); }
  }
  try {
    return limparResposta(await sessaoIA.prompt(texto));
  } catch {
    // A sessão pode ter sido descartada pelo navegador; recria e tenta 1 vez.
    destruirSessao();
    sessaoIA = await LanguageModel.create(base);
    return limparResposta(await sessaoIA.prompt(texto));
  }
}

function destruirSessao() {
  try { sessaoIA && sessaoIA.destroy(); } catch { /* ignora */ }
  sessaoIA = null;
}

/* Espelho de limparResposta do content.js. */
function limparResposta(txt) {
  let s = String(txt).trim();
  s = s.replace(/^```(?:[a-zA-Z]*)\n?/, "").replace(/```$/, "").trim();
  return s;
}
