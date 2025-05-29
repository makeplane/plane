export const EXTENDED_PROFILE_ACTION_LINKS = [
  {
    key: "connections",
    i18n_label: "profile.actions.connections",
    href: `/profile/connections`,
    highlight: (pathname: string) => pathname === "/profile/connections/",
  },
];

export enum E_INTEGRATION_KEYS {
  GITHUB = "GITHUB",
  GITLAB = "GITLAB",
  SLACK = "SLACK",
}

export type TUserConnection = E_INTEGRATION_KEYS.GITHUB | E_INTEGRATION_KEYS.SLACK;

export type TPersonalAccountProvider = {
  key: TUserConnection;
  name: string;
  description: string;
};

export const USER_CONNECTION_PROVIDERS: Record<
  TUserConnection,
  TPersonalAccountProvider
> = {
  GITHUB: {
    key: E_INTEGRATION_KEYS.GITHUB,
    name: "GitHub",
    description:
      "Connect your GitHub account to Plane to get the most out of your development workflow.",
  },
  SLACK: {
    key: E_INTEGRATION_KEYS.SLACK,
    name: "Slack",
    description:
      "Connect your Slack account to Plane to get the most out of your team collaboration and communication.",
  },
} as const;
