/**
 * Config Service - loads app config from backend at app startup
 */

import { Injectable, InjectionToken } from '@angular/core';
import 'rxjs/add/operator/toPromise';
import {HttpClient} from "@angular/common/http";

// Injector token for config (string). Provided by app module
export const APP_CONFIG = new InjectionToken<AppConfig>('app.config');


export class AppConfig {
  tileUrl: string;
  authEndpoint: string;
  socialMediaTitle: string;
  socialMediaDescription: string;
  socialMediaTags: string;
  googleAnalyticsUserId: string;
  nominatimUrl: string;
}

@Injectable()
export class ConfigService {

  config: AppConfig;

  constructor(private http: HttpClient) {}

  load(configEndpoint) {
    return this.http.get<AppConfig>(configEndpoint)
     .toPromise()
     .then(config => this.config = config);
  }
}
