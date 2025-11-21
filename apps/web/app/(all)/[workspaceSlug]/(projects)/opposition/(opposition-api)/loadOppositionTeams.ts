interface OppositionTeam {
  id: string;
  address: string;
  asst_athletic_email: string;
  asst_athletic_phone: string;
  asst_coach_name: string;
  athletic_email: string;
  athletic_phone: string;
  head_coach_name: string;
  logo: string;
  name: string;
}

export async function loadOppositionTeams() {
  try {
    const url = `${process.env.NEXT_PUBLIC_CP_SERVER_URL}/meta-type?key='OPPOSITIONTEAM'`;

    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      console.error("Failed to load opposition teams", res.status, res.statusText);
      return [];
    }

    let data: any;

    try {
      data = await res.json();
    } catch (err) {
      console.error("Invalid JSON from meta-type API", err);
      return [];
    }

    const list = data?.["Gateway Response"]?.result;
    if (!Array.isArray(list) || list.length === 0) {
      console.warn("OppositionTeam meta-type not found");
      return [];
    }

    const block = list[0];

    const values =
      block?.find((item: any) => item.field === "values")?.value || [];

    if (!Array.isArray(values)) return [];

    const teams = values.map((item: OppositionTeam) => ({
      id: item.id,
      name: item.name,
      address: item.address,
      asst_coach_name: item.asst_coach_name,
      head_coach_name: item.head_coach_name,
      asst_athletic_email: item.asst_athletic_email,
      asst_athletic_phone: item.asst_athletic_phone,
      athletic_email: item.athletic_email,
      athletic_phone: item.athletic_phone,
      logo: item.logo,
    }));


    return teams;
  } catch (error) {
    console.error("Unexpected error loading opposition teams:", error);
    return []; // Safe fallback to avoid provider crashing
  }
}
