import { z } from "zod";

const optionalUrl = z.union([z.literal(""), z.url()]).optional();

export const serverEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DEPLOYMENT_ENV: z.enum(["development", "staging", "production"]).default("development"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required."),
    SESSION_SECRET: z
      .string()
      .min(32, "SESSION_SECRET must contain at least 32 characters."),
    STORAGE_PROVIDER: z.enum(["local", "r2"]).default("local"),
    TRUST_PROXY: z.enum(["true", "false"]).default("false"),
    ALLOW_STAGING_LOCAL_STORAGE: z.enum(["true", "false"]).default("false"),
    NEXT_PUBLIC_SITE_URL: optionalUrl,
    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET_NAME: z.string().optional(),
    R2_PUBLIC_URL: optionalUrl,
  })
  .superRefine((env, context) => {
    if (env.NODE_ENV === "production") {
      if (!env.NEXT_PUBLIC_SITE_URL) {
        context.addIssue({ code: "custom", path: ["NEXT_PUBLIC_SITE_URL"], message: "NEXT_PUBLIC_SITE_URL is required in production." });
      } else if (!env.NEXT_PUBLIC_SITE_URL.startsWith("https://")) {
        context.addIssue({ code: "custom", path: ["NEXT_PUBLIC_SITE_URL"], message: "NEXT_PUBLIC_SITE_URL must use HTTPS in production." });
      }
      if (env.SESSION_SECRET.length < 48 || /replace|secret|password|change.?me/i.test(env.SESSION_SECRET)) {
        context.addIssue({ code: "custom", path: ["SESSION_SECRET"], message: "SESSION_SECRET must be at least 48 characters and non-placeholder in production." });
      }
      if (env.STORAGE_PROVIDER === "local" && !(env.DEPLOYMENT_ENV === "staging" && env.ALLOW_STAGING_LOCAL_STORAGE === "true")) {
        context.addIssue({ code: "custom", path: ["STORAGE_PROVIDER"], message: "Local storage requires explicit isolated staging opt-in and is forbidden for production." });
      }
      if (env.TRUST_PROXY !== "true") {
        context.addIssue({ code: "custom", path: ["TRUST_PROXY"], message: "TRUST_PROXY=true is required for the documented production Nginx topology." });
      }
    }
    if (env.STORAGE_PROVIDER !== "r2") return;

    for (const key of [
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET_NAME",
      "R2_PUBLIC_URL",
    ] as const) {
      if (!env[key]) {
        context.addIssue({
          code: "custom",
          path: [key],
          message: `${key} is required when STORAGE_PROVIDER=r2.`,
        });
      }
    }
  });

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(environment: Record<string, string | undefined>): ServerEnv {
  const parsed = serverEnvSchema.safeParse(environment);

  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid server environment: ${detail}`);
  }

  return parsed.data;
}
