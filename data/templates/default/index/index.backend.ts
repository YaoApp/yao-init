import { Process } from "@yao/runtime";

/**
 * Index page backend script
 */

interface Request {
  query: Record<string, string>;
  params: Record<string, string>;
  locale: string;
  theme: string;
}

const ENV_KEYS = [
  "YAO_DB_DRIVER",
  "YAO_DB_PRIMARY",
  "YAO_ENV",
  "YAO_HOST",
  "YAO_PORT",
  "DEFAULT_LLM",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GITHUBUSER_CLIENT_ID",
  "GITHUBUSER_CLIENT_SECRET",
];

/**
 * GetEnv - Read key environment variables for display
 */
function GetEnv(request: Request): Record<string, string> {
  const raw = Process(
    "utils.env.GetMany",
    ...ENV_KEYS
  ) as Record<string, string>;

  // Check OAuth provider status
  const googleConfigured =
    raw["GOOGLE_CLIENT_ID"] && raw["GOOGLE_CLIENT_SECRET"];
  const githubConfigured =
    raw["GITHUBUSER_CLIENT_ID"] && raw["GITHUBUSER_CLIENT_SECRET"];

  return {
    ...raw,
    GOOGLE_OAUTH: googleConfigured ? "Configured" : "Not Configured",
    GITHUB_OAUTH: githubConfigured ? "Configured" : "Not Configured",
  };
}
