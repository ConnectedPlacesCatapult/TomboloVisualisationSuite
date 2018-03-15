import {Injectable} from '@angular/core';
import { Observable } from 'rxjs/Observable';
import {ActivatedRouteSnapshot, CanDeactivate, RouterStateSnapshot} from '@angular/router';
import {DialogsService} from "../dialogs/dialogs.service";
import {MapEditorComponent} from "./map-editor.component";


@Injectable()
export class EditorDeactivateGuard implements CanDeactivate<MapEditorComponent> {

  routeWhitelist = ['mapexport'];

  constructor(private dialogsService: DialogsService) {
  }

  canDeactivate(component: MapEditorComponent,
                currentRoute: ActivatedRouteSnapshot,
                currentState: RouterStateSnapshot,
                nextState: RouterStateSnapshot): Observable<boolean> {

    if (component.mapModified) {
      const routeChildren = nextState.root.children;

      const whitelistedRoute = routeChildren.some(child => {
        return this.routeWhitelist.includes(child.url[0].path);
      });

      if (!whitelistedRoute) {
        return this.dialogsService.confirm('Unsaved Changes', 'You have unsaved changes, are you sure you want to navigate away?');
      }
    }

    return Observable.of(true);
  }
}
