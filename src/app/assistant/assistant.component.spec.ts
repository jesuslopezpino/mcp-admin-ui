import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AssistantComponent } from './assistant.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('AssistantComponent', () => {
  let component: AssistantComponent;
  let fixture: ComponentFixture<AssistantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [AssistantComponent],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
})
    .compileComponents();
    
    fixture = TestBed.createComponent(AssistantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
