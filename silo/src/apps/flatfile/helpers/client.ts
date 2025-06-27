import { createFlatfileClient } from "@plane/etl/flatfile";
import { env } from "@/env";

export const flatfileClient = env.FLATFILE_API_KEY && createFlatfileClient(env.FLATFILE_API_KEY);
