import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ToolApiService } from './tool-api.service';
import { JsonSchema } from '../models/json-schema';

@Injectable({
  providedIn: 'root'
})
export class ToolSchemaService {
  constructor(private toolApiService: ToolApiService) {}

  /**
   * Get JSON schema for a specific tool
   * @param toolName Tool name
   * @returns Observable with JSON schema
   */
  getSchema(toolName: string): Observable<JsonSchema> {
    return this.toolApiService.getToolSchema(toolName);
  }
}
