/**
 * Top-level app component - just an empty router-outlet to host components
 */

import {Component, Inject, OnInit, ComponentFactoryResolver, Injector} from '@angular/core';
import {Location} from '@angular/common';
import {animate, state, style, transition, trigger} from '@angular/animations';
import * as Debug from 'debug';
import {environment} from '../environments/environment';
import 'rxjs/add/operator/filter';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {Subscription} from 'rxjs/Subscription';
import {MapRegistry} from './mapbox/map-registry.service';
const debug = Debug('tombolo:app');
import {TooltipRenderService} from "./tooltip-render/tooltip-render.service";
import {TooltipRenderComponent} from "./tooltip-render/tooltip-render.component";
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
  map: TomboloMapbox;

  constructor(private router: Router,
              private mapRegistry: MapRegistry,
              private location: Location,
              private activatedRoute: ActivatedRoute,
              private tooltipRenderService: TooltipRenderService,
              private resolver: ComponentFactoryResolver,
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

    this.tooltipRenderService.tooltipUpdated().subscribe(tooltipData => {
      const popupContent = this.getTooltipInnerHtml(tooltipData);

      new mapboxgl.Popup()
        .setLngLat(tooltipData['lngLat'])
        .setHTML(`<div class="popupContent">${popupContent}</div>`)
        .addTo(this.map);
    });
  }

  ngOnDestroy() {
    this.routerEventSubscription.unsubscribe();
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
   * @param mapStyle
   * @param dataFeature
   * @returns {{name: any; description: any; id: any; value: any}[]}
   */
  private getAttributesWithValues(mapStyle, dataFeature) {
    let properties = dataFeature.properties;
    const dataSourceId = dataFeature.layer.source;
    const attributes = mapStyle['metadata']['datasets'].filter(dataset => dataset.id === dataSourceId)[0].attributes;

    return Object.keys(properties).map(propertyId => {
      const propertyAttribute = attributes.filter(attribute => attribute.id === propertyId)[0];

      return {
        name: propertyAttribute['name'],
        description: propertyAttribute['description'],
        id: propertyAttribute['id'],
        value: properties[propertyId]
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
    return component.location.nativeElement.innerHTML;
  }
}
