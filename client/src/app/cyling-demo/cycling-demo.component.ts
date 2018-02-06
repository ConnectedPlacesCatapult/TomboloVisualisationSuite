import {Component, OnInit} from '@angular/core';
import {animate, state, style, transition, trigger} from '@angular/animations';
import * as Debug from 'debug';
import {MapRegistry} from '../mapbox/map-registry.service';
import {ActivatedRoute} from '@angular/router';

const debug = Debug('tombolo:cycling-demo');

@Component({
  selector: 'cycling-demo',
  templateUrl: './cycling-demo.html',
  styles: [':host{flex-direction:column; height: 100%;}'],
  animations: [
    trigger('fadeIn', [
      state('*', style({opacity: 1})),
      state('void', style({opacity: 0})),
      transition(':enter', [
        animate('200ms 500ms'),
      ])
    ])
  ]
})
export class CyclingDemoComponent implements OnInit {

  constructor(private mapRegistry: MapRegistry, private activatedRoute: ActivatedRoute) {}

  selectedMetricId = 'cycling';

  metrics = [{
    id: 'cycling',
    name: 'Cycling Fraction',
    layerStyles: {
      cycling_no2: {
        "fill-color": [
          "interpolate",
          [
            "exponential",
            3
          ],
          [
            "to-number",
            [
              "get",
              "bicyclefraction"
            ],
            0.004
          ],
          0,
          "#000000",
          0.0047412407585985215,
          "#5e4fa2",
          0.006693663208890368,
          "#3288bd",
          0.012124089901867679,
          "#66c2a5",
          0.01665675469016706,
          "#abdda4",
          0.021846661170651278,
          "#e6f598",
          0.038257663056003685,
          "#fee08b",
          0.062245566226402656,
          "#fdc675",
          0.12093073867861223,
          "#fdae61",
          0.30813246548887774,
          "#f46d43",
          0.4,
          "#d53e4f",
          0.5,
          "#9e0142"
        ]
      }
    }
  },
    {
      id: 'no2',
      name: 'NO2',
      layerStyles: {
        cycling_no2: {
          "fill-color": [
            "interpolate",
            [
              "exponential",
              3
            ],
            [
              "to-number",
              [
                "get",
                "nitrogendioxide"
              ],
              0
            ],
            0,
            "rgba(0,0,0,0)",
            1,
            "rgba(0,0,0,1)",
            34.2,
            "#5e4fa2",
            37.8,
            "#3288bd",
            39.6,
            "#66c2a5",
            44,
            "#abdda4",
            48,
            "#e6f598",
            50,
            "#fee08b",
            58,
            "#fdc675",
            76,
            "#fdae61",
            80,
            "#f46d43",
            100,
            "#d53e4f",
            120,
            "#9e0142"
          ]
        }
      }
    }];

  layers = [
    {
      id: 'roads',
      name: 'Road Network',
      layers: [
        'highway_path',
        'highway_minor',
        'highway_major_casing',
        'highway_major_inner',
        'highway_major_subtle',
        'highway_motorway_casing',
        'highway_motorway_inner',
        'highway_motorway_subtle',
        'highway_name_other',
        'highway_name_other_en',
        'highway_ref'
      ],
      enabled: true
    },
    {
      id: 'lsoa',
      name: 'LSOA Labels',
      layers: [
        'lsoa_labels'
      ],
      enabled: false
    }];

  ngOnInit() {
    this.activatedRoute.data.subscribe(data => {
      this.mapRegistry.getMap('main-map').then(map => map.setStyle('https://maps.emu-analytics.net:4430/styles/cycling_no2.json'));
    });
  }

  ngOnDestroy() {
  }

  selectMetric(metricId: string) {


    if (metricId === this.selectedMetricId) {
      return;
    }

    this.selectedMetricId = metricId;


    this.mapRegistry.getMap('main-map').then((map) => {
      var metric = this.metrics.find(metric => metric.id == metricId);
      Object.keys(metric.layerStyles).forEach(layer => {
        Object.keys(metric.layerStyles[layer]).forEach(paintProperty => {
          map.setPaintProperty(layer, paintProperty, metric.layerStyles[layer][paintProperty]);
        });
      });
    });


    debug(`Selected metric: ${metricId}`);

    return false;
  }

  toggleLayer(layerId: string) {
    const layer = this.layers.find(layer => layer.id === layerId);
    layer.enabled = !layer.enabled;
    layer.layers.forEach(l => this.setLayerVisibility(l, layer.enabled));

    debug(`Toggled layer ${layer.name}: ${layer.enabled}`);

    return false;
  }

  private setLayerVisibility(layerId: string, visible: boolean) {
    this.mapRegistry.getMap('main-map').then(map => {
      map.setLayoutProperty(layerId, 'visibility', (visible) ? 'visible' : 'none')
    });
  }

}
