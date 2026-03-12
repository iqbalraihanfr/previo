"use client";

import { useBriefFields } from "@/lib/hooks";

export function useRequirementLogic(projectId: string, fields: any, onChange: (f: any) => void) {
  const briefFields = useBriefFields(projectId);

  const items = (fields.items as any[]) || [];
  
  const updateItems = (newItems: any[]) => {
    onChange({ ...fields, items: newItems });
  };

  const addItem = (type: "FR" | "NFR") => {
    const base: any = {
      id: crypto.randomUUID(),
      type: type,
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

  const updateItem = (id: string, updates: any) => {
    updateItems(
      items.map((it: any) => (it.id === id ? { ...it, ...updates } : it)),
    );
  };

  const removeItem = (id: string) => {
    updateItems(items.filter((it: any) => it.id !== id));
  };

  const frItems = items.filter((i: any) => (i.type || "FR") === "FR");
  const nfrItems = items.filter((i: any) => i.type === "NFR");
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
