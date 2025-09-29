import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Asset } from '../../services/api.service';

@Component({
  selector: 'app-target-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './target-selector.component.html',
  styleUrl: './target-selector.component.scss'
})
export class TargetSelectorComponent implements OnInit, OnChanges {
  @Input() assets: Asset[] = [];
  @Input() selectedAssetId?: string | null;
  @Output() selectedAssetIdChange = new EventEmitter<string | null>();

  isOpen = false;
  sortedAssets: Asset[] = []; // Sorted assets with WinRM first
  isRemembered = false; // Track if the selection is remembered

  ngOnInit() {
    // Load saved selection from localStorage (only if available)
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('mcp.ui.selectedAsset');
      const remembered = localStorage.getItem('mcp.ui.rememberedAsset');
      
      if (saved && saved !== 'null') {
        this.selectedAssetId = saved;
        this.isRemembered = remembered === 'true';
        
        // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          this.selectedAssetIdChange.emit(this.selectedAssetId);
        }, 0);
      }
    }
    this.sortAssets();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['assets']) {
      this.sortAssets();
    }
  }

  private sortAssets() {
    // Sort assets: WinRM enabled first, then by hostname/IP
    this.sortedAssets = [...this.assets].sort((a, b) => {
      // First priority: WinRM enabled
      if (a.winrmEnabled && !b.winrmEnabled) return -1;
      if (!a.winrmEnabled && b.winrmEnabled) return 1;
      
      // Second priority: Online status
      if (a.status === 'online' && b.status !== 'online') return -1;
      if (a.status !== 'online' && b.status === 'online') return 1;
      
      // Third priority: Alphabetical by hostname or IP
      const nameA = (a.hostname || a.ip).toLowerCase();
      const nameB = (b.hostname || b.ip).toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  selectOption(assetId: string) {
    this.selectedAssetId = assetId;
    this.selectedAssetIdChange.emit(assetId);
    this.isOpen = false;
    
    // Save to localStorage (only if available)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('mcp.ui.selectedAsset', assetId);
    }
  }

  toggleRemember(event?: Event) {
    if (!this.selectedAssetId) return;

    // Prevent event propagation to avoid triggering other click handlers
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    this.isRemembered = !this.isRemembered;
    
    if (typeof localStorage !== 'undefined') {
      if (this.isRemembered) {
        // Remember the current selection
        localStorage.setItem('mcp.ui.rememberedAsset', 'true');
      } else {
        // Forget the selection
        localStorage.removeItem('mcp.ui.rememberedAsset');
        localStorage.removeItem('mcp.ui.selectedAsset');
        this.selectedAssetId = null;
        // Use setTimeout to avoid immediate re-execution
        setTimeout(() => {
          this.selectedAssetIdChange.emit(null);
        }, 0);
      }
    }
  }

  getSelectedDisplayName(): string {
    if (!this.selectedAssetId) {
      return 'Seleccionar destino';
    }
    
    const asset = this.getSelectedAsset();
    if (asset) {
      return asset.hostname || asset.ip;
    }
    
    return 'Seleccionar destino';
  }

  getSelectedAsset(): Asset | null {
    if (!this.selectedAssetId) {
      return null;
    }
    
    return this.assets.find(asset => asset.id === this.selectedAssetId) || null;
  }

  trackByAssetId(index: number, asset: Asset): string {
    return asset.id;
  }
}
