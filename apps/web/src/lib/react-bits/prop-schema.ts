export type ReactBitsPropFieldType = "text" | "number" | "boolean" | "select" | "color" | "colors";

export interface ReactBitsPropField {
  key: string;
  label: string;
  type: ReactBitsPropFieldType;
  options?: { label: string; value: string }[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}
