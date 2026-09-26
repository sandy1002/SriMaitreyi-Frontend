/** Dialysis app login — `/login` when merged locally; override for production marketing site. */
export const DIALYSIS_APP_LOGIN_URL =
  import.meta.env.VITE_DIALYSIS_APP_LOGIN_URL?.trim() || '/login';

export function isExternalLoginUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

export function resolveDialysisLoginHref(url = DIALYSIS_APP_LOGIN_URL): string {
  if (url.includes('srimaitreyi.com/login')) return DIALYSIS_APP_LOGIN_URL;
  return url;
}
