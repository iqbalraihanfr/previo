"use client";

import { useBriefFields, useRequirementsFields } from "@/lib/hooks";
import type { RequirementFieldItem } from "../../requirement/hooks/useRequirementLogic";

export interface UserStoryFields {
  items?: UserStoryFieldItem[];
}

export interface UserStoryCriteria {
  given?: string;
  when?: string;
  then?: string;
}

export interface UserStoryFieldItem extends Record<string, unknown> {
  id: string;
  role?: string;
  goal?: string;
  benefit?: string;
  related_requirement?: string;
  acceptance_criteria?: Array<string | UserStoryCriteria>;
}

export function useUserStoryLogic(
  projectId: string | undefined,
  fields: UserStoryFields,
  onChange: (f: UserStoryFields) => void,
) {
  const briefFields = useBriefFields(projectId);
  const reqFields = useRequirementsFields(projectId);

  const items = fields.items || [];
  const targetUsers: string[] = briefFields?.target_users || [];
  const frItems: RequirementFieldItem[] = (reqFields?.items || []).filter(
    (i: Record<string, unknown>): i is RequirementFieldItem =>
      (i.type || "FR") === "FR",
  );

  const updateItems = (newItems: UserStoryFieldItem[]) => {
    onChange({ ...fields, items: newItems });
  };

  const addItem = () => {
    updateItems([
      ...items,
      {
        id: crypto.randomUUID(),
        role: "",
        goal: "",
        benefit: "",
        related_requirement: "",
        acceptance_criteria: [],
      },
    ]);
  };

  const updateItem = (id: string, updates: Partial<UserStoryFieldItem>) => {
    updateItems(
      items.map((it) => (it.id === id ? { ...it, ...updates } : it)),
    );
  };

  const removeItem = (id: string) => {
    updateItems(items.filter((it) => it.id !== id));
  };

  const addCriteria = (storyId: string) => {
    const story = items.find((i) => i.id === storyId);
    if (!story) return;
    const ac = story.acceptance_criteria || [];
    updateItem(storyId, {
      acceptance_criteria: [...ac, { given: "", when: "", then: "" }],
    });
  };

  const updateCriteria = (
    storyId: string,
    index: number,
    key: "given" | "when" | "then",
    value: string,
  ) => {
    const story = items.find((i) => i.id === storyId);
    if (!story) return;
    const ac = [...(story.acceptance_criteria || [])];
    
    // Migration logic
    if (typeof ac[index] === "string") {
      ac[index] = { given: ac[index], when: "", then: "" };
    }
    
    ac[index] = { ...ac[index], [key]: value };
    updateItem(storyId, { acceptance_criteria: ac });
  };

  const removeCriteria = (storyId: string, index: number) => {
    const story = items.find((i) => i.id === storyId);
    if (!story) return;
    const ac = (story.acceptance_criteria || []).filter(
      (_criterion, i: number) => i !== index,
    );
    updateItem(storyId, { acceptance_criteria: ac });
  };

  const getAutoPriority = (item: UserStoryFieldItem) => {
    if (!item.related_requirement) return null;
    const linkedFr = frItems.find(
      (fr) => fr.id === item.related_requirement,
    );
    return linkedFr?.priority || null;
  };

  return {
    items,
    targetUsers,
    frItems,
    addItem,
    updateItem,
    removeItem,
    addCriteria,
    updateCriteria,
    removeCriteria,
    getAutoPriority,
  };
}
