import {Component, EventEmitter, HostBinding, Input, OnDestroy, OnInit, Output} from '@angular/core';
import * as Debug from 'debug';
import {MapService} from '../../map-service/map.service';
import {UploadDialogContext} from './upload-dialog.component';

const debug = Debug('tombolo:upload-page2');

@Component({
  selector: 'upload-page3',
  templateUrl: './upload-page3.html',
  styleUrls: ['./upload-dialog.scss']
})
export class UploadPage3Component implements OnInit, OnDestroy {

  @Input() context: UploadDialogContext;
  @HostBinding('class.wizard-page-component') wizardPageClass = true;

  constructor(private mapService: MapService) {}

  ngOnInit() {
  }

  ngOnDestroy() {
    debug('Destroying page 3');
  }

}
