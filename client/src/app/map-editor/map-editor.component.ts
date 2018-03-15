import {Component, EventEmitter, HostBinding, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import * as Debug from 'debug';
import {ActivatedRoute, Router} from '@angular/router';
import {MapService} from '../services/map-service/map.service';
import {UploaderOptions, UploadInput, UploadOutput} from 'ngx-uploader';
import {environment} from '../../environments/environment';
import {Subject} from 'rxjs/Subject';
import {Subscription} from 'rxjs/Subscription';
import {MatDialog, MatDialogRef} from '@angular/material';
import {UploadDialogComponent, UploadDialogContext} from './upload-dialog/upload-dialog.component';
import {AuthService} from '../auth/auth.service';
import {Observable} from 'rxjs/Observable';
import {User} from '../auth/user';
import {DatasetsDialog, DatasetsDialogResult} from '../dialogs/datasets-dialog/datasets-dialog.component';
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
import {LngLatBounds as MapboxLngLatBounds} from 'mapbox-gl';


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


  /*

  Approach of resetting the current map to a clean state is dangerous. You didn't reset everything and in future if we need
  to add anything to mapDefinition to support new features then we'll need to remember that we also have to change a completely
  unrelated bit of code in newMap.

  Better approach is to start from the default map, which is guaranteed to be clean. The id of the default map is in the
  app config - config.defaultMap.

  - General principle: don't build fragility into the system by making bits of code dependent on each other when they
  don't need to be.

  - General principle: think through the implications of your chosen approach before starting coding.

  Also, your version only allows you to view a public dataset if you are logged in. This goes against the conventions in the
  app where you only need to be logged in to upload or save.

  Never use strings as flags (e.g. 'existing', 'new') unless they are typed (e.g. mode: 'new' | 'existing'). If you
  misspell them the compiler won't catch the error and you don't get code completion.

  Use a boolean instead if you can - it's self documenting and you don't need to remember the possible values.

  Alternatively use enums.

  If you're using object['property'] a lot then something is wrong. Use typed interfaces instead. Same reason, you
  can misspell the property name and the compiler won't help you.

  - General principle: use typed interfaces, method params, return types etc wherever you can. Help the compiler stop
    you making typos.

  - General principle: write every method as if someone else is going to use it (even if they're not). Help them
    out by using clear names and type information, and don't make them have to go through the method body to work out
    how to use the method.

  If you find yourself copying a large block of code from somewhere else in the codebase it's also a sign that something
  is wrong. If that block has to be changed, it now has to be done in two places. Is there a reason why it has to be copied
  or would it be better to refactor?

  I noticed that there were a couple of things that I'd done that were better to be centralised - resetting the map modified flag
  on save and calling notifyMaps/DatasetsUpdated. I moved them into mapService so whoever is calling saveMap, deleteDataset etc
  doesn't have to remember to call them.

  - General principle: leave the code in a better state than you found it when making a change (even if it is just adding a
  comment to clarify something or fixing the formatting). Code rots over time and you have to make a positive effort every time
  you make a change to stop that.

  - Final principle: if you break a rule then always have a good reason and document why you are doing it.

   */

  browsePublicDatasets() {
    const dialogRef: MatDialogRef<DatasetsDialog, DatasetsDialogResult>
      = this.matDialog.open<DatasetsDialog>(DatasetsDialog, {width: '800px'});

    // no chaining of observable operators so no need to capture dataset in outer scope
    // let dataset;

      dialogRef.afterClosed()
        .filter(res => res.result)
        .subscribe(res => {

          if (res.createNewMap) {
            // Load the default map - guaranteed to be clean
            this.mapService.loadMap(this.config.defaultMap).then(map => {

              // If user is logged in then make copy and add layer
              //
              // If the user is not logged in then its OK to let them edit the default map anyway.
              // If they later manage to log in  then the copy will happen at the point of save.
              const user = this.authService.getUserSync();
              if (user) map.copyMap(user.id);

              // Change name to match what you get when you create a map by uploading data
              map.name = `Map of ${res.dataset.name}`;

              // Zoom in on the data and set default zoom and center
              map.fitBounds(new MapboxLngLatBounds(res.dataset.extent), {animate: false});
              map.defaultZoom = map.getZoom();
              map.defaultCenter = map.getCenter().toArray();

              // addDataLayerToMap is actually asynchronous so we need to wait until it has finished before
              // doing anything else
              this.addDataLayerToMap(res.dataset, map).subscribe(() => {
                if (user) this.saveAndOpenNewMap(map);
              });
            });
          }
          else {
            // Add to current map
            this.mapRegistry.getMap<TomboloMapboxMap>('main-map')
              .then(map => this.addDataLayerToMap(res.dataset, map).subscribe());
          }
        });


  /*
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

          ***** getMap returns a promise but you're treating it as an observable by returning it in a
          * chain of observable operators. It works, which is surprising, but is a bit odd.

          return this.mapRegistry.getMap<TomboloMapboxMap>('main-map')
        })
        .mergeMap((map) => {
          map.newMap(user.id);
          return this.internalSaveMap(map);
        })
        .mergeMap((style) => {

          ****** This smells - you get map id by doing map.id

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
    */
  }

  // This method is not needed any more. And you copy'n'pasted it from map-controls
  // It's code smell to have the exact same code in more than one part of the codebase.
  // If we need to modify what happens when you save then we have to remember to do it in
  // two places if you copy it

  /*
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
  */

  /**
   * Add a new data layer to the map using the specified dataset
   *
   * @param {ITomboloDataset} dataset
   */
  addDataLayerToMap(dataset: ITomboloDataset, map: TomboloMapboxMap): Observable<void> {

    // Note: to add a data layer we need a clean basemap to regenerate the style, a palette and
    // the full dataset object with nested data attributes
    return Observable.forkJoin(
      this.mapService.loadBasemaps(),
      this.mapService.loadPalettes(),
      this.mapService.loadDataset(dataset.id))
      .map(([basemaps, palettes, ds]) => {
        const basemap = basemaps.find(b => b.id === map.basemapId);
        map.addDataLayer(ds, basemap, palettes[0]);
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
      });
  }

  /**
   * Save the specified map and then reopen it in the editor
   *
   * @param map
   */
  private saveAndOpenNewMap(map) {
    this.mapService.saveMap(map).subscribe(() => {
      this.router.navigate(['/', {
        outlets: {
          primary: ['edit', map.id],
          loginBar: null,
          rightBar: ['editpanel']}}]);
    });
  }
}
