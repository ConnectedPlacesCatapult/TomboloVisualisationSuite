/**
 * Top-level app component - just an empty router-outlet to host components
 */

import {Component, OnInit} from '@angular/core';
import {animate, state, style, transition, trigger} from '@angular/animations';
import * as Debug from 'debug';
import {environment} from '../environments/environment';
import 'rxjs/add/operator/filter';
import {NavigationEnd, Router} from '@angular/router';
import {Subscription} from 'rxjs/Subscription';

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

  constructor(private router: Router) {}

  ngOnInit() {
    debug(`App loaded - environment = ${environment.name} `);

    // Automatically open and close right bar depending on router state
    this.routerEventSubscription = this.router.events.filter(event => event instanceof NavigationEnd)
      .subscribe((event: NavigationEnd) => {
        const routeChildren = this.router.routerState.snapshot.root.children;
        this.rightBarOpen = routeChildren.findIndex(child => child.outlet === 'rightBar') > -1;
      });
  }

  ngOnDestroy() {
    this.routerEventSubscription.unsubscribe();
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
}
