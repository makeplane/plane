import { TCreateUpdateCustomerModal, TCustomerContractStatus, TCustomerStage } from "@plane/types";

export const CUSTOMER_CONTRACT_STATUS: {
  i18n_name: string;
  value: TCustomerContractStatus;
  color: string;
}[] = [
  {
    i18n_name: "customers.contract_status.active",
    value: "active",
    color: "#1FAD40",
  },
  {
    i18n_name: "customers.contract_status.pre_contract",
    value: "pre_contract",
    color: "#FF9500",
  },
  {
    i18n_name: "customers.contract_status.signed",
    value: "signed",
    color: "#3372FF",
  },
  {
    i18n_name: "customers.contract_status.inactive",
    value: "inactive",
    color: "#6F7E9F",
  },
];

export const CUSTOMER_STAGES: {
  i18n_name: string;
  value: TCustomerStage;
}[] = [
  {
    i18n_name: "customers.stage.lead",
    value: "lead",
  },
  {
    i18n_name: "customers.stage.sales_qualified_lead",
    value: "sales_qualified_lead",
  },
  {
    i18n_name: "customers.stage.contract_negotiation",
    value: "contract_negotiation",
  },
  {
    i18n_name: "customers.stage.closed_won",
    value: "closed_won",
  },
  {
    i18n_name: "customers.stage.closed_lost",
    value: "closed_lost",
  },
];

export const DEFAULT_CREATE_UPDATE_CUSTOMER_MODAL_DATA: TCreateUpdateCustomerModal = {
  isOpen: false,
  customerId: undefined,
};
