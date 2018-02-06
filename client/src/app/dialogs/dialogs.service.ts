/**
 * Dialog Service - app-wide access to general-purpose dialogs (e.g. confirmation, info)
 */

import { Observable } from 'rxjs/Rx';
import { ConfirmDialog } from './confirm-dialog.component';
import { MatDialogRef, MatDialog, MatDialogConfig } from '@angular/material';
import { Injectable } from '@angular/core';
import {InformationDialog} from "./info-dialog.component";

@Injectable()
export class DialogsService {

  constructor(private dialog: MatDialog) { }

  public confirm(title: string, message: string): Observable<boolean> {

    let dialogRef = this.dialog.open(ConfirmDialog);
    dialogRef.componentInstance.title = title;
    dialogRef.componentInstance.message = message;

    return dialogRef.afterClosed();
  }

  public information(title: string, message: string): Observable<boolean> {

    let dialogRef = this.dialog.open(InformationDialog);
    dialogRef.componentInstance.title = title;
    dialogRef.componentInstance.message = message;

    return dialogRef.afterClosed();
  }
}
