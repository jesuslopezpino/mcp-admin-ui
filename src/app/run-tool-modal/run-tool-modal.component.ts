import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService, ToolDetails, ExecuteResult, Suggestion } from '../services/api.service';
import { Observable, Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil, of } from 'rxjs';
import { TerminalOutputComponent } from '../components/terminal-output/terminal-output.component';

@Component({
  selector: 'app-run-tool-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TerminalOutputComponent],
  templateUrl: './run-tool-modal.component.html',
  styleUrl: './run-tool-modal.component.scss'
})
export class RunToolModalComponent implements OnInit, OnDestroy {
  @Input() tool: ToolDetails | null = null;
  @Input() assetId?: string | null;
  @Output() close = new EventEmitter<void>();
  @Output() execute = new EventEmitter<{tool: ToolDetails, arguments: any, userConfirmed: boolean}>();

  form: FormGroup;
  suggestions: Suggestion[] = [];
  isLoading = false;
  isExecuting = false;
  executionResult: ExecuteResult | null = null;
  showConfirmation = false;

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.form = this.fb.group({});
  }

  ngOnInit() {
    if (this.tool) {
      this.buildForm();
      this.setupAutocomplete();
      this.loadSavedArguments();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForm() {
    if (!this.tool?.jsonSchema) return;

    const schema = this.tool.jsonSchema;
    const controls: any = {};

    if (schema.properties) {
      Object.keys(schema.properties).forEach(key => {
        const prop = schema.properties[key];
        const validators = [];
        
        if (schema.required?.includes(key)) {
          validators.push(Validators.required);
        }

        // Set default value
        const defaultValue = prop.default || this.getDefaultValue(prop.type);
        controls[key] = [defaultValue, validators];
      });
    }

    this.form = this.fb.group(controls);
  }

  private getDefaultValue(type: string): any {
    switch (type) {
      case 'boolean': return false;
      case 'integer': return 0;
      case 'string': return '';
      default: return null;
    }
  }

  private setupAutocomplete() {
    if (this.tool?.name !== 'apps.install') return;

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.length < 2) {
          return of([]);
        }
        return this.apiService.suggestWinget(query);
      }),
      takeUntil(this.destroy$)
    ).subscribe(suggestions => {
      this.suggestions = suggestions;
    });
  }

  private loadSavedArguments() {
    if (!this.tool) return;

    const saved = localStorage.getItem(`mcp.ui.lastArgs.${this.tool.name}`);
    if (saved) {
      try {
        const args = JSON.parse(saved);
        this.form.patchValue(args);
      } catch (e) {
        console.warn('Error loading saved arguments:', e);
      }
    }
  }

  private saveArguments() {
    if (!this.tool) return;

    try {
      localStorage.setItem(`mcp.ui.lastArgs.${this.tool.name}`, JSON.stringify(this.form.value));
    } catch (e) {
      console.warn('Error saving arguments:', e);
    }
  }

  onSearch(query: string) {
    if (this.tool?.name === 'apps.install') {
      this.searchSubject.next(query);
    }
  }

  onSuggestionSelect(suggestion: Suggestion) {
    this.form.patchValue({ name: suggestion.id });
    this.suggestions = [];
  }

  onExecute() {
    if (!this.tool || this.form.invalid) return;

    this.saveArguments();

    if (this.tool.requiresConfirmation) {
      this.showConfirmation = true;
    } else {
      this.executeTool();
    }
  }

  onConfirm() {
    this.showConfirmation = false;
    this.executeTool();
  }

  onCancel() {
    this.showConfirmation = false;
  }

  private executeTool() {
    if (!this.tool) return;

    this.isExecuting = true;
    this.executionResult = null;

    const execution$ = this.assetId 
      ? this.apiService.executeForAsset(this.assetId, this.tool.name, this.form.value, true)
      : this.apiService.executeDirect(this.tool.name, this.form.value, true);

    execution$.subscribe({
      next: (result) => {
        this.executionResult = result;
        this.isExecuting = false;
        this.execute.emit({
          tool: this.tool!,
          arguments: this.form.value,
          userConfirmed: true
        });
      },
      error: (error) => {
        console.error('Execution error:', error);
        this.isExecuting = false;
        alert(`Error ejecutando herramienta: ${error.message || 'Error desconocido'}`);
      }
    });
  }

  onClose() {
    this.close.emit();
  }


  getFieldType(prop: any): string {
    if (prop.enum) return 'select';
    if (prop.type === 'boolean') return 'checkbox';
    if (prop.type === 'integer') return 'number';
    return 'text';
  }

  getFieldOptions(prop: any): any[] {
    return prop.enum || [];
  }

  getFieldPlaceholder(prop: any): string {
    return prop.description || '';
  }

  getFieldMin(prop: any): number | null {
    return prop.minimum || null;
  }

  getFieldMax(prop: any): number | null {
    return prop.maximum || null;
  }

  getFieldRequired(prop: any): boolean {
    return this.tool?.jsonSchema?.required?.includes(prop) || false;
  }

  getFieldNames(): string[] {
    return this.tool?.jsonSchema?.properties ? Object.keys(this.tool.jsonSchema.properties) : [];
  }

  getFieldLabel(fieldName: string): string {
    const prop = this.tool?.jsonSchema?.properties?.[fieldName];
    return prop?.description || fieldName;
  }


  getStatusIcon(status: string): string {
    switch (status) {
      case 'SUCCESS': return '✅';
      case 'FAILURE': return '❌';
      case 'ERROR': return '⚠️';
      default: return '❓';
    }
  }

  getDestinationDisplay(): string {
    return this.assetId ? `Asset: ${this.assetId}` : 'Servidor (local)';
  }
}
