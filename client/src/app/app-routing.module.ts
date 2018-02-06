/**
 * Top-level routing module
 */

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {CyclingDemoComponent} from './cyling-demo/cycling-demo.component';
import {BasemapDemoComponent} from './basemap-demo/basemap-demo.component';

const routes: Routes = [
  {
    path: 'cyclingdemo',
    component: CyclingDemoComponent
  },
  {
    path: 'basemaps',
    component: BasemapDemoComponent
  },
 // { path: '',
 //   redirectTo: '/cyclingdemo',
 //   pathMatch: 'full'
 // }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
