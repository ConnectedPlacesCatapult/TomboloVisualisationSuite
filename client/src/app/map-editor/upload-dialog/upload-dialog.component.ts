import { MatDialogRef } from '@angular/material';
import {Component, Inject, ViewChild} from '@angular/core';
import {APP_CONFIG, AppConfig} from '../../config.service';

@Component({
  selector: 'upload-dialog',
  templateUrl: './upload-dialog.html',
  styleUrls: ['./upload-dialog.scss']
})
export class UploadDialogComponent {

  public title: string;
  public url: string;
  public description: string;
  public socialMediaTitle: string;
  public tags: string;

  @ViewChild('urlInput') urlInput;

  constructor(
    public dialogRef: MatDialogRef<UploadDialogComponent>,
    @Inject(APP_CONFIG) private config: AppConfig) {}
}
