/**
 * Top-level app component - just an empty router-outlet to host components
 */

import {Component, OnInit, ComponentFactoryResolver, Injector} from '@angular/core';
import {Location} from '@angular/common';
import {animate, state, style, transition, trigger} from '@angular/animations';
import * as Debug from 'debug';
import {environment} from '../environments/environment';
import 'rxjs/add/operator/filter';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {Subscription} from 'rxjs/Subscription';
import {MapRegistry} from './mapbox/map-registry.service';
import {MapService} from './map-service/map.service';
import Style = mapboxgl.Style;
const debug = Debug('tombolo:app');
import {TooltipRenderService} from "./tooltip-render/tooltip-render.service";
import {TooltipRenderComponent, AttributeRow} from "./tooltip-render/tooltip-render.component";
import * as mapboxgl from 'mapbox-gl';
import {TomboloMapbox} from "./mapbox/mapbox.component";

@Component({
  selector: 'tombolo-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [
    trigger('fadeIn' ,[
      state('*', style({opacity: 1})),
      state('void', style({opacity: 0})),
      transition(':enter', [
        animate('200ms 500ms'),
      ])
    ])
  ]
})
export class AppComponent implements OnInit {

  leftBarOpen = true;
  rightBarOpen = false;
  routerEventSubscription: Subscription;
  mapServiceSubscription: Subscription;
  map: TomboloMapbox;

  constructor(private router: Router,
              private mapRegistry: MapRegistry,
              private location: Location,
              private activatedRoute: ActivatedRoute,
              private tooltipRenderService: TooltipRenderService,
              private resolver: ComponentFactoryResolver,
              private mapService: MapService,
              private injector: Injector) {}

  ngOnInit() {
    debug(`App loaded - environment = ${environment.name} `);

    // Automatically open and close right bar depending on router state
    this.routerEventSubscription = this.router.events.filter(event => event instanceof NavigationEnd)
      .subscribe((event: NavigationEnd) => {
        const routeChildren = this.router.routerState.snapshot.root.children;
        this.rightBarOpen = routeChildren.findIndex(child => child.outlet === 'rightBar') > -1;
      });

    this.activatedRoute.queryParams.subscribe(params => {
      this.positionMapFromURLParams(params);
    });

    this.mapServiceSubscription = this.mapService.mapLoaded$().subscribe(style => {
      this.mapLoadedHandler(style);
    });

    this.tooltipRenderService.tooltipUpdated().subscribe(tooltipData => {
      const popupContent = this.getTooltipInnerHtml(tooltipData);

      const popup = new mapboxgl.Popup()
        .setLngLat(tooltipData['lngLat'])
        .setHTML(`<div>${popupContent}</div>`)
        .addTo(this.map);

      popup.on('close', () => this.tooltipRenderService.componentInstance.destroy() );
    });
  }

  ngOnDestroy() {
    this.routerEventSubscription.unsubscribe();
    this.mapServiceSubscription.unsubscribe();
  }

  ngAfterViewInit() {
    this.mapRegistry.getMap('main-map').then(map => {

      this.map = map;

      map.on('moveend', event => {
        this.setURLFromMap(event.target);
      });
      this.setURLFromMap(map);
    });
  }

  /**
   * Open specified route in the right bar
   * @param route
   */
  openRightBarRoute(route) {
    this.router.navigate([{ outlets: { rightBar: route }}], { skipLocationChange: true });
  }

  /**
   * Close the right bar
   */
  closeRightBar() {
    this.router.navigate([{ outlets: { rightBar: null }}]);
  }

  private mapLoadedHandler(style: Style) {
    this.mapRegistry.getMap('main-map').then(map => {
      map.setStyle(style);
      // Fly to default location if not set in URL
      const url = new URL(window.location.href);
      let zoom = url.searchParams.get('zoom');
      if (!zoom) {
        map.flyTo({center: style.center, zoom: style.zoom, bearing: style.bearing, pitch: style.pitch});
      }
    });
  }

  private setURLFromMap(map) {

    debug('Updating URL zoom, lng and lat');

    const url = new URL(window.location.href);
    url.searchParams.set('zoom', map.getZoom().toFixed(1));
    url.searchParams.set('lng', map.getCenter().lng.toFixed(5));
    url.searchParams.set('lat', map.getCenter().lat.toFixed(5));

    this.location.replaceState(url.pathname, url.search);
  }

  private positionMapFromURLParams(params): boolean {

    debug('Positioning from URL');

    let zoom = params.zoom;
    let lng = params.lng;
    let lat = params.lat;

    if (zoom && lng && lat) {
      // Position map based on URL query params: zoom, lng, lat
      this.mapRegistry.getMap('main-map').then(map => map.jumpTo({zoom: +zoom, center: [+lng, +lat]}));
    }

    return true;
  }

  onMapClick(event): void {
    const mapStyle = this.map.getStyle();
    const dataFeature = this.map.queryRenderedFeatures(event.point, {layers: mapStyle['metadata']['dataLayers']})[0];

    if (!dataFeature) {
      return;
    }

    const attributes = this.getAttributesWithValues(mapStyle, dataFeature);
    this.tooltipRenderService.setTooltip(attributes, event.lngLat);
  }

  /**
   * Given the map style and the data-layer feature of a clicked point,
   * return an object combining human-readable information about each property
   * with each actual property value.
   * @param {mapboxgl.Style} mapStyle
   * @param {Object} dataFeature
   * @returns {AttributeRow[]}
   */
  private getAttributesWithValues(mapStyle: mapboxgl.Style, dataFeature: object): AttributeRow[] {
    let properties = dataFeature['properties'];
    const dataSourceId = dataFeature['layer']['source'];
    const attributes = mapStyle.metadata.datasets.filter(dataset => dataset.id === dataSourceId)[0].attributes;

    return attributes.map(attribute => {
      const propertyId = Object.keys(properties).filter(id => attribute.id === id)[0];

      const property = (propertyId) ? properties[propertyId] : null;

      return {
        name: attribute['name'],
        description: attribute['description'],
        id: attribute['id'],
        value: property,
        unit: attribute['unit']
      };

    });
  }

  /**
   * Given an object containing data to be displayed, generate the tooltip HTML
   * by passing the object into a tooltip render component.
   * @param {Object} tooltipData
   * @returns {string}
   */
  getTooltipInnerHtml(tooltipData: object): string {
    const factory = this.resolver.resolveComponentFactory(TooltipRenderComponent);
    const component = factory.create(this.injector);
    component.instance.data = {...tooltipData['attributes']};
    component.changeDetectorRef.detectChanges();
    this.tooltipRenderService.componentInstance = component;
    return component.location.nativeElement.innerHTML;
  }
}
