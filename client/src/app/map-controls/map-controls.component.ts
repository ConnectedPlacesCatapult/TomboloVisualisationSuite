import {Component, HostBinding, OnInit} from '@angular/core';
import * as Debug from 'debug';
import {MapRegistry} from '../mapbox/map-registry.service';
import {ActivatedRoute} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {MapService} from '../map-service/map.service';
import {ICONS} from '../tombolo-theme/icons';
import {TomboloMapboxMap} from '../mapbox/tombolo-mapbox-map';
import {BookmarkService} from '../bookmark-service/bookmark.service';
import {DialogsService} from '../dialogs/dialogs.service';
import {Location} from '@angular/common';
import {RecipeDialog} from "../dialogs/recipe-dialog/recipe-dialog.component";
import {MatDialog} from "@angular/material";

const debug = Debug('tombolo:maps-demo');

@Component({
  selector: 'map-controls',
  templateUrl: './map-controls.html',
  styleUrls: ['./map-controls.scss']
})
export class MapControlsComponent implements OnInit {

  sliderValue = 4;

  constructor(
    private mapRegistry: MapRegistry,
    private bookmarkService: BookmarkService,
    private dialogsService: DialogsService,
    private location: Location,
    private dialog: MatDialog) {}

  ngOnInit() {

  }

  ngOnDestroy() {
  }

  basemapSliderChanged(event) {

    this.mapRegistry.getMap<TomboloMapboxMap>('main-map').then(map => {
      map.setBasemapDetail(event.value);
    });
  }

  postBookmark(): void {
    this.bookmarkService.postBookmark(this.location.path()).subscribe(res => {
      this.dialogsService.share('Share your Map', res['shortUrl']);
    });
  }

  showRecipeDialog(): void {
    this.mapRegistry.getMap<TomboloMapboxMap>('main-map').then(map => {
      const recipe = JSON.stringify(map.getStyle()['metadata']['recipe']);
      let dialogRef = this.dialog.open(RecipeDialog, {data: {recipe: recipe}, width: '400px'});
    });
  }
}
