import { TestBed } from '@angular/core/testing';
import { NotificationService, Notification } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NotificationService]
    });
    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('show', () => {
    it('should create and emit a notification', () => {
      const notificationData = {
        type: 'success' as const,
        title: 'Test Title',
        message: 'Test Message',
        duration: 5000
      };

      let notificationCount = 0;
      service.notifications$.subscribe(notifications => {
        notificationCount = notifications.length;
        if (notificationCount === 1) {
          expect(notifications[0].type).toBe('success');
          expect(notifications[0].title).toBe('Test Title');
          expect(notifications[0].message).toBe('Test Message');
          expect(notifications[0].duration).toBe(5000);
          expect(notifications[0].id).toBeDefined();
          expect(notifications[0].timestamp).toBeInstanceOf(Date);
        }
      });

      service.show(notificationData);
      expect(notificationCount).toBe(1);
    });

    it('should generate unique IDs for notifications', () => {
      const notificationData = {
        type: 'info' as const,
        title: 'Test',
        message: 'Test'
      };

      const id1 = service.show(notificationData);
      const id2 = service.show(notificationData);

      expect(id1).not.toBe(id2);
    });

    it('should auto-dismiss notification after duration', (done) => {
      const notificationData = {
        type: 'info' as const,
        title: 'Test',
        message: 'Test',
        duration: 100 // Very short duration for testing
      };

      let notificationCount = 0;
      let doneCalled = false;
      service.notifications$.subscribe(notifications => {
        notificationCount = notifications.length;
        if (notificationCount === 0 && !doneCalled) {
          doneCalled = true;
          done();
        }
      });

      service.show(notificationData);

      // Wait for auto-dismiss
      setTimeout(() => {
        if (!doneCalled) {
          expect(notificationCount).toBe(0);
          done();
        }
      }, 150);
    });

    it('should not auto-dismiss notification with duration 0', () => {
      const notificationData = {
        type: 'error' as const,
        title: 'Test',
        message: 'Test',
        duration: 0
      };

      let notificationCount = 0;
      service.notifications$.subscribe(notifications => {
        notificationCount = notifications.length;
        if (notificationCount === 1) {
          expect(notifications[0].duration).toBe(0);
        }
      });

      service.show(notificationData);
      expect(notificationCount).toBe(1);
    });
  });

  describe('success', () => {
    it('should create success notification', () => {
      let notificationCount = 0;
      service.notifications$.subscribe(notifications => {
        notificationCount = notifications.length;
        if (notificationCount === 1) {
          expect(notifications[0].type).toBe('success');
          expect(notifications[0].title).toBe('Success Title');
          expect(notifications[0].message).toBe('Success Message');
          expect(notifications[0].duration).toBe(5000);
        }
      });

      service.success('Success Title', 'Success Message');
      expect(notificationCount).toBe(1);
    });

    it('should use custom duration', () => {
      let notificationCount = 0;
      service.notifications$.subscribe(notifications => {
        notificationCount = notifications.length;
        if (notificationCount === 1) {
          expect(notifications[0].duration).toBe(3000);
        }
      });

      service.success('Success Title', 'Success Message', 3000);
      expect(notificationCount).toBe(1);
    });
  });

  describe('error', () => {
    it('should create error notification', () => {
      let notificationCount = 0;
      service.notifications$.subscribe(notifications => {
        notificationCount = notifications.length;
        if (notificationCount === 1) {
          expect(notifications[0].type).toBe('error');
          expect(notifications[0].title).toBe('Error Title');
          expect(notifications[0].message).toBe('Error Message');
          expect(notifications[0].duration).toBe(0);
        }
      });

      service.error('Error Title', 'Error Message');
      expect(notificationCount).toBe(1);
    });

    it('should use custom duration', () => {
      let notificationCount = 0;
      service.notifications$.subscribe(notifications => {
        notificationCount = notifications.length;
        if (notificationCount === 1) {
          expect(notifications[0].duration).toBe(10000);
        }
      });

      service.error('Error Title', 'Error Message', 10000);
      expect(notificationCount).toBe(1);
    });
  });

  describe('warning', () => {
    it('should create warning notification', () => {
      let notificationCount = 0;
      service.notifications$.subscribe(notifications => {
        notificationCount = notifications.length;
        if (notificationCount === 1) {
          expect(notifications[0].type).toBe('warning');
          expect(notifications[0].title).toBe('Warning Title');
          expect(notifications[0].message).toBe('Warning Message');
          expect(notifications[0].duration).toBe(5000);
        }
      });

      service.warning('Warning Title', 'Warning Message');
      expect(notificationCount).toBe(1);
    });
  });

  describe('info', () => {
    it('should create info notification', () => {
      let notificationCount = 0;
      service.notifications$.subscribe(notifications => {
        notificationCount = notifications.length;
        if (notificationCount === 1) {
          expect(notifications[0].type).toBe('info');
          expect(notifications[0].title).toBe('Info Title');
          expect(notifications[0].message).toBe('Info Message');
          expect(notifications[0].duration).toBe(3000);
        }
      });

      service.info('Info Title', 'Info Message');
      expect(notificationCount).toBe(1);
    });
  });

  describe('dismiss', () => {
    it('should remove notification by id', () => {
      const notificationData = {
        type: 'info' as const,
        title: 'Test',
        message: 'Test'
      };

      let notificationCount = 0;
      service.notifications$.subscribe(notifications => {
        notificationCount = notifications.length;
      });

      const id = service.show(notificationData);
      expect(notificationCount).toBe(1);
      
      service.dismiss(id);
      expect(notificationCount).toBe(0);
    });

    it('should not affect other notifications', () => {
      const notificationData1 = {
        type: 'info' as const,
        title: 'Test 1',
        message: 'Test 1'
      };
      const notificationData2 = {
        type: 'success' as const,
        title: 'Test 2',
        message: 'Test 2'
      };

      let notificationCount = 0;
      let lastNotification: any = null;
      service.notifications$.subscribe(notifications => {
        notificationCount = notifications.length;
        if (notifications.length > 0) {
          lastNotification = notifications[notifications.length - 1];
        }
      });

      const id1 = service.show(notificationData1);
      const id2 = service.show(notificationData2);
      service.dismiss(id1);
      
      expect(notificationCount).toBe(1);
      expect(lastNotification?.title).toBe('Test 2');
    });
  });

  describe('dismissAll', () => {
    it('should remove all notifications', () => {
      const notificationData1 = {
        type: 'info' as const,
        title: 'Test 1',
        message: 'Test 1'
      };
      const notificationData2 = {
        type: 'success' as const,
        title: 'Test 2',
        message: 'Test 2'
      };

      let notificationCount = 0;
      service.notifications$.subscribe(notifications => {
        notificationCount = notifications.length;
      });

      service.show(notificationData1);
      service.show(notificationData2);
      expect(notificationCount).toBe(2);
      
      service.dismissAll();
      expect(notificationCount).toBe(0);
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = service['generateId']();
      const id2 = service['generateId']();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(id1.length).toBeGreaterThan(0);
      expect(id2.length).toBeGreaterThan(0);
    });
  });

  describe('multiple notifications', () => {
    it('should handle multiple notifications correctly', () => {
      let notificationCount = 0;
      let notifications: any[] = [];
      service.notifications$.subscribe(notif => {
        notificationCount = notif.length;
        notifications = notif;
      });

      service.info('Info', 'Info message');
      service.success('Success', 'Success message');
      service.error('Error', 'Error message');
      
      expect(notificationCount).toBe(3);
      expect(notifications[0].type).toBe('info');
      expect(notifications[1].type).toBe('success');
      expect(notifications[2].type).toBe('error');
    });
  });
});
