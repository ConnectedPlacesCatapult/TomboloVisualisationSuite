import {Component, HostBinding, OnInit} from '@angular/core';
import * as Debug from 'debug';

import {Router} from '@angular/router';
import {Subscription} from 'rxjs/Subscription';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AuthService} from '../auth.service';

const debug = Debug('tombolo:password-reset-dialog');

@Component({
  selector: 'reset-password-component',
  templateUrl: './reset-password.html',
  styleUrls: ['../auth-panel.scss']
})
export class ResetPasswordDialogComponent implements OnInit {

  @HostBinding('class.auth-panel-component') authPanelComponentClass = true;

  constructor(
    private router: Router,
    private authService: AuthService) {}

  resetPasswordForm: FormGroup;
  passwordReset = false;
  errorMessage: string;

  private _subs: Subscription[] = [];

  ngOnInit() {
    this.resetPasswordForm = new FormGroup({
      email: new FormControl('', Validators.required)
    });

    this._subs.push(this.resetPasswordForm.valueChanges.subscribe(() => this.errorMessage = null));
  }

  ngOnDestroy() {
    this._subs.forEach(sub => sub.unsubscribe());
  }

  close() {
    this.router.navigate([{outlets: {'loginBox': null}}]);
  }

  resetPassword() {

    const email = this.resetPasswordForm.get('email').value;

    this.authService.resetPassword(email)
      .then(user => {
        this.passwordReset = true;
      })
      .catch(() => this.errorMessage = 'Invalid email or password');
  }
}
