import { Pipe, PipeTransform } from '@angular/core';
import { SettingsService } from 'app/settings/settings.service';
import moment from 'moment';
import 'moment/locale/cs';
import 'moment/locale/de';
import 'moment/locale/es';
import 'moment/locale/fr';
import 'moment/locale/it';
import 'moment/locale/ko';
import 'moment/locale/lt';
import 'moment/locale/lv';
import 'moment/locale/ne';
import 'moment/locale/pt';
import 'moment/locale/sw';

moment.locale('en');

export function momentLocaleForLanguage(languageCode: string | undefined): string {
  const code = (languageCode || 'en').toLowerCase();
  if (code === 'en' || code.startsWith('en-')) {
    return 'en';
  }
  const twoLetter = code.slice(0, 2);
  return moment.locales().includes(twoLetter) ? twoLetter : 'en';
}

@Pipe({ name: 'dateFormat' })
export class DateFormatPipe implements PipeTransform {
  constructor(private settingsService: SettingsService) {}

  transform(value: any, dateFormat?: string): any {
    const defaultDateFormat = this.settingsService.dateFormat.replace('dd', 'DD');
    if (typeof value === 'undefined') {
      return '';
    }
    let dateVal;
    moment.locale(momentLocaleForLanguage(this.settingsService.language?.code));
    if (value instanceof Array) {
      dateVal = moment(value.join('-'), 'YYYY-MM-DD');
    } else {
      dateVal = moment(value);
    }
    if (dateFormat == null) {
      return dateVal.format(defaultDateFormat);
    }
    return dateVal.format(dateFormat);
  }
}
