/* Melhorar Mensagem — configuração inicial (primeiro uso) */

const api = globalThis.browser ?? globalThis.chrome ?? criarApiDemo();

/* Modo demonstração: quando as páginas são abertas direto no navegador (sem
   extensão), o armazenamento e a IA interna são emulados. Assim dá para testar
   visualmente o layout e capturar prints de documentação. */
function criarApiDemo() {
  globalThis.LanguageModel = {
    availability: async () => "available",
    params: async () => ({ defaultTopK: 3, defaultTemperature: 1, maxTemperature: 2 }),
    create: async () => ({ prompt: async () => "ok", destroy() {} }),
  };
  return {
    storage: {
      local: {
        get: async (padroes) => ({ ...padroes }),
        set: async () => {},
      },
    },
    runtime: { openOptionsPage() {} },
    tabs: { create() {}, remove() {}, query: async () => [] },
  };
}

const CARD = {
  groq: { titulo: "Groq", chaveUrl: "https://console.groq.com/keys", baseUrl: "https://api.groq.com/openai/v1", model: "llama-3.3-70b-versatile" },
  openai: { titulo: "OpenAI", chaveUrl: "https://platform.openai.com/api-keys", baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" },
  openrouter: { titulo: "OpenRouter", chaveUrl: "https://openrouter.ai/keys", baseUrl: "https://openrouter.ai/api/v1", model: "openai/gpt-4o-mini" },
};

const passo0 = document.getElementById("passo0");
const passoNavegador = document.getElementById("passoNavegador");
const passoChave = document.getElementById("passoChave");
const passoFim = document.getElementById("passoFim");

const obStatus = document.getElementById("obStatus");
const navTexto = document.getElementById("navTexto");
const navBaixar = document.getElementById("navBaixar");
const navProgresso = document.getElementById("navProgresso");
const chaveInput = document.getElementById("chaveInput");
const chaveTitulo = document.getElementById("chaveTitulo");
const chaveLink = document.getElementById("chaveLink");
const chaveContinuar = document.getElementById("chaveContinuar");
const chaveVoltar = document.getElementById("chaveVoltar");
const fimFechamento = document.getElementById("fimFechar");

let provedorEscolhido = "navegador";
let prontoNavegador = false;

function setStatus(msg, tipo = "ok") {
  obStatus.textContent = msg;
  obStatus.className = "status " + (tipo === "ok" ? "ok" : tipo);
}

function mostrar(elemento) {
  for (const p of [passo0, passoNavegador, passoChave, passoFim]) {
    if (p === elemento) p.hidden = false;
    else p.hidden = true;
  }
}

/* ------------------------------------------------------------------ */
/* Escolha na tela inicial                                             */
/* ------------------------------------------------------------------ */

for (const card of document.querySelectorAll(".card")) {
  card.addEventListener("click", () => escolher(card.dataset.provedor));
}

function escolher(provedor) {
  if (provedor === "outros") {
    api.runtime.openOptionsPage();
    return;
  }
  provedorEscolhido = provedor;
  if (provedor === "navegador") prepararNavegador();
  else prepararChave(provedor);
}

/* ------------------------------------------------------------------ */
/* Fluxo: IA do navegador                                              */
/* ------------------------------------------------------------------ */

function languageModel() {
  return typeof LanguageModel !== "undefined" ? LanguageModel : null;
}

async function prepararNavegador() {
  mostrar(passoNavegador);
  setStatus("");
  const es = languageModel();

  if (!es) {
    navTexto.textContent =
      "❌ Este navegador não tem a API de IA integrada (requer Chrome 138+). Escolha o Groq gratuito na lista anterior.";
    marcardCardGroq();
    return;
  }
  const estado = await es.availability();
  if (estado === "available") {
    navTexto.textContent = "✅ Modelo local pronto.";
    prontoNavegador = true;
    await salvarEConcluir();
  } else if (estado === "downloadable") {
    navTexto.textContent = "O modelo (≈ 2 GB) precisa ser baixado no seu computador. Uma vez só; depois funciona offline.";
    navBaixar.hidden = false;
  } else if (estado === "downloading") {
    navTexto.textContent = "O Chrome já está baixando o modelo — aguarde alguns minutos e recarregue a extensão.";
  } else {
    navTexto.textContent =
      "❌ Este PC não atende os requisitos da IA local (22 GB livres e 16 GB de RAM ou GPU de 4+ GB). Recomendo o Groq gratuito ao lado.";
    navBaixar.hidden = true;
    marcardCardGroq();
  }
}

async function salvarEConcluir() {
  await api.storage.local.set({
    provider: "navegador",
    apiKey: "",
    model: "",
    baseUrl: "",
    temperature: 0.3,
    setupDone: true,
  });
  mostrar(passoFim);
}

function marcardCardGroq() {
  const card = document.querySelector('[data-provedor="groq"]');
  if (card) card.classList.add("ja");
}

navBaixar.addEventListener("click", async () => {
  const es = languageModel();
  if (!es) return;
  navBaixar.disabled = true;
  try {
    const sessao = await es.create({
      monitor(m) {
        m.addEventListener("downloadprogress", (e) => {
          navProgresso.textContent = "Baixando: " + Math.round(e.loaded * 100) + "%";
        });
      },
    });
    sessao.destroy();
    prontoNavegador = true;
    navProgresso.textContent = "";
    await salvarEConcluir();
  } catch (err) {
    setStatus("❌ Falha ao baixar o modelo: " + String(err?.message || err), "erro");
  } finally {
    navBaixar.disabled = false;
  }
});

/* ------------------------------------------------------------------ */
/* Fluxo: provedores com chave                                         */
/* ------------------------------------------------------------------ */

function prepararChave(provedor) {
  mostrar(passoChave);
  setStatus("");
  const info = CARD[provedor];
  chaveTitulo.textContent = "🔑 " + info.titulo;
  chaveLink.textContent = "Crie sua chave gratuita aqui: " + info.chaveUrl;
  chaveContinuar.dataset.provedor = provedor;
  chaveInput.value = "";
  chaveInput.focus();
}

chaveVoltar.addEventListener("click", () => mostrar(passo0));

chaveContinuar.addEventListener("click", async () => {
  const provedor = chaveContinuar.dataset.provedor;
  const chave = chaveInput.value.trim();
  if (!chave) {
    setStatus("❌ Cole a chave da API para continuar.", "erro");
    chaveInput.focus();
    return;
  }
  const info = CARD[provedor];
  chaveContinuar.disabled = true;
  setStatus("Testando a chave…");
  try {
    await testarAPI(info, chave);
    await api.storage.local.set({
      provider: provedor,
      apiKey: chave,
      baseUrl: info.baseUrl,
      model: info.model,
      temperature: 0.3,
      setupDone: true,
    });
    setStatus("");
    mostrar(passoFim);
  } catch (err) {
    const msg = String(err?.message || err);
    if (/Failed to fetch|NetworkError|Load failed/i.test(msg)) {
      setStatus("❌ Sem resposta do serviço. Confira a internet e o endereço; se um bloqueador/corporação restritir, desative para este site.", "erro");
    } else {
      setStatus("❌ " + msg, "erro");
    }
  } finally {
    chaveContinuar.disabled = false;
  }
});

async function testarAPI(info, chave) {
  const resposta = await fetch(info.baseUrl.replace(/\/+$/, "") + "/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + chave,
    },
    body: JSON.stringify({
      model: info.model,
      max_tokens: 5,
      messages: [{ role: "user", content: "Diga apenas: ok" }],
    }),
  });
  if (!resposta.ok) {
    const corpo = await resposta.text().catch(() => "");
    if (resposta.status === 401 || resposta.status === 403) throw new Error("Chave inválida ou sem acesso ao modelo.");
    throw new Error("HTTP " + resposta.status + (corpo ? " — " + corpo.slice(0, 140) : ""));
  }
  await resposta.json();
}

/* ------------------------------------------------------------------ */
/* Tela final                                                          */
/* ------------------------------------------------------------------ */

document.getElementById("fimOpcoes").addEventListener("click", () => {
  api.runtime.openOptionsPage();
});

fimFechamento.addEventListener("click", () => {
  api.tabs.query({ active: true, currentWindow: true }).then(([aba]) => {
    if (aba && aba.id != null) api.tabs.remove(aba.id);
  });
});

/* Se já estava configurado (ex.: reabriu esta página), mostra o estado pronto. */
api.storage.local.get({ setupDone: false }).then((cfg) => {
  if (cfg.setupDone) {
    mostrar(passoFim);
    return;
  }
  // Rodapé da tela inicial: sair sem configurar.
  const sair = document.createElement("p");
  sair.className = "ajuda";
  sair.style.marginTop = "18px";
  sair.innerHTML = '<a href="#" id="sairSemConfigurar">Quero configurar depois, com as opções padrão</a>';
  passo0.appendChild(sair);
  sair.querySelector("a").addEventListener("click", async (e) => {
    e.preventDefault();
    // Padrão: IA do navegador (funciona automaticamente nos Chrome compatíveis).
    await api.storage.local.set({ setupDone: true, temperature: 0.3 });
    mostrar(passoFim);
  });
});
