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
import {LoginComponent} from './auth/login-component/login.component';
import {SignupComponent} from './auth/signup-component/signup.component';

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
    path: 'mapdemo',
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
    path: 'login',
    component: LoginComponent,
    outlet: 'loginBox'
  },
  {
    path: 'signup',
    component: SignupComponent,
    outlet: 'loginBox'
  },
  { path: '',
    redirectTo: '/mapdemo',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
