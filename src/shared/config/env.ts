import { z } from 'zod';

/**
 * Typed, validated access to the app's environment variables.
 *
 * Expo inlines `EXPO_PUBLIC_*` variables at build time, but only when each one is
 * referenced literally as `process.env.EXPO_PUBLIC_NAME`. Keep the references below
 * exactly in that form; never read them dynamically.
 */
const envSchema = z
  .object({
    // z.url, not z.httpUrl: httpUrl demands a dotted domain, which rejects the local backends
    // development uses (localhost, the emulator's 10.0.2.2, LAN IP addresses).
    apiUrl: z
      .url({ protocol: /^https?$/, error: 'EXPO_PUBLIC_API_URL must be an absolute http(s) URL' })
      .transform((url) => url.replace(/\/+$/, '')),
    useMockApi: z.stringbool().default(false),
    sentryDsn: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : undefined)),
    sentryEnableInDev: z.stringbool().default(false),
    appEnv: z.enum(['development', 'preview', 'production']).default('development'),
    // Internal test builds against the HTTP-only hosted backend opt in explicitly (eas.json
    // "hosted-test"). Never set it for a store build.
    allowInsecureHttp: z.stringbool().default(false),
  })
  .refine(
    (config) =>
      config.appEnv === 'development' ||
      config.allowInsecureHttp ||
      config.apiUrl.startsWith('https://'),
    {
      error: 'EXPO_PUBLIC_API_URL must use https:// in preview and production builds',
      path: ['apiUrl'],
    },
  )
  .refine((config) => !(config.allowInsecureHttp && config.appEnv === 'production'), {
    error: 'EXPO_PUBLIC_ALLOW_INSECURE_HTTP is for internal test builds, never production',
    path: ['allowInsecureHttp'],
  });

export type Env = z.infer<typeof envSchema>;

/** The raw strings, as Expo inlines them. */
export interface RawEnv {
  apiUrl: string | undefined;
  useMockApi: string | undefined;
  sentryDsn: string | undefined;
  sentryEnableInDev: string | undefined;
  appEnv: string | undefined;
  allowInsecureHttp: string | undefined;
}

/** Validates the raw values and throws one readable error listing every problem. */
export function parseEnv(raw: RawEnv): Env {
  const result = envSchema.safeParse(raw);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  ${issue.path.map(String).join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Invalid environment configuration:\n${issues}\nCopy .env.example to .env and fill in the values.`,
    );
  }

  return result.data;
}

/** Validated once at startup. Import this instead of touching process.env elsewhere. */
export const env: Env = parseEnv({
  apiUrl: process.env.EXPO_PUBLIC_API_URL,
  useMockApi: process.env.EXPO_PUBLIC_USE_MOCK_API,
  sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  sentryEnableInDev: process.env.EXPO_PUBLIC_SENTRY_ENABLE_IN_DEV,
  appEnv: process.env.EXPO_PUBLIC_APP_ENV,
  allowInsecureHttp: process.env.EXPO_PUBLIC_ALLOW_INSECURE_HTTP,
});
