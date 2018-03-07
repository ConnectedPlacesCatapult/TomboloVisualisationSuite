import {Component, OnInit} from '@angular/core';
import * as Debug from 'debug';
import {MapRegistry} from '../mapbox/map-registry.service';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {MapService} from '../services/map-service/map.service';
import {TomboloMapboxMap} from '../mapbox/tombolo-mapbox-map';
import {BookmarkService} from '../services/bookmark-service/bookmark.service';
import {DialogsService} from '../dialogs/dialogs.service';
import {Location} from '@angular/common';
import {Subscription} from 'rxjs/Subscription';
import {AuthService} from '../auth/auth.service';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/mergeMap';
import {NotificationService} from '../dialogs/notification.service';
import {IStyle} from '../../../../src/shared/IStyle';

const debug = Debug('tombolo:maps-demo');

@Component({
  selector: 'map-controls',
  templateUrl: './map-controls.html',
  styleUrls: ['./map-controls.scss']
})
export class MapControlsComponent implements OnInit {

  basemapDetailSliderValue = 4;
  mapId = null;
  mode: 'edit' | 'view' = 'view';
  mapModified = false;

  private _saving = false;

  constructor(
    private activatedRoute: ActivatedRoute,
    private mapRegistry: MapRegistry,
    private bookmarkService: BookmarkService,
    private dialogsService: DialogsService,
    private location: Location,
    private authService: AuthService,
    private mapService: MapService,
    private router: Router,
    private notificationService: NotificationService) {}

  private _subs: Subscription[] = [];

  ngOnInit() {

    // Ensure basemap detail is applied whenever a map is loaded
    this._subs.push(this.mapService.mapLoaded$().subscribe(map => {
      map.setBasemapDetail(this.basemapDetailSliderValue, false);
      this.updateURLforBasemapDetail();

      // Subscribe to map-modified notification
      this._subs.push(map.modified$().subscribe(modified => {
        this.mapModified = modified;
      }));
    }));

    // Extract mode and mapId from route
    this._subs.push(this.router.events.filter(event => event instanceof NavigationEnd)
      .subscribe((event: NavigationEnd) => {
        this.mapId = this.router.routerState.snapshot.root.firstChild.params['mapID'];
        this.mode = (this.router.routerState.snapshot.root.firstChild.url[0].path === 'edit')? 'edit' : 'view';
      }));

    this.activatedRoute.queryParams.subscribe(params => {
      if (params.basemapDetail) {
        this.basemapDetailSliderValue = +params.basemapDetail;
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

  editMap(): void {
    this.mapRegistry.getMap<TomboloMapboxMap>('main-map').then(map => {

      let route;

      if (map.id) {
        route = ['/', {outlets: {
          primary: ['edit', map.id],
          loginBar: null,
          rightBar: ['editpanel']}}]
      }
      else {
        route = ['/', {outlets: {
          primary: ['edit'],
          loginBar: null,
          rightBar: ['editinfo']}}]
      }

      this.router.navigate(route,{
        queryParamsHandling: 'merge'
      });
    });
  }

  showRecipeDialog(): void {
    this.mapRegistry.getMap<TomboloMapboxMap>('main-map').then(map => {
      this.dialogsService.recipe(map.recipe);
    });
  }

  saveButtonEnabled(): boolean {
    return this.mapModified && !this._saving;
  }

  editButtonEnabled(): boolean {
    return this.mode === 'view' && this.mapId;
  }

  shareButtonEnabled(): boolean {
    return this.mapId && this.mode === 'view';
  }

  saveMap() {
    const user = this.authService.getUserSync();

    if (!user) {
      this.dialogsService
        .confirm('Login', 'You must be logged in to save a map.', 'Go to login')
        .filter(ok => ok)
        .subscribe(() => {
          this.router.navigate([{outlets: {loginBox: 'login'}}]);
        });
    }
    else {
      this.mapRegistry.getMap<TomboloMapboxMap>('main-map').then(map => {

        map.defaultCenter = [map.getCenter().lng, map.getCenter().lat];
        map.defaultZoom = map.getZoom();

        if (user.hasRole('editor') || user.id === map.ownerId) {
          this.internalSaveMap(map).subscribe();
        }
        else {
          // Map needs to be copied
          // Editors can save any map. For normal users, a copy is made if the user doesn't
          // own the map.
          this.dialogsService
            .confirm('Save as Copy', `
                    You are editing a shared map.<p>
                    A copy wil be made and saved under your personal account.`, 'Save as Copy')
            .filter(ok => ok)
            .mergeMap(() => {
              // Copy and save map
              map.copyMap(user.id);
              return this.internalSaveMap(map);
            })
            .subscribe(() => {
              // Navigate back to editor with the new copied map
              this.router.navigate(['/', {
                outlets: {
                  primary: ['edit', map.id],
                  loginBar: null,
                  rightBar: ['editpanel']
                }
              }]);
            });
        }
      });
    }
  }

  private updateURLforBasemapDetail() {
    this.router.navigate([], {
      queryParamsHandling: 'merge',
      queryParams: {basemapDetail: this.basemapDetailSliderValue}
    })
  }

  private internalSaveMap(map: TomboloMapboxMap): Observable<IStyle> {
    debug(`Saving map ${map.id} for user ${map.ownerId}`);

    this._saving = true;

    return this.mapService.saveMap(map)
      .do(() => {
        map.setModified(false);
        this.notificationService.info('Map saved');
        this._saving = false;
      })
      .catch(e => {
        this._saving = false;
        return Observable.throw(e);
      });
  }
}
