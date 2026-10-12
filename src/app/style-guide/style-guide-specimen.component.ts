import { Clipboard } from '@angular/cdk/clipboard';
import { NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { formatStyleReference, styleReferenceById, StyleReference } from './style-guide.catalog';

@Component({
  selector: 'mifosx-style-guide-specimen',
  templateUrl: './style-guide-specimen.component.html',
  styleUrls: ['./style-guide-specimen.component.scss'],
  imports: [NgIf]
})
export class StyleGuideSpecimenComponent {
  @Input() styleId = '';
  @Input() title = '';
  @Input() source = '';
  @Input() token = '';
  @Input() value = '';
  @Input() note = '';
  @Input() active = false;

  copied = false;

  constructor(private clipboard: Clipboard) {}

  get reference(): StyleReference | undefined {
    return this.styleId ? styleReferenceById(this.styleId) : undefined;
  }

  get displayTitle(): string {
    return this.reference?.name || this.title;
  }

  get displaySource(): string {
    return this.reference?.source || this.source;
  }

  get displayToken(): string {
    return this.reference?.token || this.token;
  }

  get displayValue(): string {
    return this.reference?.value || this.value;
  }

  get displayNote(): string {
    return this.reference?.note || this.note;
  }

  copyReference(): void {
    const reference = this.reference;
    const text = reference
      ? formatStyleReference(reference)
      : [
          `style: ${this.styleId || this.title}`,
          this.source && `source: ${this.source}`,
          this.token && `token: ${this.token}`
        ]
          .filter(Boolean)
          .join('\n');
    this.clipboard.copy(text);
    this.copied = true;
    window.setTimeout(() => {
      this.copied = false;
    }, 1500);
  }
}
