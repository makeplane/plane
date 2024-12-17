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

export type TSelfHostedMemberInviteCheck = {
  invite_allowed: boolean;
  allowed_admin_members: number;
  allowed_guests: number;
};
