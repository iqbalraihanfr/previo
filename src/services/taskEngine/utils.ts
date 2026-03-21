const TASK_PREFIX_RE =
  /^(implement|create|setup|set up|test|validate|handle|integrate|build|add|deliver|prepare|configure|wire|link|connect|cover|harden|verify|design|document|ship|support)\b[:\-\s]*/i;

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "for",
  "in",
  "into",
  "logic",
  "module",
  "of",
  "on",
  "process",
  "step",
  "steps",
  "task",
  "the",
  "to",
  "with",
  "flow",
  "feature",
]);

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(TASK_PREFIX_RE, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => !STOP_WORDS.has(token));
}

export function normalizeTaskPhrase(value: string): string {
  return tokenize(value).join(" ").trim();
}

export function compactTaskText(value: string, maxLength = 72): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

export function dedupeGeneratedTasks<
  T extends {
    title: string;
    description?: string;
    group_key: string;
    feature_name?: string;
    source_item_id?: string;
    sort_order: number;
  },
>(tasks: T[]): T[] {
  const seen = new Set<string>();

  return tasks
    .filter((task) => {
      const sourceKey = normalizeTaskPhrase(task.source_item_id ?? "");
      const titleKey = normalizeTaskPhrase(task.title);
      const groupKey = normalizeTaskPhrase(task.group_key);
      const featureKey = normalizeTaskPhrase(task.feature_name ?? "");
      const descriptionKey = normalizeTaskPhrase(task.description ?? "");
      const semanticKey = [titleKey, groupKey, featureKey, descriptionKey]
        .filter(Boolean)
        .join("|");

      if (sourceKey && seen.has(`source:${sourceKey}`)) return false;
      if (semanticKey && seen.has(`semantic:${semanticKey}`)) return false;

      if (sourceKey) seen.add(`source:${sourceKey}`);
      if (semanticKey) seen.add(`semantic:${semanticKey}`);
      return true;
    })
    .sort((a, b) => a.sort_order - b.sort_order);
}

/**
 * Detect potential duplicate tasks by title similarity.
 * Returns pairs of [taskA_index, taskB_index, similarity_score].
 */
export function detectDuplicateTasks(
  tasks: { title: string; source_item_id?: string }[],
): [number, number, number][] {
  const duplicates: [number, number, number][] = [];

  for (let i = 0; i < tasks.length; i++) {
    for (let j = i + 1; j < tasks.length; j++) {
      // Skip if same source
      if (
        tasks[i].source_item_id &&
        tasks[i].source_item_id === tasks[j].source_item_id
      )
        continue;

      const a = normalizeTaskPhrase(tasks[i].title);
      const b = normalizeTaskPhrase(tasks[j].title);
      if (!a || !b) continue;

      const similarity = computeSimilarity(a, b);
      if (similarity >= 0.6) {
        duplicates.push([i, j, Math.round(similarity * 100)]);
      }
    }
  }

  return duplicates;
}

/** Dice coefficient on bigrams for string similarity */
function computeSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const tokenizedA = a.split(/\s+/).filter(Boolean);
  const tokenizedB = b.split(/\s+/).filter(Boolean);
  if (tokenizedA.length > 0 && tokenizedB.length > 0) {
    const sharedTokens = tokenizedA.filter((token) => tokenizedB.includes(token));
    const tokenScore =
      sharedTokens.length / Math.max(tokenizedA.length, tokenizedB.length);
    if (tokenScore >= 0.8) return tokenScore;
  }

  const bigrams = (s: string) => {
    const set = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i++) {
      const bg = s.slice(i, i + 2);
      set.set(bg, (set.get(bg) || 0) + 1);
    }
    return set;
  };

  const aBigrams = bigrams(a);
  const bBigrams = bigrams(b);
  let intersection = 0;

  for (const [bg, count] of aBigrams) {
    intersection += Math.min(count, bBigrams.get(bg) || 0);
  }

  const totalA = Array.from(aBigrams.values()).reduce((s, c) => s + c, 0);
  const totalB = Array.from(bBigrams.values()).reduce((s, c) => s + c, 0);

  return (2 * intersection) / (totalA + totalB);
}

/**
 * Maps MoSCoW priority string to a P0-P3 tier.
 */
export function mapPriorityToTier(priority: string): "P0" | "P1" | "P2" | "P3" {
  switch (priority?.toLowerCase()) {
    case "must":
      return "P0";
    case "should":
      return "P1";
    case "could":
      return "P2";
    case "wont":
      return "P3";
    default:
      return "P1";
  }
}
