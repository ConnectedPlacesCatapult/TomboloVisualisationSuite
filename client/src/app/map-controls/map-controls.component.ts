import {Component, OnInit} from '@angular/core';
import * as Debug from 'debug';
import {MapRegistry} from '../mapbox/map-registry.service';
import {ActivatedRoute} from '@angular/router';
import {MapService} from '../map-service/map.service';
import {TomboloMapboxMap} from '../mapbox/tombolo-mapbox-map';
import {BookmarkService} from '../bookmark-service/bookmark.service';
import {DialogsService} from '../dialogs/dialogs.service';
import {Location} from '@angular/common';
import {MatDialog} from '@angular/material';
import {Subscription} from 'rxjs/Subscription';

const debug = Debug('tombolo:maps-demo');

@Component({
  selector: 'map-controls',
  templateUrl: './map-controls.html',
  styleUrls: ['./map-controls.scss']
})
export class MapControlsComponent implements OnInit {

  sliderValue = 4;

  constructor(
    private activatedRoute: ActivatedRoute,
    private mapRegistry: MapRegistry,
    private bookmarkService: BookmarkService,
    private dialogsService: DialogsService,
    private location: Location,
    private dialog: MatDialog,
    private mapService: MapService) {}

  private _subs: Subscription[] = [];

  ngOnInit() {

    // Ensure basemap detail is applied whenever a map is loaded
    this._subs.push(this.mapService.mapLoaded$().subscribe(map => {
      map.setBasemapDetail(this.sliderValue);
      this.updateURLforBasemapDetail();
    }));

    this.activatedRoute.queryParams.subscribe(params => {
      if (params.basemapDetail) {
        this.sliderValue = +params.basemapDetail;
      }
    });
  }

  ngOnDestroy() {
    this._subs.forEach(sub => sub.unsubscribe());
  }

  basemapSliderChanged(event) {

    this.mapRegistry.getMap<TomboloMapboxMap>('main-map').then(map => {
      map.setBasemapDetail(event.value);
      this.updateURLforBasemapDetail();
    });
  }

  postBookmark(): void {
    this.bookmarkService.postBookmark(this.location.path()).subscribe(res => {
      this.dialogsService.share('Share your Map', res['shortUrl']);
    });
  }

  showRecipeDialog(): void {
    this.mapRegistry.getMap<TomboloMapboxMap>('main-map').then(map => {
      this.dialogsService.recipe(map.recipe);
    });
  }

  private updateURLforBasemapDetail() {
    const url = new URL(window.location.href);
    url.searchParams.set('basemapDetail', this.sliderValue.toString());
    this.location.replaceState(url.pathname, url.search);
  }

}
