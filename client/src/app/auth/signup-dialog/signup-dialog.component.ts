import {Component, HostBinding, OnInit} from '@angular/core';
import * as Debug from 'debug';

import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs/Subscription';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AuthService} from '../auth.service';

const debug = Debug('tombolo:signup-dialog');

@Component({
  selector: 'signup-component',
  templateUrl: './signup.html',
  styleUrls: ['./signup.scss', '../auth-panel.scss']
})
export class SignupDialogComponent implements OnInit {

  @HostBinding('class.auth-panel-component') authPanelComponentClass = true;

  constructor(
    private router: Router,
    private authService: AuthService) {}

  signupForm: FormGroup;
  errorMessage: string;

  private _subs: Subscription[] = [];

  ngOnInit() {
    this.signupForm = new FormGroup({
      email: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required),
      confirmPassword: new FormControl('', Validators.required),
      newsletters: new FormControl(true, Validators.required)
    });

    this._subs.push(this.signupForm.valueChanges.subscribe(() => this.errorMessage = null));
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

  signup() {

    // Check password matches confirmation
    if (this.signupForm.get('password').value !== this.signupForm.get('confirmPassword').value) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    this.authService.signup(this.signupForm.value)
      .then(user => this.router.navigate([{outlets: {'loginBox': 'signupconfirm'}}]))
      .catch((e) => this.errorMessage = e.message);
  }

}
