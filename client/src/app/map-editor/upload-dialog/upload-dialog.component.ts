import {MAT_DIALOG_DATA, MatDialogRef, MatHorizontalStepper, MatStep} from '@angular/material';
import {
  AfterViewInit,
  Component,
  EventEmitter,
  Inject,
  OnDestroy,
  OnInit,
  QueryList, ViewChild,
  ViewChildren
} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {UploadInput, UploadOutput} from 'ngx-uploader';
import {Subscription} from 'rxjs/Subscription';
import * as Debug from 'debug';
import {Subject} from 'rxjs/Subject';
import {FileUpload} from '../../map-service/map.service';

const debug = Debug('tombolo:upload-dialog');

export class UploadDialogContext  {

  constructor (private parentDialog: UploadDialogComponent) {}

  private _cancel$ = new Subject<void>();
  private _next$ = new Subject<void>();

  uploadInput$: EventEmitter<UploadInput>;
  uploadOutput$: Observable<UploadOutput>;
  file: FileUpload;
  datasetName: string;
  datasetDescription: string;

  // Observable to signal page should cancel pending operations
  get cancel$(): Observable<void> {
    return this._cancel$.asObservable();
  }
  // Observable to signal page that next was pressed
  get next$(): Observable<void> {
    return this._next$.asObservable();
  }

  setNextEnabled(page: number, enabled: boolean = true) {
    this.parentDialog.setNextEnabled(page, enabled);
  }

  // Notify pages to cancel pending operations
  cancel() {
    this._cancel$.next();
  }

  // Notify page that next was clicked
  next() {
    this._next$.next();
  }
}

@Component({
  selector: 'upload-dialog',
  templateUrl: './upload-dialog.html',
  styleUrls: ['./upload-dialog.scss']
})
export class UploadDialogComponent implements OnInit, OnDestroy, AfterViewInit {

  private _subs: Subscription[] = [];

  context: UploadDialogContext = new UploadDialogContext(this);

  @ViewChild(MatHorizontalStepper) private stepper: MatHorizontalStepper;
  @ViewChildren(MatStep) private pagesQuery: QueryList<MatStep>;
  pages: MatStep[];

  constructor(
    public dialogRef: MatDialogRef<UploadDialogComponent>,
    @Inject(MAT_DIALOG_DATA) data: any) {
    this.context.uploadInput$ = data.uploadInput$;
    this.context.uploadOutput$ = data.uploadOutput$;
  }

  ngOnInit() {
  }

  ngOnDestroy() {
  }

  ngAfterViewInit() {
    this.pages = this.pagesQuery.toArray();
  }

  setNextEnabled(index: number, enabled: boolean = true): void {
    if (this.pages) this.pages[index].completed = enabled;
  }

  pageCompleted(index: number): boolean {
    return (this.pages)? this.pages[index].completed : false;
  }

  cancel() {
    this.context.cancel();
    this.dialogRef.close();
  }

  next() {
    this.context.next();
    this.stepper.next();
  }

  finish() {
    this.dialogRef.close();
  }
}
