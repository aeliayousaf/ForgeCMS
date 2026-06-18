import type { ComponentType, ReactNode } from "react";
import type { ZodType, ZodTypeDef } from "zod";
import type { BlockType } from "@forgecms/shared";

export type EditorFieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "number"
  | "boolean"
  | "select"
  | "color"
  | "image"
  | "list";

export interface EditorField {
  key: string;
  label: string;
  type: EditorFieldType;
  options?: { label: string; value: string }[];
  placeholder?: string;
  // For "list" fields: schema of each item's editable fields.
  itemFields?: EditorField[];
}

export interface BlockRenderProps<P = Record<string, unknown>> {
  props: P;
  className?: string;
  style?: Record<string, string>;
  children?: ReactNode;
}

export interface BlockDefinition<P = Record<string, unknown>> {
  type: BlockType;
  label: string;
  category: "layout" | "content" | "media" | "forms" | "marketing" | "advanced";
  icon: string;
  // Input type is widened so blocks can use Zod defaults (optional input,
  // required output) while keeping a precise output type P.
  schema: ZodType<P, ZodTypeDef, unknown>;
  defaultProps: P;
  editorFields: EditorField[];
  component: ComponentType<BlockRenderProps<P>>;
}
