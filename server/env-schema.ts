import { z } from "zod";

const optionalUrl = z.union([z.literal(""), z.url()]).optional();

export const serverEnvSchema = z
  .object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required."),
    SESSION_SECRET: z
      .string()
      .min(32, "SESSION_SECRET must contain at least 32 characters."),
    STORAGE_PROVIDER: z.enum(["local", "r2"]).default("local"),
    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET_NAME: z.string().optional(),
    R2_PUBLIC_URL: optionalUrl,
  })
  .superRefine((env, context) => {
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
