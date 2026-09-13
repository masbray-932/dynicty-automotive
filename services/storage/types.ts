export type StoredObject = {
  key: string;
  publicUrl: string;
};

export type PutObjectInput = {
  key: string;
  body: Uint8Array;
  contentType: string;
};

export interface StorageProvider {
  put(input: PutObjectInput): Promise<StoredObject>;
  delete(key: string): Promise<void>;
  publicUrl(key: string): string;
}
