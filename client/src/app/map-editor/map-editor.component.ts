import {Component, EventEmitter, HostBinding, OnInit} from '@angular/core';
import * as Debug from 'debug';
import {MapRegistry} from '../mapbox/map-registry.service';
import {ActivatedRoute} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {MapService} from '../map-service/map.service';
import {UploaderOptions, UploadFile, UploadInput, UploadOutput} from 'ngx-uploader';
import {environment} from '../../environments/environment';
import {Subject} from 'rxjs/Subject';
import {Subscription} from 'rxjs/Subscription';
import {MatDialog} from '@angular/material';
import {UploadDialogComponent} from './upload-dialog/upload-dialog.component';
import {DialogsService} from '../dialogs/dialogs.service';

const debug = Debug('tombolo:map-editor');

@Component({
  selector: 'map-editor',
  templateUrl: './map-editor.html',
  styleUrls: ['./map-editor.scss']
})
export class MapEditorComponent implements OnInit {

  @HostBinding('class.sidebar-component') sidebarComponentClass = true;

  options: UploaderOptions;

  files: UploadFile[] = [];
  uploadInput = new EventEmitter<UploadInput>();
  uploadOutput = new Subject<UploadOutput>();
  dragOver: boolean;
  private subs: Subscription[] = [];

  constructor(private mapRegistry: MapRegistry,
              private activatedRoute: ActivatedRoute,
              private httpClient: HttpClient,
              private mapService: MapService,
              private matDialog: MatDialog,
              private dialogService: DialogsService) {}

  ngOnInit() {
    this.subs.push(this.uploadOutput.subscribe(event => {
      this.handleUploadOutput(event);
    }));
  }

  ngOnDestroy() {
    this.subs.forEach(sub => sub.unsubscribe());
  }

  handleUploadOutput(output: UploadOutput): void {
    if (output.type === 'allAddedToQueue') {
      debug('All added', output);
      const dialogRef = this.matDialog.open(UploadDialogComponent, {});

      dialogRef.afterOpen().subscribe(() => {
        // Start upload *after( dialog has opened to give it chance
        // to subscript to upload events

        //this.startUpload();
      });

      dialogRef.afterClosed().subscribe((dialogResults) => {
        // Optionally create a new map based on the upload and
        // open it in editor
      });

      //this.startUpload();
    }
    /*
    else if (output.type === 'addedToQueue'  && typeof output.file !== 'undefined') { // add file to array when added
      debug('Adding file', output);
      this.files.push(output.file);
    }
    else if (output.type === 'uploading' && typeof output.file !== 'undefined') {
      // update current data in files array for uploading file
      const index = this.files.findIndex(file => typeof output.file !== 'undefined' && file.id === output.file.id);
      this.files[index] = output.file;
    }
    else if (output.type === 'removed') {
      // remove file from array when removed
      this.files = this.files.filter((file: UploadFile) => file !== output.file);
    }
    else if (output.type === 'dragOver') {
      this.dragOver = true;
    }
    else if (output.type === 'dragOut') {
      this.dragOver = false;
    } else if (output.type === 'drop') {
      this.dragOver = false;
    }*/
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
