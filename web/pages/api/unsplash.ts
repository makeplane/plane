import type { NextApiRequest, NextApiResponse } from "next";
import getConfig from "next/config";

const { serverRuntimeConfig } = getConfig();
const unsplashKey = serverRuntimeConfig.unsplashAccess;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { query, page, per_page = 20 } = req.query;

  const url = query
    ? `https://api.unsplash.com/search/photos/?client_id=${unsplashKey}&query=${query}&page=${page}&per_page=${per_page}`
    : `https://api.unsplash.com/photos/?client_id=${unsplashKey}&page=${page}&per_page=${per_page}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  res.status(200).json(data);
}
