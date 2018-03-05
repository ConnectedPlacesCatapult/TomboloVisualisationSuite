import {Component, HostBinding, OnInit} from '@angular/core';
import * as Debug from 'debug';
import {TomboloMapboxMap} from '../../mapbox/tombolo-mapbox-map';
import {MapService} from '../../services/map-service/map.service';
import {Subscription} from 'rxjs/Subscription';
import {MapRegistry} from '../../mapbox/map-registry.service';
import {ActivatedRoute} from '@angular/router';
import {IPalette} from '../../../../../src/shared/IPalette';
import {IBasemap} from '../../../../../src/shared/IBasemap';
import {IMapLayer} from '../../../../../src/shared/IMapLayer';

const debug = Debug('tombolo:map-edit-panel');

@Component({
  selector: 'map-info',
  templateUrl: './edit-panel.html',
  styleUrls: ['./edit-panel.scss']
})
export class EditPanelComponent implements OnInit {

  @HostBinding('class.sidebar-component') sidebarComponentClass = true;

  constructor(private mapService: MapService,
              private mapRegistry: MapRegistry) {}

  _subs: Subscription[] = [];
  map: TomboloMapboxMap;
  basemaps: IBasemap[];
  palettes: IPalette[];

  ngOnInit() {

    // Initial setting of map
    this.mapRegistry.getMap<TomboloMapboxMap>('main-map').then(map => {
      debug('initial settting of map', map.mapLoaded);
      if (map.mapLoaded) {
        this.map = map;
      }
    });

    this.mapService.loadBasemaps().subscribe(basemaps => {
      this.basemaps = basemaps;
    });

    this.mapService.loadPalettes().subscribe(palettes => {
      this.palettes = palettes;
    });

    this._subs.push(this.mapService.mapLoading$().subscribe(() => {
      debug('Map is loading');
      // Clear map so that child components don't try to access map
      // while it is loading
      this.map = null;
    }));

    // Update when map loaded
    this._subs.push(this.mapService.mapLoaded$().subscribe(map => {
      debug('Edit panel got map', map.id);
      this.map = map;
    }));
  }

  ngOnDestroy() {
    this._subs.forEach(sub => sub.unsubscribe());
  }

  toggleLayerVisibility(layer: IMapLayer) {
    this.map.setDataLayerVisibility(layer.layerId, !layer.visible);
  }

  deleteLayer(layerId: string) {

  }

  eyeIconForLayer(layer: IMapLayer): string {
    return layer.visible ? 'eye' : 'eye-off';
  }

}
