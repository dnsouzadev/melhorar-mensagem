# Publicando o Melhorar Mensagem no Firefox (AMO)

Guia passo a passo para a publicação listada (catálogo de add-ons), gratuita.

> **Estado atual**: `dist/firefox.zip` passa no `addons-linter` da Mozilla com
> **0 erros, 0 avisos** (`npx addons-linter dist/firefox.zip` para conferir antes de enviar).

## 1. Conta e upload

1. Acesse https://addons.mozilla.org/developers/addon/submit/ e entre com uma
   **conta Mozilla** (gratuita). Nome do perfil: algo profissional (será público).
2. Clique em **"Submit a New Add-on"**.
3. Escolha **"On this site"** (listado) — é o que dá página pública no catálogo.
4. Suba o arquivo `dist/firefox.zip` (gerado por `python3 build.py`).

## 2. Metadados (copie daqui)

### Nome do add-on

```
Melhorar Mensagem
```

### Resumo (short description, máx. ~250 caracteres)

```
Selecione um texto, clique com o direito e melhore a mensagem com IA: mais
profissional, mais formal, mais curta ou apenas corrigindo a gramática.
```

### Descrição longa

```
Melhorar Mensagem corrige e reescreve suas mensagens com IA direto no campo
onde você escreveu — sem abrir outra aba, sem copiar e colar.

COMO USAR
1. Escreva sua mensagem normalmente.
2. Selecione o trecho que quer revisar.
3. Clique com o direito e escolha "✨ Melhorar mensagem".
4. Escolha o estilo: melhorar (padrão), mais formal, mais curto ou só corrigir
   a gramática.
O texto é substituído no lugar e o Ctrl+Z continua funcionando.

ESTILOS DE ESCRITA
✨ Melhorar mensagem (padrão) — corrige gramática e deixa o tom profissional.
🎩 Mais formal — adequado para clientes, chefes e coordenadores.
✂️ Mais curto — remove enrolação mantendo o essencial e a cortesia.
🔤 Só corrigir gramática — conservador: muda o mínimo possível.

QUE IA O ADD-ON USA (VOCÊ ESCOLHE)
Na primeira abertura, um assistente pergunta o provedor. Tudo fica salvo no
seu navegador; nada é enviado para os desenvolvedores.
• Groq — nível de uso gratuito (crie a chave em console.groq.com).
• OpenAI / OpenRouter — use sua própria chave e modelo favoritos.
• Ollama local — 100% offline no seu computador (configure
  OLLAMA_ORIGINS="moz-extension://*" nos ajustes do serviço).
A opção "IA do navegador" (modelo local embutido) depende da Prompt API,
que está disponível no Chrome a partir da versão 138; no Firefox use um dos
provedores acima.

PRIVACIDADE
• A extensão não coleta nenhum dado.
• O texto selecionado é enviado apenas ao provedor que você escolheu,
  quando você clica no item do menu.
• Sem telemetria, sem rastreamento, sem histórico.

Desenvolvido por dnsouzadev · código aberto (MIT).
Fonte: https://github.com/dnsouzadev/melhorar-mensagem
```

### Categoria sugerida

- **Primary**: Productivity (ou "Eficiência de negócios")
- **Secondary**: Accessibility (opcional; opcional)

### Tags (máx. 5)

```
ia, escrita, corretor, produtividade, chatgpt
```

### Homepage / site de suporte

- Homepage: https://github.com/dnsouzadev/melhorar-mensagem
- Support link: https://github.com/dnsouzadev/melhorar-mensagem/issues

### E-mail de contato

Seu e-mail público (obrigatório no formulário; aparece para o usuário final só se você marcar).

## 3. Screenshots

Formato: PNG/JPEG recomendado 1280×800 ou 700×528. Use os `docs/img/*.png`
(já nessa proporção de janela) — reordene: menu de contexto em uso primeiro.

## 4. Licença no formulário

- **Licença**: marque **MIT/X11 License** (é a que o projeto usa).
- Preencha **Source Code URL** com https://github.com/dnsouzadev/melhorar-mensagem

## 5. Coleta de dados (formulário)

- **"Does this add-on collect data?"**: **No**.
- Explique (caixa de texto livre):
```
O add-on não coleta nenhum dado por si só. O texto selecionado pelo usuário é
enviado apenas ao provedor de IA escolhido por ele nas opções (ex.: Groq ou
OpenAI), em uma ação explícita do usuário via menu de contexto.
```

## 6. Revisão automática e humana

- O upload passa na revisão automática (mesma do linter) — já está limpo.
- Pode haver **revisão humana** para entrar no catálogo. Tempo típico: dias.

### Notas para o revisor (cole em "Notes for reviewers")

```
Add-on de utilidade em pt-BR; código simples e comentado em JavaScript puro
(sem build/bundler). Estrutura:
• background.js — cria o submenu de contexto (✨ Melhorar mensagem) e atua como
  fallback do Prompt API.
• content.js — captura a seleção, chama a API do provedor configurado pelo
  usuário e substitui o texto com execCommand('insertText').
• onboarding.html/js — assistente de primeira configuração (escolha do
  provedor); options.html/js — configuração completa.
• A rede só é acessada quando o usuário clica no item de menu, para o
  endereço do provedor que ele mesmo configurou (o provedor padrão, "IA do
  navegador", roda offline no navegador e não faz rede). Nenhuma telemetria;
  nenhuma chave é enviada aos desenvolvedores.

Para testar: instale, clique no ícone → Opções → escolha "OpenRouter" ou
"Groq" e informe uma chave gratuita (console.groq.com). Depois, em qualquer
site, selecione um texto em um campo editável, clique com o direito e escolha
"✨ Melhorar mensagem → Más formal" etc. Sem chave configurada, o erro é
amigável por toast.
```

## 7. Após aprovação

- A página pública fica tipo addons.mozilla.org/firefox/addon/melhorar-mensagem/
- **Atualizações futuras**: bump da versão (manifest + CHANGELOG) → commit →
  tag → `python3 build.py` → em "Your submissions", no add-on, "Upload New Version".
- Versões com revisão pendente continuam visíveis para quem já instalou via
  página do add-on (non-tested builds) se marcado; padrão é esperar aprovação.

## 8. Checklist final antes de enviar

- [ ] `npx addons-linter dist/firefox.zip` → 0 errors / 0 warnings
- [ ] Versão no `dist/firefox/manifest.json` a próxima (0.5.1)
- [ ] ZIP contém manifest no diretório raiz (não dobrar em pasta)
- [ ] Textos acima copiados
- [ ] 2-3 screenshots em anexo
- [ ] Notas para o revisor preenchidas
