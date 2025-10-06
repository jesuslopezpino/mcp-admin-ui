import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { Tool, ToolDetails, Suggestion } from '../models/api';
import { JsonSchema } from '../models/json-schema';

@Injectable({
  providedIn: 'root'
})
export class ToolApiService extends BaseApiService {
  
  /**
   * Get all available tools
   */
  getTools(): Observable<Tool[]> {
    return this.http.get<Tool[]>(`${this.baseUrl}/tools`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get tool details by name
   */
  getTool(name: string): Observable<ToolDetails> {
    return this.http.get<ToolDetails>(`${this.baseUrl}/tools/${name}`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get JSON schema for a specific tool
   */
  getToolSchema(toolName: string): Observable<JsonSchema> {
    return this.http.get<JsonSchema>(`${this.baseUrl}/tools/${toolName}/schema`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Get winget suggestions
   */
  suggestWinget(query: string): Observable<Suggestion[]> {
    return this.http.get<Suggestion[]>(`${this.baseUrl}/tools/apps.install/suggest`, {
      headers: this.getHeaders(),
      params: { q: query }
    });
  }
}
