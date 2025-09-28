import { TestBed } from '@angular/core/testing';
import { CategoryService, Category, CategorizedTool } from './category.service';
import { Tool } from './api.service';

describe('CategoryService', () => {
  let service: CategoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CategoryService]
    });
    service = TestBed.inject(CategoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCategories', () => {
    it('should return all predefined categories', () => {
      const categories = service.getCategories();
      
      expect(categories).toBeDefined();
      expect(categories.length).toBeGreaterThan(0);
      
      // Check that all categories have required properties
      categories.forEach(category => {
        expect(category.id).toBeDefined();
        expect(category.name).toBeDefined();
        expect(category.icon).toBeDefined();
        expect(category.description).toBeDefined();
      });
    });

    it('should include expected categories', () => {
      const categories = service.getCategories();
      const categoryIds = categories.map(c => c.id);
      
      expect(categoryIds).toContain('system');
      expect(categoryIds).toContain('apps');
      expect(categoryIds).toContain('security');
      expect(categoryIds).toContain('files');
      expect(categoryIds).toContain('user');
      expect(categoryIds).toContain('process');
      expect(categoryIds).toContain('disk');
      expect(categoryIds).toContain('network');
      expect(categoryIds).toContain('log');
      expect(categoryIds).toContain('update');
      expect(categoryIds).toContain('policy');
    });
  });

  describe('getCategoryById', () => {
    it('should return category by id', () => {
      const category = service.getCategoryById('system');
      
      expect(category).toBeDefined();
      expect(category?.id).toBe('system');
      expect(category?.name).toBe('Sistema');
      expect(category?.icon).toBe('⚙️');
    });

    it('should return undefined for non-existent category', () => {
      const category = service.getCategoryById('non-existent');
      
      expect(category).toBeUndefined();
    });

    it('should return undefined for null id', () => {
      const category = service.getCategoryById(null as any);
      
      expect(category).toBeUndefined();
    });

    it('should return undefined for undefined id', () => {
      const category = service.getCategoryById(undefined as any);
      
      expect(category).toBeUndefined();
    });
  });

  describe('categorizeTools', () => {
    it('should categorize tools by name prefix', () => {
      const tools: Tool[] = [
        {
          name: 'system.list_services',
          description: 'List system services',
          requiresConfirmation: false,
          osSupport: ['windows']
        },
        {
          name: 'system.get_uptime',
          description: 'Get system uptime',
          requiresConfirmation: false,
          osSupport: ['windows']
        },
        {
          name: 'apps.install',
          description: 'Install application',
          requiresConfirmation: true,
          osSupport: ['windows']
        },
        {
          name: 'network.test_connectivity',
          description: 'Test network connectivity',
          requiresConfirmation: false,
          osSupport: ['windows']
        }
      ];

      const categorized = service.categorizeTools(tools);
      
      expect(categorized.size).toBeGreaterThan(0);
      expect(categorized.get('system')?.length).toBe(2);
      expect(categorized.get('apps')?.length).toBe(1);
      expect(categorized.get('network')?.length).toBe(1);
    });

    it('should add category property to categorized tools', () => {
      const tools: Tool[] = [
        {
          name: 'system.list_services',
          description: 'List system services',
          requiresConfirmation: false,
          osSupport: ['windows']
        }
      ];

      const categorized = service.categorizeTools(tools);
      const systemTools = categorized.get('system');
      
      expect(systemTools).toBeDefined();
      expect(systemTools?.length).toBe(1);
      expect(systemTools?.[0].category).toBe('system');
      expect(systemTools?.[0].name).toBe('List Services');
    });

    it('should handle empty tools array', () => {
      const categorized = service.categorizeTools([]);
      
      expect(categorized.size).toBeGreaterThan(0);
      // All categories should be empty
      categorized.forEach(tools => {
        expect(tools.length).toBe(0);
      });
    });

    it('should handle tools with unknown categories', () => {
      const tools: Tool[] = [
        {
          name: 'unknown.tool',
          description: 'Unknown tool',
          requiresConfirmation: false,
          osSupport: ['windows']
        }
      ];

      // This should not throw an error
      expect(() => service.categorizeTools(tools)).not.toThrow();
    });

    it('should preserve all tool properties', () => {
      const tools: Tool[] = [
        {
          name: 'system.list_services',
          description: 'List system services',
          requiresConfirmation: false,
          osSupport: ['windows'],
          parameters: { type: 'object' }
        }
      ];

      const categorized = service.categorizeTools(tools);
      const systemTools = categorized.get('system');
      const tool = systemTools?.[0];
      
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('List Services');
      expect(tool?.description).toBe('List system services');
      expect(tool?.requiresConfirmation).toBe(false);
      expect(tool?.category).toBe('system');
    });

    it('should handle tools with multiple dots in name', () => {
      const tools: Tool[] = [
        {
          name: 'system.subsystem.tool',
          description: 'Subsystem tool',
          requiresConfirmation: false,
          osSupport: ['windows']
        }
      ];

      const categorized = service.categorizeTools(tools);
      const systemTools = categorized.get('system');
      
      expect(systemTools).toBeDefined();
      expect(systemTools?.length).toBe(1);
      expect(systemTools?.[0].category).toBe('system');
    });

    it('should handle tools without dots in name', () => {
      const tools: Tool[] = [
        {
          name: 'singletool',
          description: 'Single tool',
          requiresConfirmation: false,
          osSupport: ['windows']
        }
      ];

      // This should not throw an error
      expect(() => service.categorizeTools(tools)).not.toThrow();
    });
  });

  describe('category structure', () => {
    it('should have consistent category structure', () => {
      const categories = service.getCategories();
      
      categories.forEach(category => {
        expect(typeof category.id).toBe('string');
        expect(typeof category.name).toBe('string');
        expect(typeof category.icon).toBe('string');
        expect(typeof category.description).toBe('string');
        expect(category.id.length).toBeGreaterThan(0);
        expect(category.name.length).toBeGreaterThan(0);
        expect(category.icon.length).toBeGreaterThan(0);
        expect(category.description.length).toBeGreaterThan(0);
      });
    });

    it('should have unique category ids', () => {
      const categories = service.getCategories();
      const ids = categories.map(c => c.id);
      const uniqueIds = [...new Set(ids)];
      
      expect(ids.length).toBe(uniqueIds.length);
    });
  });

  describe('edge cases', () => {
    it('should handle null tools array', () => {
      expect(() => service.categorizeTools(null as any)).toThrow();
    });

    it('should handle undefined tools array', () => {
      expect(() => service.categorizeTools(undefined as any)).toThrow();
    });

    it('should handle tools with null names', () => {
      const tools = [
        { name: null as any, description: 'Test', requiresConfirmation: false }
      ];
      
      expect(() => service.categorizeTools(tools)).toThrow();
    });

    it('should handle tools with empty names', () => {
      const tools = [
        { name: '', description: 'Test', requiresConfirmation: false }
      ];
      
      expect(() => service.categorizeTools(tools)).not.toThrow();
    });
  });
});
