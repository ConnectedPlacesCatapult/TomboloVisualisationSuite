import {Component, HostBinding, OnInit} from '@angular/core';
import * as Debug from 'debug';

import {Router} from '@angular/router';
import {Subscription} from 'rxjs/Subscription';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AuthService} from '../auth.service';

const debug = Debug('tombolo:password-reset-dialog');

@Component({
  selector: 'change-password-component',
  templateUrl: './change-password.html',
  styleUrls: ['../auth-panel.scss']
})
export class ChangePasswordDialogComponent implements OnInit {

  @HostBinding('class.auth-panel-component') authPanelComponentClass = true;

  constructor(
    private router: Router,
    private authService: AuthService) {}

  changePasswordForm: FormGroup;
  errorMessage: string;

  private _subs: Subscription[] = [];

  ngOnInit() {
    this.changePasswordForm = new FormGroup({
      email: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required),
      confirmPassword: new FormControl('', Validators.required)
    });

    this._subs.push(this.changePasswordForm.valueChanges.subscribe(() => this.errorMessage = null));
  }

  ngOnDestroy() {
    this._subs.forEach(sub => sub.unsubscribe());
  }

  close() {
    this.router.navigate([{outlets: {'loginBox': null}}]);
  }

  changePassword() {

    const email = this.changePasswordForm.get('email').value;
    const password = this.changePasswordForm.get('password').value;
    const confirmPassword = this.changePasswordForm.get('confirmPassword').value;

    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');

    // Check password matches confirmation
    if (password !== confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    this.authService.changePassword(email, password, token)
      .then(user => this.router.navigate([{outlets: {'loginBox': 'login'}}]))
      .catch(() => this.errorMessage = 'Invalid email or password');
  }
}
