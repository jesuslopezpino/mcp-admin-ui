import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
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
export class TargetSelectorComponent implements OnInit {
  @Input() assets: Asset[] = [];
  @Input() selectedAssetId?: string | null;
  @Output() selectedAssetIdChange = new EventEmitter<string | null>();

  ngOnInit() {
    // Load saved selection from localStorage
    const saved = localStorage.getItem('mcp.ui.selectedAsset');
    if (saved && saved !== 'null') {
      this.selectedAssetId = saved;
      this.selectedAssetIdChange.emit(this.selectedAssetId);
    }
  }

  onSelectionChange(assetId: string | null) {
    this.selectedAssetId = assetId;
    this.selectedAssetIdChange.emit(assetId);
    
    // Save to localStorage
    if (assetId) {
      localStorage.setItem('mcp.ui.selectedAsset', assetId);
    } else {
      localStorage.setItem('mcp.ui.selectedAsset', 'null');
    }
  }

  getDisplayName(asset: Asset): string {
    if (asset.hostname && asset.hostname.trim()) {
      return `${asset.hostname} (${asset.ip})`;
    }
    return asset.ip;
  }
}
