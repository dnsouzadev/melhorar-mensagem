/* Melhorar Mensagem — página de opções */

const api = globalThis.browser ?? globalThis.chrome;

const PRESETS = {
  navegador: {}, // IA nativa: sem endpoint, modelo ou chave
  openai: {
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
    chaveUrl: "https://platform.openai.com/api-keys",
  },
  groq: {
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
    chaveUrl: "https://console.groq.com/keys",
  },
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1",
    model: "openai/gpt-4o-mini",
    chaveUrl: "https://openrouter.ai/keys",
  },
  ollama: {
    baseUrl: "http://localhost:11434/v1",
    model: "llama3.1",
    chaveUrl: "https://ollama.com",
  },
  custom: { chaveUrl: "" },
};

const els = {
  provider: document.getElementById("provider"),
  apiKey: document.getElementById("apiKey"),
  model: document.getElementById("model"),
  baseUrl: document.getElementById("baseUrl"),
  temperature: document.getElementById("temperature"),
  tempValor: document.getElementById("tempValor"),
  dicaChave: document.getElementById("dicaChave"),
  salvar: document.getElementById("salvar"),
  testar: document.getElementById("testar"),
  status: document.getElementById("status"),
  campoNavegador: document.getElementById("campoNavegador"),
  iaStatus: document.getElementById("iaStatus"),
  iaProgresso: document.getElementById("iaProgresso"),
  baixarModelo: document.getElementById("baixarModelo"),
  avancado: document.querySelector("details"),
};

function provedorAtual() {
  return els.provider.value;
}

function eNavegador() {
  return provedorAtual() === "navegador";
}

function languageModel() {
  return typeof LanguageModel !== "undefined" ? LanguageModel : null;
}

function setStatus(msg, tipo = "ok") {
  els.status.textContent = msg;
  els.status.className = tipo;
}

/* ------------------------------------------------------------------ */
/* Carregar / salvar                                                   */
/* ------------------------------------------------------------------ */

async function carregar() {
  const cfg = await api.storage.local.get({
    provider: "navegador",
    baseUrl: "",
    apiKey: "",
    model: "",
    temperature: 0.3,
  });
  els.provider.value = cfg.provider;
  els.apiKey.value = cfg.apiKey;
  els.model.value = cfg.model || (PRESETS[cfg.provider]?.model ?? "");
  els.baseUrl.value = cfg.baseUrl || (PRESETS[cfg.provider]?.baseUrl ?? "");
  els.temperature.value = String(cfg.temperature);
  els.tempValor.textContent = String(cfg.temperature);
  atualizarDicaChave();
  atualizarVisibilidade();
  if (eNavegador()) atualizarEstadoIA();
}

function lerFormulario() {
  const cfg = {
    provider: provedorAtual(),
    apiKey: els.apiKey.value.trim(),
    model: els.model.value.trim(),
    baseUrl: els.baseUrl.value.trim(),
    temperature: Number(els.temperature.value),
  };
  // IA nativa não usa os campos de API; limpa para não confundir depois.
  if (cfg.provider === "navegador") {
    cfg.apiKey = "";
    cfg.model = "";
    cfg.baseUrl = "";
  }
  return cfg;
}

function atualizarDicaChave() {
  if (eNavegador()) {
    els.dicaChave.textContent = "Não precisa de chave: a IA roda localmente no seu navegador.";
    return;
  }
  const preset = PRESETS[provedorAtual()];
  els.dicaChave.textContent = preset?.chaveUrl
    ? "Obtenha a chave em: " + preset.chaveUrl
    : "Informe o endereço e o modelo do seu serviço compatível com OpenAI.";
}

function atualizarVisibilidade() {
  const navegador = eNavegador();
  els.apiKey.closest(".campo").hidden = navegador;
  els.avancado.hidden = navegador;
  els.campoNavegador.hidden = !navegador;
}

/* ------------------------------------------------------------------ */
/* IA nativa do navegador (Chrome 138+)                                */
/* ------------------------------------------------------------------ */

async function atualizarEstadoIA() {
  const es = languageModel();
  if (!es) {
    els.iaStatus.textContent = "❌ Indisponível neste navegador. Para usar a IA nativa, é preciso Chrome 138 ou superior.";
    els.iaStatus.className = "ajuda erro";
    return;
  }
  els.iaStatus.className = "ajuda";
  const estado = await es.availability();
  if (estado === "available") {
    els.iaStatus.textContent = "✅ Modelo local pronto para uso.";
  } else if (estado === "downloadable") {
    els.iaStatus.textContent = "O modelo ainda precisa ser baixado no seu computador.";
    els.baixarModelo.hidden = false;
  } else if (estado === "downloading") {
    els.iaStatus.textContent = "O Chrome já está baixando o modelo — recarregue esta página em alguns minutos.";
  } else {
    els.iaStatus.textContent = "❌ O Chrome não consegue rodar o modelo neste dispositivo (confira os requisitos listados acima).";
    els.iaStatus.className = "ajuda erro";
  }
}

els.baixarModelo.addEventListener("click", async () => {
  const es = languageModel();
  if (!es) return;
  els.baixarModelo.disabled = true;
  els.iaProgresso.textContent = "";
  try {
    const sessao = await es.create({
      monitor(m) {
        m.addEventListener("downloadprogress", (e) => {
          els.iaProgresso.textContent = "Baixando: " + Math.round(e.loaded * 100) + "%";
        });
      },
    });
    sessao.destroy();
    els.iaProgresso.textContent = "";
    els.baixarModelo.hidden = true;
    els.iaStatus.textContent = "✅ Modelo baixado e pronto para uso!";
    els.iaStatus.className = "ajuda";
  } catch (err) {
    els.iaStatus.textContent = "❌ Falha ao baixar: " + String(err?.message || err);
    els.iaStatus.className = "ajuda erro";
    els.baixarModelo.disabled = false;
  }
});

async function testarIANavegador() {
  const es = languageModel();
  if (!es) throw new Error("IA nativa indisponível neste navegador (requer Chrome 138+).");
  const estado = await es.availability();
  if (estado === "downloadable" || estado === "downloading") {
    throw new Error("O modelo ainda não foi baixado — clique em “Baixar modelo” acima.");
  }
  if (estado !== "available") {
    throw new Error("IA nativa não disponível neste dispositivo — confira os requisitos.");
  }
  const sessao = await es.create();
  const resposta = (await sessao.prompt("Responda apenas com a palavra: ok")).trim();
  sessao.destroy();
  if (!resposta) throw new Error("O modelo respondeu uma mensagem vazia.");
}

/* ------------------------------------------------------------------ */
/* Eventos dos campos                                                  */
/* ------------------------------------------------------------------ */

els.provider.addEventListener("change", () => {
  const p = PRESETS[provedorAtual()];
  if (p?.baseUrl) els.baseUrl.value = p.baseUrl;
  if (p?.model) els.model.value = p.model;
  atualizarDicaChave();
  atualizarVisibilidade();
  if (eNavegador()) {
    setStatus("");
    atualizarEstadoIA();
  }
});

els.temperature.addEventListener("input", () => {
  els.tempValor.textContent = els.temperature.value;
});

els.salvar.addEventListener("click", async () => {
  await api.storage.local.set(lerFormulario());
  setStatus("✓ Configuração salva.", "ok");
});

els.testar.addEventListener("click", async () => {
  const cfg = lerFormulario();
  await api.storage.local.set(cfg);
  setStatus("Testando…", "ok");
  try {
    if (cfg.provider === "navegador") {
      await testarIANavegador();
    } else {
      await testarAPI(cfg);
    }
    setStatus(
      cfg.provider === "navegador"
        ? "✅ IA nativa funcionando! Já pode usar: selecione um texto e clique com o direito."
        : "✅ Conexão OK! Já pode usar: selecione um texto e clique com o direito.",
      "ok"
    );
  } catch (err) {
    const msg = String(err?.message || err);
    if (/Failed to fetch|NetworkError|Load failed/i.test(msg)) {
      setStatus(
        "❌ Não foi possível conectar. Verifique o endereço e a internet. " +
          "No Ollama local, inicie o serviço permitindo a origem da extensão: " +
          'OLLAMA_ORIGINS="chrome-extension://* moz-extension://*" ollama serve',
        "erro"
      );
    } else {
      setStatus("❌ " + msg, "erro");
    }
  }
});

async function testarAPI(cfg) {
  const resposta = await fetch(cfg.baseUrl.replace(/\/+$/, "") + "/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cfg.apiKey ? { Authorization: "Bearer " + cfg.apiKey } : {}),
    },
    body: JSON.stringify({
      model: cfg.model || PRESETS[cfg.provider]?.model,
      max_tokens: 5,
      messages: [{ role: "user", content: "Diga apenas: ok" }],
    }),
  });
  if (!resposta.ok) {
    const texto = await resposta.text().catch(() => "");
    throw new Error("HTTP " + resposta.status + (texto ? " — " + texto.slice(0, 160) : ""));
  }
  await resposta.json();
}

carregar();
