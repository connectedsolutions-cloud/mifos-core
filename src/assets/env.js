(function (window) {
  window['env'] = window['env'] || {};

  // BackEnd Environment variables
  window['env']['fineractApiUrls'] = 'https://localhost:8443';
  window['env']['fineractApiUrl'] = 'https://localhost:8443';

  window['env']['apiProvider'] = '/fineract-provider/api';
  window['env']['apiVersion'] = '/v1';

  window['env']['fineractPlatformTenantId'] = 'default';
  window['env']['fineractPlatformTenantIds'] = 'default';

  // Language Environment variables
  window['env']['defaultLanguage'] = 'en-US';
  window['env']['supportedLanguages'] = 'cs-CS,de-DE,en-US,es-MX,fr-FR,it-IT,ko-KO,lt-LT,lv-LV,ne-NE,pt-PT,sw-SW';

  window['env']['preloadClients'] = 'true';

  // Char delimiter to Export CSV options: ',' ';' '|' ' '
  window['env']['defaultCharDelimiter'] = ',';

  // Display or not the Server Selector
  window['env']['allowServerSwitch'] = 'true';

  // Display or not the BackEnd Info
  window['env']['displayBackEndInfo'] = 'true';

  // Display or not the Tenant Selector
  window['env']['displayTenantSelector'] = 'true';

  // Time in seconds for Notifications, default 60 seconds
  window['env']['waitTimeForNotifications'] = '60';

  // Time in seconds for COB Catch-Up, default 30 seconds
  window['env']['waitTimeForCOBCatchUp'] = '30';

  // Time in milliseconds for Session idle timeout, default 300000 seconds
  window['env']['sessionIdleTimeout'] = '300000';

  // OAuth Server Enabled
  window['env']['oauthServerEnabled'] = 'false';

  // OAuth Server URL
  window['env']['oauthServerUrl'] = '';

  // OAuth Client Id
  window['env']['oauthAppId'] = 'web-app';

  // Min Password length
  window['env']['minPasswordLength'] = '12';

  // Enable or Disable HTTP Cache
  window['env']['httpCacheEnabled'] = 'true';

  window['env']['vNextApiUrl'] = '';
  window['env']['vNextApiProvider'] = '';
  window['env']['vNextApiVersion'] = '';
  window['env']['interbankTransfers'] = 'false';

  // OIDC Plugin Environment variables
  window['env']['oidcServerEnabled'] = 'false';
  window['env']['oidcBaseUrl'] = '';
  window['env']['oidcClientId'] = '';
  window['env']['oidcApiUrl'] = '';
  window['env']['oidcFrontUrl'] = '';
})(this);
