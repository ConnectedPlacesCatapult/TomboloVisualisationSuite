import {Component, EventEmitter, HostBinding, OnDestroy, OnInit} from '@angular/core';
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

  private _subs: Subscription[] = [];

  constructor(
              private router: Router,
              private activatedRoute: ActivatedRoute,
              private mapService: MapService,
              private mapRegistry: MapRegistry,
              private authService: AuthService,
              private dialogsService: DialogsService,
              private matDialog: MatDialog,
              private notificationService: NotificationService) {}

  ngOnInit() {
    this.activatedRoute.params.subscribe(params => {
      this.loadMap(params.mapID);
    });

    this._subs.push(this.uploadOutput.subscribe(event => {
      this.handleUploadOutput(event);
    }));

    this._subs.push(this.authService.user$.subscribe(user => {
      this.loadUserMaps(user);
      this.loadUserDatasets(user);
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
    this.router.navigate(['/', {outlets: {primary: 'view', rightBar: 'appinfo'}}]);
  }

  handleUploadOutput(output: UploadOutput): void {
    if (output.type === 'allAddedToQueue') {
      debug('All added', output);
      this.dragOver = false;

      // Prompt for login
      if (!this.authService.getUserSync()) {
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

    dialogRef.afterClosed().filter(d => !!d).subscribe((context: UploadDialogContext) => {

      
      this.uploadInput.next({type: 'cancelAll'});

      if (context.openInMap) {
        this.mapService.createMapForUpload(context.file.id).subscribe(map => {
          this.router.navigate(['/',{outlets:{primary:['view', map.id], rightBar:['mapinfo']}}]);
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
    const dialogRef = this.matDialog.open<DatasetsDialog>(DatasetsDialog, {width: '800px', height: '500px'});

    dialogRef.afterClosed().filter(res => res.result).subscribe(res => {
      this.addDataLayerToMap(res['dataset']);
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
        this.loadUserMaps(this.authService.getUserSync());
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
        this.loadUserDatasets(this.authService.getUserSync());
      });
  }

}
