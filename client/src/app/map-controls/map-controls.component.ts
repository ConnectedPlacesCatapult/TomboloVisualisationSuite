import {Component, Inject, OnInit} from '@angular/core';
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
import {APP_CONFIG, AppConfig} from '../config.service';

const debug = Debug('tombolo:maps-demo');

@Component({
  selector: 'map-controls',
  templateUrl: './map-controls.html',
  styleUrls: ['./map-controls.scss']
})
export class MapControlsComponent implements OnInit {

  basemapDetailSliderValue = 4;
  map: TomboloMapboxMap;
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
    private notificationService: NotificationService,
    @Inject(APP_CONFIG) private config: AppConfig) {}

  private _subs: Subscription[] = [];

  ngOnInit() {

    // Initial setting of map
    this.mapRegistry.getMap<TomboloMapboxMap>('main-map').then(map => {
      this.mode = (this.router.routerState.snapshot.root.firstChild.url[0].path === 'edit') ? 'edit' : 'view';

      this._subs.push(map.modified$().subscribe(modified => {
        this.mapModified = modified;
      }));

      if (map.mapLoaded) {
        this.map = map;
      }
    });

    // Update name and description when map is loading
    this._subs.push(this.mapService.mapLoading$().subscribe(map => {
      this.map = null;
    }));

    // Update map when map is loaded
    this._subs.push(this.mapService.mapLoaded$().subscribe(map => {
      this.map = map;

      // Ensure basemap detail is applied whenever a map is loaded
      this.map.setBasemapDetail(this.basemapDetailSliderValue, false);
      this.updateURLforBasemapDetail();
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
    this.map.setBasemapDetail(event.value);
    this.updateURLforBasemapDetail();
  }

  postBookmark(): void {
    this.bookmarkService.postBookmark(this.location.path()).subscribe(res => {
      this.dialogsService.share('Share your Map', res['shortUrl']);
    });
  }

  editMap(): void {
    let route;

    if (this.map.id) {
      route = ['/', {outlets: {
        primary: ['edit', this.map.id],
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
  }

  showRecipeDialog(): void {
    this.dialogsService.recipe(this.map.recipe);
  }

  saveButtonEnabled(): boolean {
    return this.mapModified && !this._saving;
  }

  editButtonEnabled(): boolean {
    return this.mode === 'view' && this.map && this.map.id;
  }

  shareButtonEnabled(): boolean {
    return this.map && this.map.id && this.mode === 'view';
  }

  saveMap() {
    const user = this.authService.getUserSync();

    if (!this.config.saveEnabled) {
      this.dialogsService
        .information('Save Disabled', 'Saving maps is currently disabled.')
        .subscribe(() => {
        });
    }
    else if (!user) {
      this.dialogsService
        .confirm('Login', 'You must be logged in to save a map.', 'Go to login')
        .filter(ok => ok)
        .subscribe(() => {
          this.router.navigate([{outlets: {loginBox: 'login'}}]);
        });
    }
    else {
      this.map.defaultCenter = [this.map.getCenter().lng, this.map.getCenter().lat];
      this.map.defaultZoom = this.map.getZoom();

      if (user.id !== this.map.ownerId && user.hasRole('editor')) {
        // Warn editor before saving a map that they don't own
        this.dialogsService
          .confirm('Saving a Curated Map', `
                  You are about to save a map that you don't own.<p>
                  Are you sure you want to continue?`, 'Save')
          .filter(ok => ok)
          .mergeMap(() => this.internalSaveMap(this.map))
          .subscribe();
      }
      else if (user.id === this.map.ownerId) {
        // Save own map
        this.internalSaveMap(this.map).subscribe();
      }
      else {
        // User does not own the map - it needs to be copied before saving
        this.dialogsService
          .confirm('Save as Copy', `
                  You are editing a shared map.<p>
                  A copy wil be made and saved under your personal account.`, 'Save as Copy')
          .filter(ok => ok)
          .mergeMap(() => {
            // Copy and save map
            this.map.copyMap(user.id);
            return this.internalSaveMap(this.map);
          })
          .subscribe(() => {
            // Navigate back to editor with the new copied map
            this.router.navigate(['/', {
              outlets: {
                primary: ['edit', this.map.id],
                loginBar: null,
                rightBar: ['editpanel']
              }
            }]);
          });
      }
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
        this.mapService.notifyMapsUpdated();
        this._saving = false;
      })
      .catch(e => {
        this._saving = false;
        return Observable.throw(e);
      });
  }
}
