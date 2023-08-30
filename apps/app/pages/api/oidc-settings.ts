import { NextApiRequest, NextApiResponse } from "next";
import { IOidcSettings } from "types/oidc";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const settings: IOidcSettings = {
    enabled: parseInt(process.env.OIDC_ENABLED || "0") === 1,
    auto: parseInt(process.env.OIDC_AUTO || "0") === 1,
    client_id: process.env.OIDC_CLIENT_ID || "",
    url_authorize: process.env.OIDC_URL_AUTHORIZE || "",
  };

  res.status(200).json(settings);
}
