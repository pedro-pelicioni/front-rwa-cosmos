// Cache em memória para imagens de RWA
const imageMemoryCache = new Map<string, string>();

export function getImageFromMemoryCache(key: string): string | undefined {
  return imageMemoryCache.get(key);
}

export function setImageInMemoryCache(key: string, data: string) {
  imageMemoryCache.set(key, data);
} 