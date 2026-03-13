import type { ShadowRootContentScriptUi } from "#imports";

// ─── Message Types ───────────────────────────────────────────────────────────

export type ExtensionMessage =
  | { type: "OPEN_POPUP" }
  | { type: "CLOSE_POPUP" }
  | { type: "POPUP_CLOSED" };

// ─── Raw Messaging Helpers ───────────────────────────────────────────────────

export function sendToTab(tabId: number, message: ExtensionMessage) {
  return browser.tabs.sendMessage(tabId, message);
}

export function sendToBackground(message: ExtensionMessage) {
  return browser.runtime.sendMessage(message);
}

// ─── PopupController ────────────────────────────────────────────────────────

class PopupControllerImpl {
  private ui: ShadowRootContentScriptUi<any> | null = null;
  private isOpen = false;

  // ─── Setup ──────────────────────────────────────────────────────────────

  setUi(ui: ShadowRootContentScriptUi<any>): this {
    this.ui = ui;
    return this;
  }

  onMessage(handler: (message: ExtensionMessage) => void): this {
    browser.runtime.onMessage.addListener(handler);
    return this;
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  open(): void {
    if (this.isOpen || !this.ui) return;

    this.ui.mount();
    this.isOpen = true;
    this.attachPageListeners();
  }

  close(): void {
    if (!this.isOpen || !this.ui) return;
    this.isOpen = false;
    this.detachPageListeners();

    this.ui.remove();
    sendToBackground({ type: "POPUP_CLOSED" }).catch(() => {});
  }

  // ─── Page Listeners ─────────────────────────────────────────────────────

  private onMouseDown = (e: MouseEvent) => {
    const host = document.querySelector("popup-ui");
    if (host && !host.contains(e.target as Node)) this.close();
  };

  private onBlur = () => this.close();

  private onVisibilityChange = () => {
    if (document.visibilityState === "hidden") this.close();
  };

  private attachPageListeners() {
    document.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("blur", this.onBlur);
    document.addEventListener("visibilitychange", this.onVisibilityChange);
  }

  private detachPageListeners() {
    document.removeEventListener("mousedown", this.onMouseDown);
    window.removeEventListener("blur", this.onBlur);
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────

export const PopupController = new PopupControllerImpl();
