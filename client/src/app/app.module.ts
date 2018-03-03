/**
 * Main app module
 */
import 'hammerjs';
import {BrowserModule, DomSanitizer} from '@angular/platform-browser';
import {APP_INITIALIZER, NgModule} from '@angular/core';
import {AppComponent} from './app.component';
import {APP_CONFIG, ConfigService} from './config.service';
import {environment} from '../environments/environment';
import {HttpClientModule} from '@angular/common/http';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AppRoutingModule} from './app-routing.module';
import {DialogsModule} from './dialogs/index';
import {LocalStorageModule} from 'angular-2-local-storage';
import {FlexLayoutModule} from '@angular/flex-layout';
import {MaterialModule} from './material/index';
import {NotificationService} from './dialogs/notification.service';
import {MapRegistry} from './mapbox/map-registry.service';
import {MapboxModule} from './mapbox/index';
import {MapViewerComponent} from './map-viewer/map-viewer.component';
import {MapInfoComponent} from './rightbar-panels/map-info/map-info.component';
import {MarkdownModule} from 'ngx-md';
import {MapExportComponent} from './map-export/map-export.component';
import {MatIconRegistry} from '@angular/material';
import {BookmarkService} from './services/bookmark-service/bookmark.service';
import {MapService} from './services/map-service/map.service';
import {TooltipRenderComponent} from './mapbox/tooltip-render/tooltip-render.component';
import {TooltipRenderService} from './mapbox/tooltip-render/tooltip-render.service';
import {ShareModule} from '@ngx-share/core';
import {MapEditorComponent} from './map-editor/map-editor.component';
import {NgUploaderModule} from 'ngx-uploader';
import {UploadDialogComponent} from './map-editor/upload-dialog/upload-dialog.component';
import {UploadPage1Component} from './map-editor/upload-dialog/upload-page1.component';
import {UploadPage2Component} from './map-editor/upload-dialog/upload-page2.component';
import {UploadPage3Component} from './map-editor/upload-dialog/upload-page3.component';
import {UploadPage4Component} from './map-editor/upload-dialog/upload-page4.component';

import {Angulartics2Module} from 'angulartics2';
import {CustomGoogleTagManager} from './analytics/custom-google-tag-manager';
import {RegisterIcons} from './tombolo-theme/icons';
import {MapControlsComponent} from './map-controls/map-controls.component';
import {LoginControlsComponent} from './auth/login-controls/login-controls.component';
import {LoginDialogComponent} from './auth/login-dialog/login-dialog.component';
import {SignupDialogComponent} from './auth/signup-dialog/signup-dialog.component';
import {AuthService} from './auth/auth.service';
import {SignupConfirmationComponent} from './auth/signup-confirmation-dialog/signup-confirmation.component';
import {ChangePasswordDialogComponent} from './auth/change-password-dialog/change-password-dialog.component';
import {ResetPasswordDialogComponent} from './auth/reset-password-dialog/reset-password-dialog.component';
import {AccountInfoComponent} from './rightbar-panels/account-info/account-info.component';
import {TermsAndConditionsComponent} from './rightbar-panels/terms-and-conditions/terms-and-conditions.component';
import {AppInfoComponent} from './rightbar-panels/app-info/app-info.component';
import {MyAccountDialogComponent} from './auth/my-account-dialog/my-account.component';
import {GeosearchComponent} from './map-viewer/geosearch/geosearch.component';
import {GeosearchService} from './map-viewer/geosearch/geosearch.service';
import {EditPanelComponent} from './map-editor/edit-panel/edit-panel.component';

// APP_INITIALIZER function to load server-defined app config at startup
export function ConfigLoader(configService: ConfigService) {
  return () => configService.load(`${environment.apiEndpoint}/config`);
}

export function AppConfigFactory(configService: ConfigService) {
  return configService.config;
}

@NgModule({
  entryComponents: [
    TooltipRenderComponent,
    UploadDialogComponent
  ],
  declarations: [
    AppComponent,
    MapViewerComponent,
    MapEditorComponent,
    MapInfoComponent,
    MapExportComponent,
    UploadDialogComponent,
    TooltipRenderComponent,
    UploadPage1Component,
    UploadPage2Component,
    UploadPage3Component,
    UploadPage4Component,
    MapControlsComponent,
    LoginControlsComponent,
    LoginDialogComponent,
    SignupDialogComponent,
    SignupConfirmationComponent,
    ChangePasswordDialogComponent,
    ResetPasswordDialogComponent,
    AccountInfoComponent,
    TermsAndConditionsComponent,
    AppInfoComponent,
    MyAccountDialogComponent,
    GeosearchComponent,
    EditPanelComponent
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
    NgUploaderModule,
    Angulartics2Module.forRoot([CustomGoogleTagManager]),
    ShareModule.forRoot(),
    LocalStorageModule.withConfig({
      prefix: 'tombolo',
      storageType: 'localStorage'
    }),
    DialogsModule
  ],
  providers: [
    BookmarkService,
    CustomGoogleTagManager,
    NotificationService,
    ConfigService,
    MapRegistry,
    MapService,
    TooltipRenderService,
    AuthService,
    GeosearchService,
    {
      // Load app config at startup
      provide: APP_INITIALIZER,
      useFactory: ConfigLoader,
      deps: [ConfigService],
      multi: true
    },
    {
      // Load app config at startup
      provide: APP_INITIALIZER,
      useFactory: RegisterIcons,
      deps: [MatIconRegistry, DomSanitizer],
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
