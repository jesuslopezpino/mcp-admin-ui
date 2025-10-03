import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TargetSelectorComponent } from './target-selector.component';
import { TargetSelectionService } from '../../services/target-selection.service';
import { Asset } from '../../services/api.service';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('TargetSelectorComponent', () => {
  let component: TargetSelectorComponent;
  let fixture: ComponentFixture<TargetSelectorComponent>;
  let selectionService: TargetSelectionService;
  let compiled: HTMLElement;

  const mockAssets: Asset[] = [
    {
      id: 'asset-1',
      hostname: 'server-1',
      ip: '192.168.1.10',
      os: 'windows',
      status: 'online',
      winrmEnabled: true,
      lastSeen: '2025-01-01T00:00:00Z'
    },
    {
      id: 'asset-2',
      hostname: 'server-2',
      ip: '192.168.1.11',
      os: 'windows',
      status: 'online',
      winrmEnabled: true,
      lastSeen: '2025-01-01T00:00:00Z'
    },
    {
      id: 'asset-3',
      hostname: 'server-3',
      ip: '192.168.1.12',
      os: 'windows',
      status: 'offline',
      winrmEnabled: false,
      lastSeen: '2025-01-01T00:00:00Z'
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TargetSelectorComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TargetSelectorComponent);
    component = fixture.componentInstance;
    selectionService = TestBed.inject(TargetSelectionService);
    compiled = fixture.nativeElement;
    
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initial state', () => {
    it('should have disabled control initially', () => {
      expect(component.targetCtrl.disabled).toBe(true);
      expect(component.assetsLoading).toBe(true);
    });

    it('should show loading spinner when assets are loading', () => {
      component.assetsLoading = true;
      fixture.detectChanges();
      
      const spinner = compiled.querySelector('.loading-spinner');
      expect(spinner).toBeTruthy();
    });

    it('should have null value initially', () => {
      expect(component.targetCtrl.value).toBeNull();
    });

    it('should display local option by default', () => {
      component.assets = mockAssets;
      component.ngOnChanges({ assets: { currentValue: mockAssets, previousValue: undefined, firstChange: true, isFirstChange: () => true } });
      fixture.detectChanges();
      
      const select = compiled.querySelector('[data-testid="target-selector"]') as HTMLSelectElement;
      expect(select).toBeTruthy();
      expect(select.value).toBe('null');
    });
  });

  describe('Assets loading', () => {
    it('should enable control after assets are loaded', () => {
      component.assets = mockAssets;
      component.ngOnChanges({ assets: { currentValue: mockAssets, previousValue: undefined, firstChange: true, isFirstChange: () => true } });
      
      expect(component.assetsLoading).toBe(false);
      expect(component.targetCtrl.disabled).toBe(false);
    });

    it('should render local option with correct data-testid', () => {
      component.assets = mockAssets;
      component.ngOnChanges({ assets: { currentValue: mockAssets, previousValue: undefined, firstChange: true, isFirstChange: () => true } });
      fixture.detectChanges();
      
      const localOption = compiled.querySelector('[data-testid="target-option-local"]');
      expect(localOption).toBeTruthy();
      expect(localOption?.textContent?.trim()).toContain('Servidor (local)');
    });

    it('should render all asset options', () => {
      component.assets = mockAssets;
      component.ngOnChanges({ assets: { currentValue: mockAssets, previousValue: undefined, firstChange: true, isFirstChange: () => true } });
      fixture.detectChanges();
      
      const select = compiled.querySelector('[data-testid="target-selector"]') as HTMLSelectElement;
      const options = select.querySelectorAll('option');
      
      // 1 local + 3 assets = 4 options
      expect(options.length).toBe(4);
    });
  });

  describe('Persistence', () => {
    it('should apply persisted selection when valid asset exists', () => {
      // Save a valid asset ID
      selectionService.save('asset-1');
      
      // Load component with assets
      component.assets = mockAssets;
      component.ngOnChanges({ assets: { currentValue: mockAssets, previousValue: undefined, firstChange: true, isFirstChange: () => true } });
      fixture.detectChanges();
      
      // Should restore the saved selection
      expect(component.targetCtrl.value).toBe('asset-1');
    });

    it('should fallback to null when persisted asset no longer exists', () => {
      // Save an asset ID that won't exist
      selectionService.save('non-existent-asset');
      
      // Load component with assets
      component.assets = mockAssets;
      component.ngOnChanges({ assets: { currentValue: mockAssets, previousValue: undefined, firstChange: true, isFirstChange: () => true } });
      fixture.detectChanges();
      
      // Should fallback to null (local)
      expect(component.targetCtrl.value).toBeNull();
    });

    it('should save selection when user changes it', (done) => {
      component.assets = mockAssets;
      component.ngOnChanges({ assets: { currentValue: mockAssets, previousValue: undefined, firstChange: true, isFirstChange: () => true } });
      fixture.detectChanges();
      
      // Change selection
      component.targetCtrl.setValue('asset-2');
      
      // Give time for async operations
      setTimeout(() => {
        expect(selectionService.load()).toBe('asset-2');
        done();
      }, 10);
    });

    it('should clear localStorage when selecting local (null)', (done) => {
      // First set a value
      selectionService.save('asset-1');
      
      component.assets = mockAssets;
      component.ngOnChanges({ assets: { currentValue: mockAssets, previousValue: undefined, firstChange: true, isFirstChange: () => true } });
      fixture.detectChanges();
      
      // Change to local (null)
      component.targetCtrl.setValue(null);
      
      setTimeout(() => {
        expect(selectionService.load()).toBeNull();
        done();
      }, 10);
    });
  });

  describe('Selection display', () => {
    it('should show "Servidor (local)" when nothing is selected', () => {
      component.assets = mockAssets;
      component.ngOnChanges({ assets: { currentValue: mockAssets, previousValue: undefined, firstChange: true, isFirstChange: () => true } });
      component.targetCtrl.setValue(null);
      
      expect(component.getSelectedDisplayName()).toBe('— Servidor (local) —');
    });

    it('should show asset hostname when selected', () => {
      component.assets = mockAssets;
      component.ngOnChanges({ assets: { currentValue: mockAssets, previousValue: undefined, firstChange: true, isFirstChange: () => true } });
      component.targetCtrl.setValue('asset-1');
      
      const displayName = component.getSelectedDisplayName();
      expect(displayName).toContain('server-1');
      expect(displayName).toContain('192.168.1.10');
    });
  });

  describe('Disabled assets', () => {
    it('should disable assets without WinRM', () => {
      component.assets = mockAssets;
      component.ngOnChanges({ assets: { currentValue: mockAssets, previousValue: undefined, firstChange: true, isFirstChange: () => true } });
      fixture.detectChanges();
      
      const options = compiled.querySelectorAll('option');
      const asset3Option = Array.from(options).find(opt => 
        opt.getAttribute('data-testid') === 'target-option-asset-3'
      ) as HTMLOptionElement;
      
      expect(asset3Option?.disabled).toBe(true);
    });
  });

  describe('Event emission', () => {
    it('should emit selectedAssetIdChange when value changes', (done) => {
      component.assets = mockAssets;
      component.ngOnChanges({ assets: { currentValue: mockAssets, previousValue: undefined, firstChange: true, isFirstChange: () => true } });
      
      component.selectedAssetIdChange.subscribe(value => {
        expect(value).toBe('asset-1');
        done();
      });
      
      component.targetCtrl.setValue('asset-1');
    });

    it('should normalize empty string to null in emission', (done) => {
      component.assets = mockAssets;
      component.ngOnChanges({ assets: { currentValue: mockAssets, previousValue: undefined, firstChange: true, isFirstChange: () => true } });
      
      component.selectedAssetIdChange.subscribe(value => {
        expect(value).toBeNull();
        done();
      });
      
      component.targetCtrl.setValue('');
    });
  });

  describe('Component reload scenario', () => {
    it('should restore selection after component recreation', () => {
      // Step 1: Select an asset and destroy component
      selectionService.save('asset-2');
      
      // Step 2: Create new component instance (simulating page reload)
      const newFixture = TestBed.createComponent(TargetSelectorComponent);
      const newComponent = newFixture.componentInstance;
      
      // Step 3: Load assets
      newComponent.assets = mockAssets;
      newComponent.ngOnChanges({ assets: { currentValue: mockAssets, previousValue: undefined, firstChange: true, isFirstChange: () => true } });
      newFixture.detectChanges();
      
      // Step 4: Verify selection is restored
      expect(newComponent.targetCtrl.value).toBe('asset-2');
      
      newFixture.destroy();
    });

    it('should handle disabled state during loading correctly', () => {
      // Component starts with control disabled
      expect(component.targetCtrl.disabled).toBe(true);
      
      // Simulate async asset loading
      setTimeout(() => {
        component.assets = mockAssets;
        component.ngOnChanges({ assets: { currentValue: mockAssets, previousValue: undefined, firstChange: true, isFirstChange: () => true } });
        fixture.detectChanges();
        
        // Control should be enabled after assets load
        expect(component.targetCtrl.disabled).toBe(false);
      }, 0);
    });
  });

  describe('Asset sorting', () => {
    it('should sort WinRM-enabled assets first', () => {
      component.assets = mockAssets;
      component.ngOnChanges({ assets: { currentValue: mockAssets, previousValue: undefined, firstChange: true, isFirstChange: () => true } });
      
      expect(component.sortedAssets[0].winrmEnabled).toBe(true);
      expect(component.sortedAssets[1].winrmEnabled).toBe(true);
      expect(component.sortedAssets[2].winrmEnabled).toBe(false);
    });
  });
});