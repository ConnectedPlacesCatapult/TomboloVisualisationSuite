import {Component, HostBinding, OnInit} from '@angular/core';
import * as Debug from 'debug';
import {MapRegistry} from '../mapbox/map-registry.service';
import {ActivatedRoute, Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {Style} from 'mapbox-gl';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {Location} from '@angular/common';
import {NotificationService} from "../dialogs/notification.service";
import {TomboloMapboxMap} from '../mapbox/tombolo-mapbox-map';

const debug = Debug('tombolo:map-info');

@Component({
  selector: 'map-info',
  templateUrl: './map-export.html',
  styleUrls: ['./map-export.scss']
})
export class MapExportComponent implements OnInit {

  @HostBinding('class.sidebar-component') sidebarComponentClass = true;

  constructor(private mapRegistry: MapRegistry,
              private location: Location,
              private notificationService: NotificationService,
              private router: Router) {}

  exportLoading = false;
  mapName: string;
  mapDescription: string;
  exportForm: FormGroup;
  presets = {
    "a4_150dpi": { width: 297, height: 210, dpi: 150, format: 'png' },
    "a4_300dpi": { width: 297, height: 210, dpi: 300, format: 'png' },
    "a3_150dpi": { width: 420, height: 297, dpi: 150, format: 'png' },
    "a3_300dpi": { width: 420, height: 297, dpi: 300, format: 'png' }
  };

  ngOnInit() {

    this.exportForm = new FormGroup({
      name: new FormControl('', Validators.required),
      width: new FormControl(this.presets['a4_150dpi'].width, Validators.required),
      height: new FormControl(this.presets['a4_150dpi'].height, Validators.required),
      dpi: new FormControl(this.presets['a4_150dpi'].dpi, Validators.required),
      format: new FormControl(this.presets['a4_150dpi'].format, Validators.required),
      preset: new FormControl('a4_150dpi')
    });

    this.mapRegistry.getMap<TomboloMapboxMap>('main-map').then(map => {
      this.exportForm.patchValue({'name': this.formatFileName(map.getStyle().name)});
    });

    this.exportForm.get('preset').valueChanges.subscribe(val => this.onPresetChange(val));
  }

  exportMap(): void {
    this.exportLoading = true;

    this.mapRegistry.getMap<TomboloMapboxMap>('main-map')
      .then(map => {
        return map.export(
          this.exportForm.get('name').value,
          this.exportForm.get('width').value,
          this.exportForm.get('height').value,
          this.exportForm.get('dpi').value,
          this.exportForm.get('format').value)
      })
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
    if(!this.location.back()) {
      setTimeout(() => this.router.navigate([{ outlets: { rightBar: 'appinfo' }}]), 200);
    }
  }

  onPresetChange(preset) {
    this.exportForm.patchValue({
      width: this.presets[preset].width,
      height: this.presets[preset].height,
      dpi: this.presets[preset].dpi,
      format: this.presets[preset].format
    });
  }

}
