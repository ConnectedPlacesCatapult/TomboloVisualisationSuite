/**
 * Top-level app component - just an empty router-outlet to host components
 */

import {Component, Inject, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import {animate, state, style, transition, trigger} from '@angular/animations';
import * as Debug from 'debug';
import {environment} from '../environments/environment';
import 'rxjs/add/operator/filter';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {Subscription} from 'rxjs/Subscription';
import {MapRegistry} from './mapbox/map-registry.service';
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

  constructor(private router: Router, private mapRegistry: MapRegistry, private location: Location, private activatedRoute: ActivatedRoute) {}

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
  }

  ngOnDestroy() {
    this.routerEventSubscription.unsubscribe();
  }

  ngAfterViewInit() {
    this.mapRegistry.getMap('main-map').then(map => {
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
      this.mapRegistry.getMap('main-map').then(map => map.jumpTo({zoom: +zoom, center: [+lng, +lat]});
    }

    return true;
  }
}
