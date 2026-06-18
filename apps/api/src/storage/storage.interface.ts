export interface StoredObject {
  path: string;
  url: string;
}

// Storage adapter contract. Local disk adapter ships with the MVP; an
// S3-compatible adapter can be added behind the same interface later.
export interface StorageAdapter {
  put(buffer: Buffer, relativePath: string): Promise<StoredObject>;
  delete(relativePath: string): Promise<void>;
  resolveUrl(relativePath: string): string;
}

export const STORAGE_ADAPTER = Symbol("STORAGE_ADAPTER");
