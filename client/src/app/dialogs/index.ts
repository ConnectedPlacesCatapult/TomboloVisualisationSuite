import {DialogsService} from './dialogs.service';
import {MaterialModule } from '../material';
import {NgModule} from '@angular/core';

import {ConfirmDialog }   from './confirm-dialog.component';
import {FlexLayoutModule} from '@angular/flex-layout';
import {InformationDialog} from './info-dialog.component';
import {NotificationService} from './notification.service';
import {ShareDialog} from './share-dialog/share-dialog.component';
import {ShareModule} from "@ngx-share/core";
import {RecipeDialog} from "./recipe-dialog/recipe-dialog.component";
import {CodeMirrorComponent} from "../codemirror/codemirror.component";
import {FormsModule} from "@angular/forms";

@NgModule({
  imports: [
    FormsModule,
    FlexLayoutModule,
    MaterialModule,
    ShareModule.forRoot()
  ],
  exports: [
    ConfirmDialog,
    InformationDialog,
    ShareDialog,
    RecipeDialog
  ],
  declarations: [
    ConfirmDialog,
    InformationDialog,
    ShareDialog,
    RecipeDialog,
    CodeMirrorComponent
  ],
  providers: [
    DialogsService,
    NotificationService
  ],
  entryComponents: [
    ConfirmDialog,
    InformationDialog,
    ShareDialog,
    RecipeDialog
  ],
})
export class DialogsModule { }
