export interface IInstanceConfigExtended {
  // instance
  is_airgapped: boolean;
  // auth
  is_oidc_enabled: boolean;
  oidc_provider_name: string | undefined;
  is_saml_enabled: boolean;
  saml_provider_name: string | undefined;
  // feature flags
  payment_server_base_url?: string;
  prime_server_base_url?: string;
  feature_flag_server_base_url?: string;
  // silo
  silo_base_url: string | undefined;
  // elasticsearch
  is_elasticsearch_enabled: boolean;
}
