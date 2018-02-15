/**
 * Main app module
 */
import 'hammerjs';
import {BrowserModule} from '@angular/platform-browser';
import {APP_INITIALIZER, NgModule} from '@angular/core';
import {AppComponent} from './app.component';
import {APP_CONFIG, ConfigService} from "./config.service";
import {environment} from "../environments/environment";
import {HttpClientModule} from "@angular/common/http";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {AppRoutingModule} from "./app-routing.module";
import {DialogsModule} from "./dialogs/index";
import {LocalStorageModule} from 'angular-2-local-storage';
import {FlexLayoutModule} from '@angular/flex-layout';
import {MaterialModule} from "./material/index";
import {NotificationService} from "./dialogs/notification.service";
import {MapRegistry} from "./mapbox/map-registry.service";
import {MapboxModule} from './mapbox/index';
import {CyclingDemoComponent} from './cyling-demo/cycling-demo.component';
import {BasemapDemoComponent} from './basemap-demo/basemap-demo.component';
import {MapsDemoComponent} from './maps-demo/maps-demo.component';
import {MapInfoComponent} from './map-info/map-info.component';
import {MarkdownModule} from 'ngx-md';
import {MapExportComponent} from "./map-export/map-export.component";
import {MatInputModule, MatTableModule} from "@angular/material";
import {BookmarkService} from "./bookmark-service/bookmark.service";
import {MapService} from './map-service/map.service';
import {TooltipRenderComponent} from "./tooltip-render/tooltip-render.component";
import {TooltipRenderService} from "./tooltip-render/tooltip-render.service";
import {CdkTableModule} from "@angular/cdk/table";
import {MatTooltipModule} from '@angular/material/tooltip';
import {ShareModule} from '@ngx-share/core';

// APP_INITIALIZER function to load server-defined app config at startup
export function ConfigLoader(configService: ConfigService) {
  return () => configService.load(`${environment.apiEndpoint}/config`);
}

export function AppConfigFactory(configService: ConfigService) {
  return configService.config;
}

@NgModule({
  entryComponents: [
    TooltipRenderComponent
  ],
  declarations: [
    AppComponent,
    CyclingDemoComponent,
    BasemapDemoComponent,
    MapsDemoComponent,
    MapInfoComponent,
    MapExportComponent,
    TooltipRenderComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    BrowserAnimationsModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    HttpClientModule,
    MarkdownModule.forRoot(),
    AppRoutingModule,
    MaterialModule,
    MapboxModule,
    MatTableModule,
    CdkTableModule,
    MatTooltipModule,
    ShareModule.forRoot(),
    LocalStorageModule.withConfig({
      prefix: 'tombolo',
      storageType: 'localStorage'
    }),
    DialogsModule
  ],
  providers: [
    BookmarkService,
    NotificationService,
    ConfigService,
    MapRegistry,
    MapService,
    TooltipRenderService,
    {
      // Load app config at startup
      provide: APP_INITIALIZER,
      useFactory: ConfigLoader,
      deps: [ConfigService],
      multi: true
    },
    {
      // Provide pre-loaded config
      provide: APP_CONFIG,
      useFactory: AppConfigFactory,
      deps: [ConfigService]
    }
    ],
  bootstrap: [AppComponent]
})
export class AppModule { }
