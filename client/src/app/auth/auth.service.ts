import {Injectable} from '@angular/core';
import * as Debug from 'debug';
import {Subject} from 'rxjs/Subject';
import {User} from './user';
import {Observable} from 'rxjs/Observable';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {NotificationService} from '../dialogs/notification.service';
import {UserBase} from '../../../../src/shared/user-base';

const debug = Debug('tombolo:AuthService');

@Injectable()
export class AuthService {

  private _user$ = new Subject<User>();

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService) {}

  user$(): Observable<User> {
    return this._user$.asObservable();
  }

  /**
   * Log in with email and password
   *
   * @param {string} email
   * @param {string} password
   */
  login(email: string, password: string): Promise<User> {

    // application/x-www-form-urlencoded form data
    let body = new URLSearchParams();

    body.set('username', email);
    body.set('password', password);

    let options = {
      headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded')
    };

    return this.http.post<User>(`${environment.apiEndpoint}/auth/login`, body.toString(), options)
      .map(u => {
        debug(`Logged in user`, u);
        this._user$.next(u);
        return u;
      })
      .catch(e => {
        this._user$.next(null);
        return this.handleError(e);
      })
      .toPromise();
  }

  signup(data: object) {
    // application/x-www-form-urlencoded form data
    let body = new URLSearchParams();

    Object.keys(data).forEach(key => {
      body.set(key, data[key]);
    });

    let options = {
      headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded')
    };

    return this.http.post<User>(`${environment.apiEndpoint}/auth/signup`, body.toString(), options)
      .map(u => {
        debug(`Signed up user`, u);
        return u;
      })
      .catch(e =>this.handleError(e))
      .toPromise();
  }

  /**
   * Send a password reset email to the specified user
   *
   * @param {string} email
   */
  resetPassword(email: string): Promise<User> {
    let body = new URLSearchParams();

    body.set('email', email);

    let options = {
      headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded')
    };

    return this.http.post<User>(`${environment.apiEndpoint}/auth/resetpassword`, body.toString(), options)
      .map(u => {
        debug(`Sent reset password email`, u);
        return u;
      })
      .catch(e => this.handleError(e))
      .toPromise();
  }

  /**
   * Change password
   *
   * Requires a password reset token delivered by email
   *
   * @param {string} email
   * @param {string} password
   * @param {string} token
   */
  changePassword(email: string, password: string, token: string): Promise<User> {

    // application/x-www-form-urlencoded form data
    let body = new URLSearchParams();

    body.set('email', email);
    body.set('password', password);
    body.set('token', token);

    let options = {
      headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded')
    };

    return this.http.post<User>(`${environment.apiEndpoint}/auth/changepassword`, body.toString(), options)
      .map(u => {
        debug(`Changed password`, u);
        return u;
      })
      .catch(e => this.handleError(e))
      .toPromise();
  }

  loadUser(): Promise<User> {
    return this.http.get<User>(`${environment.apiEndpoint}/auth/me`)
      .map(user => {
        debug(`Loaded user: ${user.email}`);
        this._user$.next(user);

        return user;
      })
      .catch(e => {
        this._user$.next(null);

        if (e instanceof HttpErrorResponse && e.status === 404) {
          // Not logged in
          return Promise.resolve(null);
        }

        return this.handleError(e)
      })
      .toPromise();
  }

  logOut(): Promise<void> {
    return this.http.get(`${environment.apiEndpoint}/auth/logout`, {}).map(() => {
      this._user$.next(null);
    }).toPromise();
  }

  private handleError(e): Promise<any> {

    debug('Auth error', e);

    if (e instanceof HttpErrorResponse) {
      // Bad request
      return Promise.reject(e.error);
    }

    if (!environment.production) {
      this.notificationService.error(e);
    }

    return Promise.reject(new Error('Unknown error'));
  }
}
