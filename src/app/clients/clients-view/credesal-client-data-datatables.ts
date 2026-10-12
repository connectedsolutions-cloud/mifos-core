/** Credesal KYC client datatables shown together under "Datos cliente". */
export const CREDESAL_CLIENT_DATA_DATATABLE_NAMES: readonly string[] = [
  'credesal_client_datos_personales',
  'credesal_client_pep',
  'credesal_client_trabajo',
  'credesal_client_ingresos_egresos_mensuales',
  'credesal_client_remesas',
  'credesal_client_informacion_complementaria',
  'credesal_client_actividad_mensual',
  'credesal_client_informacion_laboral'
];

export const CREDESAL_WORK_BUSINESS_DATATABLE_NAME = 'credesal_client_trabajo';

/** Shown on the client header via dedicated fields, not as a generic datatable. */
export const CREDESAL_HIDDEN_CLIENT_DATATABLE_NAMES = new Set<string>([
  'credesal_client_staff_assignment'
]);

export const CREDESAL_CLIENT_TYPE_RESTRICTED_DATATABLE_NAMES = new Set<string>([
  'credesal_client_ingresos_egresos_mensuales',
  'credesal_client_remesas',
  'credesal_client_informacion_complementaria',
  'credesal_client_actividad_mensual',
  'credesal_client_informacion_laboral'
]);

export const CREDESAL_ALLOWED_CLIENT_TYPE_TAG_NAMES = new Set<string>([
  'cliente',
  'cliente-socio'
]);
export const CREDESAL_ALLOWED_SHAREHOLDER_TYPE_TAG_NAMES = new Set<string>([
  'socio',
  'cliente-socio'
]);
