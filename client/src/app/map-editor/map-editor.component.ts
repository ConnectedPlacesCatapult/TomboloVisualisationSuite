import {Component, EventEmitter, HostBinding, OnDestroy, OnInit} from '@angular/core';
import * as Debug from 'debug';
import {MapRegistry} from '../mapbox/map-registry.service';
import {ActivatedRoute, Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {MapService} from '../map-service/map.service';
import {UploaderOptions, UploadFile, UploadInput, UploadOutput} from 'ngx-uploader';
import {environment} from '../../environments/environment';
import {Subject} from 'rxjs/Subject';
import {Subscription} from 'rxjs/Subscription';
import {MatDialog} from '@angular/material';
import {UploadDialogComponent, UploadDialogContext} from './upload-dialog/upload-dialog.component';
import {DialogsService} from '../dialogs/dialogs.service';

const debug = Debug('tombolo:map-editor');

@Component({
  selector: 'map-editor',
  templateUrl: './map-editor.html',
  styleUrls: ['./map-editor.scss']
})
export class MapEditorComponent implements OnInit, OnDestroy {

  @HostBinding('class.sidebar-component') sidebarComponentClass = true;

  options: UploaderOptions;

  files: UploadFile[] = [];
  uploadInput = new EventEmitter<UploadInput>();
  uploadOutput = new Subject<UploadOutput>();
  dragOver: boolean;
  private subs: Subscription[] = [];

  constructor(
              private router: Router,
              private mapRegistry: MapRegistry,
              private activatedRoute: ActivatedRoute,
              private httpClient: HttpClient,
              private mapService: MapService,
              private matDialog: MatDialog,
              private dialogService: DialogsService) {}

  ngOnInit() {
    this.activatedRoute.params.subscribe(params => {
      this.loadMap(params.mapID);
    });

    this.subs.push(this.uploadOutput.subscribe(event => {
      this.handleUploadOutput(event);
    }));
  }

  ngOnDestroy() {
    this.subs.forEach(sub => sub.unsubscribe());
  }

  loadMap(mapID: string) {

    debug('Editing mapID:', mapID);

    if (!mapID) return;

    this.mapService.loadMap(mapID).then(map => {
      //map.setBasemapDetail(this.sliderValue);
    });
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
}
