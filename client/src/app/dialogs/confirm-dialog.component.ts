/**
 * General purpose confirmation dialog
 */

import { MatDialogRef } from '@angular/material';
import { Component } from '@angular/core';

@Component({
  selector: 'confirm-dialog',
  template: `
    <h1 mat-dialog-title>{{ title }}</h1>
    <div mat-dialog-content>
        <p [innerHTML]="message"></p>
    </div>
    <div mat-dialog-actions fxLayoutAlign="end">
      <button type="button" mat-button (click)="dialogRef.close(false)">Cancel</button>
        <button type="button" mat-button (click)="dialogRef.close(true)">OK</button>
    </div>
    `,
})
export class ConfirmDialog {

  public title: string;
  public message: string;

  constructor(public dialogRef: MatDialogRef<ConfirmDialog>) {

  }
}
