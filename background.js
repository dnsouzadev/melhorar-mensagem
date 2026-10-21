/* Melhorar Mensagem — processos de fundo (service worker no Chrome, script no Firefox)
 *
 * Responsabilidades:
 *   1. Criar o item "✨ Melhorar mensagem" no menu de contexto de campos editáveis.
 *   2. Ao clicar, avisar o content script da aba (todo o resto acontece lá).
 */

const api = globalThis.browser ?? globalThis.chrome;

const ID_MENU = "melhorar-mensagem";

api.runtime.onInstalled.addListener(criarMenus);
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
