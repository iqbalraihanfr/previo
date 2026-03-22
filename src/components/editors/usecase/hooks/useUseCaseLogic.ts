"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useBriefFields } from "@/lib/hooks";
import { getCanonicalNodeFields } from "@/lib/canonicalContent";
import { NodeContentRepository } from "@/repositories/NodeRepository";
import type { UserStoryFieldItem } from "../../userstory/hooks/useUserStoryLogic";

export interface UseCaseFlowStep {
  actor: string;
  action: string;
}

export interface UseCaseAlternativeFlow {
  name: string;
  branch_from_step: string;
  steps: string;
}

export interface UseCaseItemData {
  id: string;
  name: string;
  primary_actor: string;
  secondary_actors: string[];
  description: string;
  preconditions: string[];
  postconditions: string[];
  main_flow: UseCaseFlowStep[];
  alternative_flows: UseCaseAlternativeFlow[];
  related_user_stories: string[];
  include_extend: string[];
}

export interface UseCaseFields {
  actors?: string[];
  useCases?: UseCaseItemData[];
}

export function useUseCaseLogic(
  projectId?: string,
  fields: UseCaseFields = {},
  onChange?: (f: UseCaseFields) => void,
) {
  const briefFields = useBriefFields(projectId);
  
  const userStories =
    useLiveQuery(async () => {
      if (!projectId) return [] as UserStoryFieldItem[];
      const content = await NodeContentRepository.findByProjectAndType(
        projectId,
        "user_stories",
      );
      return (
        getCanonicalNodeFields("user_stories", content).items || []
      ) as UserStoryFieldItem[];
    },
    [projectId],
  ) ?? [];

  const targetUsers: string[] = Array.isArray(briefFields?.target_users)
    ? (briefFields.target_users as string[])
    : [];
  
  const actors: string[] = Array.isArray(fields?.actors)
    ? (fields.actors as string[])
    : [];
  
  const useCases: UseCaseItemData[] = Array.isArray(fields?.useCases)
    ? fields.useCases
    : [];

  const updateActors = (newActors: string[]) =>
    onChange?.({ ...fields, actors: newActors });

  const updateUseCases = (newUseCases: UseCaseItemData[]) =>
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

  const updateUseCase = (id: string, updates: Partial<UseCaseItemData>) => {
    updateUseCases(
      useCases.map((uc) => (uc.id === id ? { ...uc, ...updates } : uc))
    );
  };

  const removeUseCase = (id: string) => {
    updateUseCases(useCases.filter((uc) => uc.id !== id));
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
