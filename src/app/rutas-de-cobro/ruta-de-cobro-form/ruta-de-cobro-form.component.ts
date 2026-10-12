import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatIconButton } from '@angular/material/button';
import { MatNavList, MatListSubheaderCssMatStyler } from '@angular/material/list';
import { MatLine } from '@angular/material/grid-list';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ClientsService } from 'app/clients/clients.service';
import { OrganizationService } from 'app/organization/organization.service';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import { RutasDeCobroService } from '../rutas-de-cobro.service';

@Component({
  selector: 'mifosx-ruta-de-cobro-form',
  templateUrl: './ruta-de-cobro-form.component.html',
  styleUrls: ['./ruta-de-cobro-form.component.scss'],
  standalone: true,
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    NgxMatSelectSearchModule,
    MatAutocompleteTrigger,
    MatAutocomplete,
    MatIconButton,
    FaIconComponent,
    MatNavList,
    MatListSubheaderCssMatStyler,
    MatLine
  ]
})
export class RutaDeCobroFormComponent implements OnInit, AfterViewInit, OnDestroy {
  routeForm: UntypedFormGroup;
  employees: any[] = [];
  filteredEmployees: any[] = [];
  employeeFilterCtrl = new UntypedFormControl('');
  clientsData: any[] = [];
  clientMembers: any[] = [];
  clientChoice = new UntypedFormControl('');
  routeId: number | null = null;
  isCreate = true;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private formBuilder: UntypedFormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private service: RutasDeCobroService,
    private organizationService: OrganizationService,
    private clientsService: ClientsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.routeForm = this.formBuilder.group({
      routeName: [
        '',
        Validators.required
      ],
      responsibleStaffId: [
        '',
        Validators.required
      ]
    });

    this.employeeFilterCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.filteredEmployees = this.filterEmployees(value);
    });
    this.loadEmployees();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isCreate = false;
      this.routeId = Number(idParam);
      this.service.getRoute(this.routeId).subscribe((route: any) => {
        this.routeForm.patchValue({
          routeName: route.routeName,
          responsibleStaffId: route.responsibleStaffId
        });
        this.clientMembers = (route.clients || []).map((client: any) => ({
          id: client.id,
          displayName: client.displayName,
          accountNo: client.accountNo
        }));
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  compareStaffIds(left: any, right: any): boolean {
    if (left == null || right == null) {
      return left === right;
    }
    return Number(left) === Number(right);
  }

  staffLabel(staff: any): string {
    if (!staff) {
      return '';
    }
    if (staff.displayName) {
      return staff.displayName;
    }
    const name = [
      staff.firstname,
      staff.lastname
    ]
      .filter(Boolean)
      .join(' ');
    return name || String(staff.id ?? '');
  }

  ngAfterViewInit(): void {
    this.clientChoice.valueChanges.subscribe((value: any) => {
      if (typeof value === 'string' && value.length >= 2) {
        this.clientsService.getFilteredClients('displayName', 'ASC', false, value).subscribe((data: any) => {
          this.clientsData = data.pageItems || [];
        });
      }
    });
  }

  displayClient(client: any): string | undefined {
    return client ? client.displayName : undefined;
  }

  addClient(): void {
    const selected = this.clientChoice.value;
    if (!selected?.id) {
      return;
    }
    const alreadyAdded = this.clientMembers.some((client) => client.id === selected.id);
    if (!alreadyAdded) {
      this.clientMembers.push(selected);
    }
    this.clientChoice.setValue('');
    this.clientsData = [];
  }

  removeClient(index: number): void {
    this.clientMembers.splice(index, 1);
  }

  private loadEmployees(): void {
    this.service.getTemplate(true).subscribe({
      next: (template: any) => this.setEmployees(template),
      error: () => {
        this.organizationService.getEmployees(true).subscribe((data: any) => this.setEmployees(data));
      }
    });
  }

  private setEmployees(source: any): void {
    this.employees = this.extractStaffOptions(source);
    this.filteredEmployees = this.filterEmployees(this.employeeFilterCtrl.value);
    this.cdr.detectChanges();
  }

  private extractStaffOptions(source: any): any[] {
    if (Array.isArray(source)) {
      return source;
    }
    if (Array.isArray(source?.staffOptions)) {
      return source.staffOptions;
    }
    if (Array.isArray(source?.pageItems)) {
      return source.pageItems;
    }
    return [];
  }

  private filterEmployees(search: string | null): any[] {
    if (!search) {
      return this.employees.slice();
    }
    const term = String(search).toLowerCase();
    return this.employees.filter((staff) => this.staffLabel(staff).toLowerCase().includes(term));
  }

  submit(): void {
    if (this.routeForm.invalid) {
      return;
    }
    const payload = {
      routeName: this.routeForm.value.routeName,
      responsibleStaffId: this.routeForm.value.responsibleStaffId,
      clientIds: this.clientMembers.map((client) => client.id)
    };
    const request = this.isCreate ? this.service.createRoute(payload) : this.service.updateRoute(this.routeId, payload);
    request.subscribe(() => {
      this.router.navigate(['/rutas-de-cobro']);
    });
  }
}
