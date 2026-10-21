# Melhorar Mensagem

Extensão de navegador (Chrome e Firefox) que melhora suas mensagens com IA **onde você escreve**: selecione o texto, clique com o direito em **"✨ Melhorar mensagem"** e pronto — a frase é corrigida e reescrita de forma mais profissional, direto no campo.

Sem abrir ChatGPT, sem copiar e colar.

## Como funciona

```
[ você seleciona o texto ]
         │
         ▼  botão direito
   ✨ Melhorar mensagem          (menu de contexto)
         │
         ▼
   content script pega a seleção e chama a API de IA
         │
         ▼
   texto substituído no campo    (Ctrl+Z desfaz)
```

- Compatível com **qualquer serviço que use a API da OpenAI** (OpenAI, Groq, OpenRouter, Ollama local…).
- A chave fica **apenas no seu navegador**; não há servidor no meio.
- Funciona em `<input>`, `<textarea>` e campos editáveis (Gmail, WhatsApp Web, formulários…).
- A substituição usa `execCommand('insertText')`, então o histórico de desfazer continua funcionando.

## Instalar

### Chrome / Edge (modo desenvolvedor)

```bash
python3 build.py            # gera dist/chrome e dist/firefox
```

1. Abra `chrome://extensions`
2. Ative **Modo do desenvolvedor** (canto superior direito)
3. **Carregar sem compactação** e escolha a pasta `dist/chrome`

### Firefox

1. Abra `about:debugging#/runtime/this-firefox`
2. **Load Temporary Add-on…** e escolha `dist/firefox/manifest.json`

> Instalação temporária expira ao fechar o Firefox. Para uso diário, é preciso assinar a extensão no [addons.mozilla.org](https://addons.mozilla.org/developers/) (é grátis).

## Configurar

Na página da extensão → **Opções**:

| Provedor | Custo | Chave em |
|---|---|---|
| **🆓 IA do navegador** | grátis, no seu PC (Chrome 138+) | — (sem chave) |
| **OpenAI** | pago | platform.openai.com/api-keys |
| **Groq** | níveis grátis generosos | console.groq.com/keys |
| **OpenRouter** | alguns modelos grátis | openrouter.ai/keys |
| **Ollama local** | grátis, sem nuvem | — (sem chave) |

### IA do navegador (padrão, sem chave)

A opção padrão usa a **Prompt API do Chrome** (Gemini Nano rodando no seu computador).
Requisitos do PC: 22 GB livres no disco e 16 GB de RAM (ou GPU de 4+ GB).
Na primeira vez, abra as **Opções → "Baixar modelo"**; depois funciona offline e
nada do que você escreve sai do computador.

> Só funciona no Chrome (138+); no Firefox escolha outro provedor nas opções.

### Ollama (opcional)

O Ollama precisa aceitar requisições vindas da extensão. Inicie com:

```bash
OLLAMA_ORIGINS="chrome-extension://* moz-extension://*" ollama serve
```

## Desenvolver

```
manifest.json    manifest-fonte (Chrome); o Firefox usa uma variação gerada
background.js    cria o item de menu do botão direito
content.js       captura a seleção, chama a IA e substitui o texto
options.html/js  configuração (provedor, chave, modelo)
build.py         gera dist/chrome e dist/firefox (+ .zip para publicação)
```

- **Nova versão**: atualize `version` no `manifest.json` + `CHANGELOG.md`, commit `v X.Y.Z` e crie a tag:

```bash
git tag -a v0.2.0 -m "descrição"
```

## Problemas conhecidos

- **"Chave de API inválida"** → confira a chave e o provedor nas Opções.
- **"Não foi possível conectar"** → endereço errado, sem internet, ou Ollama sem `OLLAMA_ORIGINS`.
- Campos muito sofisticados (Google Docs, sites com editor embutido complexo) podem não aceitar a substituição — a v1 cobre os campos de texto comuns.

## Ideias para as próximas versões

- [ ] Mais estilos no menu: "Mais formal", "Mais curto", "Só corrigir gramática"
- [ ] Popup com prévia antes de substituir (aceitar/descartar)
- [ ] Atalho de teclado (ex.: Alt+M) para o texto selecionado
- [ ] Publicação nas lojas (Chrome Web Store e AMO)
