import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationComponent } from './notification.component';
import { NotificationService, Notification } from '../../services/notification.service';
import { of } from 'rxjs';

describe('NotificationComponent', () => {
  let component: NotificationComponent;
  let fixture: ComponentFixture<NotificationComponent>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;

  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: 'success',
      title: 'Success',
      message: 'Operation completed successfully',
      duration: 5000,
      timestamp: new Date()
    },
    {
      id: '2',
      type: 'error',
      title: 'Error',
      message: 'Operation failed',
      duration: 0,
      timestamp: new Date()
    }
  ];

  beforeEach(async () => {
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['dismiss']);

    await TestBed.configureTestingModule({
      imports: [NotificationComponent],
      providers: [
        { provide: NotificationService, useValue: notificationServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationComponent);
    component = fixture.componentInstance;
    mockNotificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    
    // Mock the notifications$ observable
    const mockObservable = of(mockNotifications);
    Object.defineProperty(mockNotificationService, 'notifications$', {
      value: mockObservable,
      writable: true,
      configurable: true
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should subscribe to notifications', () => {
      expect(component.notifications).toEqual(mockNotifications);
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from notifications', () => {
      spyOn(component['subscription'], 'unsubscribe');
      
      component.ngOnDestroy();
      
      expect(component['subscription'].unsubscribe).toHaveBeenCalled();
    });
  });

  describe('dismiss', () => {
    it('should call notification service dismiss', () => {
      component.dismiss('1');
      
      expect(mockNotificationService.dismiss).toHaveBeenCalledWith('1');
    });
  });

  describe('getIcon', () => {
    it('should return correct icons for different types', () => {
      expect(component.getIcon('success')).toBe('✅');
      expect(component.getIcon('error')).toBe('❌');
      expect(component.getIcon('warning')).toBe('⚠️');
      expect(component.getIcon('info')).toBe('ℹ️');
      expect(component.getIcon('unknown')).toBe('ℹ️');
    });
  });

  describe('getTypeClass', () => {
    it('should return correct CSS classes', () => {
      expect(component.getTypeClass('success')).toBe('notification-success');
      expect(component.getTypeClass('error')).toBe('notification-error');
      expect(component.getTypeClass('warning')).toBe('notification-warning');
      expect(component.getTypeClass('info')).toBe('notification-info');
    });
  });

  describe('trackByNotificationId', () => {
    it('should return notification id for tracking', () => {
      const notification = mockNotifications[0];
      
      expect(component.trackByNotificationId(0, notification)).toBe('1');
    });
  });

  describe('formatMessage', () => {
    it('should escape HTML characters', () => {
      const message = '<script>alert("xss")</script>';
      const formatted = component.formatMessage(message);
      
      expect(formatted).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
    });

    it('should convert newlines to HTML breaks', () => {
      const message = 'Line 1\nLine 2\nLine 3';
      const formatted = component.formatMessage(message);
      
      expect(formatted).toBe('Line 1<br>Line 2<br>Line 3');
    });

    it('should handle empty message', () => {
      const formatted = component.formatMessage('');
      
      expect(formatted).toBe('');
    });

    it('should handle message with both HTML and newlines', () => {
      const message = '<b>Bold</b>\n<script>alert("xss")</script>\nNormal text';
      const formatted = component.formatMessage(message);
      
      expect(formatted).toBe('&lt;b&gt;Bold&lt;/b&gt;<br>&lt;script&gt;alert("xss")&lt;/script&gt;<br>Normal text');
    });
  });

  describe('component state', () => {
    it('should initialize with empty notifications array', () => {
      const newComponent = new NotificationComponent(mockNotificationService);
      
      expect(newComponent.notifications).toEqual([]);
    });

    it('should handle notifications subscription', () => {
      const newNotifications: Notification[] = [
        {
          id: '3',
          type: 'info',
          title: 'Info',
          message: 'Information message',
          duration: 3000,
          timestamp: new Date()
        }
      ];
      
      // Update the mock observable
      mockNotificationService.notifications$ = of(newNotifications);
      
      component.ngOnInit();
      
      expect(component.notifications).toEqual(newNotifications);
    });
  });
});
