/**
 * Magazine utility class
 * This will take an array of objects of type T
 * and a magazine size, and will provide methods to
 * - Get the latest item in magazine
 * - update the magazine with new items
 *    - through callback. When an item is used from the top of the magazine,
 *     a callback is called to fetch a new item to add to the end of the magazine
 *     and the return type of the callback should be of type Promise<T>
 * - clear the magazine
 *
 * This is simple LIFO queue implementation with fixed size
 */
export class Magazine<T> {
  private items: T[] = [];
  private readonly size: number;
  private maxAccess: number;
  private readonly fetchNewItem: (count: number) => Promise<T[]>;
  private readonly onItemsChange?: (items: T[]) => void;
  private readonly onTimesAccessedChange?: (timesAccessed: number) => void;
  private isReloading: boolean = false;
  private timesAccessed: number = 0;

  constructor({
    size,
    maxAccess = 1,
    preload,
    preloadTimesAccessed = 0,
    fetchNewItem,
    onItemsChange,
    onTimesAccessedChange,
  }: {
    size: number;
    maxAccess?: number;
    preload?: T[];
    preloadTimesAccessed?: number;
    fetchNewItem: (count: number) => Promise<T[]>;
    onItemsChange?: (items: T[]) => void;
    onTimesAccessedChange?: (timesAccessed: number) => void;
  }) {
    this.size = size;
    this.maxAccess = Math.max(1, Math.min(10, maxAccess)); // Clamp between 1 and 10
    this.fetchNewItem = fetchNewItem;
    this.onItemsChange = onItemsChange;
    this.onTimesAccessedChange = onTimesAccessedChange;
    this.timesAccessed = preloadTimesAccessed;
    if (preload && preload.length > 0) {
      this.items = preload.slice(0, size);
    }
    this.reloadMagazine();
  }

  /**
   * Get the latest item in the magazine.
   * Increments timesAccessed counter unless isPinned is true.
   */
  public getLatestItem(isPinned: boolean = false): T | null {
    if (this.items.length === 0) return null;
    
    // If pinned, just return the current item without any tracking
    if (isPinned) {
      return this.items[0];
    }
    
    this.timesAccessed++;
    
    // Notify about timesAccessed change
    if (this.onTimesAccessedChange) {
      this.onTimesAccessedChange(this.timesAccessed);
    }
    
    // If we've accessed this item enough times, pop it and reset counter
    if (this.timesAccessed >= this.maxAccess) {
      const returnItem = this.items.shift()!;
      this.timesAccessed = 0;
      
      // Notify about timesAccessed reset
      if (this.onTimesAccessedChange) {
        this.onTimesAccessedChange(this.timesAccessed);
      }
      
      // Asynchronously replenish the magazine
      this.reloadMagazine();
      return returnItem;
    }
    
    // Otherwise, just return the current item without removing it
    return this.items[0];
  }

  public getAllItems(): T[] {
    return this.items;
  }

  public pop(): T | null {
    if (this.items.length === 0) return null;
    const returnItem = this.items.shift()!;
    // Asynchronously replenish the magazine
    this.reloadMagazine();
    return returnItem;
  }

  /**
   * Clear the magazine
   */
  public clearMagazine(): void {
    this.items = [];
  }

  /**
   * Update the maxAccess setting.
   * If timesAccessed already exceeds the new maxAccess, pop the current item.
   */
  public updateMaxAccess(newMaxAccess: number): void {
    this.maxAccess = Math.max(1, Math.min(10, newMaxAccess)); // Clamp between 1 and 10
    
    // If we've already accessed the current item more than the new max, pop it
    if (this.timesAccessed >= this.maxAccess && this.items.length > 0) {
      this.items.shift();
      this.timesAccessed = 0;
      
      // Notify about timesAccessed reset
      if (this.onTimesAccessedChange) {
        this.onTimesAccessedChange(this.timesAccessed);
      }
      
      // Notify about items change
      if (this.onItemsChange) {
        this.onItemsChange(this.items);
      }
      
      // Asynchronously replenish the magazine
      this.reloadMagazine();
    }
  }

  /**
   * Reload the magazine to its full size.
   * This will fill the magazine up to its size, fetching new items as needed.
   * Existing items are preserved.
   */
  public async reloadMagazine(retries: number = 3): Promise<void> {
    // Prevent concurrent reloads
    if (this.isReloading || this.items.length >= this.size) return;
    
    this.isReloading = true;
    let attempts = 0;
    while (attempts < retries) {
      try {
        const needed = this.size - this.items.length;
        if (needed <= 0) break;
        
        const newItems = await this.fetchNewItem(needed);
        this.items.push(...newItems);
        if (this.onItemsChange) {
          this.onItemsChange(this.items);
        }
        break;
      } catch (error) {
        attempts++;
        if (attempts >= retries) {
          break;
        }
      }
    }
    this.isReloading = false;
  }
}
