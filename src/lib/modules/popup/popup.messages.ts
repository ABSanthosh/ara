export type ExtensionMessage =
  | { type: "OPEN_POPUP" }
  | { type: "CLOSE_POPUP" }
  | { type: "POPUP_CLOSED"; tabId?: number }
  | { type: "OPEN_NEWTAB_POPUP"; tabId: number }
  | { type: "CLOSE_NEWTAB_POPUP"; tabId: number };