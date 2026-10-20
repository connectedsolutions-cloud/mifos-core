import { Clipboard } from '@angular/cdk/clipboard';
import { NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ComponentReference, componentReferenceById, formatComponentReference } from './components-guide.catalog';

@Component({
  selector: 'mifosx-components-guide-specimen',
  templateUrl: './components-guide-specimen.component.html',
  styleUrls: ['./components-guide-specimen.component.scss'],
  imports: [NgIf]
})
export class ComponentsGuideSpecimenComponent {
  @Input() componentId = '';
  @Input() active = false;

  copied = false;

  constructor(private clipboard: Clipboard) {}

  get reference(): ComponentReference | undefined {
    return this.componentId ? componentReferenceById(this.componentId) : undefined;
  }

  copyReference(): void {
    const reference = this.reference;
    if (!reference) {
      return;
    }
    this.clipboard.copy(formatComponentReference(reference));
    this.copied = true;
    window.setTimeout(() => {
      this.copied = false;
    }, 1500);
  }
}
