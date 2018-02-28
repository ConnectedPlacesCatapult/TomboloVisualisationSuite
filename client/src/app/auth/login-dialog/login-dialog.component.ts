import {Component, HostBinding, OnInit} from '@angular/core';
import * as Debug from 'debug';

import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs/Subscription';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AuthService} from '../auth.service';
import {Angulartics2} from 'angulartics2';

const debug = Debug('tombolo:login-dialog');

@Component({
  selector: 'login-component',
  templateUrl: './login.html',
  styleUrls: ['../auth-panel.scss']
})
export class LoginDialogComponent implements OnInit {

  @HostBinding('class.auth-panel-component') authPanelComponentClass = true;

  constructor(
    private router: Router,
    private authService: AuthService,
    private analytics: Angulartics2) {}

  loginForm: FormGroup;
  errorMessage: string;


  private _subs: Subscription[] = [];

  ngOnInit() {
    this.loginForm = new FormGroup({
      email: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required)
    });

    this._subs.push(this.loginForm.valueChanges.subscribe(() => this.errorMessage = null));
  }

  ngOnDestroy() {
    this._subs.forEach(sub => sub.unsubscribe());
  }

  signup() {
    this.router.navigate([{outlets: {'loginBox': 'signup'}}]);
  }

  close() {
    this.router.navigate([{outlets: {loginBox: null, rightBar: null}}]);
  }

  login() {
    this.authService.login(this.loginForm.get('email').value, this.loginForm.get('password').value)
      .then(user => {
        this.router.navigate([{outlets: {'loginBox': null}}]);
        this.analytics.eventTrack.next({
          action: 'Login',
          properties: {
            category: 'Account',
            label: this.loginForm.get('email').value
          },
        });
      })
      .catch(() => {
        this.errorMessage = 'Invalid email or password';
        this.analytics.eventTrack.next({
          action: 'LoginFail',
          properties: {
            category: 'Account',
            label: this.loginForm.get('email').value
          },
        });
      });
  }
}
