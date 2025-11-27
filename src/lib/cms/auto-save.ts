export interface SaveData {
  id?: string;
  data: Record<string, any>;
}

export interface SaveRequest {
  data: SaveData;
  timestamp: number;
}

/**
 * Manages auto-save functionality with debouncing and queue management
 * Prevents race conditions and ensures data integrity
 */
export class AutoSaveManager {
  private saveTimeout: NodeJS.Timeout | null = null;
  private saveQueue: SaveRequest[] = [];
  private isSaving: boolean = false;
  private saveFunction: (data: SaveData) => Promise<void>;
  private retryCount: number = 0;
  private maxRetries: number = 3;

  constructor(saveFunction: (data: SaveData) => Promise<void>) {
    this.saveFunction = saveFunction;
  }

  /**
   * Schedule a save with debouncing
   * @param data - Data to save
   * @param delay - Delay in milliseconds (default 30000 = 30 seconds)
   */
  scheduleSave(data: SaveData, delay: number = 30000): void {
    // Clear existing timeout
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Add to queue
    this.saveQueue.push({
      data,
      timestamp: Date.now(),
    });

    // Keep only the latest request
    if (this.saveQueue.length > 1) {
      this.saveQueue = [this.saveQueue[this.saveQueue.length - 1]];
    }

    // Schedule new save
    this.saveTimeout = setTimeout(() => {
      this.processSaveQueue();
    }, delay);
  }

  /**
   * Cancel all pending saves
   */
  cancelPendingSaves(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.saveQueue = [];
  }

  /**
   * Force immediate save
   */
  async forceSave(): Promise<void> {
    this.cancelPendingSaves();
    if (this.saveQueue.length > 0) {
      await this.processSaveQueue();
    }
  }

  /**
   * Process the save queue
   */
  private async processSaveQueue(): Promise<void> {
    if (this.isSaving || this.saveQueue.length === 0) {
      return;
    }

    this.isSaving = true;
    const request = this.saveQueue[0];

    try {
      await this.saveFunction(request.data);
      this.saveQueue.shift(); // Remove processed request
      this.retryCount = 0; // Reset retry count on success

      // Process next item if queue has more
      if (this.saveQueue.length > 0) {
        setTimeout(() => this.processSaveQueue(), 100);
      }
    } catch (error) {
      console.error("Auto-save failed:", error);

      // Retry with exponential backoff
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        const backoffDelay = Math.pow(2, this.retryCount) * 1000; // 2s, 4s, 8s
        console.log(`Retrying auto-save in ${backoffDelay}ms (attempt ${this.retryCount}/${this.maxRetries})`);

        setTimeout(() => {
          this.isSaving = false;
          this.processSaveQueue();
        }, backoffDelay);
      } else {
        console.error("Auto-save failed after max retries");
        this.saveQueue.shift(); // Remove failed request
        this.retryCount = 0;
      }
    } finally {
      if (this.retryCount === 0) {
        this.isSaving = false;
      }
    }
  }

  /**
   * Check if currently saving
   */
  isSavingNow(): boolean {
    return this.isSaving;
  }

  /**
   * Get pending save count
   */
  getPendingCount(): number {
    return this.saveQueue.length;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.cancelPendingSaves();
  }
}
