import { Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({ name: 'translateKey', standalone: true })
export class TranslatePipe implements PipeTransform {
  constructor(private translateService: TranslateService) {}

  transform(attributeValue: any, group: string, prefix: string = 'labels'): string {
    if (!attributeValue) {
      return '';
    }
    const translationKey = `${prefix}.${group}.${attributeValue}`;
    const translation = this.translateService.instant(translationKey);
    // If translation is the same as the key, it means the translation wasn't found
    // Return the original attributeValue as fallback
    if (translation === translationKey) {
      return attributeValue;
    }
    return translation;
  }
}
