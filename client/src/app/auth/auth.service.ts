import {Injectable} from '@angular/core';
import * as Debug from 'debug';
import {Subject} from 'rxjs/Subject';
import {User} from './user';
import {Observable} from 'rxjs/Observable';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {NotificationService} from '../dialogs/notification.service';

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

        if (e instanceof HttpErrorResponse && e.status === 401) {
          // Login failed
          debug('Login failed');
          this._user$.next(null);
          return Promise.reject(null);
        }

        return this.handleError(e);
      })
      .toPromise();
  }

  signup(email: string, password: string) {
    // application/x-www-form-urlencoded form data
    let body = new URLSearchParams();

    body.set('email', email);
    body.set('password', password);

    let options = {
      headers: new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded')
    };

    return this.http.post<User>(`${environment.apiEndpoint}/auth/signup`, body.toString(), options)
      .map(u => {
        debug(`Signed up user`, u);
        return u;
      })
      .catch(e => {

        debug('signup error', e);

        if (e instanceof HttpErrorResponse && e.status === 400) {
          // Bad request
          return Promise.reject(e);
        }

        // Generic handler for unknown errors
        return this.handleError(e);
      })
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

        if (e instanceof HttpErrorResponse && e.status === 404) {
          // No logged in user
          debug('No logged in user');
          this._user$.next(null);
          return Promise.resolve(null);
        }

        return this.handleError(e);
      })
      .toPromise();
  }

  logOut(): Promise<void> {
    return this.http.get(`${environment.apiEndpoint}/auth/logout`, {}).map(() => {
      this._user$.next(null);
    }).toPromise();
  }

  private handleError(e): Promise<any> {

    if (!environment.production) {
      this.notificationService.error(e);
    }
    return Promise.reject(e);
  }
}
