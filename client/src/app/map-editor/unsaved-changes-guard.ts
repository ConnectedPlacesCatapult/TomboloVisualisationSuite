import {Injectable} from '@angular/core';
import { Observable } from 'rxjs/Observable';
import {ActivatedRouteSnapshot, CanDeactivate, RouterStateSnapshot} from '@angular/router';
import {DialogsService} from "../dialogs/dialogs.service";
import {MapEditorComponent} from "./map-editor.component";


@Injectable()
export class EditorDeactivateGuard implements CanDeactivate<MapEditorComponent> {

  constructor(private dialogsService: DialogsService) {
  }

  canDeactivate(component: MapEditorComponent,
                currentRoute: ActivatedRouteSnapshot,
                currentState: RouterStateSnapshot,
                nextState: RouterStateSnapshot): Observable<boolean> {

    if (component.mapModified) {
      return this.dialogsService.confirm('Unsaved Changes', 'You have unsaved changes, are you sure you want to navigate away?');
    }

    return Observable.of(true);
  }
}
