# Changelog

Formato semelhante ao [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e versionamento [SemVer](https://semver.org/lang/pt-BR/).

## [0.2.0] - 2026-10-20

### Adicionado

- Provedor "IA do navegador" (padrão): Prompt API do Chrome 138+ com Gemini Nano
  local, sem chave e sem custo; download do modelo pela página de opções com
  barra de progresso e teste de conexão.
- Fallback automático: se o content script não tiver acesso à API, o prompt é
  processado pelo service worker da extensão.

## [0.1.0] - 2026-10-20

### Adicionado

- Item "✨ Melhorar mensagem" no menu de contexto de campos editáveis.
- Substituição do texto selecionado preservando o desfazer (Ctrl+Z), em
  `<input>`, `<textarea>` e campos contenteditable (incluindo dentro de iframes).
- Configuração de provedor compatível com a API da OpenAI:
  OpenAI, Groq, OpenRouter, Ollama local e endpoints personalizados.
- Página de opções com teste de conexão.
- Toast de feedback ("Melhorando…", sucesso, erros com mensagens claras).
- Script `build.py` que gera os pacotes de Chrome e Firefox.

[0.1.0]: https://github.com/daniel/extension/releases/tag/v0.1.0
