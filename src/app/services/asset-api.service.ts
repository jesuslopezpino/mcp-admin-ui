import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { Asset, DiscoveryResult } from '../models/api';

@Injectable({
  providedIn: 'root'
})
export class AssetApiService extends BaseApiService {
  
  /**
   * Get all assets
   */
  getAssets(): Observable<Asset[]> {
    return this.http.get<Asset[]>(`${this.baseUrl}/assets`, {
      headers: this.getHeaders()
    });
  }

  /**
   * Discover assets on network
   */
  discoverAssets(): Observable<DiscoveryResult> {
    return this.http.post<DiscoveryResult>(`${this.baseUrl}/assets/discover`, {}, {
      headers: this.getHeaders()
    });
  }
}
