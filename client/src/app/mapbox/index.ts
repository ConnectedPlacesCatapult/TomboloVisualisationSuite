import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapboxComponent } from './mapbox.component';
import { MaterialModule } from '../material';
import {ExportMap} from "./export-map";

@NgModule({
  imports: [
    CommonModule,
    MaterialModule
  ],
  declarations: [
    MapboxComponent
  ],
  exports: [
    MapboxComponent
  ],
  providers: [
  ]
})
export class MapboxModule {}
