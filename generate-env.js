const fs = require('fs');
const path = require('path');

// Read .env file
const envPath = path.join(__dirname, '.env');
const templatePath = path.join(__dirname, 'src', 'assets', 'env.template.js');
const outputPath = path.join(__dirname, 'src', 'assets', 'env.js');

if (!fs.existsSync(envPath)) {
  console.error('Error: .env file not found at', envPath);
  process.exit(1);
}

// Read .env file
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

// Parse .env file
envContent.split('\n').forEach((line) => {
  line = line.trim();
  // Skip empty lines and comments
  if (!line || line.startsWith('#')) {
    return;
  }

  // Handle export statements
  line = line.replace(/^export\s+/, '');

  const equalIndex = line.indexOf('=');
  if (equalIndex > 0) {
    const key = line.substring(0, equalIndex).trim();
    let value = line.substring(equalIndex + 1).trim();

    // Remove quotes if present
    value = value.replace(/^["']|["']$/g, '');

    envVars[key] = value;
  }
});

// Read template
if (!fs.existsSync(templatePath)) {
  console.error('Error: env.template.js not found at', templatePath);
  process.exit(1);
}

let templateContent = fs.readFileSync(templatePath, 'utf-8');

// Replace placeholders with values from .env
// Map .env variable names to template placeholders
const replacements = {
  $FINERACT_API_URLS: envVars.FINERACT_API_URLS || '',
  $FINERACT_API_URL: envVars.FINERACT_API_URL || '',
  $FINERACT_API_PROVIDER: envVars.FINERACT_API_PROVIDER || '/fineract-provider/api',
  $FINERACT_API_VERSION: envVars.FINERACT_API_VERSION || '/v1',
  $FINERACT_PLATFORM_TENANT_IDENTIFIER: envVars.FINERACT_PLATFORM_TENANT_IDENTIFIER || 'default',
  $FINERACT_PLATFORM_TENANTS_IDENTIFIER: envVars.FINERACT_PLATFORM_TENANTS_IDENTIFIER || 'default',
  $MIFOS_DEFAULT_LANGUAGE: envVars.MIFOS_DEFAULT_LANGUAGE || 'en-US',
  $MIFOS_SUPPORTED_LANGUAGES:
    envVars.MIFOS_SUPPORTED_LANGUAGES || 'cs-CS,de-DE,en-US,es-MX,fr-FR,it-IT,ko-KO,lt-LT,lv-LV,ne-NE,pt-PT,sw-SW',
  $MIFOS_PRELOAD_CLIENTS: envVars.MIFOS_PRELOAD_CLIENTS || 'true',
  $MIFOS_DEFAULT_CHAR_DELIMITER: envVars.MIFOS_DEFAULT_CHAR_DELIMITER || ',',
  $MIFOS_ALLOW_SERVER_SWITCH_SELECTOR: envVars.MIFOS_ALLOW_SERVER_SWITCH || 'true',
  $MIFOS_DISPLAY_BACKEND_INFO: envVars.MIFOS_DISPLAY_BACKEND_INFO || 'true',
  $MIFOS_DISPLAY_TENANT_SELECTOR: envVars.MIFOS_DISPLAY_TENANT_SELECTOR || 'true',
  $MIFOS_WAIT_TIME_FOR_NOTIFICATIONS: envVars.MIFOS_WAIT_TIME_FOR_NOTIFICATIONS || '60',
  $MIFOS_WAIT_TIME_FOR_CATCHUP: envVars.MIFOS_WAIT_TIME_FOR_CATCHUP || '30',
  $MIFOS_SESSION_IDLE_TIMEOUT: envVars.MIFOS_SESSION_IDLE_TIMEOUT || '300000',
  $MIFOS_OAUTH_SERVER_ENABLED: envVars.MIFOS_OAUTH_SERVER_ENABLED || 'false',
  $MIFOS_OAUTH_SERVER_URL: envVars.MIFOS_OAUTH_SERVER_URL || '',
  $MIFOS_OAUTH_CLIENT_ID: envVars.MIFOS_OAUTH_CLIENT_ID || 'web-app',
  $MIFOS_MIN_PASSWORD_LENGTH: envVars.MIFOS_MIN_PASSWORD_LENGTH || '12',
  $MIFOS_HTTP_CACHE_ENABLED: envVars.MIFOS_HTTP_CACHE_ENABLED || 'true',
  $MIFOS_WARNING_DIALOG_ENABLED: envVars.MIFOS_WARNING_DIALOG_ENABLED || 'true',
  $VNEXT_API_URL: envVars.VNEXT_API_URL || '',
  $VNEXT_API_PROVIDER: envVars.VNEXT_API_PROVIDER || '',
  $VNEXT_API_VERSION: envVars.VNEXT_API_VERSION || '',
  $VNEXT_INTERBANK_TRANSFERS: envVars.VNEXT_INTERBANK_TRANSFERS || 'false',
  $FINERACT_PLUGIN_OIDC_ENABLED: envVars.FINERACT_PLUGIN_OIDC_ENABLED || 'false',
  $FINERACT_PLUGIN_OIDC_BASE_URL: envVars.FINERACT_PLUGIN_OIDC_BASE_URL || '',
  $FINERACT_PLUGIN_OIDC_CLIENT_ID: envVars.FINERACT_PLUGIN_OIDC_CLIENT_ID || '',
  $FINERACT_PLUGIN_OIDC_API_URL: envVars.FINERACT_PLUGIN_OIDC_API_URL || '',
  $FINERACT_PLUGIN_OIDC_FRONTEND_URL: envVars.FINERACT_PLUGIN_OIDC_FRONTEND_URL || ''
};

// Replace all placeholders
Object.keys(replacements).forEach((placeholder) => {
  const value = replacements[placeholder];
  // Escape quotes in the value for JavaScript
  const escapedValue = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  templateContent = templateContent.replace(new RegExp(placeholder.replace(/\$/g, '\\$'), 'g'), escapedValue);
});

// Write output file
fs.writeFileSync(outputPath, templateContent, 'utf-8');
console.log(`✅ Generated env.js from .env file`);
console.log(`   Source: ${envPath}`);
console.log(`   Output: ${outputPath}`);
