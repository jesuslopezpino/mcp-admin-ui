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

  ngOnInit() {
    // Load saved selection from localStorage
    const saved = localStorage.getItem('mcp.ui.selectedAsset');
    if (saved && saved !== 'null') {
      this.selectedAssetId = saved;
      this.selectedAssetIdChange.emit(this.selectedAssetId);
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
    
    // Save to localStorage
    localStorage.setItem('mcp.ui.selectedAsset', assetId);
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
