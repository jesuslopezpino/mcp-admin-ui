import { TestBed } from '@angular/core/testing';
import { TargetSelectionService } from './target-selection.service';

describe('TargetSelectionService', () => {
  let service: TargetSelectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TargetSelectionService);
    
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('load()', () => {
    it('should return null when localStorage is empty', () => {
      expect(service.load()).toBeNull();
    });

    it('should return null for empty string', () => {
      localStorage.setItem('mcp.ui.selectedAsset', '');
      expect(service.load()).toBeNull();
    });

    it('should return null for "null" string', () => {
      localStorage.setItem('mcp.ui.selectedAsset', 'null');
      expect(service.load()).toBeNull();
    });

    it('should return null for "undefined" string', () => {
      localStorage.setItem('mcp.ui.selectedAsset', 'undefined');
      expect(service.load()).toBeNull();
    });

    it('should return the stored value for valid UUID', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      localStorage.setItem('mcp.ui.selectedAsset', uuid);
      expect(service.load()).toBe(uuid);
    });

    it('should return the stored value for any non-empty string', () => {
      const value = 'some-asset-id';
      localStorage.setItem('mcp.ui.selectedAsset', value);
      expect(service.load()).toBe(value);
    });
  });

  describe('save()', () => {
    it('should save valid asset ID to localStorage', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      service.save(uuid);
      expect(localStorage.getItem('mcp.ui.selectedAsset')).toBe(uuid);
    });

    it('should remove key when saving null', () => {
      // First set a value
      localStorage.setItem('mcp.ui.selectedAsset', 'some-value');
      expect(localStorage.getItem('mcp.ui.selectedAsset')).toBe('some-value');
      
      // Then save null
      service.save(null);
      expect(localStorage.getItem('mcp.ui.selectedAsset')).toBeNull();
    });

    it('should remove key when saving empty string', () => {
      // First set a value
      localStorage.setItem('mcp.ui.selectedAsset', 'some-value');
      
      // Then save empty string
      service.save('');
      expect(localStorage.getItem('mcp.ui.selectedAsset')).toBeNull();
    });

    it('should convert non-string values to string', () => {
      const value = 123 as any;
      service.save(value);
      expect(localStorage.getItem('mcp.ui.selectedAsset')).toBe('123');
    });
  });

  describe('clear()', () => {
    it('should remove the key from localStorage', () => {
      // First set a value
      localStorage.setItem('mcp.ui.selectedAsset', 'some-value');
      expect(localStorage.getItem('mcp.ui.selectedAsset')).toBe('some-value');
      
      // Then clear
      service.clear();
      expect(localStorage.getItem('mcp.ui.selectedAsset')).toBeNull();
    });

    it('should not throw when key does not exist', () => {
      expect(() => service.clear()).not.toThrow();
    });
  });

  describe('integration', () => {
    it('should handle save -> load cycle correctly', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      
      // Save and load
      service.save(uuid);
      expect(service.load()).toBe(uuid);
      
      // Clear and load
      service.clear();
      expect(service.load()).toBeNull();
    });

    it('should normalize empty values during save -> load cycle', () => {
      // Save empty string
      service.save('');
      expect(service.load()).toBeNull();
      
      // Save null
      service.save(null);
      expect(service.load()).toBeNull();
    });
  });
});
