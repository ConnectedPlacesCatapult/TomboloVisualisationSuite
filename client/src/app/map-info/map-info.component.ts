import {Component, HostBinding, OnInit} from '@angular/core';
import * as Debug from 'debug';
import {BookmarkService} from "../bookmark-service/bookmark.service";
import {Location} from '@angular/common';
import {DialogsService} from "../dialogs/dialogs.service";
import {TomboloMapboxMap, TomboloMapStyle} from '../mapbox/tombolo-mapbox-map';
import {MapService} from '../map-service/map.service';
import {Subscription} from 'rxjs/Subscription';
import {MapRegistry} from '../mapbox/map-registry.service';

const debug = Debug('tombolo:map-info');

@Component({
  selector: 'map-info',
  templateUrl: './map-info.html',
  styleUrls: ['./map-info.scss']
})
export class MapInfoComponent implements OnInit {

  @HostBinding('class.sidebar-component') sidebarComponentClass = true;

  constructor(private mapService: MapService,
              private mapRegistry: MapRegistry,
              private dialogsService: DialogsService,
              private bookmarkService: BookmarkService,
              private location: Location) {}

  mapName: string;
  mapID: string;
  mapDescription: string;
  mapServiceSubscription: Subscription;

  ngOnInit() {

    // Initial setting of name and description
    this.mapRegistry.getMap<TomboloMapboxMap>('main-map').then(map => {
      const style = map.getStyle();
      this.mapName = style.name;
      this.mapDescription = style.metadata.description;
    });

    // Update name and description if map is loaded
    this.mapServiceSubscription = this.mapService.mapLoaded$().subscribe((mapStyle: TomboloMapStyle) => {
      this.mapName = mapStyle.name;
      this.mapDescription = mapStyle.metadata.description;
    });
  }

  ngOnDestroy() {
    this.mapServiceSubscription.unsubscribe();
  }

  postBookmark(): void {
    this.bookmarkService.postBookmark(this.location.path()).subscribe(res => {
      this.dialogsService.share('Share your Map', res['shortUrl']);
    });
  }

}
