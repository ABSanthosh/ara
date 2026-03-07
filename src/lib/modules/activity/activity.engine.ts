export class ActivityEngineImpl {
  private idleThreshold = 30; // seconds
  private allowedProtocols = ["http:", "https:", "localhost:", "file:"];

  private util = {
    getDomainFromUrl(url: string): {
      domain: string;
      protocol: string;
    } | null {
      try {
        const urlObj = new URL(url);
        return { domain: urlObj.hostname, protocol: urlObj.protocol };
      } catch {
        return null;
      }
    },
  };

  private handlers = {
    tab: {
      activated: async (activeInfo: chrome.tabs.OnActivatedInfo) => {
        const tab = await chrome.tabs.get(activeInfo.tabId);
        const domainInfo = this.util.getDomainFromUrl(tab.url || "");
        if (!this.allowedProtocols.includes(domainInfo?.protocol || "")) return;
      },
      updated: async (
        tabId: number,
        changeInfo: chrome.tabs.OnUpdatedInfo,
        tab: chrome.tabs.Tab,
      ) => {
        if (changeInfo.status === "complete") {
          console.log("Tab updated:", tabId, tab);
        }
      },
      removed: async (tabId: number, removeInfo: chrome.tabs.OnRemovedInfo) => {
        // console.log("Tab removed:", tabId, removeInfo);
      },
    },
    window: {
      focusChanged: async (windowId: number) => {
        if (windowId === -1) {
          console.log("Window unfocused");
          return;
        }
        if (windowId === chrome.windows.WINDOW_ID_NONE) return;

        console.log(await chrome.windows.get(windowId));
      },
    },
  };

  constructor() {
    this.addListeners();
  }

  private addListeners() {
    // Tabs
    chrome.tabs.onActivated.addListener(this.handlers.tab.activated);
    chrome.tabs.onUpdated.addListener(this.handlers.tab.updated);
    chrome.tabs.onRemoved.addListener(this.handlers.tab.removed);

    // Windows
    chrome.windows.onFocusChanged.addListener(
      this.handlers.window.focusChanged,
    );
  }

  private removeListeners() {
    // Tabs
    chrome.tabs.onActivated.removeListener(this.handlers.tab.activated);
    chrome.tabs.onUpdated.removeListener(this.handlers.tab.updated);
    chrome.tabs.onRemoved.removeListener(this.handlers.tab.removed);

    // Windows
    chrome.windows.onFocusChanged.removeListener(
      this.handlers.window.focusChanged,
    );
  }

  public destroy() {
    this.removeListeners();
  }
}
