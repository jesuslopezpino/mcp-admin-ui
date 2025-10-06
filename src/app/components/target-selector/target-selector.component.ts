import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Asset } from '../../models/api';
import { TargetSelectionService } from '../../services/target-selection.service';
import { Subject, takeUntil } from 'rxjs';
import { Select, Card, ProgressSpinner } from '../../ui/ui-prime';

@Component({
    selector: 'app-target-selector',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, Select, Card, ProgressSpinner],
    templateUrl: './target-selector.component.html',
    styleUrl: './target-selector.component.scss'
})
export class TargetSelectorComponent implements OnInit, OnChanges, OnDestroy {
  @Input() assets: Asset[] = [];
  @Input() selectedAssetId?: string | null;
  @Output() selectedAssetIdChange = new EventEmitter<string | null>();

  targetCtrl = new FormControl<string | null>({ value: null, disabled: true });
  assetsLoading = true;
  sortedAssets: Asset[] = []; // Sorted assets with WinRM first
  selectOptions: any[] = []; // Options for PrimeNG Select
  
  private destroy$ = new Subject<void>();

  constructor(private selectionService: TargetSelectionService) {}

  ngOnInit() {
    this.sortAssets();
    this.setupValueChanges();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['assets']) {
      this.sortAssets();
      
      // Enable control after assets are loaded
      if (this.assets && this.assets.length >= 0) {
        this.assetsLoading = false;
        this.targetCtrl.enable();
        this.applyPersistedSelection();
      }
    }
  }

  private setupValueChanges() {
    this.targetCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        const normalized = value ? String(value) : null;
        this.selectionService.save(normalized);
        this.selectedAssetIdChange.emit(normalized);
      });
  }

  private applyPersistedSelection() {
    const stored = this.selectionService.load();
    const exists = stored ? this.assets.some(a => a.id === stored) : false;
    this.targetCtrl.setValue(exists ? stored : null, { emitEvent: false });
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

    // Generate select options
    this.selectOptions = [
      {
        label: 'Servidor (local)',
        value: null,
        icon: 'pi pi-desktop',
        statusClass: 'text-600'
      },
      ...this.sortedAssets.map(asset => ({
        label: asset.hostname || asset.ip,
        value: asset.id,
        subtitle: asset.ip && asset.hostname ? asset.ip : undefined,
        icon: asset.winrmEnabled ? 'pi pi-check-circle' : 'pi pi-times-circle',
        statusClass: asset.winrmEnabled ? 'text-green-500' : 'text-red-500'
      }))
    ];
  }

  getSelectedDisplayName(): string {
    const value = this.targetCtrl.value;
    if (!value) {
      return '— Servidor (local) —';
    }
    
    const asset = this.getSelectedAsset();
    if (asset) {
      const hostname = asset.hostname || asset.ip;
      const ip = asset.ip && asset.hostname ? ` (${asset.ip})` : '';
      return `${hostname}${ip}`;
    }
    
    return '— Servidor (local) —';
  }

  getSelectedAsset(): Asset | null {
    const value = this.targetCtrl.value;
    if (!value) {
      return null;
    }
    
    return this.assets.find(asset => asset.id === value) || null;
  }

  trackByAssetId(_: number, asset: Asset): string {
    return asset.id;
  }
}
