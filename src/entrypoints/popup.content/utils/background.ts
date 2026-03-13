// lib/background-popup.ts

import { sendToTab, type ExtensionMessage } from "./controller";

// ─── BackgroundPopupManager ──────────────────────────────────────────────────

class BackgroundPopupManagerImpl {
  private openTabs = new Set<number>();

  // ─── Setup ────────────────────────────────────────────────────────────────

  init(): this {
    this.listenForActionClick();
    this.listenForPopupClosed();
    this.listenForTabRemoved();
    return this;
  }

  // ─── Listeners ────────────────────────────────────────────────────────────

  private listenForActionClick() {
    browser.action.onClicked.addListener(async (tab) => {
      if (!tab.id || !tab.url?.startsWith("http")) return;
      await this.toggle(tab.id);
    });
  }

  private listenForPopupClosed() {
    browser.runtime.onMessage.addListener(
      (message: ExtensionMessage, sender) => {
        if (message.type !== "POPUP_CLOSED") return;
        if (sender.tab?.id) this.openTabs.delete(sender.tab.id);
      },
    );
  }

  private listenForTabRemoved() {
    browser.tabs.onRemoved.addListener((tabId) => this.openTabs.delete(tabId));
  }

  // ─── Toggle ───────────────────────────────────────────────────────────────

  private async toggle(tabId: number) {
    const isOpen = this.openTabs.has(tabId);

    isOpen ? this.openTabs.delete(tabId) : this.openTabs.add(tabId);

    try {
      await sendToTab(tabId, { type: isOpen ? "CLOSE_POPUP" : "OPEN_POPUP" });
    } catch {
      // Content script not available on this page (e.g. chrome:// pages)
      this.openTabs.delete(tabId);
    }
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────

export const BackgroundPopupManager = new BackgroundPopupManagerImpl();
