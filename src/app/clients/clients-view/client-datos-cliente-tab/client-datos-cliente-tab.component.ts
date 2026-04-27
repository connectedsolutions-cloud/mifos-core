/** Angular Imports */
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/** Custom Services */
import { AuthenticationService } from 'app/core/authentication/authentication.service';
import { MatTabLink, MatTabNav, MatTabNavPanel } from '@angular/material/tabs';
import { NgFor } from '@angular/common';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import {
  CREDESAL_ALLOWED_CLIENT_TYPE_TAG_NAMES,
  CREDESAL_ALLOWED_SHAREHOLDER_TYPE_TAG_NAMES,
  CREDESAL_CLIENT_TYPE_RESTRICTED_DATATABLE_NAMES,
  CREDESAL_CLIENT_DATA_DATATABLE_NAMES,
  CREDESAL_WORK_BUSINESS_DATATABLE_NAME
} from '../credesal-client-data-datatables';

@Component({
  selector: 'mifosx-client-datos-cliente-tab',
  templateUrl: './client-datos-cliente-tab.component.html',
  styleUrls: ['./client-datos-cliente-tab.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    NgFor,
    MatTabNav,
    MatTabLink,
    RouterLink,
    RouterLinkActive,
    MatTabNavPanel,
    RouterOutlet
  ]
})
export class ClientDatosClienteTabComponent implements OnInit {
  credesalClientDataDatatables: { registeredTableName: string }[] = [];
  private readonly workBusinessDatatableName = CREDESAL_WORK_BUSINESS_DATATABLE_NAME;
  private readonly allowedClientTypeTagNames = CREDESAL_ALLOWED_CLIENT_TYPE_TAG_NAMES;
  private readonly allowedShareholderTagNames = CREDESAL_ALLOWED_SHAREHOLDER_TYPE_TAG_NAMES;
  private readonly clientTypeRestrictedDatatableNames = CREDESAL_CLIENT_TYPE_RESTRICTED_DATATABLE_NAMES;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authenticationService: AuthenticationService
  ) {}

  ngOnInit() {
    const all: { registeredTableName: string }[] = this.route.parent?.snapshot.data['clientDatatables'] || [];
    const clientViewData = this.route.parent?.snapshot.data['clientViewData'] || {};
    const byName = new Map(
      all.map((datatable) => [
        datatable.registeredTableName,
        datatable
      ])
    );
    const selectedClientTypeTagNames = this.getSelectedClientTypeTagNames(clientViewData);
    this.credesalClientDataDatatables = CREDESAL_CLIENT_DATA_DATATABLE_NAMES.map((name) => byName.get(name))
      .filter(Boolean)
      .filter((datatable: any) =>
        this.shouldDisplayDatatable(datatable.registeredTableName, selectedClientTypeTagNames)
      ) as {
      registeredTableName: string;
    }[];

    if (!this.route.firstChild && this.credesalClientDataDatatables.length) {
      const firstReadable = this.credesalClientDataDatatables.find((datatable) =>
        this.userHasReadDatatable(datatable.registeredTableName)
      );
      if (firstReadable) {
        this.router.navigate([firstReadable.registeredTableName], { relativeTo: this.route, replaceUrl: true });
      }
    }
  }

  private userHasReadDatatable(registeredTableName: string): boolean {
    const permission = `READ_${registeredTableName}`;
    const permissions = this.authenticationService.getCredentials().permissions;
    if (permissions.includes('ALL_FUNCTIONS')) {
      return true;
    }
    if (permission.startsWith('READ_') && permissions.includes('ALL_FUNCTIONS_READ')) {
      return true;
    }
    return permissions.includes(permission);
  }

  private shouldDisplayDatatable(registeredTableName: string, selectedClientTypeTagNames: Set<string>): boolean {
    if (registeredTableName === this.workBusinessDatatableName) {
      return this.hasAnyAllowedTypeTag(selectedClientTypeTagNames, this.allowedShareholderTagNames);
    }
    if (!this.clientTypeRestrictedDatatableNames.has(registeredTableName)) {
      return true;
    }
    return this.hasAnyAllowedTypeTag(selectedClientTypeTagNames, this.allowedClientTypeTagNames);
  }

  private hasAnyAllowedTypeTag(selectedClientTypeTagNames: Set<string>, allowedTagNames: Set<string>): boolean {
    return Array.from(selectedClientTypeTagNames).some((tagName) => allowedTagNames.has(tagName));
  }

  private getSelectedClientTypeTagNames(clientViewData: any): Set<string> {
    const tags = clientViewData?.tags;
    if (!tags) {
      return new Set<string>();
    }

    let tagList: any[] = [];
    if (Array.isArray(tags)) {
      tagList = tags;
    } else if (tags instanceof Set) {
      tagList = Array.from(tags);
    } else {
      tagList = Object.values(tags);
    }

    const clientTypeTags = tagList.filter((tag: any) => tag?.tagGroup === 'tipo_cliente');
    return new Set(clientTypeTags.map((tag: any) => this.normalizeTagName(tag?.name)).filter(Boolean));
  }

  private normalizeTagName(name: string): string {
    return (name || '').toLowerCase().trim();
  }
}
