import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    let urlObj;
    try {
      urlObj = new URL(url);
    } catch (e) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch");

      const html = await response.text();

      const getMetaContent = (property: string) => {
        const patterns = [
          new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`, "i"),
          new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${property}["']`, "i"),
          new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`, "i"),
        ];
        for (const pattern of patterns) {
          const match = html.match(pattern);
          if (match) return match[1];
        }
        return null;
      };

      const title = getMetaContent("og:title") || getMetaContent("twitter:title") || html.match(/<title>([^<]*)<\/title>/i)?.[1];
      const description = getMetaContent("og:description") || getMetaContent("twitter:description") || getMetaContent("description");
      const image = getMetaContent("og:image") || getMetaContent("twitter:image");
      const favicon = getMetaContent("icon") || `${urlObj.origin}/favicon.ico`;

      return NextResponse.json({
        title: title || urlObj.hostname.replace('www.', ''),
        description: description || "",
        image: image || null,
        favicon: favicon || null,
      });
    } catch (fetchError) {
      // Fallback to basic info if fetch fails
      const domain = urlObj.hostname.replace('www.', '');
      return NextResponse.json({
        title: domain,
        description: `Link to ${domain}`,
        image: null,
        favicon: `${urlObj.origin}/favicon.ico`,
      });
    }
  } catch (error: any) {
    console.error("Link preview error:", error?.message || error);
    return NextResponse.json({ 
      error: error?.message || "Failed to fetch link preview" 
    }, { status: 500 });
  }
}
