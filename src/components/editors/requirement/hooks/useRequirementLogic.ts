"use client";

import { useBriefFields } from "@/lib/hooks";

export type RequirementType = "FR" | "NFR";

export interface RequirementFieldItem extends Record<string, unknown> {
  id: string;
  type?: RequirementType;
  description?: string;
  priority?: "Must" | "Should" | "Could" | "Wont";
  category?: string;
  related_scope?: string;
  metric?: string;
  target?: string;
}

export interface RequirementFields {
  items?: RequirementFieldItem[];
}

export function useRequirementLogic(
  projectId: string | undefined,
  fields: RequirementFields,
  onChange: (f: RequirementFields) => void,
) {
  const briefFields = useBriefFields(projectId);

  const items = fields.items || [];
  
  const updateItems = (newItems: RequirementFieldItem[]) => {
    onChange({ ...fields, items: newItems });
  };

  const addItem = (type: RequirementType) => {
    const base: RequirementFieldItem = {
      id: crypto.randomUUID(),
      type,
      description: "",
      priority: "Should",
      category: "",
    };
    if (type === "NFR") {
      base.metric = "";
      base.target = "";
    } else {
      base.related_scope = "";
    }
    updateItems([...items, base]);
  };

  const updateItem = (id: string, updates: Partial<RequirementFieldItem>) => {
    updateItems(
      items.map((it) => (it.id === id ? { ...it, ...updates } : it)),
    );
  };

  const removeItem = (id: string) => {
    updateItems(items.filter((it) => it.id !== id));
  };

  const frItems = items.filter((i) => (i.type || "FR") === "FR");
  const nfrItems = items.filter((i) => i.type === "NFR");
  const scopeInItems: string[] = briefFields?.scope_in || [];

  return {
    items,
    frItems,
    nfrItems,
    scopeInItems,
    addItem,
    updateItem,
    removeItem,
  };
}
