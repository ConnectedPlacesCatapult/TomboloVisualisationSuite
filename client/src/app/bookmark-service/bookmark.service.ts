/**
 * Bookmark Service
 */


import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {HttpClient} from "@angular/common/http";
import 'rxjs/add/operator/debounceTime';
import {environment} from "../../environments/environment";

@Injectable()
export class BookmarkService {

  constructor(private http: HttpClient) {
  }

  postBookmark(url: string): Observable<string> {
    return this.http.post(`${environment.apiEndpoint}/createBookmark`,{url: url});
  }

  getBookmark(base58Id: string): Observable<string> {
    return this.http.get<string>(`/b/${base58Id}`,{withCredentials: true});
  }
}
