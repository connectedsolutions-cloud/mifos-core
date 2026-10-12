import { CurrencyPipe } from '@angular/common';
import { Component } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { DateFormatPipe } from '../../../pipes/date-format.pipe';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

@Component({
  selector: 'mifosx-share-yield-tab',
  templateUrl: './yield-tab.component.html',
  styleUrls: ['./yield-tab.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    MatTableModule,
    CurrencyPipe,
    DateFormatPipe
  ]
})
export class YieldTabComponent {
  shareAccountData: any;
  yieldData: any;
  dataSource = new MatTableDataSource<any>();
  displayedColumns = [
    'date',
    'entryType',
    'baseAmount',
    'annualRate',
    'accruedAmount',
    'bookedAmount',
    'sourceReference'
  ];

  constructor(private route: ActivatedRoute) {
    this.route.parent?.data.subscribe(
      (data: { sharesAccountData: any }) => (this.shareAccountData = data.sharesAccountData)
    );
    this.route.data.subscribe((data: { shareYieldData: any }) => {
      this.yieldData = data.shareYieldData;
      this.dataSource.data = this.yieldData?.accruals || [];
    });
  }
}
