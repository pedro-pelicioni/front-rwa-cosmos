import { get, set } from 'idb-keyval';

export async function getImageFromIDB(key: string): Promise<string | undefined> {
  return await get(key);
}

export async function setImageToIDB(key: string, value: string): Promise<void> {
  await set(key, value);
} 