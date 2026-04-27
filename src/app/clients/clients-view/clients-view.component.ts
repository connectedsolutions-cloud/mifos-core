/** Angular Imports */
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { MatDialog } from '@angular/material/dialog';

/** Custom Dialogs */
import { UnassignStaffDialogComponent } from './custom-dialogs/unassign-staff-dialog/unassign-staff-dialog.component';
import { UnassignGestorDialogComponent } from './custom-dialogs/unassign-gestor-dialog/unassign-gestor-dialog.component';
import { UploadSignatureDialogComponent } from './custom-dialogs/upload-signature-dialog/upload-signature-dialog.component';
import { ViewSignatureDialogComponent } from './custom-dialogs/view-signature-dialog/view-signature-dialog.component';
import { DeleteSignatureDialogComponent } from './custom-dialogs/delete-signature-dialog/delete-signature-dialog.component';
import { DeleteDialogComponent } from 'app/shared/delete-dialog/delete-dialog.component';
import { UploadImageDialogComponent } from './custom-dialogs/upload-image-dialog/upload-image-dialog.component';
import { CaptureImageDialogComponent } from './custom-dialogs/capture-image-dialog/capture-image-dialog.component';

/** Custom Services */
import { ClientViewRefreshService } from '../client-view-refresh.service';
import { ClientsService } from '../clients.service';
import { AuthenticationService } from 'app/core/authentication/authentication.service';
import {
  MatCard,
  MatCardHeader,
  MatCardTitleGroup,
  MatCardMdImage,
  MatCardTitle,
  MatCardSubtitle,
  MatCardContent
} from '@angular/material/card';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { NgClass, NgIf, NgFor } from '@angular/common';
import { EntityNameComponent } from '../../shared/entity-name/entity-name.component';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatIcon } from '@angular/material/icon';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { AccountNumberComponent } from '../../shared/account-number/account-number.component';
import { ExternalIdentifierComponent } from '../../shared/external-identifier/external-identifier.component';
import { MatTabNav, MatTabLink, MatTabNavPanel } from '@angular/material/tabs';
import { StatusLookupPipe } from '../../pipes/status-lookup.pipe';
import { DateFormatPipe } from '../../pipes/date-format.pipe';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import {
  CREDESAL_ALLOWED_CLIENT_TYPE_TAG_NAMES,
  CREDESAL_ALLOWED_SHAREHOLDER_TYPE_TAG_NAMES,
  CREDESAL_CLIENT_TYPE_RESTRICTED_DATATABLE_NAMES,
  CREDESAL_CLIENT_DATA_DATATABLE_NAMES,
  CREDESAL_WORK_BUSINESS_DATATABLE_NAME
} from './credesal-client-data-datatables';

@Component({
  selector: 'mifosx-clients-view',
  templateUrl: './clients-view.component.html',
  styleUrls: ['./clients-view.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatCardHeader,
    MatCardTitleGroup,
    MatCardMdImage,
    MatTooltip,
    MatCardTitle,
    NgClass,
    EntityNameComponent,
    MatIconButton,
    MatMenuTrigger,
    MatIcon,
    FaIconComponent,
    MatCardSubtitle,
    AccountNumberComponent,
    ExternalIdentifierComponent,
    MatMenu,
    MatMenuItem,
    MatTabNav,
    MatTabLink,
    RouterLinkActive,
    MatTabNavPanel,
    RouterOutlet,
    StatusLookupPipe,
    DateFormatPipe
  ]
})
export class ClientsViewComponent implements OnInit {
  private readonly personalDetailsTableName = 'credesal_client_datos_personales';
  clientViewData: any;
  clientDatatables: any;
  clientImage: any;
  clientTemplateData: any;
  personalDetails: { estadoCivil?: string; conocidoPor?: string } = {};
  private readonly workBusinessDatatableName = CREDESAL_WORK_BUSINESS_DATATABLE_NAME;
  private readonly allowedClientTypeTagNames = CREDESAL_ALLOWED_CLIENT_TYPE_TAG_NAMES;
  private readonly allowedShareholderTagNames = CREDESAL_ALLOWED_SHAREHOLDER_TYPE_TAG_NAMES;
  private readonly clientTypeRestrictedDatatableNames = CREDESAL_CLIENT_TYPE_RESTRICTED_DATATABLE_NAMES;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientsService: ClientsService,
    private authenticationService: AuthenticationService,
    private clientViewRefreshService: ClientViewRefreshService,
    private cdr: ChangeDetectorRef,
    private _sanitizer: DomSanitizer,
    public dialog: MatDialog
  ) {
    this.route.data.subscribe((data: { clientViewData: any; clientTemplateData: any; clientDatatables: any }) => {
      this.clientViewData = data.clientViewData;
      this.clientDatatables = data.clientDatatables;
      this.clientTemplateData = data.clientTemplateData;
    });
  }

  ngOnInit() {
    this.clientsService.getClientProfileImage(this.clientViewData.id).subscribe({
      next: (base64Image: any) => {
        // If base64Image is null, client has no profile image
        if (base64Image) {
          this.clientImage = this._sanitizer.bypassSecurityTrustResourceUrl(base64Image);
        } else {
          this.clientImage = null;
        }
      },
      error: (error: any) => {
        // Handle any unexpected errors
        console.error('Error loading client profile image:', error);
        this.clientImage = null;
      }
    });
    if (this.clientViewRefreshService.consumeShouldRefresh()) {
      this.clientsService.getClientData(this.clientViewData.id, { skipCache: true }).subscribe({
        next: (data) => {
          this.clientViewData = data;
          this.cdr.detectChanges();
        }
      });
    }
    this.loadPersonalDetailsDatatable();
  }

  private loadPersonalDetailsDatatable() {
    this.clientsService.getClientDatatable(this.clientViewData.id, this.personalDetailsTableName).subscribe({
      next: (datatable: any) => {
        this.personalDetails = this.extractPersonalDetails(datatable);
      },
      error: () => {
        this.personalDetails = {};
      }
    });
  }

  private extractPersonalDetails(datatable: any): { estadoCivil?: string; conocidoPor?: string } {
    const row = datatable?.data?.[0]?.row;
    const headers = datatable?.columnHeaders || [];
    if (!row || !headers.length) {
      return {};
    }

    const getValue = (columnName: string): string | undefined => {
      const index = headers.findIndex((header: any) => header.columnName === columnName);
      if (index < 0) {
        return undefined;
      }
      const value = row[index];
      if (value === null || value === undefined || value === '') {
        return undefined;
      }
      return String(value);
    };

    return {
      estadoCivil: getValue('estado_civil'),
      conocidoPor: getValue('conocido_por')
    };
  }

  isActive(): boolean {
    return this.clientViewData.status.value === 'Active';
  }

  get credesalClientDataDatatables(): { registeredTableName: string }[] {
    if (!this.clientDatatables?.length) {
      return [];
    }

    const byName = new Map(
      this.clientDatatables.map((datatable: { registeredTableName: string }) => [
        datatable.registeredTableName,
        datatable
      ])
    );
    return CREDESAL_CLIENT_DATA_DATATABLE_NAMES.map((name) => byName.get(name))
      .filter(Boolean)
      .filter((datatable: any) => this.shouldDisplayDatatable(datatable.registeredTableName)) as {
      registeredTableName: string;
    }[];
  }

  get otherClientDatatables(): any[] {
    if (!this.clientDatatables?.length) {
      return [];
    }

    const groupedDatatableNames = new Set(CREDESAL_CLIENT_DATA_DATATABLE_NAMES);
    return this.clientDatatables.filter(
      (datatable: { registeredTableName: string }) =>
        !groupedDatatableNames.has(datatable.registeredTableName) &&
        this.shouldDisplayDatatable(datatable.registeredTableName)
    );
  }

  get showDatosClienteTab(): boolean {
    return this.credesalClientDataDatatables.some((datatable) =>
      this.userHasReadDatatable(datatable.registeredTableName)
    );
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

  private shouldDisplayDatatable(registeredTableName: string): boolean {
    if (registeredTableName === this.workBusinessDatatableName) {
      return this.isAnyAllowedTypeSelected(this.allowedShareholderTagNames);
    }
    if (!this.clientTypeRestrictedDatatableNames.has(registeredTableName)) {
      return true;
    }
    return this.isAnyAllowedTypeSelected(this.allowedClientTypeTagNames);
  }

  private isAnyAllowedTypeSelected(allowedTagNames: Set<string>): boolean {
    const normalizedTypeTags = this.getClientTypeTags().map((tag) => this.normalizeTagName(tag?.name));
    return normalizedTypeTags.some((tagName) => allowedTagNames.has(tagName));
  }

  private getClientTypeTags(): any[] {
    const tags = this.clientViewData?.tags;
    if (!tags) {
      return [];
    }
    if (Array.isArray(tags)) {
      return tags.filter((tag: any) => tag?.tagGroup === 'tipo_cliente');
    }
    if (tags instanceof Set) {
      return Array.from(tags).filter((tag: any) => tag?.tagGroup === 'tipo_cliente');
    }
    return Object.values(tags).filter((tag: any) => tag?.tagGroup === 'tipo_cliente');
  }

  private normalizeTagName(name: string): string {
    return (name || '').toLowerCase().trim();
  }

  /**
   * Performs action button/option action.
   * @param {string} name action name.
   */
  doAction(name: string) {
    switch (name) {
      case 'Assign Staff':
      case 'Assign Gestor':
      case 'Close':
      case 'Survey':
      case 'Reject':
      case 'Activate':
      case 'Withdraw':
      case 'Update Default Savings':
      case 'Transfer Client':
      case 'Undo Transfer':
      case 'Accept Transfer':
      case 'Reject Transfer':
      case 'Reactivate':
      case 'Undo Rejection':
      case 'Add Charge':
      case 'Create Collateral':
      case 'Client Screen Reports':
        this.router.navigate([`actions/${name}`], { relativeTo: this.route });
        break;
      case 'Unassign Staff':
        this.unassignStaff();
        break;
      case 'Unassign Gestor':
        this.unassignGestor();
        break;
      case 'Delete':
        this.deleteClient();
        break;
      case 'View Signature':
        this.viewSignature();
        break;
      case 'Upload Signature':
        this.uploadSignature();
        break;
      case 'Delete Signature':
        this.deleteSignature();
        break;
      case 'Capture Image':
        this.captureProfileImage();
        break;
      case 'Upload Image':
        this.uploadProfileImage();
        break;
      case 'Delete Image':
        this.deleteProfileImage();
        break;
      case 'Create Standing Instructions':
        const createStandingInstructionsQueryParams: any = {
          officeId: this.clientViewData.officeId,
          accountType: 'fromsavings'
        };
        this.router.navigate(['standing-instructions/create-standing-instructions'], {
          relativeTo: this.route,
          queryParams: createStandingInstructionsQueryParams
        });
        break;
      case 'View Standing Instructions':
        const viewStandingInstructionsQueryParams: any = {
          officeId: this.clientViewData.officeId,
          accountType: 'fromsavings'
        };
        this.router.navigate(['standing-instructions/list-standing-instructions'], {
          relativeTo: this.route,
          queryParams: viewStandingInstructionsQueryParams
        });
        break;
    }
  }

  /**
   * Refetches data for the component
   * TODO: Replace by a custom reload component instead of hard-coded back-routing.
   */
  reload() {
    const url: string = this.router.url;
    this.router.navigateByUrl(`/clients`, { skipLocationChange: true }).then(() => this.router.navigate([url]));
  }

  /**
   * Deletes the client
   */
  private deleteClient() {
    const deleteClientDialogRef = this.dialog.open(DeleteDialogComponent, {
      data: { deleteContext: `client with id: ${this.clientViewData.id}` }
    });
    deleteClientDialogRef.afterClosed().subscribe((response: any) => {
      if (response.delete) {
        this.clientsService.deleteClient(this.clientViewData.id).subscribe(() => {
          this.router.navigate(['/clients'], { relativeTo: this.route });
        });
      }
    });
  }

  /**
   * Unassign's the client's staff.
   */
  private unassignStaff() {
    const unAssignStaffDialogRef = this.dialog.open(UnassignStaffDialogComponent);
    unAssignStaffDialogRef.afterClosed().subscribe((response: { confirm: any }) => {
      if (response.confirm) {
        this.clientsService
          .executeClientCommand(this.clientViewData.id, 'unassignStaff', { staffId: this.clientViewData.staffId })
          .subscribe(() => {
            this.reload();
          });
      }
    });
  }

  /**
   * Unassign's the client's gestor.
   */
  private unassignGestor() {
    const unAssignGestorDialogRef = this.dialog.open(UnassignGestorDialogComponent);
    unAssignGestorDialogRef.afterClosed().subscribe((response: { confirm: any }) => {
      if (response.confirm) {
        this.clientsService
          .executeClientCommand(this.clientViewData.id, 'unassignGestor', { gestorId: this.clientViewData.gestorId })
          .subscribe(() => {
            this.reload();
          });
      }
    });
  }

  /**
   * Shows client signature in a dialog
   */
  private viewSignature() {
    this.clientsService.getClientDocuments(this.clientViewData.id).subscribe((documents: any) => {
      const viewSignatureDialogRef = this.dialog.open(ViewSignatureDialogComponent, {
        data: {
          documents: documents,
          id: this.clientViewData.id
        }
      });
      viewSignatureDialogRef.afterClosed().subscribe((response: any) => {
        if (response.upload) {
          this.uploadSignature();
        } else if (response.delete) {
          this.deleteSignature();
        }
      });
    });
  }

  /**
   * Uploads client signature
   */
  private uploadSignature() {
    const uploadSignatureDialogRef = this.dialog.open(UploadSignatureDialogComponent);
    uploadSignatureDialogRef.afterClosed().subscribe((signature: File) => {
      if (signature) {
        this.clientsService.uploadClientSignatureImage(this.clientViewData.id, signature).subscribe(() => {
          this.reload();
        });
      }
    });
  }

  /**
   * Deletes client signature
   */
  private deleteSignature() {
    this.clientsService.getClientDocuments(this.clientViewData.id).subscribe((documents: any) => {
      const deleteSignatureDialogRef = this.dialog.open(DeleteSignatureDialogComponent, {
        data: documents
      });
      deleteSignatureDialogRef.afterClosed().subscribe((response: any) => {
        if (response.delete) {
          this.clientsService.deleteClientDocument(this.clientViewData.id, response.id).subscribe(() => {
            this.reload();
          });
        } else if (response.upload) {
          this.uploadSignature();
        }
      });
    });
  }

  /**
   * Captures clients profile image.
   */
  private captureProfileImage() {
    const captureImageDialogRef = this.dialog.open(CaptureImageDialogComponent);
    captureImageDialogRef.afterClosed().subscribe((imageURL: string) => {
      if (imageURL) {
        this.clientsService.uploadCapturedClientProfileImage(this.clientViewData.id, imageURL).subscribe(() => {
          this.reload();
        });
      }
    });
  }

  /**
   * Uploads the clients image.
   */
  private uploadProfileImage() {
    const uploadImageDialogRef = this.dialog.open(UploadImageDialogComponent);
    uploadImageDialogRef.afterClosed().subscribe((image: File) => {
      if (image) {
        this.clientsService.uploadClientProfileImage(this.clientViewData.id, image).subscribe(() => {
          this.reload();
        });
      }
    });
  }

  /**
   * Deletes the client image.
   */
  private deleteProfileImage() {
    const deleteClientImageDialogRef = this.dialog.open(DeleteDialogComponent, {
      data: { deleteContext: `the profile image of ${this.clientViewData.displayName}` }
    });
    deleteClientImageDialogRef.afterClosed().subscribe((response: any) => {
      if (response.delete) {
        this.clientsService.deleteClientProfileImage(this.clientViewData.id).subscribe(() => {
          this.reload();
        });
      }
    });
  }
}
