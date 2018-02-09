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

  exportLoading = false;
  mapName: string;
  mapDescription: string;
  exportForm: FormGroup;
  presets = {
    "a4_150dpi": { width: 297, height: 210, dpi: 150, format: 'png' },
    "a4_300dpi": { width: 297, height: 210, dpi: 300, format: 'png' },
    "a3_150dpi": { width: 420, height: 297, dpi: 150, format: 'png' },
    "a3_300dpi": { width: 420, height: 297, dpi: 300, format: 'png' }
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
    this.exportLoading = true;

    // Sample function for drawing a red line across the map.
    // Argument is a canvas 2D context.
    const drawOverlay = (ctx) => {
      ctx.beginPath();
      ctx.moveTo(0,0);
      ctx.lineTo(300,150);
      ctx.strokeStyle = "#FF0000";
      ctx.lineWidth = 14;
      ctx.stroke();
    }

    this.mapRegistry.getMap('main-map')
      .then(map => map.export(
        this.exportForm.get('name').value,
        this.exportForm.get('width').value,
        this.exportForm.get('height').value,
        this.exportForm.get('dpi').value,
        this.exportForm.get('format').value,
        drawOverlay))
      .then(name => {
        debug('Downloaded ' + name);
        this.routeBack();
      })
      .catch(err => {
        this.exportLoading = false;
        this.notificationService.error(err)
      });
  }

  formatFileName(name: string): string {
    return name.toLowerCase().replace(/ /g, "_");
  }

  routeBack(): void {
    this.location.back();
  }

  onPresetChange(presetOption) {
    const preset = presetOption.value;
    this.exportForm.patchValue({
      width: this.presets[preset].width,
      height: this.presets[preset].height,
      dpi: this.presets[preset].dpi,
      format: this.presets[preset].format
    });
  }

}
