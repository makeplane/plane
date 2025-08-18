interface ParsedURL {
  protocol: string;
  subdomain: string;
  rootDomain: string;
  tld: string;
  path: string;
  full: {
    domain: string;
    hostname: string;
  };
}

export function parseURL(urlString: string): ParsedURL | undefined {
  try {
    if (!urlString.includes("://")) {
      return undefined;
    }

    const url = new URL(urlString);
    const protocol = url.protocol.slice(0, -1);
    const path = (url.pathname + url.search + url.hash).replace(/^\/+/, "").replace(/\/+/g, "/");
    const hostnameParts = url.hostname.split(".");

    let subdomain = "";
    let rootDomain = "";
    let tld = "";

    if (hostnameParts.length >= 2) {
      tld = hostnameParts[hostnameParts.length - 1];

      rootDomain = hostnameParts[hostnameParts.length - 2];

      if (hostnameParts.length > 2) {
        subdomain = hostnameParts.slice(0, -2).join(".");
      }
    }

    return {
      protocol,
      subdomain,
      rootDomain,
      tld,
      path,
      full: {
        domain: `${rootDomain}.${tld}`,
        hostname: url.hostname,
      },
    };
  } catch (error) {
    throw new Error(`Invalid URL: ${urlString}`);
  }
}

export function isUrlValid(urlString: string): boolean {
  try {
    if (!urlString.includes("://")) {
      urlString = "https://" + urlString;
    }
    new URL(urlString);
    return true;
  } catch (error) {
    return false;
  }
}
