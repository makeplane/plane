import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handleSlackAuthorize(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { code } = req.body;

    if (!code || code === "") return res.status(400).json({ message: "Code is required" });

    const response = await axios({
      method: "post",
      url: process.env.SLACK_OAUTH_URL || "",
      params: {
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        code,
      },
    });
    res.status(200).json(response?.data);
  } catch (error) {
    res.status(200).json({ message: "Internal Server Error" });
  }
}
