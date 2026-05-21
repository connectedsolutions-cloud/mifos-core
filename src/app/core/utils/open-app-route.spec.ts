import { buildAppRouteAbsoluteUrl, openAppRouteInNewTab } from './open-app-route';

describe('openAppRouteInNewTab', () => {
  const router = {
    createUrlTree: jest.fn(() => ({})),
    serializeUrl: jest.fn(() => '/dte-preview?loanTransactionId=10')
  };
  const location = {
    prepareExternalUrl: jest.fn((path: string) => (path.startsWith('#') ? path : `#${path}`))
  };

  let openSpy: jest.SpyInstance;

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    openSpy.mockRestore();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('opens hash-based app URL in a new tab', () => {
    openAppRouteInNewTab(router as any, location as any, ['/dte-preview'], { loanTransactionId: 10 });

    expect(location.prepareExternalUrl).toHaveBeenCalledWith('/dte-preview?loanTransactionId=10');
    expect(window.open).toHaveBeenCalledWith(
      `${window.location.origin}/#/dte-preview?loanTransactionId=10`,
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('mirrors session auth into localStorage so the new tab can authenticate', () => {
    sessionStorage.setItem('mifosXCredentials', JSON.stringify({ username: 'u', rememberMe: false }));
    sessionStorage.setItem(
      'mifosXTwoFactorAuthenticationToken',
      JSON.stringify({ token: 't', validTo: Date.now() + 60000 })
    );

    openAppRouteInNewTab(router as any, location as any, ['/dte-preview']);

    expect(localStorage.getItem('mifosXCredentials')).toBe(sessionStorage.getItem('mifosXCredentials'));
    expect(localStorage.getItem('mifosXTwoFactorAuthenticationToken')).toBe(
      sessionStorage.getItem('mifosXTwoFactorAuthenticationToken')
    );
  });

  it('buildAppRouteAbsoluteUrl includes origin and hash path', () => {
    router.serializeUrl.mockReturnValue('/dte-preview?sample=1');
    const url = buildAppRouteAbsoluteUrl(router as any, location as any, ['/dte-preview'], { sample: '1' });
    expect(url).toBe(`${window.location.origin}/#/dte-preview?sample=1`);
  });
});
