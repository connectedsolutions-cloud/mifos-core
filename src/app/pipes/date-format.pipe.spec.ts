import { SettingsService } from 'app/settings/settings.service';
import { DateFormatPipe, momentLocaleForLanguage } from './date-format.pipe';

describe('DateFormatPipe month names', () => {
  function pipeFor(languageCode: string): DateFormatPipe {
    const settingsService = {
      dateFormat: 'dd MMMM yyyy',
      language: { code: languageCode }
    } as SettingsService;
    return new DateFormatPipe(settingsService);
  }

  it('maps the app language onto a loaded moment locale', () => {
    expect(momentLocaleForLanguage('es')).toBe('es');
    expect(momentLocaleForLanguage('es-MX')).toBe('es');
    expect(momentLocaleForLanguage('en')).toBe('en');
    expect(momentLocaleForLanguage('en-US')).toBe('en');
  });

  it('writes the month name in the active language', () => {
    expect(
      pipeFor('es').transform([
        2026,
        10,
        11
      ])
    ).toBe('11 octubre 2026');
    expect(
      pipeFor('en').transform([
        2026,
        10,
        11
      ])
    ).toBe('11 October 2026');
  });
});
