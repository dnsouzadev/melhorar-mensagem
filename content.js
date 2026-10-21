/* Melhorar Mensagem — content script
 *
 * Fluxo completo:
 *   1. O usuário clica com o direito dentro de um campo editável -> guardamos o elemento.
 *   2. O item de menu dispara { type: "melhorar" } -> capturamos a seleção ATUAL do campo.
 *   3. Lemos a configuração do chrome.storage e chamamos uma API compatível com OpenAI.
 *   4. Substituímos o texto selecionado com execCommand('insertText'),
 *      que preserva o histórico de desfazer (Ctrl+Z) do campo.
 *
 * Executa em todos os frames, porque o campo de texto pode estar dentro de um iframe.
 */

const api = globalThis.browser ?? globalThis.chrome;

const PRESETS = {
  openai:     { baseUrl: "https://api.openai.com/v1",      model: "gpt-4o-mini" },
  groq:       { baseUrl: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile" },
  openrouter: { baseUrl: "https://openrouter.ai/api/v1",   model: "openai/gpt-4o-mini" },
  ollama:     { baseUrl: "http://localhost:11434/v1",      model: "llama3.1" },
};

/* Espelho dos padrões de options.js (sem processo de build, ficam duplicados) */
const DEFAULTS = {
  provider: "navegador",
  baseUrl: PRESETS.openai.baseUrl,
  apiKey: "",
  model: PRESETS.openai.model,
  temperature: 0.3,
};

const SYSTEM_PROMPT = [
  "Você é um revisor de mensagens que o usuário vai enviar para outra pessoa (cliente, colega etc.).",
  "Reescreva o texto recebido assim:",
  "1. Corrija ortografia, gramática e pontuação.",
  "2. Deixe a mensagem clara, direta e profissional, removendo gírias e redundâncias.",
  "3. Mantenha exatamente o sentido original, bem como nomes próprios, números, links e códigos.",
  "4. Responda no mesmo idioma do texto original.",
  "5. Devolva SOMENTE o texto final: sem aspas, sem comentários, sem explicações.",
].join(" ");

/* ------------------------------------------------------------------ */
/* Captura do campo sob o menu de contexto                             */
/* ------------------------------------------------------------------ */

let lastEditable = null;

document.addEventListener(
  "contextmenu",
  (e) => {
    if (isEditable(e.target)) lastEditable = e.target;
  },
  true
);

function isEditable(el) {
  if (!el) return false;
  if (el.isContentEditable) return true;
  const tag = (el.tagName || "").toLowerCase();
  if (tag === "textarea") return true;
  if (tag === "input") {
    const t = (el.type || "text").toLowerCase();
    const ignorados = ["button", "submit", "reset", "checkbox", "radio", "file", "color", "range", "image", "hidden"];
    return !ignorados.includes(t) && !el.disabled && !el.readOnly;
  }
  return false;
}

api.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === "melhorar") melhorar();
});

/* ------------------------------------------------------------------ */
/* Orquestração                                                        */
/* ------------------------------------------------------------------ */

async function melhorar() {
  const selecao = capturarSelecao();
  if (!selecao) {
    toast("Selecione um texto dentro do campo antes de melhorar.", "erro");
    return;
  }

  toast("Melhorando…", "processo", 45000);
  try {
    const cfg = await config();
    const melhorado =
      cfg.provider === "navegador"
        ? await iaNavegador(selecao.texto, cfg.temperature)
        : await chamarIA(cfg, selecao.texto);
    aplicar(selecao, melhorado);
    toast("✅ Mensagem melhorada (Ctrl+Z desfaz)", "ok");
  } catch (err) {
    console.error("[melhorar-mensagem]", err);
    toast(msgErro(err), "erro", 6000);
  }
}

function capturarSelecao() {
  const el = lastEditable;
  if (!el || !el.isConnected || !isEditable(el)) return null;

  if (el.isContentEditable) {
    const s = window.getSelection();
    if (!s || s.rangeCount === 0 || s.isCollapsed) return null;
    const texto = s.toString().replace(/\r\n/g, "\n");
    if (!texto.trim()) return null;
    const range = s.getRangeAt(0).cloneRange();
    el.focus({ preventScroll: true });
    return { tipo: "editavel", el, range, texto };
  }

  const ini = el.selectionStart;
  const fim = el.selectionEnd;
  if (ini == null || ini === fim) return null;
  const texto = el.value.slice(ini, fim);
  if (!texto.trim()) return null;
  el.focus({ preventScroll: true });
  return { tipo: "campo", el, ini, fim, texto };
}

async function config() {
  const dados = await api.storage.local.get({
    provider: DEFAULTS.provider,
    baseUrl: "",
    apiKey: "",
    model: "",
    temperature: DEFAULTS.temperature,
  });
  // O preset só atua como fallback se o usuário não salvou valores próprios.
  const preset = PRESETS[dados.provider];
  if (preset && !dados.baseUrl) dados.baseUrl = preset.baseUrl;
  if (preset && !dados.model) dados.model = preset.model;
  return dados;
}

/* ------------------------------------------------------------------ */
/* IA do navegador (Chrome 138+: modelo Gemini Nano baixado no PC)     */
/* ------------------------------------------------------------------ */

async function iaNavegador(texto, temperatura) {
  // A API Prompt pode não estar exposta no content script dependendo da
  // versão do Chrome; nesse caso delegamos ao service worker da extensão.
  if (typeof LanguageModel !== "undefined") return promptLocal(texto, temperatura);

  const resp = await api.runtime.sendMessage({
    type: "navegador-prompt",
    texto,
    temperature: Number(temperatura) || 0.3,
  });
  if (!resp || !resp.ok) {
    throw new Error((resp && resp.erro) || "IA do navegador indisponível neste contexto.");
  }
  return resp.texto;
}

async function promptLocal(texto, temperatura) {
  const estado = await LanguageModel.availability();
  if (estado === "unavailable") {
    throw new Error(
      "IA do navegador indisponível neste dispositivo (requer Chrome 138+ e hardware compatível)."
    );
  }
  if (estado === "downloadable" || estado === "downloading") {
    throw new Error("O modelo local ainda não está pronto — abra as Opções da extensão e clique em “Baixar modelo”.");
  }

  // Em extensões, temperatura tem que ir junto com topK (ou nenhum dos dois).
  let params = null;
  try { params = await LanguageModel.params(); } catch { /* segue sem ajuste */ }

  let opcoes = { initialPrompts: [{ role: "system", content: SYSTEM_PROMPT }] };
  if (params) {
    opcoes.topK = params.defaultTopK;
    opcoes.temperature = Math.min(
      params.defaultTemperature * (0.5 + (Number(temperatura) || 0.3)),
      params.maxTemperature
    );
  }

  let sessao;
  try {
    sessao = await LanguageModel.create(opcoes);
  } catch {
    sessao = await LanguageModel.create({ initialPrompts: opcoes.initialPrompts });
  }
  const saida = await sessao.prompt(texto);
  sessao.destroy();
  return limparResposta(saida);
}

/* ------------------------------------------------------------------ */
/* Chamada à API (formato OpenAI /chat/completions)                    */
/* ------------------------------------------------------------------ */

class ErroAPI extends Error {
  constructor(status, detalhe) {
    super("A API respondeu " + status);
    this.status = status;
    this.detalhe = detalhe || "";
  }
}

async function chamarIA(cfg, texto) {
  if (!cfg.baseUrl) throw new Error("Configure o provedor de IA nas opções da extensão.");
  const url = cfg.baseUrl.replace(/\/+$/, "") + "/chat/completions";

  const cab = { "Content-Type": "application/json" };
  if (cfg.apiKey) cab.Authorization = "Bearer " + cfg.apiKey;
  if (cfg.provider === "openrouter") {
    // Metadados opcionais do OpenRouter (rankings da plataforma).
    cab["HTTP-Referer"] = "https://github.com/melhorar-mensagem";
    cab["X-Title"] = "Melhorar Mensagem";
  }

  const ctrl = new AbortController();
  const tempo = setTimeout(() => ctrl.abort(), 45000);
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: cab,
      body: JSON.stringify({
        model: cfg.model,
        temperature: Number(cfg.temperature) || 0.3,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: texto },
        ],
      }),
      signal: ctrl.signal,
    });
    if (!resp.ok) {
      const detalhe = await resp.text().catch(() => "");
      throw new ErroAPI(resp.status, detalhe);
    }
    const dados = await resp.json();
    const saida = dados && dados.choices && dados.choices[0] && dados.choices[0].message && dados.choices[0].message.content;
    if (typeof saida !== "string" || !saida.trim()) {
      throw new Error("Resposta inesperada da API: " + JSON.stringify(dados).slice(0, 160));
    }
    return limparResposta(saida);
  } finally {
    clearTimeout(tempo);
  }
}

function limparResposta(txt) {
  let s = String(txt).trim();
  // Remove cercas de código se o modelo responder com markdown.
  s = s.replace(/^```(?:[a-zA-Z]*)\n?/, "").replace(/```$/, "").trim();
  // Remove aspas idênticas de abertura/fechamento que envolvem o texto todo.
  const pares = { '"': '"', "'": "'", "“": "”", "‘": "’" };
  if (s.length >= 2 && pares[s[0]] === s[s.length - 1]) s = s.slice(1, -1).trim();
  s = s.replace(/\n{3,}/g, "\n\n"); // colapsa linhas vazias em excesso
  return s;
}

/* ------------------------------------------------------------------ */
/* Substituição da seleção (preserva Ctrl+Z)                           */
/* ------------------------------------------------------------------ */

function aplicar(selecao, texto) {
  if (!texto) throw new Error("A IA devolveu um texto vazio.");

  if (selecao.tipo === "campo") {
    const el = selecao.el;
    el.focus({ preventScroll: true });
    el.setSelectionRange(selecao.ini, selecao.fim);
    let ok = false;
    try { ok = document.execCommand("insertText", false, texto); } catch { ok = false; }
    if (!ok) {
      // Fallback (raro): reescreve o valor e dispara eventos para frameworks
      // tipo React, que só reagem ao setter nativo.
      const valor = el.value.slice(0, selecao.ini) + texto + el.value.slice(selecao.fim);
      setValor(el, valor);
      const fimNovo = selecao.ini + texto.length;
      el.setSelectionRange(fimNovo, fimNovo);
    }
    return;
  }

  selecao.el.focus({ preventScroll: true });
  const s = window.getSelection();
  s.removeAllRanges();
  s.addRange(selecao.range);
  let ok = false;
  try { ok = document.execCommand("insertText", false, texto); } catch { ok = false; }
  if (!ok) {
    // Fallback: manipula a árvore direto (perde o Ctrl+Z, mas funciona).
    selecao.range.deleteContents();
    selecao.range.insertNode(document.createTextNode(texto));
  }
}

function setValor(el, valor) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const desc = Object.getOwnPropertyDescriptor(proto, "value");
  if (desc && desc.set) desc.set.call(el, valor);
  else el.value = valor;
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

/* ------------------------------------------------------------------ */
/* Toast de feedback (isolado via Shadow DOM para não herdar CSS)      */
/* ------------------------------------------------------------------ */

function toast(msg, tipo = "ok", duracao = 2600) {
  const host = document.createElement("div");
  host.style.cssText =
    "all:initial;position:fixed;z-index:2147483647;left:50%;bottom:28px;transform:translateX(-50%);";
  const shadow = host.attachShadow({ mode: "open" });
  const cor = tipo === "erro" ? "#7f1d1d" : tipo === "processo" ? "#1e293b" : "#111827";
  shadow.innerHTML = `
    <style>
      .pill { background:${cor};color:#fff;font:14px/1.4 system-ui,sans-serif;padding:10px 16px;
              border-radius:999px;box-shadow:0 8px 30px rgba(0,0,0,.35);
              max-width:70vw;opacity:0;transition:opacity .18s ease;pointer-events:none;
              white-space:pre-wrap;text-align:center }
      .ok { opacity:1 }
    </style>
    <div class="pill">${escapeHtml(msg)}</div>`;
  document.documentElement.appendChild(host);
  const pill = shadow.querySelector(".pill");
  requestAnimationFrame(() => pill.classList.add("ok"));

  let removido = false;
  let timer = duracao > 0 ? setTimeout(fechar, duracao) : null;
  function fechar() {
    if (removido) return;
    removido = true;
    if (timer) clearTimeout(timer);
    pill.classList.remove("ok");
    setTimeout(() => host.remove(), 200);
  }
  // O retorno permite atualizar o mesmo toast (ex.: "Melhorando…" -> resultado).
  return {
    fim: (novoMsg, novoTipo = "ok", novoDur = 2600) => {
      if (timer) clearTimeout(timer);
      pill.textContent = novoMsg;
      if (novoTipo === "erro") pill.style.background = "#7f1d1d";
      else if (novoTipo !== "processo") pill.style.background = "#111827";
      pill.classList.add("ok");
      timer = setTimeout(fechar, novoDur);
    },
  };
}

function escapeHtml(t) {
  return String(t).replace(/[&<>"']/g, (c) =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c])
  );
}

/* ------------------------------------------------------------------ */
/* Mensagens de erro amigáveis                                         */
/* ------------------------------------------------------------------ */

function msgErro(err) {
  if (err instanceof ErroAPI) {
    switch (err.status) {
      case 401:
      case 403:
        return "Chave de API inválida ou ausente — confira nas opções da extensão.";
      case 404:
        return "Modelo ou endereço da API não encontrado — confira as opções da extensão.";
      case 429:
        return "Limite de uso da API atingido — tente novamente em instantes.";
      default:
        return err.detalhe
          ? "A API respondeu " + err.status + ": " + String(err.detalhe).slice(0, 120)
          : "A API respondeu " + err.status + ".";
    }
  }
  if (err && err.name === "AbortError") return "A IA demorou demais e a solicitação foi cancelada.";
  const msg = String((err && err.message) || err);
  if (/Failed to fetch|NetworkError|Load failed/i.test(msg)) {
    return "Não foi possível conectar à API — verifique a internet e o provedor nas opções. (Ollama local precisa permitir a origem da extensão.)";
  }
  return msg.slice(0, 140);
}
