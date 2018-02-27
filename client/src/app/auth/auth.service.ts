import {Injectable} from '@angular/core';
import * as Debug from 'debug';
import {Subject} from 'rxjs/Subject';
import {User} from './user';
import {Observable} from 'rxjs/Observable';

const debug = Debug('tombolo:AuthService');


@Injectable()
export class AuthService {

  private _user$ = new Subject<User>();

  user$(): Observable<User> {
    return this._user$.asObservable();
  }

  login(email: string, password: string): Observable<User> {
    debug('Logging in');
  }

  signup(email: string, password: string): Observable<User> {
    debug('Signing up');
  }

  loadUser(): Observable<User> {

  }
}
