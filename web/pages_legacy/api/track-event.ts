import type { NextApiRequest, NextApiResponse } from "next";
// jitsu
import { createClient } from "@jitsu/nextjs";

const jitsuClient = createClient({
  key: process.env.JITSU_TRACKER_ACCESS_KEY || "",
  tracking_host: process.env.JITSU_TRACKER_HOST || "",
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { eventName, user, extra } = req.body;

  if (!eventName) {
    return res.status(400).json({ message: "Bad request" });
  }

  if (!user) return res.status(401).json({ message: "Unauthorized" });

  jitsuClient
    .id({
      id: user?.id,
      email: user?.email,
      first_name: user?.first_name,
      last_name: user?.last_name,
      display_name: user?.display_name,
    })
    .then(() => {
      jitsuClient.track(eventName, {
        ...extra,
      });
    });

  res.status(200).json({ message: "success" });
}
