import { writable } from "svelte/store";
import type { Unsubscriber, Writable } from "svelte/store";

export abstract class StoreImpl<T extends object> {
  public set!: Writable<T>["set"];
  public update!: Writable<T>["update"];
  public subscribe!: Writable<T>["subscribe"];
  public unsubscribe!: Unsubscriber;

  private isInitialized = false;
  private saveTimer: NodeJS.Timeout | null = null;

  protected abstract readonly storageKey: string;
  protected readonly debounceDelay: number = 2000;

  private readonly _defaultStore: T;

  /**
   * Called once after the initial value is loaded from storage.
   * Override to normalize or sanitize the loaded state before it's applied.
   */
  protected normalize(value: T): T {
    return value;
  }

  private get storageItem() {
    return storage.defineItem<T>(`local:${this.storageKey}`, {
      version: 1,
      fallback: this._defaultStore,
    });
  }

  constructor(defaultStore: T) {
    this._defaultStore = defaultStore;
    const { subscribe, set, update } = writable<T>(defaultStore);
    this.set = set;
    this.update = update;
    this.subscribe = subscribe;
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;

    // Load persisted value
    const stored = await this.storageItem.getValue();
    this.set(this.normalize(this.deserialize(stored) as T));

    // React to external storage changes (e.g. other tabs/windows)
    this.unsubscribe = this.storageItem.watch((value) => {
      this.set(this.deserialize(value) as T);
    });

    // Debounced save on every store change
    this.subscribe((value) => {
      if (this.saveTimer !== null) clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(() => {
        this.storageItem.setValue(this.serialize(value) as T);
      }, this.debounceDelay);
    });

    this.isInitialized = true;
  }

  public destroy(): void {
    this.unsubscribe?.();
    if (this.saveTimer !== null) clearTimeout(this.saveTimer);
  }

  // ─── Serialization ────────────────────────────────────────────────────────

  private isSerializable(value: unknown): boolean {
    return (
      !(value instanceof Element || value instanceof HTMLElement) &&
      typeof value !== "function"
    );
  }

  protected serialize(value: unknown): unknown {
    if (value instanceof Date) {
      return { __type: "Date", __value: value.toISOString() };
    }

    if (value instanceof Set) {
      return { __type: "Set", __value: Array.from(value) };
    }

    if (!this.isSerializable(value)) return undefined;

    if (Array.isArray(value)) {
      return value
        .map((item) => this.serialize(item))
        .filter((item) => item !== undefined);
    }

    if (value && typeof value === "object") {
      const output: Record<string, unknown> = {};
      for (const [key, nested] of Object.entries(value)) {
        const serialized = this.serialize(nested);
        if (serialized !== undefined) output[key] = serialized;
      }
      return output;
    }

    return value;
  }

  protected deserialize(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.deserialize(item));
    }

    if (value && typeof value === "object") {
      const obj = value as Record<string, unknown>;

      if (obj.__type === "Date") return new Date(obj.__value as string);
      if (obj.__type === "Set") return new Set(obj.__value as unknown[]);

      const output: Record<string, unknown> = {};
      for (const [key, nested] of Object.entries(obj)) {
        output[key] = this.deserialize(nested);
      }
      return output;
    }

    return value;
  }
}
