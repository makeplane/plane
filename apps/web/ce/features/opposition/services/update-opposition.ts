import { adapter } from "./adapter";


export async function updateEntity(type: string, entity: any) {

  const BASE_URL = process.env.NEXT_PUBLIC_CP_SERVER_URL!
  const payload = await adapter.modulateOne(type, entity);

  const res = await fetch(`${BASE_URL}/${type}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Update failed");
  return res.json();
}
