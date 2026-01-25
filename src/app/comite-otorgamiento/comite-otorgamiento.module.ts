import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { ComiteOtorgamientoRoutingModule } from './comite-otorgamiento-routing.module';
import { ComiteOtorgamientoComponent } from './comite-otorgamiento.component';
import { EditSesionComiteComponent } from './edit-sesion-comite/edit-sesion-comite.component';
import { CreateSesionComiteDialogComponent } from './create-sesion-comite-dialog/create-sesion-comite-dialog.component';

// Material imports
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDatepickerModule } from '@angular/material/datepicker';

import { TranslateModule } from '@ngx-translate/core';

import { STANDALONE_SHARED_IMPORTS } from '../standalone-shared.module';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    ComiteOtorgamientoRoutingModule,
    MatTableModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatCardModule,
    MatIconModule,
    MatPaginatorModule,
    MatSortModule,
    MatDatepickerModule,
    TranslateModule.forRoot(),
    ...STANDALONE_SHARED_IMPORTS
  ]
})
export class ComiteOtorgamientoModule {}
