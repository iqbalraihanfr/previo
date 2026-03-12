"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useBriefFields } from "@/lib/hooks";

export function useUseCaseLogic(projectId?: string, fields?: any, onChange?: (f: any) => void) {
  const briefFields = useBriefFields(projectId);
  
  const userStories = useLiveQuery(
    async () => {
      if (!projectId) return [];
      const node = await db.nodes
        .where({ project_id: projectId, type: "user_stories" })
        .first();
      if (!node) return [];
      const content = await db.nodeContents.where({ node_id: node.id }).first();
      return content?.structured_fields?.items || [];
    },
    [projectId],
    []
  );

  const targetUsers: string[] = Array.isArray(briefFields?.target_users)
    ? (briefFields.target_users as string[])
    : [];
  
  const actors: string[] = Array.isArray(fields?.actors)
    ? (fields.actors as string[])
    : [];
  
  const useCases: any[] = Array.isArray(fields?.useCases)
    ? (fields.useCases as any[])
    : [];

  const updateActors = (newActors: string[]) =>
    onChange?.({ ...fields, actors: newActors });

  const updateUseCases = (newUseCases: any[]) =>
    onChange?.({ ...fields, useCases: newUseCases });

  const addUseCase = () => {
    updateUseCases([
      ...useCases,
      {
        id: crypto.randomUUID(),
        name: "",
        primary_actor: "",
        secondary_actors: [],
        description: "",
        preconditions: [],
        postconditions: [],
        main_flow: [],
        alternative_flows: [],
        related_user_stories: [],
        include_extend: [],
      },
    ]);
  };

  const updateUseCase = (id: string, updates: any) => {
    updateUseCases(
      useCases.map((uc: any) => (uc.id === id ? { ...uc, ...updates } : uc))
    );
  };

  const removeUseCase = (id: string) => {
    updateUseCases(useCases.filter((uc: any) => uc.id !== id));
  };

  return {
    targetUsers,
    actors,
    useCases,
    userStories,
    updateActors,
    addUseCase,
    updateUseCase,
    removeUseCase,
  };
}
