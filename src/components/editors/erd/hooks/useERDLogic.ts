"use client";

import { crypto } from "@/lib/utils"; // Assuming crypto.randomUUID is available or needs fallback

export type ERDAttribute = {
  name: string;
  type: string;
  description?: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  isUnique?: boolean;
  isNullable?: boolean;
  isRequired?: boolean;
  isIndex?: boolean;
};

export type ERDEntity = {
  id: string;
  name: string;
  description?: string;
  attributes: ERDAttribute[];
};

export type ERDRelationship = {
  id: string;
  from: string;
  to: string;
  type: "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many";
  label?: string;
  junction_table?: string;
};

export interface ERDFields {
  entities?: ERDEntity[];
  relationships?: ERDRelationship[];
}

export function useERDLogic(fields: ERDFields, onChange: (f: ERDFields) => void) {
  const entities = Array.isArray(fields.entities) ? fields.entities : [];
  const relationships = Array.isArray(fields.relationships) ? fields.relationships : [];

  const updateEntities = (newE: ERDEntity[]) => onChange({ ...fields, entities: newE });
  const updateRels = (newR: ERDRelationship[]) => onChange({ ...fields, relationships: newR });

  const addEntity = () => {
    updateEntities([
      ...entities,
      { id: window.crypto.randomUUID(), name: "", description: "", attributes: [] },
    ]);
  };

  const updateEntity = (id: string, updates: Partial<ERDEntity>) => {
    updateEntities(entities.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const removeEntity = (id: string) => {
    updateEntities(entities.filter((e) => e.id !== id));
  };

  const addAttribute = (entityId: string) => {
    const e = entities.find((ent) => ent.id === entityId);
    if (!e) return;
    const attrs = Array.isArray(e.attributes) ? e.attributes : [];
    updateEntity(entityId, {
      attributes: [
        ...attrs,
        {
          name: "",
          type: "string",
          description: "",
          isPrimaryKey: false,
          isForeignKey: false,
          isUnique: false,
          isNullable: true,
          isRequired: false,
          isIndex: false,
        },
      ],
    });
  };

  const updateAttribute = (entityId: string, idx: number, updates: Partial<ERDAttribute>) => {
    const e = entities.find((ent) => ent.id === entityId);
    if (!e) return;
    const attrs = [...e.attributes];
    attrs[idx] = { ...attrs[idx], ...updates };
    updateEntity(entityId, { attributes: attrs });
  };

  const removeAttribute = (entityId: string, idx: number) => {
    const e = entities.find((ent) => ent.id === entityId);
    if (!e) return;
    const attrs = e.attributes.filter((_, i) => i !== idx);
    updateEntity(entityId, { attributes: attrs });
  };

  const addRel = () => {
    updateRels([
      ...relationships,
      {
        id: window.crypto.randomUUID(),
        from: "",
        to: "",
        type: "one-to-many",
        label: "",
      },
    ]);
  };

  const updateRel = (id: string, updates: Partial<ERDRelationship>) => {
    updateRels(relationships.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const removeRel = (id: string) => {
    updateRels(relationships.filter((r) => r.id !== id));
  };

  return {
    entities,
    relationships,
    addEntity,
    updateEntity,
    removeEntity,
    addAttribute,
    updateAttribute,
    removeAttribute,
    addRel,
    updateRel,
    removeRel,
  };
}
