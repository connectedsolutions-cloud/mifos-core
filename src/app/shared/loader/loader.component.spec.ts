import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LoaderComponent } from './loader.component';

@Component({
  standalone: true,
  imports: [
    NgIf,
    LoaderComponent
  ],
  template: '<mifosx-loader *ngIf="loading" diameter="40"></mifosx-loader>'
})
class LoaderHostComponent {
  loading = false;
}

describe('LoaderComponent integration', () => {
  it('follows the loading state, accepts attribute sizing, and announces the active language', async () => {
    await TestBed.configureTestingModule({
      imports: [
        LoaderHostComponent,
        TranslateModule.forRoot()
      ]
    }).compileComponents();
    const translations = TestBed.inject(TranslateService);
    translations.setTranslation('en', { labels: { buttons: { Loading: 'Loading...' } } });
    translations.setTranslation('es', { labels: { buttons: { Loading: 'Cargando...' } } });
    translations.use('en');
    const fixture = TestBed.createComponent(LoaderHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();

    fixture.componentInstance.loading = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]').getAttribute('aria-label')).toBe('Loading...');
    expect(fixture.nativeElement.querySelector('.credesal-loader').style.getPropertyValue('--loader-size')).toBe(
      '40px'
    );

    translations.use('es');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]').getAttribute('aria-label')).toBe('Cargando...');

    fixture.componentInstance.loading = false;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mifosx-loader')).toBeNull();
  });
});
