interface OppositionTeam {
    address: string,
    asst_athletic_email: string,
    asst_athletic_phone: string,
    asst_coach_name: string,
    athletic_email: string,
    athletic_phone: string,
    head_coach_name: string,
    logo: string,
    name: string

}

export async function loadOppositionTeams() {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_CP_SERVER_URL}/meta-type?key='OPPOSITIONTEAM'`,
        { cache: "no-store" }
    );

    const data = await res.json();

    // Extract “values”
    const values =
        data?.["Gateway Response"]?.result?.[0]?.find(
            (item: any) => item.field === "values"
        )?.value || [];

    // Convert API shape → Your UI Team[] shape
    const teams = values.map((item: OppositionTeam, index: number) => ({
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

    console.log("Opposition Teams Values:", teams);
    return teams;
}



