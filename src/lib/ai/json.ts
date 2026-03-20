function stripCodeFence(raw: string): string | null {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return match ? match[1].trim() : null;
}

function extractFirstJsonLike(raw: string): string | null {
  let start = -1;
  let inString = false;
  let escaping = false;
  const stack: string[] = [];

  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];

    if (start === -1) {
      if (char === "{") {
        start = index;
        stack.push("}");
      } else if (char === "[") {
        start = index;
        stack.push("]");
      }
      continue;
    }

    if (inString) {
      if (escaping) {
        escaping = false;
      } else if (char === "\\") {
        escaping = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      stack.push("}");
      continue;
    }

    if (char === "[") {
      stack.push("]");
      continue;
    }

    if (char === "}" || char === "]") {
      if (stack[stack.length - 1] !== char) {
        return null;
      }

      stack.pop();

      if (stack.length === 0) {
        return raw.slice(start, index + 1).trim();
      }
    }
  }

  return null;
}

function collectParseCandidates(raw: string): string[] {
  const candidates: string[] = [];
  const seen = new Set<string>();

  const pushCandidate = (candidate: string | null) => {
    if (!candidate) return;

    const normalized = candidate.trim();
    if (!normalized || seen.has(normalized)) return;

    seen.add(normalized);
    candidates.push(normalized);
  };

  pushCandidate(raw);

  const strippedFence = stripCodeFence(raw);
  pushCandidate(strippedFence);

  pushCandidate(extractFirstJsonLike(raw));

  if (strippedFence) {
    pushCandidate(extractFirstJsonLike(strippedFence));
  }

  return candidates;
}

export function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseModelJson<T>(raw: string): T {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("Model response was empty.");
  }

  for (const candidate of collectParseCandidates(trimmed)) {
    try {
      return JSON.parse(candidate) as T;
    } catch {
      continue;
    }
  }

  throw new Error("Model response was not valid JSON.");
}

export function normalizeStringArray(values: string[]): string[] {
  const uniqueValues = new Set<string>();
  const normalized: string[] = [];

  values.forEach((value) => {
    const cleanValue = value.trim();
    if (!cleanValue || uniqueValues.has(cleanValue)) return;

    uniqueValues.add(cleanValue);
    normalized.push(cleanValue);
  });

  return normalized;
}

export function parseModelStringArray(raw: string): string[] {
  const parsed = parseModelJson<unknown>(raw);

  if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === "string")) {
    throw new Error("Model response was not a JSON array of strings.");
  }

  return normalizeStringArray(parsed);
}

export function parseModelObject<T extends object>(raw: string): T {
  const parsed = parseModelJson<unknown>(raw);

  if (!isPlainObject(parsed)) {
    throw new Error("Model response was not a JSON object.");
  }

  return parsed as T;
}
