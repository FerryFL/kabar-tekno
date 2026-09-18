export function logServerTiming(
  label: string,
  startedAt: number,
  details: Record<string, unknown> = {},
) {
  console.info("[server-timing]", {
    label,
    ms: Math.round(performance.now() - startedAt),
    ...details,
  });
}
