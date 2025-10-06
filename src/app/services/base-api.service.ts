import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BaseApiService {
  protected baseUrl = environment.baseUrl;
  protected apiKey = environment.apiKey;

  constructor(protected http: HttpClient) {}

  protected getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json'
    });
  }
}
