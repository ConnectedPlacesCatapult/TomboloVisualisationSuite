import {DialogsService} from './dialogs.service';
import {MaterialModule } from '../material';
import {NgModule} from '@angular/core';

import {ConfirmDialog }   from './confirm-dialog.component';
import {FlexLayoutModule} from '@angular/flex-layout';
import {InformationDialog} from './info-dialog.component';
import {NotificationService} from './notification.service';

@NgModule({
  imports: [
    FlexLayoutModule,
    MaterialModule
  ],
  exports: [
    ConfirmDialog,
    InformationDialog
  ],
  declarations: [
    ConfirmDialog,
    InformationDialog
  ],
  providers: [
    DialogsService,
    NotificationService
  ],
  entryComponents: [
    ConfirmDialog,
    InformationDialog
  ],
})
export class DialogsModule { }
