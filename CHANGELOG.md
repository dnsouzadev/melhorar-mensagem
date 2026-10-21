# Changelog

Formato semelhante ao [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e versionamento [SemVer](https://semver.org/lang/pt-BR/).

## [0.5.2] - 2026-10-20

### Alterado

- Manifestos agora são **dois arquivos estáticos escritos à mão** (`manifest.json`
  para o Chrome e `manifest.firefox.json` para o Firefox); o `build.py` apenas
  copia e empacota, sem gerar nenhum arquivo. Isso mantém verdadeira a resposta
  "No" da pergunta de código-fonte do formulário de publicação do AMO.

## [0.5.1] - 2026-10-20

### Corrigido

- Toast do content script construído via DOM (sem `innerHTML` dinâmico),
  alinhado com a política de segurança da Mozilla.
- Manifesto do Firefox declara `data_collection_permissions: none`
  (obrigatório para novas submissões no AMO).

## [0.5.0] - 2026-10-20

### Adicionado

- README completo bilíngue (pt-BR e English) com prints das telas, gerados
  por Firefox headless (docs/img).
- Crédito "Desenvolvido por dnsouzadev" com atalho para o GitHub no rodapé
  do assistente de configuração inicial.
- Licença MIT.
- Modo demonstração nas páginas de opções/assistente: abertas sem a extensão,
  emulam o storage e a IA para visualização e capturas de tela.

## [0.4.0] - 2026-10-20

### Adicionado

- Submenu "✨ Melhorar mensagem" com quatro estilos: **padrão** (profissional),
  **🎩 Mais formal**, **✂️ Mais curto** e **🔤 Só corrigir gramática**.
- O estilo escolhido é aplicado em todos os provedores (IA nativa do navegador
  e APIs compatíveis com OpenAI).

## [0.3.0] - 2026-10-20

### Adicionado

- Configuração inicial na primeira instalação: assistente que pergunta como o
  usuário quer usar a IA (navegador / Groq / OpenAI / outros), com teste da
  chave e do modelo local antes de salvar.
- A instalação abre o assistente automaticamente; "configurar depois" também
  sai dele sem travar nada.

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
