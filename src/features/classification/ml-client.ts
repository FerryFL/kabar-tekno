import "server-only";

import { z } from "zod";

export const classificationLabels = ["baik", "buruk", "netral"] as const;
export type ClassificationLabel = (typeof classificationLabels)[number];

const labelSchema = z.enum(classificationLabels);

const metricsSchema = z.object({
  accuracy: z.number(),
  macro_precision: z.number(),
  macro_recall: z.number(),
  macro_f1: z.number(),
  weighted_f1: z.number(),
  classification_report: z.record(z.string(), z.unknown()).optional(),
  confusion_matrix: z.array(z.array(z.number())),
});

const trainTestResponseSchema = z.object({
  run_id: z.string().min(1),
  model_version: z.string().min(1),
  artifact_name: z.string().min(1),
  training_sample_count: z.number().int().nonnegative(),
  test_sample_count: z.number().int().nonnegative(),
  metrics: metricsSchema,
});

const predictionResponseSchema = z.object({
  model_version: z.string().min(1),
  predictions: z.array(z.object({
    id: z.string().min(1),
    label: labelSchema,
    confidence: z.number().min(0).max(1),
    scores: z.record(z.string(), z.number()).optional(),
  })),
});

const healthResponseSchema = z.object({
  ok: z.boolean(),
  service: z.string(),
  model_loaded: z.boolean(),
  active_model_version: z.string().nullable().optional(),
});

export type TrainTestResponse = z.infer<typeof trainTestResponseSchema>;
export type PredictionResponse = z.infer<typeof predictionResponseSchema>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;

export class MlServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "MlServiceError";
  }
}

function getConfig() {
  const url = process.env.ML_SERVICE_URL;
  const token = process.env.ML_SERVICE_TOKEN;

  if (!url || !token) {
    throw new MlServiceError("CONFIGURATION_ERROR", "ML service is not configured.");
  }

  const timeout = Number.parseInt(process.env.ML_REQUEST_TIMEOUT_MS ?? "120000", 10);

  return {
    url: url.replace(/\/$/, ""),
    token,
    timeout: Number.isFinite(timeout) ? timeout : 120000,
  };
}

async function request<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  const config = getConfig();
  let response: Response;

  try {
    response = await fetch(`${config.url}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.token}`,
        ...init?.headers,
      },
      signal: AbortSignal.timeout(config.timeout),
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new MlServiceError("TIMEOUT", "ML service timed out.");
    }

    throw new MlServiceError("UNAVAILABLE", "ML service is unavailable.");
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body &&
      "error" in body &&
      typeof body.error === "object" &&
      body.error &&
      "message" in body.error &&
      typeof body.error.message === "string"
        ? body.error.message
        : "ML service request failed.";

    throw new MlServiceError(
      response.status === 503 ? "UNAVAILABLE" : "ML_SERVICE_ERROR",
      message,
      response.status,
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new MlServiceError("MALFORMED_RESPONSE", "ML service returned an invalid response.", response.status);
  }

  return parsed.data;
}

export function trainAndTest(payload: {
  model_version: string;
  random_seed: number;
  test_size: number;
  cv_folds: number;
  rows: Array<{
    id: string;
    title: string;
    description: string;
    label: ClassificationLabel;
  }>;
}) {
  return request("/v1/train-test", trainTestResponseSchema, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function predict(payload: {
  model_version: string;
  rows: Array<{ id: string; title: string; description: string }>;
}) {
  return request("/v1/predict", predictionResponseSchema, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function checkMlHealth() {
  const config = getConfig();

  return fetch(`${config.url}/health`, {
    signal: AbortSignal.timeout(config.timeout),
    cache: "no-store",
  })
    .then(async (response) => {
      const parsed = healthResponseSchema.safeParse(await response.json());
      if (!response.ok || !parsed.success) {
        throw new MlServiceError("UNAVAILABLE", "ML service health check failed.", response.status);
      }
      return parsed.data;
    })
    .catch((error) => {
      if (error instanceof MlServiceError) throw error;
      throw new MlServiceError("UNAVAILABLE", "ML service is unavailable.");
    });
}
