import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { DeleteDialogComponent } from '../../../shared/delete-dialog/delete-dialog.component';
import { ProductsService } from '../../products.service';
import { MhDteItemComponentsListRefreshService } from '../mh-dte-item-components-list-refresh.service';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

@Component({
  selector: 'mifosx-view-mh-dte-item-component',
  templateUrl: './view-mh-dte-item-component.component.html',
  styleUrls: ['./view-mh-dte-item-component.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS,
    FaIconComponent,
    RouterLink
  ]
})
export class ViewMhDteItemComponentComponent {
  mhDteItem: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productsService: ProductsService,
    private dialog: MatDialog,
    private mhDteItemComponentsListRefreshService: MhDteItemComponentsListRefreshService
  ) {
    this.route.data.subscribe((data: { mhDteItem: any }) => {
      this.mhDteItem = data.mhDteItem;
    });
  }

  delete() {
    const ref = this.dialog.open(DeleteDialogComponent, {
      data: { deleteContext: `MH DTE mapping ${this.mhDteItem?.name}` }
    });
    ref.afterClosed().subscribe((response: { delete?: boolean }) => {
      if (response?.delete) {
        this.productsService.deleteMhDteItemComponent(String(this.mhDteItem.id)).subscribe({
          next: () => {
            this.mhDteItemComponentsListRefreshService.setShouldRefresh();
            void this.router.navigate(['/products/mh-dte-item-components']);
          },
          error: (e) => alert(e.error?.defaultUserMessage || e.message || 'Error')
        });
      }
    });
  }
}
