import {Component, EventEmitter, HostBinding, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import * as Debug from 'debug';
import {ActivatedRoute, Router} from '@angular/router';
import {MapService} from '../services/map-service/map.service';
import {UploaderOptions, UploadInput, UploadOutput} from 'ngx-uploader';
import {environment} from '../../environments/environment';
import {Subject} from 'rxjs/Subject';
import {Subscription} from 'rxjs/Subscription';
import {MatDialog} from '@angular/material';
import {UploadDialogComponent, UploadDialogContext} from './upload-dialog/upload-dialog.component';
import {AuthService} from '../auth/auth.service';
import {Observable} from 'rxjs/Observable';
import {User} from '../auth/user';
import {DatasetsDialog} from '../dialogs/datasets-dialog/datasets-dialog.component';
import {ITomboloMap} from '../../../../src/shared/ITomboloMap';
import {ITomboloDataset} from '../../../../src/shared/ITomboloDataset';
import {DialogsService} from '../dialogs/dialogs.service';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/mergeMap';
import {NotificationService} from '../dialogs/notification.service';
import 'rxjs/add/observable/forkJoin';
import {MapRegistry} from '../mapbox/map-registry.service';
import {TomboloMapboxMap} from '../mapbox/tombolo-mapbox-map';
import {APP_CONFIG, AppConfig} from '../config.service';
import {IStyle} from "../../../../src/shared/IStyle";


const debug = Debug('tombolo:map-editor');

@Component({
  selector: 'map-editor',
  templateUrl: './map-editor.html',
  styleUrls: ['./map-editor.scss']
})
export class MapEditorComponent implements OnInit, OnDestroy  {

  @HostBinding('class.sidebar-component') sidebarComponentClass = true;

  options: UploaderOptions;

  userMaps: ITomboloMap[] = [];
  userDatasets: ITomboloDataset[] = [];

  uploadInput = new EventEmitter<UploadInput>();
  uploadOutput = new Subject<UploadOutput>();
  dragOver: boolean;

  @ViewChild('fileUploadInput') fileUploadInput;

  private _subs: Subscription[] = [];

  constructor(
              private router: Router,
              private activatedRoute: ActivatedRoute,
              private mapService: MapService,
              private mapRegistry: MapRegistry,
              private authService: AuthService,
              private dialogsService: DialogsService,
              private matDialog: MatDialog,
              private notificationService: NotificationService,
              @Inject(APP_CONFIG) private config: AppConfig) {}

  ngOnInit() {
    this.activatedRoute.params.subscribe(params => {

      const mapId = params.mapID || null;

      if (mapId === null) {
        // Redirect to default map
        this.router.navigate(['/', {outlets: {
          primary: ['edit', this.config.defaultMap],
          loginBar: null,
          rightBar: ['editinfo']}}]);
        return
      }
      else {
        this.loadMap(mapId);
      }
    });

    this._subs.push(this.uploadOutput.subscribe(event => {
      this.handleUploadOutput(event);
    }));

    this._subs.push(this.authService.user$.subscribe(user => {
      this.loadUserMaps(user);
      this.loadUserDatasets(user);
    }));

    this._subs.push(this.mapService.mapsUpdated$().subscribe(() => {
      this.loadUserMaps(this.authService.getUserSync());
    }));

    this._subs.push(this.mapService.datasetsUpdated$().subscribe(() => {
      this.loadUserDatasets(this.authService.getUserSync());
    }));
  }

  ngOnDestroy() {
    this._subs.forEach(sub => sub.unsubscribe());
  }

  loadMap(mapID: string) {

    debug('Editing mapID:', mapID);

    if (!mapID || mapID === 'undefined') return;

    this.mapService.loadMap(mapID).then(map => {
      //map.setBasemapDetail(this.basemapDetailSliderValue);
    });
  }

  loadUserMaps(user: User) {
    if (user) {
      this.mapService.loadUserMaps(user.id).subscribe(maps => this.userMaps = maps);
    }
  }

  loadUserDatasets(user: User) {
    if (user) {
      this.mapService.loadUserDatasets(user.id).subscribe(datasets => this.userDatasets = datasets);
    }
  }

  backToView() {

    this.mapRegistry.getMap<TomboloMapboxMap>('main-map').then(map => {
      let route;

      if (map.id) {
        route = ['/', {
          outlets: {
            primary: ['view', map.id],
            loginBar: null,
            rightBar: [map.id === this.config.defaultMap ? 'appinfo' : map.rightBarRoute]
          }
        }]
      }
      else {
        route = ['/', {
          outlets: {
            primary: ['edit'],
            loginBar: null,
            rightBar: ['appinfo']
          }
        }]
      }

      this.router.navigate(route, {
        queryParamsHandling: 'merge'
      });
    });
  }

  handleUploadOutput(output: UploadOutput): void {
    if (output.type === 'allAddedToQueue') {
      debug('All added', output);
      this.dragOver = false;

      // Check if uploads are disabled
      if (!this.config.uploadEnabled) {
        this.dialogsService
          .information('Upload Disabled', 'Uploading your own data is currently disabled.')
          .subscribe();
      }
      // Prompt for login
      else if (!this.authService.getUserSync()) {
        this.dialogsService
          .confirm('Login', 'You must be logged in to upload data.', 'Go to login')
          .filter(ok => ok)
          .subscribe(() => {
            this.router.navigate([{outlets: {loginBox: 'login'}}]);
          });
      }
      else {
        this.showUploadDialog();
      }
    }
    else if (output.type === 'dragOver') {
      this.dragOver = true;
    }
    else if (output.type === 'dragOut') {
      this.dragOver = false;
    }
  }

  /**
   * Check if user is logged before uploading data
   * @returns {boolean}
   */
  checkUpload(): boolean {
    if (!this.authService.getUserSync()) {
      this.dialogsService
        .confirm('Login', 'You must be logged in to upload data.', 'Go to login')
        .filter(ok => ok)
        .subscribe(() => {
          this.router.navigate([{outlets: {loginBox: 'login'}}]);
        });

      return false;
    }

    return true;
  }

  showUploadDialog(startUpload: boolean = true) {
    const dialogRef = this.matDialog.open<UploadDialogComponent>(UploadDialogComponent, {
      disableClose: startUpload,
      maxWidth: '900px',
      data: {
        uploadInput$: this.uploadInput,
        uploadOutput$: this.uploadOutput
      }
    });

    if (startUpload) {
      dialogRef.afterOpen().subscribe(() => {
        // Start upload *after* dialog has opened to give it chance
        // to subscript to upload events

        this.startUpload();
      });
    }

    dialogRef.afterClosed()
      .do(() => {
        // Cancel all uploads
        this.uploadInput.next({type: 'cancelAll'});
        this.fileUploadInput.nativeElement.value = null;
        this.mapService.notifyDatasetsUpdated();
      })
      .filter(d => !!d).subscribe((context: UploadDialogContext) => {
      if (context.openInMap) {
        this.mapService.createMapForUpload(context.file.id).subscribe(map => {
          this.mapService.notifyMapsUpdated();
          this.router.navigate(['/', {outlets: {primary: ['edit', map.id], rightBar: ['editpanel']}}]);
        });
      }
    });
  }

  startUpload(): void {
    const event: UploadInput = {
      type: 'uploadAll',
      url: `${environment.apiEndpoint}/uploads`,
      method: 'POST',
      data: { foo: 'bar' }
    };

    this.uploadInput.emit(event);
  }

  browsePublicDatasets() {
    const dialogRef = this.matDialog.open<DatasetsDialog>(DatasetsDialog, {width: '800px'});
    const user = this.authService.getUserSync();
    let dataset;

      dialogRef.afterClosed()
        .filter(res => res.result)
        .filter(res => {
          const isExistingMode = (res['mode'] === 'existing');
          dataset = res['dataset'];
          if (isExistingMode) this.addDataLayerToMap(dataset);
          return !isExistingMode;
        })
        .filter(() => {
          if (!user) {
            this.dialogsService.information('Not logged in', 'You must be logged in to create a new map.')
            return false;
          }
          return true;
        })
        .mergeMap(() => {
          return this.mapRegistry.getMap<TomboloMapboxMap>('main-map')
        })
        .mergeMap((map) => {
          map.newMap(user.id);
          return this.internalSaveMap(map);
        })
        .mergeMap((style) => {
          const mapId = style['metadata']['mapDefinition']['id'];
          // Navigate back to editor with the new map
          this.router.navigate(['/', {
            outlets: {
              primary: ['edit', mapId],
              loginBar: null,
              rightBar: ['editpanel']
            }
          }]);
          return this.mapService.loadMap(mapId);
        })
        .subscribe((map) => {
          this.addDataLayerToMap(dataset);
        });
  }

  private internalSaveMap(map: TomboloMapboxMap): Observable<IStyle> {
    debug(`Saving map ${map.id} for user ${map.ownerId}`);

    return this.mapService.saveMap(map)
      .do(() => {
        map.setModified(false);
        this.notificationService.info('Map saved');
        this.mapService.notifyMapsUpdated();
      })
      .catch(e => {
        return Observable.throw(e);
      });
  }

  /**
   * Add a new data layer to the map using the specified dataset
   *
   * @param {ITomboloDataset} dataset
   */
  addDataLayerToMap(dataset: ITomboloDataset) {

    // Note: to add a data layer we need a clean basemap to regenerate the style, a palette and
    // the full dataset object with nested data attributes

    this.mapRegistry.getMap<TomboloMapboxMap>('main-map').then(map => {
      Observable.forkJoin(
        this.mapService.loadBasemaps(),
        this.mapService.loadPalettes(),
        this.mapService.loadDataset(dataset.id))
        .subscribe(([basemaps, palettes, ds]) => {
        const basemap = basemaps.find(b => b.id === map.basemapId);
        map.addDataLayer(ds, basemap, palettes[0]);
      });
    });
  }

  deleteMap(map: ITomboloMap) {
    this.dialogsService.confirm(
      'Delete Map',
      `Are you sure you want to delete the map '${map.name}'.<p>This cannot be undone!`)
      .filter(ok => ok)
      .mergeMap(() => {
        return this.mapService.deleteMap(map.id);
      })
      .subscribe(() => {
        this.notificationService.info('Map deleted!');
        this.mapService.notifyMapsUpdated();
        this.router.navigate(['/edit']);
      });
  }

  deleteDataset(dataset: ITomboloDataset) {

    this.mapService.loadMapsForDataset(dataset.id)
      .mergeMap(maps => {

        let message;

        if (maps.length) {

          const list = `<ul>${maps.map(map => '<li>' + map.name + '</li>')}</ul>`;

          message = `There are maps that are using this dataset:
                        ${list}
                        Are you sure you want to continue?`;
        }
        else {
          message = `Are you sure you want to delete the dataset '${dataset.name}'?.<p>This cannot be undone!`;
        }

        return this.dialogsService.confirm('Delete Dataset', message);
      })
      .filter(ok => ok)
      .mergeMap(() => {
        return this.mapService.deleteDataset(dataset.id);
      })
      .subscribe(() => {
        this.notificationService.info('Dataset deleted!');
        this.mapService.notifyDatasetsUpdated();
      });
  }
}
