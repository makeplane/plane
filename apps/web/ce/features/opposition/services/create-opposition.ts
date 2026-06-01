import { adapter } from "./adapter";

export async function createEntity(type: string, entity: any) {
  const payload = await adapter.modulateOne(type, entity);

  const BASE_URL = process.env.NEXT_PUBLIC_CP_SERVER_URL!
  const res = await fetch(`${BASE_URL}/${type}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Create failed");
  return res.json();
}
