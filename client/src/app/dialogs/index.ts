import {DialogsService} from './dialogs.service';
import {MaterialModule } from '../material';
import {NgModule} from '@angular/core';

import {ConfirmDialog }   from './confirm-dialog.component';
import {FlexLayoutModule} from '@angular/flex-layout';
import {InformationDialog} from './info-dialog.component';
import {NotificationService} from './notification.service';
import {ShareDialog} from './share-dialog.component';

@NgModule({
  imports: [
    FlexLayoutModule,
    MaterialModule
  ],
  exports: [
    ConfirmDialog,
    InformationDialog,
    ShareDialog
  ],
  declarations: [
    ConfirmDialog,
    InformationDialog,
    ShareDialog
  ],
  providers: [
    DialogsService,
    NotificationService
  ],
  entryComponents: [
    ConfirmDialog,
    InformationDialog,
    ShareDialog
  ],
})
export class DialogsModule { }
