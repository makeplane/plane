const { withSentryConfig } = require("@sentry/nextjs");
const path = require("path");
const extraImageDomains = (process.env.NEXT_PUBLIC_EXTRA_IMAGE_DOMAINS ?? "")
  .split(",")
  .filter((domain) => domain.length > 0);

async function getDockerEnv() {
  const env = await DockerCompose.config({
    cwd: process.cwd(),
    envFile: ".env",
    files: ["../../docker-compose.yml"],
  });

  return env;
}

const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  images: {
    domains: [
      "vinci-web.s3.amazonaws.com",
      "planefs-staging.s3.ap-south-1.amazonaws.com",
      "planefs.s3.amazonaws.com",
      "images.unsplash.com",
      "avatars.githubusercontent.com",
      ...extraImageDomains,
    ],
  },
  output: "standalone",
  experimental: {
    // this includes files from the monorepo base two directories up
    outputFileTracingRoot: path.join(__dirname, "../../"),
  },
  serverRuntimeConfig: {
    processEnv: Object.fromEntries(
      Object.entries(process.env).filter(([key]) => key.includes("NEXT_PUBLIC_"))
    ),
  },
  publicRuntimeConfig: {
    processEnv: Object.fromEntries(
      Object.entries(process.env).filter(([key]) => key.includes("NEXT_PUBLIC_"))
    ),
  },
};

if (parseInt(process.env.NEXT_PUBLIC_ENABLE_SENTRY || "0")) {
  module.exports = withSentryConfig(nextConfig, { silent: true }, { hideSourceMaps: true });
} else {
  module.exports = nextConfig;
}
