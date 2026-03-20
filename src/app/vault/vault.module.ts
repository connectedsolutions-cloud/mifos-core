import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { VaultRoutingModule } from './vault-routing.module';
import { VaultComponent } from './vault.component';
import { VaultAllocateCashDialogComponent } from './allocate-cash-dialog/allocate-cash-dialog.component';

@NgModule({
  imports: [
    CommonModule,
    VaultRoutingModule,
    VaultComponent,
    VaultAllocateCashDialogComponent
  ]
})
export class VaultModule {}
