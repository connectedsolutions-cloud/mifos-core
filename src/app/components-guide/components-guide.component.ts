import { Clipboard } from '@angular/cdk/clipboard';
import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, UntypedFormControl } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AccountNumberComponent } from 'app/shared/account-number/account-number.component';
import { AccountStatusMarkComponent } from 'app/shared/account-status-progress/account-status-mark.component';
import { GlAccountDisplayComponent } from 'app/shared/accounting/gl-account-display/gl-account-display.component';
import { GlAccountSelectorComponent } from 'app/shared/accounting/gl-account-selector/gl-account-selector.component';
import { DropdownComponent } from 'app/shared/dropdown/dropdown.component';
import { EntityNameComponent } from 'app/shared/entity-name/entity-name.component';
import { ExternalIdentifierComponent } from 'app/shared/external-identifier/external-identifier.component';
import { FileUploadComponent } from 'app/shared/file-upload/file-upload.component';
import { InputAmountComponent } from 'app/shared/input-amount/input-amount.component';
import { InputPasswordComponent } from 'app/shared/input-password/input-password.component';
import { LoaderComponent } from 'app/shared/loader/loader.component';
import { LongTextComponent } from 'app/shared/long-text/long-text.component';
import { Currency, GLAccount } from 'app/shared/models/general.model';
import { StepperButtonsComponent } from 'app/shared/steppers/stepper-buttons/stepper-buttons.component';
import { SvgIconComponent } from 'app/shared/svg-icon/svg-icon.component';
import { ThemeToggleComponent } from 'app/shared/theme-toggle/theme-toggle.component';
import { ComponentsGuideSpecimenComponent } from './components-guide-specimen.component';
import {
  COMPONENT_GROUPS,
  COMPONENT_REFERENCES,
  ComponentGroup,
  ComponentReference,
  componentReferenceById,
  formatComponentReference
} from './components-guide.catalog';

@Component({
  selector: 'mifosx-components-guide',
  templateUrl: './components-guide.component.html',
  styleUrls: ['./components-guide.component.scss'],
  imports: [
    NgFor,
    NgIf,
    RouterLink,
    ReactiveFormsModule,
    MatStepperModule,
    ComponentsGuideSpecimenComponent,
    StepperButtonsComponent,
    InputAmountComponent,
    InputPasswordComponent,
    FileUploadComponent,
    DropdownComponent,
    GlAccountSelectorComponent,
    AccountNumberComponent,
    EntityNameComponent,
    ExternalIdentifierComponent,
    LongTextComponent,
    AccountStatusMarkComponent,
    GlAccountDisplayComponent,
    LoaderComponent,
    SvgIconComponent,
    ThemeToggleComponent
  ]
})
export class ComponentsGuideComponent implements OnInit {
  readonly components = COMPONENT_REFERENCES;
  readonly componentGroups = COMPONENT_GROUPS;
  readonly sections = [
    { id: 'index', label: 'Index' },
    { id: 'forms', label: 'Forms' },
    { id: 'identity', label: 'Identity' },
    { id: 'display', label: 'Display' },
    { id: 'chrome', label: 'Chrome' },
    { id: 'dialogs', label: 'Dialogs' },
    { id: 'data', label: 'Data' }
  ];

  activeComponentId = '';
  unknownComponentId = '';
  copiedId = '';
  indexOpen = true;

  readonly currency: Currency = {
    code: 'USD',
    name: 'US Dollar',
    displaySymbol: '$'
  };

  readonly amountControl = new UntypedFormControl('1250');
  readonly glAccountControl = new UntypedFormControl(null);

  readonly form = new FormGroup({
    password: new FormControl('secreto'),
    controlSelect: new FormControl('')
  });

  readonly officeOptions = [
    { id: 1, value: 'Santiago de María' },
    { id: 2, value: 'Usulután' }
  ];

  readonly glAccount: GLAccount = {
    id: 12,
    name: 'Caja general',
    glCode: '11110',
    description: '',
    nameDecorated: '11110 - Caja general',
    disabled: false,
    manualEntriesAllowed: true,
    type: { id: 1, code: 'accountType.asset', value: 'ASSET' },
    usage: { id: 1, code: 'accountUsage.detail', value: 'DETAIL' }
  };

  readonly glAccounts: GLAccount[] = [this.glAccount];

  constructor(
    private route: ActivatedRoute,
    private clipboard: Clipboard
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.focusComponent(params.get('componentId'));
    });
  }

  componentsIn(group: ComponentGroup): ComponentReference[] {
    return this.components.filter((component) => component.group === group);
  }

  withoutPreview(group: ComponentGroup): ComponentReference[] {
    return this.componentsIn(group).filter((component) => !component.preview);
  }

  copyComponent(id: string): void {
    const component = componentReferenceById(id);
    if (!component) {
      return;
    }
    this.clipboard.copy(formatComponentReference(component));
    this.copiedId = id;
    window.setTimeout(() => {
      if (this.copiedId === id) {
        this.copiedId = '';
      }
    }, 1500);
  }

  focusComponent(componentId: string | null): void {
    if (!componentId) {
      this.activeComponentId = '';
      this.unknownComponentId = '';
      return;
    }
    const known = componentReferenceById(componentId);
    this.activeComponentId = known ? componentId : '';
    this.unknownComponentId = known ? '' : componentId;
    if (!known) {
      return;
    }
    window.setTimeout(() => {
      document.querySelector(`[data-component-id="${componentId}"]`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });
  }

  scrollTo(event: Event, id: string): void {
    event.preventDefault();
    if (id === 'index') {
      this.indexOpen = true;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
