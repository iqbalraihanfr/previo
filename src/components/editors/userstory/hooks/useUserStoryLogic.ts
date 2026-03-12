"use client";

import { useBriefFields, useRequirementsFields } from "@/lib/hooks";

export function useUserStoryLogic(projectId: string, fields: any, onChange: (f: any) => void) {
  const briefFields = useBriefFields(projectId);
  const reqFields = useRequirementsFields(projectId);

  const items = fields.items || [];
  const targetUsers: string[] = briefFields?.target_users || [];
  const frItems = (reqFields?.items || []).filter(
    (i: any) => (i.type || "FR") === "FR",
  );

  const updateItems = (newItems: any[]) => {
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

  const updateItem = (id: string, updates: any) => {
    updateItems(
      items.map((it: any) => (it.id === id ? { ...it, ...updates } : it)),
    );
  };

  const removeItem = (id: string) => {
    updateItems(items.filter((it: any) => it.id !== id));
  };

  const addCriteria = (storyId: string) => {
    const story = items.find((i: any) => i.id === storyId);
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
    const story = items.find((i: any) => i.id === storyId);
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
    const story = items.find((i: any) => i.id === storyId);
    if (!story) return;
    const ac = (story.acceptance_criteria || []).filter(
      (_: any, i: number) => i !== index,
    );
    updateItem(storyId, { acceptance_criteria: ac });
  };

  const getAutoPriority = (item: any) => {
    if (!item.related_requirement) return null;
    const linkedFr = frItems.find(
      (fr: any) => fr.id === item.related_requirement,
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
