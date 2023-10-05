import axios from "axios";
import type { NextApiRequest, NextApiResponse } from "next";

const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { query, page, per_page = 20 } = req.query;

    const url = query
      ? `https://api.unsplash.com/search/photos/?client_id=${unsplashKey}&query=${query}&page=${page}&per_page=${per_page}`
      : `https://api.unsplash.com/photos/?client_id=${unsplashKey}&page=${page}&per_page=${per_page}`;

    const response = await axios({
      method: "GET",
      url,
      headers: {
        "Content-Type": "application/json",
      },
    });

    res.status(200).json(response?.data);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch unsplash", error });
  }
}
