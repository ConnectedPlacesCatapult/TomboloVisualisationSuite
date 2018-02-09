import {Component, OnInit} from '@angular/core';
import * as Debug from 'debug';
import {MapRegistry} from '../mapbox/map-registry.service';
import {ActivatedRoute} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {Style} from 'mapbox-gl';
import {BookmarkService} from "../bookmark-service/bookmark.service";
import {Location} from '@angular/common';

const debug = Debug('tombolo:map-info');

@Component({
  selector: 'map-info',
  templateUrl: './map-info.html',
  styleUrls: ['./map-info.scss']
})
export class MapInfoComponent implements OnInit {

  constructor(private activatedRoute: ActivatedRoute,
              private httpClient: HttpClient,
              private mapRegistry: MapRegistry,
              private bookmarkService: BookmarkService,
              private location: Location) {}

  mapName: string;
  mapID: string;
  mapDescription: string;

  ngOnInit() {
    this.activatedRoute.params.subscribe(params => {
      this.mapID = params.mapID;
      this.loadMapInfo(params.mapID);
    });
  }

  ngOnDestroy() {
  }

  loadMapInfo(mapID: string) {
    debug('mapID:', mapID);
    if (!mapID) return;
    this.httpClient.get<Style>(`/maps/${mapID}/style.json`).subscribe(style => {
      this.mapName = style.name;
      this.mapDescription = style.metadata['description'];
    });
  }

  postBookmark(): void {
    this.bookmarkService.postBookmark(this.location.path()).subscribe(shortUrl => {
      console.log(shortUrl);
    });
  }
}
