import type { NextApiRequest, NextApiResponse } from "next";
// supabase
import { supabaseClient } from "lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse<any>) {
  const {
    body: { email },
    method,
  } = req;

  switch (method) {
    case "POST":
      if (supabaseClient) {
        if (email) {
          const emailExists = await supabaseClient
            .from("web-waitlist")
            .select("id,email,count")
            .eq("email", email);
          if (emailExists.data.length === 0) {
            const emailCreation = await supabaseClient
              .from("web-waitlist")
              .insert([{ email: email, count: 1, last_visited: new Date() }])
              .select("id,email,count");

            if (emailCreation.status === 201) return res.status(201).json({ status: "success" });
            else return res.status(400).json({ status: "insert_error" });
          } else {
            const emailCountUpdate = await supabaseClient
              .from("web-waitlist")
              .upsert({
                id: emailExists.data[0]?.id,
                count: emailExists.data[0]?.count + 1,
                last_visited: new Date(),
              })
              .select("id,email,count");
            if (emailCountUpdate.status === 201)
              return res.status(202).json({ status: "email_already_exists" });
            else return res.status(400).json({ status: "update_error" });
          }
        } else return res.status(400).json({ status: "email_required" });
      }
      return res.status(400).json({ status: "supabase_error" });

    default:
      res.setHeader("Allow", ["POST"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}
