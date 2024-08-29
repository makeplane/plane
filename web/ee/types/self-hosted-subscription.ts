export type TSelfHostedSubscription = {
  license: {
    id: string | undefined;
    license_key: string | undefined;
    instance_id: string | undefined;
    workspace_id: string | undefined;
    product: string | undefined;
    product_type: string | undefined;
    workspace_slug: string | undefined;
    seats: number | undefined;
  };
  message: "string";
  status: boolean;
};
