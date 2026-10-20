import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
import { NgIf, CurrencyPipe } from '@angular/common';
import { ExternalIdentifierComponent } from '../../../shared/external-identifier/external-identifier.component';
import { DateFormatPipe } from '../../../pipes/date-format.pipe';
import { FormatNumberPipe } from '../../../pipes/format-number.pipe';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { LoansService } from '../../loans.service';
import { SettingsService } from '../../../settings/settings.service';
import {
  CREDESAL_LOAN_STAFF_ASSIGNMENT_DATATABLE,
  CREDESAL_LOAN_STAFF_ASSIGNMENT_ROLES,
  EMPTY_LOAN_STAFF_ASSIGNMENT,
  LoanStaffAssignment,
  LoanStaffAssignmentRole,
  parseLoanStaffAssignment
} from '../credesal-loan-staff-assignment';

@Component({
  selector: 'mifosx-general-tab',
  templateUrl: './general-tab.component.html',
  styleUrls: ['./general-tab.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatTable,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatCellDef,
    MatCell,
    MatHeaderRowDef,
    MatHeaderRow,
    MatRowDef,
    MatRow,
    ExternalIdentifierComponent,
    CurrencyPipe,
    DateFormatPipe,
    FormatNumberPipe
  ]
})
export class GeneralTabComponent implements OnInit {
  /** Currency Code */
  currencyCode: string;
  loanDetails: any;
  status: any;
  loanSummaryColumns: string[] = [
    'Empty',
    'Original',
    'Paid',
    'Waived',
    'Written Off',
    'Outstanding',
    'Over Due'
  ];
  loanDetailsColumns: string[] = [
    'Key',
    'Value'
  ];
  loanSummaryTableData: {
    property: string;
    original: string;
    adjustment: string;
    paid: string;
    waived: string;
    writtenOff: string;
    outstanding: string;
    overdue: string;
  }[];
  loanDetailsTableData: {
    key: string;
    value?: string;
  }[];

  /** Data source for loans summary table. */
  dataSource: MatTableDataSource<any>;
  detailsDataSource: MatTableDataSource<any>;
  readonly staffAssignmentRoles = CREDESAL_LOAN_STAFF_ASSIGNMENT_ROLES;
  staffAssignment: LoanStaffAssignment = { ...EMPTY_LOAN_STAFF_ASSIGNMENT };
  staffOptions: any[] = [];
  staffAssignmentHasRow = false;
  savingStaffColumn: string | null = null;
  staffAssignmentError = '';
  loanId: string;

  constructor(
    private route: ActivatedRoute,
    private loansService: LoansService,
    private settingsService: SettingsService
  ) {
    this.loanId = this.route.parent?.snapshot.paramMap.get('loanId') || '';
    this.route.parent.data.subscribe((data: { loanDetailsData: any }) => {
      this.loanDetails = data.loanDetailsData;
      this.currencyCode = this.loanDetails.currency.code;
      if (this.loanDetails.transactions) {
        this.loanDetails.transactions.some((transaction: any) => {
          if (transaction.type.code === 'loanTransactionType.chargeback') {
            this.loanSummaryColumns = [
              'Empty',
              'Original',
              'Adjustments',
              'Paid',
              'Waived',
              'Written Off',
              'Outstanding',
              'Over Due'
            ];
            return;
          }
        });
      }
    });
  }

  ngOnInit() {
    this.status = this.loanDetails.value;
    if (this.loanDetails.summary) {
      this.setloanSummaryTableData();
      this.setloanDetailsTableData();
    } else {
      this.setloanNonDetailsTableData();
    }
    this.loadStaffAssignment();
  }

  loadStaffAssignment() {
    forkJoin({
      datatable: this.loansService
        .getLoanDatatable(this.loanId, CREDESAL_LOAN_STAFF_ASSIGNMENT_DATATABLE, { skipErrorHandler: true })
        .pipe(catchError(() => of(null))),
      staff: this.loansService.getStaffForAssignment().pipe(catchError(() => of([])))
    }).subscribe(({ datatable, staff }) => {
      const parsed = parseLoanStaffAssignment(datatable);
      this.staffAssignment = parsed.assignment;
      this.staffAssignmentHasRow = parsed.hasRow;
      this.staffOptions = staff || [];
    });
  }

  updateStaffAssignment(role: LoanStaffAssignmentRole, value: number | null) {
    if (!this.loanId || this.savingStaffColumn) {
      return;
    }
    const previous = this.staffAssignment[role.controlName];
    this.staffAssignment = { ...this.staffAssignment, [role.controlName]: value };
    if (!this.staffAssignmentHasRow && value == null) {
      return;
    }
    this.savingStaffColumn = role.column;
    this.staffAssignmentError = '';
    const payload = {
      locale: this.settingsService.language?.code || 'en',
      dateFormat: this.settingsService.dateFormat || 'dd MMMM yyyy',
      client_id: this.loanDetails.clientId,
      [role.column]: value == null ? '' : value
    };
    const request = this.staffAssignmentHasRow
      ? this.loansService.editLoanDatatableEntry(this.loanId, CREDESAL_LOAN_STAFF_ASSIGNMENT_DATATABLE, payload)
      : this.loansService.addLoanDatatableEntry(this.loanId, CREDESAL_LOAN_STAFF_ASSIGNMENT_DATATABLE, payload);
    request.pipe(finalize(() => (this.savingStaffColumn = null))).subscribe({
      next: () => (this.staffAssignmentHasRow = true),
      error: () => {
        this.staffAssignment = { ...this.staffAssignment, [role.controlName]: previous };
        this.staffAssignmentError = 'labels.text.Unable to save staff assignment';
      }
    });
  }

  setloanSummaryTableData() {
    this.loanSummaryTableData = [
      {
        property: 'Principal',
        original: this.loanDetails.summary.totalPrincipal,
        adjustment: this.loanDetails.summary.principalAdjustments || 0,
        paid: this.loanDetails.summary.principalPaid,
        waived: this.loanDetails.summary.principalWaived || 0,
        writtenOff: this.loanDetails.summary.principalWrittenOff,
        outstanding: this.loanDetails.summary.principalOutstanding,
        overdue: this.loanDetails.summary.principalOverdue
      },
      {
        property: 'Interest',
        original: this.loanDetails.summary.interestCharged,
        adjustment: '0',
        paid: this.loanDetails.summary.interestPaid,
        waived: this.loanDetails.summary.interestWaived,
        writtenOff: this.loanDetails.summary.interestWrittenOff,
        outstanding: this.loanDetails.summary.interestOutstanding,
        overdue: this.loanDetails.summary.interestOverdue
      },
      {
        property: 'Fees',
        original: this.loanDetails.summary.feeChargesCharged,
        adjustment: '0',
        paid: this.loanDetails.summary.feeChargesPaid,
        waived: this.loanDetails.summary.feeChargesWaived,
        writtenOff: this.loanDetails.summary.feeChargesWrittenOff,
        outstanding: this.loanDetails.summary.feeChargesOutstanding,
        overdue: this.loanDetails.summary.feeChargesOverdue
      },
      {
        property: 'Penalties',
        original: this.loanDetails.summary.penaltyChargesCharged,
        adjustment: '0',
        paid: this.loanDetails.summary.penaltyChargesPaid,
        waived: this.loanDetails.summary.penaltyChargesWaived,
        writtenOff: this.loanDetails.summary.penaltyChargesWrittenOff,
        outstanding: this.loanDetails.summary.penaltyChargesOutstanding,
        overdue: this.loanDetails.summary.penaltyChargesOverdue
      },
      {
        property: 'Total',
        original: this.loanDetails.summary.totalExpectedRepayment,
        adjustment: this.loanDetails.summary.principalAdjustments || 0,
        paid: this.loanDetails.summary.totalRepayment,
        waived: this.loanDetails.summary.totalWaived,
        writtenOff: this.loanDetails.summary.totalWrittenOff,
        outstanding: this.loanDetails.summary.totalOutstanding,
        overdue: this.loanDetails.summary.totalOverdue
      }
    ];
    this.dataSource = new MatTableDataSource(this.loanSummaryTableData);
  }

  setloanDetailsTableData() {
    this.loanDetailsTableData = [
      {
        key: 'Expected Disbursement Date'
      },
      {
        key: 'Disbursement Date'
      },
      {
        key: 'Loan Purpose'
      },
      {
        key: 'Loan Officer'
      },
      {
        key: 'Currency'
      },
      {
        key: 'External Id'
      },
      {
        key: 'Proposed Amount',
        value: this.loanDetails.proposedPrincipal
      },
      {
        key: 'Approved Amount',
        value: this.loanDetails.approvedPrincipal
      },
      {
        key: 'Disburse Amount',
        value: this.loanDetails.principal
      }
    ];
    if (this.loanDetails.writeOffReason) {
      this.loanDetailsTableData.push({
        key: 'Write-off Reason',
        value: this.loanDetails.writeOffReason
      });
    }
    this.detailsDataSource = new MatTableDataSource(this.loanDetailsTableData);
  }

  setloanNonDetailsTableData() {
    this.loanDetailsTableData = [
      {
        key: 'Expected Disbursement Date'
      },
      {
        key: 'Disbursement Date'
      },
      {
        key: 'Currency'
      },
      {
        key: 'Loan Officer'
      },
      {
        key: 'External Id'
      }
    ];
    this.detailsDataSource = new MatTableDataSource(this.loanDetailsTableData);
  }

  showApprovedAmountBasedOnStatus() {
    if (
      this.status === 'Submitted and pending approval' ||
      this.status === 'Withdrawn by applicant' ||
      this.status === 'Rejected'
    ) {
      return false;
    }
    return true;
  }

  showDisbursedAmountBasedOnStatus = function () {
    if (
      this.status === 'Submitted and pending approval' ||
      this.status === 'Withdrawn by applicant' ||
      this.status === 'Rejected' ||
      this.status === 'Approved'
    ) {
      return false;
    }
    return true;
  };
}
