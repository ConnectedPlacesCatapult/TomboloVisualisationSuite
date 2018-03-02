/**
 * Share dialog
 */

import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {AfterViewInit, Component, Inject, ViewChild} from '@angular/core';
import {APP_CONFIG, AppConfig} from '../../config.service';

@Component({
  selector: 'share-dialog',
  templateUrl: './datasets-dialog.html',
  styleUrls: ['./datasets-dialog.scss']
})
export class DatasetsDialog {

  constructor(public dialogRef: MatDialogRef<DatasetsDialog>,
              @Inject(MAT_DIALOG_DATA) public data: any,
              @Inject(APP_CONFIG) private config: AppConfig) {
  }
}
