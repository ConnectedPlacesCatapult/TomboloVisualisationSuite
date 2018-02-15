/**
 * General purpose information dialog
 */

import { MatDialogRef } from '@angular/material';
import {Component, ViewChild, OnInit} from '@angular/core';
import {InformationDialog} from '../info-dialog.component';
import { ShareButtons } from '@ngx-share/core';

@Component({
  selector: 'share-dialog',
  templateUrl: './share-dialog.html',
  styleUrls: ['./share-dialog.scss']
})
export class ShareDialog  {

  public title: string;
  public url: string;
  public description = 'Check out this amazing map I built with Tombolo!';
  public tags = 'tombolo';

  @ViewChild('urlInput') urlInput;

  constructor(public dialogRef: MatDialogRef<ShareDialog>, public share: ShareButtons) {
  }

  ngAfterViewInit() {
    this.urlInput.nativeElement.focus();
    this.urlInput.nativeElement.select();
  }

  copy() {
    document.execCommand('copy');
    this.dialogRef.close(true);
  }

  email() {
    window.location.href = `mailto:?subject=My Tombolo Map&body=${this.description}%0D%0A%0D%0A${this.url}`;
    return false;
  }
}
