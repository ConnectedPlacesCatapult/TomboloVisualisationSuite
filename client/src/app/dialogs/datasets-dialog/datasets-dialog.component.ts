/**
 * Share dialog
 */

import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {Component, HostBinding, Inject, OnInit} from '@angular/core';
import {APP_CONFIG, AppConfig} from '../../config.service';
import {MapService} from '../../services/map-service/map.service';
import {ITomboloDataset} from '../../../../../src/shared/ITomboloDataset';
import {IDatasetGroup} from '../../../../../src/shared/IDatasetGroup';

import * as Debug from 'debug';
import {ITomboloDatasetAttribute} from '../../../../../src/shared/ITomboloDatasetAttribute';
import {DialogsService} from "../dialogs.service";

const debug = Debug('tombolo:datasets-dialog');

// DialogRef.close passes back an untyped 'any'. As the result gets more complicated
// it's a good idea to define an interface so the client of the dialog can get the benefits of type safety/code
// completion
export interface DatasetsDialogResult {
  result: boolean,
  dataset?: ITomboloDataset,
  // Try to avoid using strings as flags unless they are typed and there are more than two options
  // Use boolean if possible as it's self-documenting
  createNewMap?: boolean

  // Alternative - if you have more than two options - define a restricted string type that can only take certain values:
  // mode: 'existing' | 'new'
}

export interface DatasetsDialogData {
  mapModified: boolean
}

@Component({
  selector: 'datasets-dialog',
  templateUrl: './datasets-dialog.html',
  styleUrls: ['./datasets-dialog.scss']
})
export class DatasetsDialog implements OnInit {

  @HostBinding('class.datasets-dialog') datasetsDialogClass = true;

  groups: IDatasetGroup[];
  datasets: ITomboloDataset[];
  selectedGroup: IDatasetGroup;
  selectedDataset: ITomboloDataset;
  mapModified: boolean;

  // Notice the MatDialogRef has a second type parameter - this defines the result type and enforces
  // type safety using DatasetDialogResult defined above
  constructor(public dialogRef: MatDialogRef<DatasetsDialog, DatasetsDialogResult>,
              private mapService: MapService,
              private dialogsService: DialogsService,
              @Inject(MAT_DIALOG_DATA) public data: DatasetsDialogData,
              @Inject(APP_CONFIG) private config: AppConfig) {
                this.mapModified = data.mapModified;
  }

  ngOnInit() {
    this.getGroups();
  }

  getGroups(): void {
    this.mapService.loadDatasetGroups()
      .subscribe(groups => this.groups = groups);
  }

  selectGroup(group: IDatasetGroup): void {
    this.selectedGroup = group;
    this.selectedDataset = null;

    this.mapService.loadDatasetsInGroup(group.id).subscribe(group => {
      debug(group);
      this.datasets = group.datasets;
    });
  }

  selectDataset(dataset: ITomboloDataset): void {
    this.mapService.loadDataset(dataset.id).subscribe(dataset => {
      this.selectedDataset = dataset;
    });
  }

  filterByQuery(searchTerm: string): void {
    this.selectedGroup = null;
    this.selectedDataset = null;

    this.mapService.findDatasetsByQuery(searchTerm)
      .subscribe(datasets => this.datasets = datasets);
  }

  close(): void {
    // This is OK as I defined dataset and createMap as optional
    this.dialogRef.close({result: false});
  }

  addToMap(): void {
    // Type is checked here because dialogRef.close is parameterized to take a DatasetsDialogResult
    // Try misspelling one of the properties and the compiler will complain
    this.dialogRef.close({result: true, dataset: this.selectedDataset, createNewMap: false});
  }

  addNewMap(): void {
    // Type is checked here because dialogRef.close is parameterized to take a DatasetsDialogResult
    // Try misspelling one of the properties and the compiler will complain

    const dialogResult = {result: true, dataset: this.selectedDataset, createNewMap: true};

    if (this.mapModified) {
      this.dialogsService.confirm('Unsaved Changes', 'You have unsaved changes, are you sure you want to navigate away?')
        .filter(ok => ok)
        .subscribe(() => {
          this.dialogRef.close(dialogResult);
        });
    } else {
      this.dialogRef.close(dialogResult);
    }
  }

  typeIconForGeometryType(geometryType: string): 'polygon' | 'line' | 'point' {
    switch (geometryType) {
      case 'ST_MultiPoint': return 'point';
      case 'ST_Point': return 'point';
      case 'ST_MultiLineString': return 'line';
      case 'ST_LineString': return 'line';
      case 'ST_MultiPolygon': return 'polygon';
      case 'ST_Polygon': return 'polygon';
    }
  }

  typeIndicatorForAttribute(attr: ITomboloDatasetAttribute): string {
    switch (attr.type) {
      case 'string': return 'Aa';
      case 'number': return '#';
      default: return '?'
    }
  }
}
