/**
 * General purpose information dialog
 */

import { MatDialogRef } from '@angular/material';
import {Component, ViewChild, OnInit} from '@angular/core';
import {InformationDialog} from './info-dialog.component';

@Component({
  selector: 'share-dialog',
  template: `
    <h1 mat-dialog-title>{{title}}</h1>
    <div mat-dialog-content>
      <p class="mat-body">Use this link to share your map.</p>
      <mat-form-field class="full-width">
        <input #urlInput matInput type="text" [value]="url" readonly>
      </mat-form-field>
      
    </div>
    <div mat-dialog-actions fxLayoutAlign="end">
      <button type="button" mat-button (click)="copy()">Copy to Clipboard</button>
    </div>
    `,
  styles: ['.full-width {width: 100%}']
})
export class ShareDialog  {

  public title: string;
  public url: string;

  @ViewChild('urlInput') urlInput;

  constructor(public dialogRef: MatDialogRef<ShareDialog>) {

  }

  ngAfterViewInit() {
    this.urlInput.nativeElement.focus();
    this.urlInput.nativeElement.select();
  }

  copy() {
    document.execCommand('copy');
    this.dialogRef.close(true);
  }
}
