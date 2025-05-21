import Cookies from 'js-cookie';
import CryptoJS from 'crypto-js';

const SECRET = 'sua-chave-secreta'; // Troque por uma chave forte

export function setImageCookie(key: string, data: string) {
  // Criptografa
  const encrypted = CryptoJS.AES.encrypt(data, SECRET).toString();
  Cookies.set(key, encrypted, { expires: 7 }); // 7 dias
}

export function getImageCookie(key: string): string | undefined {
  const encrypted = Cookies.get(key);
  if (!encrypted) return undefined;
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, SECRET);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return undefined;
  }
} 