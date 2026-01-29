/**
 * Global timer that runs a single setInterval and manages callbacks
 * for all clock widgets. This prevents high CPU usage from multiple timers.
 * 
 * Each clock widget can register its own callback function which will be
 * called every second. This allows different clocks to handle different
 * timezones or update logic without creating multiple timers.
 * 
 * Example usage with timezone:
 * ```ts
 * GlobalTimer.register(widget.id!, () => {
 *   date = dayjs().tz(widget.settings.timezone);
 * });
 * ```
 */
class GlobalTimerManager {
  private callbacks: Map<string, () => void> = new Map();
  private interval: NodeJS.Timeout | null = null;

  /**
   * Register a callback to be called every second
   * @param id Unique identifier for this callback (usually widget ID)
   * @param callback Function to call every second
   */
  register(id: string, callback: () => void): void {
    this.callbacks.set(id, callback);
    
    // Start the interval if this is the first callback
    if (this.callbacks.size === 1) {
      this.start();
    }
    
    // Call immediately to initialize
    callback();
  }

  /**
   * Unregister a callback
   * @param id Unique identifier for the callback to remove
   */
  unregister(id: string): void {
    this.callbacks.delete(id);
    
    // Stop the interval if there are no more callbacks
    if (this.callbacks.size === 0) {
      this.stop();
    }
  }

  /**
   * Start the global interval timer
   */
  private start(): void {
    if (this.interval) return;
    
    this.interval = setInterval(() => {
      // Call all registered callbacks
      this.callbacks.forEach((callback) => {
        callback();
      });
    }, 1000);
  }

  /**
   * Stop the global interval timer
   */
  private stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

export const GlobalTimer = new GlobalTimerManager();
