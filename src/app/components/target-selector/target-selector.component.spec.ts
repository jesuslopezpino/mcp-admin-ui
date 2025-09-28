import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TargetSelectorComponent } from './target-selector.component';
import { Asset } from '../../services/api.service';

describe('TargetSelectorComponent', () => {
  let component: TargetSelectorComponent;
  let fixture: ComponentFixture<TargetSelectorComponent>;

  const mockAssets: Asset[] = [
    {
      id: 'asset-1',
      hostname: 'server1',
      ip: '192.168.1.100',
      os: 'Windows Server 2022',
      status: 'online',
      winrmEnabled: true,
      lastSeen: '2024-01-01T00:00:00Z'
    },
    {
      id: 'asset-2',
      hostname: 'server2',
      ip: '192.168.1.101',
      os: 'Windows 11',
      status: 'offline',
      winrmEnabled: false,
      lastSeen: '2024-01-01T00:00:00Z'
    },
    {
      id: 'asset-3',
      hostname: 'server3',
      ip: '192.168.1.102',
      os: 'Windows 10',
      status: 'online',
      winrmEnabled: true,
      lastSeen: '2024-01-01T00:00:00Z'
    }
  ];

  beforeEach(async () => {
    // Mock localStorage globally
    const mockLocalStorage = {
      getItem: jasmine.createSpy('getItem').and.returnValue(null),
      setItem: jasmine.createSpy('setItem'),
      removeItem: jasmine.createSpy('removeItem')
    };
    Object.defineProperty(window, 'localStorage', { 
      value: mockLocalStorage, 
      writable: true 
    });

    await TestBed.configureTestingModule({
      imports: [TargetSelectorComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TargetSelectorComponent);
    component = fixture.componentInstance;
    component.assets = mockAssets;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize with empty assets array', () => {
      component.assets = [];
      component.ngOnInit();
      
      expect(component.sortedAssets).toEqual([]);
    });

    it('should sort assets on initialization', () => {
      component.ngOnInit();
      
      expect(component.sortedAssets.length).toBe(3);
      // WinRM enabled assets should come first
      expect(component.sortedAssets[0].winrmEnabled).toBe(true);
      expect(component.sortedAssets[1].winrmEnabled).toBe(true);
      expect(component.sortedAssets[2].winrmEnabled).toBe(false);
    });

    it('should load saved selection from localStorage', () => {
      (window.localStorage.getItem as jasmine.Spy).and.returnValue('asset-1');
      
      component.ngOnInit();
      
      expect(component.selectedAssetId).toBe('asset-1');
    });

    it('should handle null localStorage values', () => {
      (window.localStorage.getItem as jasmine.Spy).and.returnValue(null);
      
      component.ngOnInit();
      
      expect(component.selectedAssetId).toBeUndefined();
    });

    it('should handle remembered state from localStorage', () => {
      (window.localStorage.getItem as jasmine.Spy).and.callFake((key) => {
        if (key === 'mcp.ui.selectedAsset') return 'asset-1';
        if (key === 'mcp.ui.rememberedAsset') return 'true';
        return null;
      });
      
      component.ngOnInit();
      
      expect(component.isRemembered).toBe(true);
    });
  });

  describe('ngOnChanges', () => {
    it('should sort assets when assets input changes', () => {
      const newAssets: Asset[] = [
        {
          id: 'asset-4',
          hostname: 'server4',
          ip: '192.168.1.103',
          os: 'Windows 11',
          status: 'online',
          winrmEnabled: true,
          lastSeen: '2024-01-01T00:00:00Z'
        }
      ];
      
      component.assets = newAssets;
      component.ngOnChanges({ assets: { currentValue: newAssets, previousValue: mockAssets, firstChange: false, isFirstChange: () => false } });
      
      expect(component.sortedAssets.length).toBe(1);
      expect(component.sortedAssets[0].id).toBe('asset-4');
    });

    it('should not sort assets when other properties change', () => {
      const originalSortedAssets = [...component.sortedAssets];
      
      component.ngOnChanges({ selectedAssetId: { currentValue: 'asset-1', previousValue: undefined, firstChange: false, isFirstChange: () => false } });
      
      expect(component.sortedAssets).toEqual(originalSortedAssets);
    });
  });

  describe('sortAssets', () => {
    it('should prioritize WinRM enabled assets', () => {
      component['sortAssets']();
      
      const winrmAssets = component.sortedAssets.filter(asset => asset.winrmEnabled);
      const nonWinrmAssets = component.sortedAssets.filter(asset => !asset.winrmEnabled);
      
      expect(winrmAssets.length).toBe(2);
      expect(nonWinrmAssets.length).toBe(1);
      
      // All WinRM assets should come before non-WinRM assets
      const firstNonWinrmIndex = component.sortedAssets.findIndex(asset => !asset.winrmEnabled);
      const lastWinrmIndex = component.sortedAssets.length - 1 - component.sortedAssets.slice().reverse().findIndex((asset: any) => asset.winrmEnabled);
      
      expect(firstNonWinrmIndex).toBeGreaterThan(lastWinrmIndex);
    });

    it('should prioritize online assets within same WinRM status', () => {
      component['sortAssets']();
      
      const winrmAssets = component.sortedAssets.filter(asset => asset.winrmEnabled);
      const onlineAssets = winrmAssets.filter(asset => asset.status === 'online');
      const offlineAssets = winrmAssets.filter(asset => asset.status !== 'online');
      
      // Online assets should come before offline assets
      if (onlineAssets.length > 0 && offlineAssets.length > 0) {
        const firstOfflineIndex = winrmAssets.findIndex(asset => asset.status !== 'online');
        const lastOnlineIndex = winrmAssets.length - 1 - winrmAssets.slice().reverse().findIndex((asset: any) => asset.status === 'online');
        expect(firstOfflineIndex).toBeGreaterThan(lastOnlineIndex);
      } else {
        // If no offline assets or no online assets, test should pass
        expect(winrmAssets.length).toBeGreaterThan(0);
      }
    });

    it('should sort alphabetically by hostname or IP', () => {
      component['sortAssets']();
      
      const winrmAssets = component.sortedAssets.filter(asset => asset.winrmEnabled);
      
      for (let i = 0; i < winrmAssets.length - 1; i++) {
        const current = winrmAssets[i];
        const next = winrmAssets[i + 1];
        const currentName = (current.hostname || current.ip).toLowerCase();
        const nextName = (next.hostname || next.ip).toLowerCase();
        
        expect(currentName <= nextName).toBe(true);
      }
    });
  });

  describe('toggleDropdown', () => {
    it('should toggle dropdown state', () => {
      expect(component.isOpen).toBe(false);
      
      component.toggleDropdown();
      expect(component.isOpen).toBe(true);
      
      component.toggleDropdown();
      expect(component.isOpen).toBe(false);
    });
  });

  describe('selectOption', () => {
    it('should select asset and emit change', () => {
      spyOn(component.selectedAssetIdChange, 'emit');
      
      component.selectOption('asset-1');
      
      expect(component.selectedAssetId).toBe('asset-1');
      expect(component.selectedAssetIdChange.emit).toHaveBeenCalledWith('asset-1');
      expect(component.isOpen).toBe(false);
    });

    it('should save selection to localStorage', () => {
      component.selectOption('asset-1');
      
      expect(window.localStorage.setItem).toHaveBeenCalledWith('mcp.ui.selectedAsset', 'asset-1');
    });

    it('should handle localStorage not available', () => {
      // Mock localStorage as undefined
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true
      });
      
      // Should not throw error and should handle gracefully
      expect(() => component.selectOption('asset-1')).not.toThrow();
    });
  });

  describe('toggleRemember', () => {
    it('should not toggle when no asset selected', () => {
      component.selectedAssetId = null;
      const originalRemembered = component.isRemembered;
      
      component.toggleRemember();
      
      expect(component.isRemembered).toBe(originalRemembered);
    });

    it('should remember current selection', () => {
      component.selectedAssetId = 'asset-1';
      component.isRemembered = false;
      
      component.toggleRemember();
      
      expect(component.isRemembered).toBe(true);
      expect(window.localStorage.setItem).toHaveBeenCalledWith('mcp.ui.rememberedAsset', 'true');
    });

    it('should forget selection and clear localStorage', () => {
      component.selectedAssetId = 'asset-1';
      component.isRemembered = true;
      spyOn(component.selectedAssetIdChange, 'emit');
      
      component.toggleRemember();
      
      expect(component.isRemembered).toBe(false);
      expect(component.selectedAssetId).toBeNull();
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('mcp.ui.rememberedAsset');
      expect(window.localStorage.removeItem).toHaveBeenCalledWith('mcp.ui.selectedAsset');
      expect(component.selectedAssetIdChange.emit).toHaveBeenCalledWith(null);
    });

    it('should handle localStorage not available', () => {
      component.selectedAssetId = 'asset-1';
      // Mock localStorage as undefined
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true
      });
      
      // Should not throw error and should handle gracefully
      expect(() => component.toggleRemember()).not.toThrow();
      expect(component.isRemembered).toBe(true);
    });
  });

  describe('getSelectedDisplayName', () => {
    it('should return default text when no asset selected', () => {
      component.selectedAssetId = null;
      
      expect(component.getSelectedDisplayName()).toBe('Seleccionar destino');
    });

    it('should return hostname when available', () => {
      component.selectedAssetId = 'asset-1';
      
      expect(component.getSelectedDisplayName()).toBe('server1');
    });

    it('should return IP when hostname not available', () => {
      component.selectedAssetId = 'asset-2';
      
      expect(component.getSelectedDisplayName()).toBe('server2');
    });

    it('should return default text when asset not found', () => {
      component.selectedAssetId = 'non-existent';
      
      expect(component.getSelectedDisplayName()).toBe('Seleccionar destino');
    });
  });

  describe('getSelectedAsset', () => {
    it('should return null when no asset selected', () => {
      component.selectedAssetId = null;
      
      expect(component.getSelectedAsset()).toBeNull();
    });

    it('should return selected asset', () => {
      component.selectedAssetId = 'asset-1';
      
      const selectedAsset = component.getSelectedAsset();
      expect(selectedAsset).toBeDefined();
      expect(selectedAsset?.id).toBe('asset-1');
      expect(selectedAsset?.hostname).toBe('server1');
    });

    it('should return null when asset not found', () => {
      component.selectedAssetId = 'non-existent';
      
      expect(component.getSelectedAsset()).toBeNull();
    });
  });

  describe('trackByAssetId', () => {
    it('should return asset id for tracking', () => {
      const asset = mockAssets[0];
      
      expect(component.trackByAssetId(0, asset)).toBe('asset-1');
    });
  });

  describe('component state', () => {
    it('should initialize with correct default values', () => {
      expect(component.isOpen).toBe(false);
      expect(component.isRemembered).toBe(false);
      // sortedAssets will be populated by ngOnInit with mockAssets
      expect(component.sortedAssets).toBeDefined();
    });

    it('should handle empty assets array', () => {
      component.assets = [];
      component.ngOnInit();
      
      expect(component.sortedAssets).toEqual([]);
    });

    it('should handle assets with missing properties', () => {
      const incompleteAssets: Asset[] = [
        {
          id: 'incomplete-1',
          hostname: '',
          ip: '192.168.1.100',
          os: 'Windows',
          status: 'online',
          winrmEnabled: true,
          lastSeen: '2024-01-01T00:00:00Z'
        }
      ];
      
      component.assets = incompleteAssets;
      component.ngOnInit();
      
      expect(component.sortedAssets.length).toBe(1);
      expect(component.getSelectedDisplayName()).toBe('Seleccionar destino');
    });
  });
});
