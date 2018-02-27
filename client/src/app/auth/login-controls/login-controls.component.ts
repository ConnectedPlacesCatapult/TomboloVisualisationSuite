import {Component, OnInit} from '@angular/core';
import * as Debug from 'debug';

import {ActivatedRoute} from '@angular/router';
import {Subscription} from 'rxjs/Subscription';

const debug = Debug('tombolo:maps-demo');

@Component({
  selector: 'login-controls',
  templateUrl: './login-controls.html',
  styleUrls: ['./login-controls.scss']
})
export class LoginControlsComponent implements OnInit {


  constructor(private activatedRoute: ActivatedRoute) {}

  private _subs: Subscription[] = [];

  ngOnInit() {

  }

  ngOnDestroy() {
    this._subs.forEach(sub => sub.unsubscribe());
  }

}
