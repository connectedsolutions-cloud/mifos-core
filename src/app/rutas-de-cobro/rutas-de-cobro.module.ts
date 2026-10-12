import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RutasDeCobroRoutingModule } from './rutas-de-cobro-routing.module';
import { RutasDeCobroComponent } from './rutas-de-cobro.component';
import { RutaDeCobroFormComponent } from './ruta-de-cobro-form/ruta-de-cobro-form.component';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { TranslateModule } from '@ngx-translate/core';
import { STANDALONE_SHARED_IMPORTS } from '../standalone-shared.module';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    RutasDeCobroRoutingModule,
    MatTableModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatIconModule,
    MatPaginatorModule,
    MatSortModule,
    MatAutocompleteModule,
    TranslateModule.forRoot(),
    ...STANDALONE_SHARED_IMPORTS,
    RutasDeCobroComponent,
    RutaDeCobroFormComponent
  ]
})
export class RutasDeCobroModule {}
