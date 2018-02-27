import {Component, HostBinding, OnInit} from '@angular/core';
import * as Debug from 'debug';

import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs/Subscription';

const debug = Debug('tombolo:maps-demo');

@Component({
  selector: 'signup-component',
  templateUrl: './signup.html',
  styleUrls: ['./signup.scss', '../auth-panel.scss']
})
export class SignupDialogComponent implements OnInit {

  @HostBinding('class.auth-panel-component') authPanelComponentClass = true;

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router) {}

  private _subs: Subscription[] = [];

  ngOnInit() {

  }

  ngOnDestroy() {
    this._subs.forEach(sub => sub.unsubscribe());
  }

  login() {
    this.router.navigate([{outlets: {'loginBox': 'login'}}]);
  }

  close() {
    this.router.navigate([{outlets: {'loginBox': null}}]);
  }

}
