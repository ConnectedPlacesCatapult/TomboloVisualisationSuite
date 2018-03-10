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

const debug = Debug('tombolo:datasets-dialog');

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

  constructor(public dialogRef: MatDialogRef<DatasetsDialog>,
              private mapService: MapService,
              @Inject(MAT_DIALOG_DATA) public data: any,
              @Inject(APP_CONFIG) private config: AppConfig) {
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
    this.selectedDataset = dataset;
  }

  filterByQuery(searchTerm: string): void {
    this.selectedGroup = null;
    this.selectedDataset = null;

    this.mapService.findDatasetsByQuery(searchTerm)
      .subscribe(datasets => this.datasets = datasets);
  }

  close(): void {
    this.dialogRef.close({result: false});
  }

  addToMap(): void {
    this.dialogRef.close({result: true, dataset: this.selectedDataset});
  }
}
