import {Component, OnInit} from '@angular/core';
import * as Debug from 'debug';
import {MapRegistry} from '../mapbox/map-registry.service';
import {ActivatedRoute} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {Style} from 'mapbox-gl';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {Location} from '@angular/common';
import {NotificationService} from "../dialogs/notification.service";

const debug = Debug('tombolo:map-info');

@Component({
  selector: 'map-info',
  templateUrl: './map-export.html',
  styleUrls: ['./map-export.scss']
})
export class MapExportComponent implements OnInit {

  constructor(private activatedRoute: ActivatedRoute,
              private httpClient: HttpClient,
              private mapRegistry: MapRegistry,
              private location: Location,
              private notificationService: NotificationService) {}

  mapName: string;
  mapDescription: string;
  exportForm: FormGroup;
  presets = {
    "a4_150dpi": { width: 18.2708, height: 12.9167, dpi: 150 }
  }

  ngOnInit() {
    this.activatedRoute.params.subscribe(params => {
      this.loadMapInfo(params.mapID);
    });
  }

  loadMapInfo(mapID: string) {
    debug('mapID:', mapID);
    if (!mapID) return;
    this.httpClient.get<Style>(`/maps/${mapID}/style.json`).subscribe(style => {
      this.mapName = style.name;
      this.mapDescription = style.metadata['description'];

      this.exportForm = new FormGroup({
        name: new FormControl(this.formatFileName(this.mapName), Validators.required),
        width: new FormControl('', Validators.required),
        height: new FormControl('', Validators.required),
        dpi: new FormControl('', Validators.required),
        format: new FormControl('', Validators.required)
      });
    });
  }

  exportMap(): void {
    this.mapRegistry.getMap('main-map')
      .then(map => map.export(
        this.exportForm.get('name').value,
        this.exportForm.get('width').value,
        this.exportForm.get('height').value,
        this.exportForm.get('dpi').value,
        this.exportForm.get('format').value))
      .then(name => {
        debug('Downloaded ' + name);
        this.notificationService.info(`Downloaded ${name}`);
        this.routeBack();
      })
      .catch(err => this.notificationService.error(err));
  }

  formatFileName(name: string): string {
    return name.toLowerCase().replace(" ", "_");
  }

  routeBack(): void {
    this.location.back();
  }

  onPresetChange(presetOption) {
    const preset = presetOption.value;
    this.exportForm.patchValue({
      width: this.presets[preset].width,
      height: this.presets[preset].height,
      dpi: this.presets[preset].dpi
    });
  }

}
