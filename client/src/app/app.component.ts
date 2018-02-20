/**
 * Top-level app component - just an empty router-outlet to host components
 */

import {Component, ComponentFactoryResolver, Injector, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import {animate, state, style, transition, trigger} from '@angular/animations';
import * as Debug from 'debug';
import {environment} from '../environments/environment';
import 'rxjs/add/operator/filter';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {Subscription} from 'rxjs/Subscription';
import {MapRegistry} from './mapbox/map-registry.service';
import {MapService} from './map-service/map.service';
import {TomboloMapboxMap} from './mapbox/tombolo-mapbox-map';
import {Map as MapboxMap, Popup as MapboxPopup} from 'mapbox-gl';
import {TooltipRenderService} from './tooltip-render/tooltip-render.service';
import {AttributeRow, TooltipRenderComponent} from './tooltip-render/tooltip-render.component';
import {EmuMapboxMap} from './mapbox/mapbox.component';
import {CustomGoogleTagManager} from "./custom-google-tag-manager/custom-google-tag-manager";

const debug = Debug('tombolo:app');

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
  mapClass: typeof EmuMapboxMap = TomboloMapboxMap;

  constructor(private router: Router,
              private mapRegistry: MapRegistry,
              private location: Location,
              private activatedRoute: ActivatedRoute,
              private tooltipRenderService: TooltipRenderService,
              private resolver: ComponentFactoryResolver,
              private mapService: MapService,
              private injector: Injector,
              private customGoogleTagManager: CustomGoogleTagManager) {}

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

    this.mapServiceSubscription = this.mapService.mapLoaded$().subscribe(map => {
      this.mapLoadedHandler(map);
    });

    this.tooltipRenderService.tooltipUpdated().subscribe(tooltipData => {
      const popupContent = this.getTooltipInnerHtml(tooltipData);
      this.mapRegistry.getMap<TomboloMapboxMap>('main-map').then(map => {
        const popup = new MapboxPopup()
          .setLngLat(tooltipData['lngLat'])
          .setHTML(`<div>${popupContent}</div>`)
          .addTo(map);
        popup.on('close', () => this.tooltipRenderService.componentInstance.destroy() );
      });
    });
  }

  ngOnDestroy() {
    this.routerEventSubscription.unsubscribe();
    this.mapServiceSubscription.unsubscribe();
  }

  ngAfterViewInit() {
    this.mapRegistry.getMap<TomboloMapboxMap>('main-map').then(map => {
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

  /**
   * Handler called when a map is loaded.
   * Fly to to default position for the map unless zoom and centre are set in the URL to override the default
   *
   * @param {mapboxgl.Style} style
   */
  private mapLoadedHandler(map: TomboloMapboxMap) {
    // Fly to default location if not set in URL
    const url = new URL(window.location.href);
    let zoom = url.searchParams.get('zoom');
    if (!zoom) {
      const style = map.getStyle();
      map.flyTo({center: style.center, zoom: style.zoom, bearing: style.bearing, pitch: style.pitch});
    }
  }

  /**
   * Update the browser URL to add zoom and lat,lng coords to encode current map view
   *
   * @param map
   */
  private setURLFromMap(map: MapboxMap) {

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
    this.mapRegistry.getMap<TomboloMapboxMap>('main-map').then(map => {
      const dataFeature = map.queryRenderedFeatures(event.point, {layers: map.dataLayers})[0];

      if (!dataFeature) {
        return;
      }

      const attributes = this.getAttributesWithValues(map, dataFeature);
      this.tooltipRenderService.setTooltip(attributes, event.lngLat);
    });
  }

  /**
   * Given the map style and the data-layer feature of a clicked point,
   * return an object combining human-readable information about each property
   * with each actual property value.
   * @param {mapboxgl.Style} mapStyle
   * @param {Object} dataFeature
   * @returns {AttributeRow[]}
   */
  private getAttributesWithValues(map: TomboloMapboxMap, dataFeature: object): AttributeRow[] {
    const properties = dataFeature['properties'];
    const layerID = dataFeature['layer']['id'];
    const attributes = map.getDataAttributesForLayer(layerID);

    return attributes.map(attribute => ({
      name: attribute.name,
      description: attribute.description,
      id: attribute.id,
      value: properties[attribute.id],
      unit: attribute.unit
    }));
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
