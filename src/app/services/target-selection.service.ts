import { Injectable } from '@angular/core';

/**
 * Service for persisting target selection (local vs remote asset) in localStorage.
 * Handles normalization of empty strings to null and ensures only valid UUIDs are stored.
 */
@Injectable({
  providedIn: 'root'
})
export class TargetSelectionService {
  private readonly key = 'mcp.ui.selectedAsset';

  /**
   * Load the persisted asset ID from localStorage.
   * Normalizes empty strings, 'null', and 'undefined' to null.
   * @returns The persisted asset ID or null if none/invalid
   */
  load(): string | null {
    const value = localStorage.getItem(this.key);
    
    // Normalize empty/invalid values to null
    if (!value || value === 'null' || value === 'undefined' || value === '') {
      return null;
    }
    
    return String(value);
  }

  /**
   * Save the asset ID to localStorage.
   * If assetId is null/empty, removes the key from localStorage.
   * @param assetId The asset ID to persist, or null to clear
   */
  save(assetId: string | null): void {
    if (!assetId) {
      localStorage.removeItem(this.key);
      return;
    }
    
    localStorage.setItem(this.key, String(assetId));
  }

  /**
   * Clear the persisted selection from localStorage.
   */
  clear(): void {
    localStorage.removeItem(this.key);
  }
}
