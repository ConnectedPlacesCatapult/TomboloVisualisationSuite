import {Component, EventEmitter, HostBinding, OnDestroy, OnInit} from '@angular/core';
import * as Debug from 'debug';
import {ActivatedRoute, Router} from '@angular/router';
import {MapService} from '../map-service/map.service';
import {UploaderOptions, UploadFile, UploadInput, UploadOutput} from 'ngx-uploader';
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

const debug = Debug('tombolo:map-editor');

@Component({
  selector: 'map-editor',
  templateUrl: './map-editor.html',
  styleUrls: ['./map-editor.scss']
})
export class MapEditorComponent implements OnInit, OnDestroy {

  @HostBinding('class.sidebar-component') sidebarComponentClass = true;

  options: UploaderOptions;

  userMaps$: Observable<ITomboloMap[]> = null;
  userDatasets$: Observable<ITomboloDataset[]> = null;

  uploadInput = new EventEmitter<UploadInput>();
  uploadOutput = new Subject<UploadOutput>();
  dragOver: boolean;

  private _subs: Subscription[] = [];

  constructor(
              private router: Router,
              private activatedRoute: ActivatedRoute,
              private mapService: MapService,
              private authService: AuthService,
              private matDialog: MatDialog) {}

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

    if (!mapID) return;

    this.mapService.loadMap(mapID).then(map => {
      //map.setBasemapDetail(this.sliderValue);
    });
  }

  loadUserMaps(user: User) {
    if (user) {
      this.userMaps$ = this.mapService.loadUserMaps(user.id);
    }
  }

  loadUserDatasets(user: User) {
    if (user) {
      this.userDatasets$ = this.mapService.loadUserDatasets(user.id);
    }
  }

  backToView() {
    this.router.navigate(['/view' ]);
  }

  handleUploadOutput(output: UploadOutput): void {
    if (output.type === 'allAddedToQueue') {
      debug('All added', output);
      this.dragOver = false;
      this.showUploadDialog();
    }
    else if (output.type === 'dragOver') {
      this.dragOver = true;
    }
    else if (output.type === 'dragOut') {
      this.dragOver = false;
    }
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
      if (context.openInMap) {
        this.mapService.createMapForUpload(context.file.id).subscribe(map => {
          this.router.navigate(['/',{outlets:{primary:['mapdemo', map.id], rightBar:['mapinfo']}}]);
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
    const dialogRef = this.matDialog.open<DatasetsDialog>(DatasetsDialog, {width: '500px', height: '400px'});
  }
}
