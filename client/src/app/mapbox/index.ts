import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapboxComponent } from './mapbox.component';
import { MaterialModule } from '../material';

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
  ]
})
export class MapboxModule {}
