/**
 * Top-level routing module
 */

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {CyclingDemoComponent} from './cyling-demo/cycling-demo.component';
import {BasemapDemoComponent} from './basemap-demo/basemap-demo.component';
import {MapsDemoComponent} from './maps-demo/maps-demo.component';
import {MapInfoComponent} from './map-info/map-info.component';
import {MapExportComponent} from "./map-export/map-export.component";
import {MapEditorComponent} from './map-editor/map-editor.component';
import {IconsDemoComponent} from './icons-demo/icons-demo.component';
import {LoginDialogComponent} from './auth/login-dialog/login-dialog.component';
import {SignupDialogComponent} from './auth/signup-dialog/signup-dialog.component';
import {SignupConfirmationComponent} from './auth/signup-confirmation-dialog/signup-confirmation.component';
import {ChangePasswordDialogComponent} from './auth/change-password-dialog/change-password-dialog.component';
import {ResetPasswordDialogComponent} from './auth/reset-password-dialog/reset-password-dialog.component';
import {AccountInfoComponent} from './account-info/account-info.component';

const routes: Routes = [
  {
    path: 'cyclingdemo',
    component: CyclingDemoComponent
  },
  {
    path: 'basemaps',
    component: BasemapDemoComponent
  },
  {
    path: 'view',
    component: MapsDemoComponent
  },
  {
    path: 'icons',
    component: IconsDemoComponent
  },
  {
    path: 'mapdemo/:mapID',
    component: MapsDemoComponent
  },
  {
    path: 'edit',
    component: MapEditorComponent
  },
  {
    path: 'edit/:mapID',
    component: MapEditorComponent
  },
  {
    path: 'mapinfo',
    component: MapInfoComponent,
    outlet: 'rightBar'
  },
  {
    path: 'mapexport',
    component: MapExportComponent,
    outlet: 'rightBar'
  },
  {
    path: 'accountinfo',
    component: AccountInfoComponent,
    outlet: 'rightBar'
  },
  {
    path: 'login',
    component: LoginDialogComponent,
    outlet: 'loginBox'
  },
  {
    path: 'signup',
    component: SignupDialogComponent,
    outlet: 'loginBox'
  },
  {
    path: 'resetpassword',
    component: ResetPasswordDialogComponent,
    outlet: 'loginBox'
  },
  {
    path: 'changepassword',
    component: ChangePasswordDialogComponent,
    outlet: 'loginBox'
  },
  {
    path: 'signupconfirm',
    component: SignupConfirmationComponent,
    outlet: 'loginBox'
  },
  { path: '',
    redirectTo: '/view',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
