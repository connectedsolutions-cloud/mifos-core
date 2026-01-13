/** Angular Imports */
import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import {
  MatTableDataSource,
  MatTable,
  MatColumnDef,
  MatHeaderCellDef,
  MatHeaderCell,
  MatCellDef,
  MatCell,
  MatHeaderRowDef,
  MatHeaderRow,
  MatRowDef,
  MatRow
} from '@angular/material/table';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';

/** Custom Models */
import { FormfieldBase } from 'app/shared/form-dialog/formfield/model/formfield-base';
import { InputBase } from 'app/shared/form-dialog/formfield/model/input-base';
import { SelectBase } from 'app/shared/form-dialog/formfield/model/select-base';

/** Custom Dialogs */
import { FormDialogComponent } from 'app/shared/form-dialog/form-dialog.component';

/** Custom Services */
import { OrganizationService } from '../../organization.service';
import { SettingsService } from 'app/settings/settings.service';
import { MatFormField, MatLabel, MatError, MatHint } from '@angular/material/form-field';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { FindPipe } from '../../../pipes/find.pipe';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatCard } from '@angular/material/card';
import { MatList, MatListItem } from '@angular/material/list';
import { MatDivider } from '@angular/material/divider';

/**
 * Create Loan Provisioning Criteria Component.
 */
@Component({
  selector: 'mifosx-create-loan-provisioning-criteria',
  templateUrl: './create-loan-provisioning-criteria.component.html',
  styleUrls: ['./create-loan-provisioning-criteria.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatHint,
    MatTable,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatCellDef,
    MatCell,
    FaIconComponent,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    FindPipe,
    MatButton,
    MatIcon,
    MatCard,
    MatList,
    MatListItem,
    MatDivider
  ]
})
export class CreateLoanProvisioningCriteriaComponent implements OnInit {
  /** Loan Provisioning Criteria form. */
  provisioningCriteriaForm: UntypedFormGroup;
  /** Loan Provisioning Criteria Template */
  loanProvisioningCriteriaTemplate: any;
  /** Liability Accounts */
  liabilityAccounts: any;
  /** Expense Accounts */
  expenseAccounts: any;
  /** All Available Categories */
  categories: any[] = [];
  /** Category Order Array */
  categoryOrder: number[] = [];
  /** Ordered Categories for display */
  orderedCategories: any[] = [];

  /** Columns to be displayed in definitions table. */
  displayedColumns: string[] = [
    'category',
    'minAge',
    'maxAge',
    'percentage',
    'liabilityAccount',
    'expenseAccount',
    'edit'
  ];
  /** Criteria Definitions Array */
  definitions: {
    categoryId: number;
    categoryName: string;
    maxAge?: number;
    minAge?: number;
    liabilityAccount?: string;
    expenseAccount?: string;
    provisioningPercentage?: number;
  }[] = [];
  /** Checks Definitons Table Validity */
  isDefinitionValid: any = {};

  /**
   * Retrieves the offices data from `resolve`.
   * @param {FormBuilder} formBuilder Form Builder.
   * @param {OrganizationService} organizationService Organization Service.
   * @param {SettingsService} settingsService Settings Service.
   * @param {ActivatedRoute} route Activated Route.
   * @param {Router} router Router for navigation.
   */
  constructor(
    private formBuilder: UntypedFormBuilder,
    private organizationService: OrganizationService,
    private settingsService: SettingsService,
    private router: Router,
    public dialog: MatDialog,
    private route: ActivatedRoute
  ) {
    this.route.data.subscribe((data: { loanProvisioningCriteriaTemplate: any }) => {
      this.loanProvisioningCriteriaTemplate = data.loanProvisioningCriteriaTemplate;
      this.definitions = this.loanProvisioningCriteriaTemplate.definitions;
      this.liabilityAccounts = this.loanProvisioningCriteriaTemplate.glAccounts.filter(
        (account: any) => account.type.value === 'LIABILITY'
      );
      this.expenseAccounts = this.loanProvisioningCriteriaTemplate.glAccounts.filter(
        (account: any) => account.type.value === 'EXPENSE'
      );
      this.loadCategories();
    });
  }

  ngOnInit() {
    this.createProvisioningCriteriaForm();
  }

  /**
   * Loads all provisioning categories
   * @param {boolean} forceRefresh If true, bypasses cache by adding timestamp parameter
   */
  loadCategories(forceRefresh: boolean = false) {
    this.organizationService.getProvisioningCategories(forceRefresh).subscribe((categories: any) => {
      this.categories = categories || [];
      // Initialize category order based on current order
      this.categoryOrder = this.categories.map((cat: any) => cat.id);
      // Update ordered categories
      this.updateOrderedCategories();
      // Ensure definitions are ordered according to category order
      this.reorderDefinitions();
    });
  }

  /**
   * Updates the ordered categories array for display
   */
  updateOrderedCategories() {
    const ordered: any[] = [];
    this.categoryOrder.forEach((categoryId: number) => {
      const category = this.categories.find((cat: any) => cat.id === categoryId);
      if (category) {
        ordered.push(category);
      }
    });
    // Add any categories not in order array
    this.categories.forEach((category: any) => {
      if (!this.categoryOrder.includes(category.id)) {
        ordered.push(category);
      }
    });
    this.orderedCategories = ordered;
  }

  /**
   * Add new category
   */
  addCategory() {
    const data = {
      title: 'Add Provisioning Category',
      formfields: this.getCategoryFormFields(null),
      layout: { addButtonText: 'Confirm' }
    };
    const addCategoryDialogRef = this.dialog.open(FormDialogComponent, { data });
    addCategoryDialogRef.afterClosed().subscribe((response: any) => {
      if (response.data) {
        // Only send categoryname and categorydescription - these are the only supported parameters
        const categoryData = {
          categoryname: response.data.value.categoryname,
          categorydescription: response.data.value.categorydescription || ''
        };
        this.organizationService.createProvisioningCategory(categoryData).subscribe(
          (result: any) => {
            this.loadCategories(true); // Force refresh categories after creation (clears cache)
          },
          (error: any) => {
            // Handle error - show backend error message
            const errorMessage =
              error.error?.errors?.[0]?.defaultUserMessage ||
              error.error?.defaultUserMessage ||
              'Error creating category';
            alert(errorMessage);
          }
        );
      }
    });
  }

  /**
   * Gets formfields for category form dialog
   * @param {any} category Category (null for new category)
   */
  getCategoryFormFields(category: any) {
    const formfields: FormfieldBase[] = [];
    formfields.push(
      new InputBase({
        controlName: 'categoryname',
        label: 'Category Name',
        value: category ? category.categoryName : '',
        type: 'text',
        required: true,
        order: 1
      })
    );
    formfields.push(
      new InputBase({
        controlName: 'categorydescription',
        label: 'Description',
        value: category ? category.categoryDescription : '',
        type: 'text',
        required: false,
        order: 2
      })
    );
    return formfields;
  }

  /**
   * Delete category
   * @param {any} category Category to delete
   */
  deleteCategory(category: any) {
    // Check if category is used in current form definitions and is properly configured
    const isUsedInDefinitions = this.definitions.some((def: any) => {
      if (def.categoryId === category.id) {
        // Only consider it "in use" if the definition has been properly configured
        // (has all required fields: minAge, maxAge, percentage, liabilityAccount, expenseAccount)
        const isConfigured =
          def.minAge != null &&
          def.maxAge != null &&
          def.provisioningPercentage != null &&
          def.liabilityAccount != null &&
          def.expenseAccount != null;
        return isConfigured;
      }
      return false;
    });

    if (isUsedInDefinitions) {
      alert('Cannot delete category that is in use in this criteria');
      return;
    }

    // Confirm deletion
    if (confirm(`Are you sure you want to delete category "${category.categoryName}"?`)) {
      this.organizationService.deleteProvisioningCategory(category.id.toString()).subscribe(
        () => {
          this.loadCategories(true); // Force refresh categories after deletion (clears cache)
          // Remove from definitions if present (shouldn't happen due to check above)
          this.definitions = this.definitions.filter((def: any) => def.categoryId !== category.id);
        },
        (error: any) => {
          // Show backend error message
          const errorMessage =
            error.error?.errors?.[0]?.defaultUserMessage ||
            error.error?.defaultUserMessage ||
            'Error deleting category';
          alert(errorMessage);
        }
      );
    }
  }

  /**
   * Move category up in order
   * @param {number} index Current index in ordered list
   */
  moveCategoryUp(index: number) {
    if (index > 0) {
      const categoryId = this.orderedCategories[index].id;
      const currentOrderIndex = this.categoryOrder.indexOf(categoryId);
      if (currentOrderIndex > 0) {
        const temp = this.categoryOrder[currentOrderIndex];
        this.categoryOrder[currentOrderIndex] = this.categoryOrder[currentOrderIndex - 1];
        this.categoryOrder[currentOrderIndex - 1] = temp;
        this.updateOrderedCategories();
        this.reorderDefinitions();
      }
    }
  }

  /**
   * Move category down in order
   * @param {number} index Current index in ordered list
   */
  moveCategoryDown(index: number) {
    if (index < this.orderedCategories.length - 1) {
      const categoryId = this.orderedCategories[index].id;
      const currentOrderIndex = this.categoryOrder.indexOf(categoryId);
      if (currentOrderIndex < this.categoryOrder.length - 1) {
        const temp = this.categoryOrder[currentOrderIndex];
        this.categoryOrder[currentOrderIndex] = this.categoryOrder[currentOrderIndex + 1];
        this.categoryOrder[currentOrderIndex + 1] = temp;
        this.updateOrderedCategories();
        this.reorderDefinitions();
      }
    }
  }

  /**
   * Reorder categories array based on categoryOrder
   * @deprecated Use orderedCategories property instead
   */
  reorderCategories() {
    const orderedCategories: any[] = [];
    this.categoryOrder.forEach((categoryId: number) => {
      const category = this.categories.find((cat: any) => cat.id === categoryId);
      if (category) {
        orderedCategories.push(category);
      }
    });
    // Add any categories not in order array
    this.categories.forEach((category: any) => {
      if (!this.categoryOrder.includes(category.id)) {
        orderedCategories.push(category);
      }
    });
    return orderedCategories;
  }

  /**
   * Reorder definitions based on category order
   */
  reorderDefinitions() {
    // Sort definitions to match category order
    this.definitions.sort((a: any, b: any) => {
      const aIndex = this.orderedCategories.findIndex((cat: any) => cat.id === a.categoryId);
      const bIndex = this.orderedCategories.findIndex((cat: any) => cat.id === b.categoryId);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
    // Trigger change detection
    this.definitions = [...this.definitions];
  }

  /**
   * Get ordered categories for use in dropdowns
   * @deprecated Use orderedCategories property instead
   */
  getOrderedCategories() {
    return this.orderedCategories;
  }

  /**
   * Creates the provisioning criteria form
   */
  createProvisioningCriteriaForm() {
    this.provisioningCriteriaForm = this.formBuilder.group({
      criteriaName: [
        '',
        Validators.required
      ],
      loanProducts: [
        [],
        Validators.required
      ]
    });
  }

  /**
   * Edit Definition
   * @param {any} definition Definition
   * @param {number} index Definition index
   */
  editDefinition(definition: any) {
    const data = {
      title: 'Edit Criteria Definition',
      formfields: this.getDefinitionFormFields(definition),
      layout: { addButtonText: 'Confirm' }
    };
    const editDefinitionDialogRef = this.dialog.open(FormDialogComponent, { data });
    editDefinitionDialogRef.afterClosed().subscribe((response: any) => {
      if (response.data) {
        const definitionData = {
          ...response.data.value,
          categoryName: definition.categoryName,
          categoryId: definition.categoryId
        };
        this.definitions.splice(this.definitions.indexOf(definition), 1, definitionData);
        this.definitions = this.definitions.concat([]);
        this.isDefinitionValid[definition.categoryName] = true;
      }
    });
  }

  /**
   * Gets formfields for form dialog.
   * @param {any} definition Definition
   */
  getDefinitionFormFields(definition: any) {
    const formfields: FormfieldBase[] = [];
    formfields.push(
      new InputBase({
        controlName: 'minAge',
        label: 'Min Age',
        value: definition ? definition.minAge : '',
        type: 'number',
        required: true,
        order: 1
      })
    );
    formfields.push(
      new InputBase({
        controlName: 'maxAge',
        label: 'Max Age',
        value: definition ? definition.maxAge : '',
        type: 'number',
        required: true,
        order: 2
      })
    );
    formfields.push(
      new InputBase({
        controlName: 'provisioningPercentage',
        label: 'Percentage (%)',
        value: definition ? definition.provisioningPercentage : '',
        type: 'number',
        required: true,
        order: 3
      })
    );
    formfields.push(
      new SelectBase({
        controlName: 'liabilityAccount',
        label: 'Liability Account',
        value: definition ? definition.liabilityAccount : '',
        options: {
          label: 'name',
          value: 'id',
          data: this.liabilityAccounts,
          searchLabel: 'name',
          searchCode: 'glCode',
          displayFormat: '({{glCode}}) {{name}}'
        },
        required: true,
        order: 4,
        searchable: true
      })
    );
    formfields.push(
      new SelectBase({
        controlName: 'expenseAccount',
        label: 'Expense Account',
        value: definition ? definition.expenseAccount : '',
        options: {
          label: 'name',
          value: 'id',
          data: this.expenseAccounts,
          searchLabel: 'name',
          searchCode: 'glCode',
          displayFormat: '({{glCode}}) {{name}}'
        },
        required: true,
        order: 5,
        searchable: true
      })
    );
    return formfields;
  }

  /**
   * Returns validity of form and table.
   */
  get provisioningCriteriaFormValid() {
    const definitionsValid: boolean =
      Object.entries(this.isDefinitionValid).length === this.definitions.length ? true : false;
    return this.provisioningCriteriaForm.valid && definitionsValid;
  }

  /**
   * Creates a loan provisioning criteria.
   */
  submit() {
    const locale = this.settingsService.language.code;
    const products = this.provisioningCriteriaForm.get('loanProducts').value;
    const loanProvisioningCriteria = {
      ...this.provisioningCriteriaForm.value,
      loanProducts: products.map((product: any) => ({
        id: product.id,
        name: product.name,
        includeInBorrowerCycle: product.includeInBorrowerCycle
      })),
      definitions: this.definitions,
      locale
    };
    this.organizationService.createProvisioningCriteria(loanProvisioningCriteria).subscribe((response: any) => {
      this.router.navigate(
        [
          '../',
          response.resourceId
        ],
        { relativeTo: this.route }
      );
    });
  }
}
