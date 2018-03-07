/**
 * Share dialog
 */

import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {AfterViewInit, Component, Inject, OnInit, ViewChild} from '@angular/core';
import {APP_CONFIG, AppConfig} from '../../config.service';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";
import {MapService} from '../../services/map-service/map.service';

@Component({
  selector: 'share-dialog',
  templateUrl: './datasets-dialog.html',
  styleUrls: ['./datasets-dialog.scss']
})
export class DatasetsDialog implements OnInit {

  groups: object;
  datasets: object[];
  filterInput: string;
  selectedGroupId: string;
  selectedDataset: object = {id: null, description: ''};

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

  loadDatasets(groupId: string): void {
    this.selectedGroupId = groupId;
    this.selectedDataset = {id: null, description: ''};

    this.mapService.loadDatasetsInGroup(groupId)
      .subscribe(group => this.datasets = group['datasets']);
  }

  selectDataset(dataset: object): void {
    this.selectedDataset = dataset;
  }

  filterByQuery(): void {
    this.selectedGroupId = null;
    this.selectedDataset = {id: null, description: ''};

    if (this.filterInput === '') return;

    this.mapService.findDatasetsByQuery(this.filterInput)
      .subscribe(datasets => this.datasets = datasets);
  }

  queryOnEnter(ev): void {
    if (ev['key'] === 'Enter') {
      this.filterByQuery();
    }
  }

  close(): void {
    this.dialogRef.close({result: false});
  }

  addToMap(): void {
    this.dialogRef.close({result: true, dataset: this.selectedDataset});
  }
}
