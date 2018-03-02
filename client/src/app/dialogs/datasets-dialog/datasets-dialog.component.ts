/**
 * Share dialog
 */

import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {AfterViewInit, Component, Inject, OnInit, ViewChild} from '@angular/core';
import {APP_CONFIG, AppConfig} from '../../config.service';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";
import {MapService} from '../../map-service/map.service';

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

  constructor(public dialogRef: MatDialogRef<DatasetsDialog>,
              private mapService: MapService,
              private http: HttpClient,
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

    this.mapService.loadDatasetsInGroup(groupId)
      .subscribe(group => this.datasets = group['datasets']);
  }

  filterByQuery(): void {
    this.selectedGroupId = null;

    if (this.filterInput === '') return;

    this.mapService.findDatasetsByQuery(this.filterInput)
      .subscribe(datasets => this.datasets = datasets);
  }
}
