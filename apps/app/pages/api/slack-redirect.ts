// pages/api/slack/authorize.js
import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handleSlackAuthorize(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.body;

  if (!code || code === "") return res.status(400).json({ message: "Code is required" });

  const response = await axios({
    method: "post",
    url: "https://slack.com/api/oauth.v2.access",
    params: {
      client_id: process.env.NEXT_PUBLIC_SLACK_CLIENT_ID,
      client_secret: process.env.NEXT_PUBLIC_SLACK_CLIENT_SECRET,
      code,
    },
  });

  // if (response?.data?.ok)
    res.status(200).json(response.data);
  // else res.status(404).json(response.data);
}
