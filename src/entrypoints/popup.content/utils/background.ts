// lib/background-popup.ts

import { PopupStore } from "@/lib/modules/popup/popup.store";
import type { ExtensionMessage } from "@/lib/modules/popup/popup.messages";
import { sendToTab } from "./controller";

// ─── BackgroundPopupManager ──────────────────────────────────────────────────

class BackgroundPopupManagerImpl {
  private openTabs = new Set<number>();

  // ─── Setup ────────────────────────────────────────────────────────────────

  init(): this {
    PopupStore.init();
    this.listenForActionClick();
    this.listenForPopupClosed();
    this.listenForTabRemoved();
    return this;
  }

  // ─── Listeners ────────────────────────────────────────────────────────────

  private listenForActionClick() {
    browser.action.onClicked.addListener(async (tab) => {
      if (!tab.id || !tab.url) return;
      await this.toggle(tab.id, tab.url);
    });
  }

  private listenForPopupClosed() {
    browser.runtime.onMessage.addListener(
      (message: ExtensionMessage, sender) => {
        if (message.type !== "POPUP_CLOSED") return;
        const tabId = message.tabId ?? sender.tab?.id;
        if (tabId) this.openTabs.delete(tabId);
      },
    );
  }

  private listenForTabRemoved() {
    browser.tabs.onRemoved.addListener((tabId) => this.openTabs.delete(tabId));
  }

  // ─── Toggle ───────────────────────────────────────────────────────────────

  private async toggle(tabId: number, tabUrl: string) {
    if (this.isNewTabOverride(tabUrl)) {
      await this.toggleNewTabPopup(tabId);
      return;
    }

    if (!tabUrl.startsWith("http")) return;

    const isOpen = this.openTabs.has(tabId);

    isOpen ? this.openTabs.delete(tabId) : this.openTabs.add(tabId);

    try {
      await sendToTab(tabId, { type: isOpen ? "CLOSE_POPUP" : "OPEN_POPUP" });
    } catch {
      // Content script not available on this page (e.g. chrome:// pages)
      this.openTabs.delete(tabId);
    }
  }

  private async toggleNewTabPopup(tabId: number) {
    const isOpen = this.openTabs.has(tabId);

    isOpen ? this.openTabs.delete(tabId) : this.openTabs.add(tabId);

    try {
      await browser.runtime.sendMessage({
        type: isOpen ? "CLOSE_NEWTAB_POPUP" : "OPEN_NEWTAB_POPUP",
        tabId,
      } satisfies ExtensionMessage);
    } catch {
      this.openTabs.delete(tabId);
    }
  }

  private isNewTabOverride(tabUrl: string) {
    const newTabPath = browser.runtime.getManifest().chrome_url_overrides?.newtab;

    if (!newTabPath) return false;

    return tabUrl === new URL(newTabPath, browser.runtime.getURL("/")).toString();
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────

export const BackgroundPopupManager = new BackgroundPopupManagerImpl();
