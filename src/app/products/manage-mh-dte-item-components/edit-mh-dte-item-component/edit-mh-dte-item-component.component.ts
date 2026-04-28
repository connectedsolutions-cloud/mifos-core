import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductsService } from '../../products.service';
import { MhDteItemComponentsListRefreshService } from '../mh-dte-item-components-list-refresh.service';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

@Component({
  selector: 'mifosx-edit-mh-dte-item-component',
  templateUrl: './edit-mh-dte-item-component.component.html',
  styleUrls: ['./edit-mh-dte-item-component.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    ReactiveFormsModule,
    RouterLink
  ]
})
export class EditMhDteItemComponentComponent implements OnInit {
  form: UntypedFormGroup;
  charges: any[] = [];
  dteTypes = [
    'ventaNoSuj',
    'ventaExenta',
    'ventaGravada',
    'psv',
    'noGravado'
  ];
  loanComponents = [
    'PRINCIPAL',
    'INTEREST'
  ];
  id: string;

  constructor(
    private fb: UntypedFormBuilder,
    private productsService: ProductsService,
    private router: Router,
    private route: ActivatedRoute,
    private mhDteItemComponentsListRefreshService: MhDteItemComponentsListRefreshService
  ) {
    this.form = this.fb.group({
      name: [
        '',
        Validators.required
      ],
      dteAmountType: [''],
      chargeId: [null],
      loanComponent: [''],
      clientType: ['']
    });
  }

  ngOnInit(): void {
    this.productsService.getCharges().subscribe((data: any[]) => {
      this.charges = data || [];
    });
    this.route.data.subscribe((data: { mhDteItem: any }) => {
      const it = data.mhDteItem;
      this.id = String(it.id);
      this.form.patchValue({
        name: it.name,
        dteAmountType: it.dteAmountType || '',
        chargeId: it.chargeId ?? null,
        loanComponent: it.loanComponent || '',
        clientType: it.clientType || ''
      });
    });
    this.form.get('chargeId')?.valueChanges.subscribe((v) => {
      if (v) {
        this.form.patchValue({ loanComponent: '' }, { emitEvent: false });
      }
    });
    this.form.get('loanComponent')?.valueChanges.subscribe((v) => {
      if (v) {
        this.form.patchValue({ chargeId: null }, { emitEvent: false });
      }
    });
  }

  submit() {
    if (this.form.get('name')?.invalid) {
      return;
    }
    const v = this.form.value;
    const hasCharge = v.chargeId != null && v.chargeId !== '';
    const payload: any = {
      name: v.name?.trim(),
      clientType: (v.clientType && String(v.clientType).trim()) || null
    };
    if (v.dteAmountType) {
      payload.dteAmountType = v.dteAmountType;
    }
    payload.chargeId = hasCharge ? Number(v.chargeId) : null;
    payload.loanComponent = v.loanComponent || null;
    this.productsService.updateMhDteItemComponent(this.id, payload).subscribe({
      next: () => {
        this.mhDteItemComponentsListRefreshService.setShouldRefresh();
        void this.router.navigate([
          '/products/mh-dte-item-components',
          this.id
        ]);
      },
      error: (e) => alert(e.error?.errors?.[0]?.defaultUserMessage || e.message || 'Error')
    });
  }
}
