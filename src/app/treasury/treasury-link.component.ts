import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TreasuryService } from './treasury.service';

@Component({
  selector: 'mifosx-treasury-link',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule
  ],
  template: `
    <div *ngIf="movement?.id" class="flex-100">
      <span class="mat-body-strong">{{ 'labels.text.treasury.bank' | translate }}: </span>
      <a routerLink="/treasury">{{ bankName }}</a>
      <span> · {{ movement.refNum || movement.journalTransactionId }}</span>
    </div>
  `
})
export class TreasuryLinkComponent implements OnChanges {
  @Input() linkType = '';
  @Input() entityId: number | null = null;
  movement: any;
  bankName = '';

  constructor(private treasuryService: TreasuryService) {}

  ngOnChanges(): void {
    if (!this.linkType || this.entityId == null) {
      return;
    }
    this.treasuryService.getLink(this.linkType, this.entityId).subscribe({
      next: (movement) => {
        this.movement = movement?.id ? movement : null;
        this.bankName = movement?.lines?.[0]?.bankName || '';
      },
      error: () => {
        this.movement = null;
      }
    });
  }
}
