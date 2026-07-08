/** Kiosk (fuar TV) modu — URL'de ?kiosk=1 varsa uygulama kilitli vitrin
 * moduna geçer: etkileşimli UI gizlenir, Sunum Modu otomatik başlar ve
 * kapatılırsa bekçi tarafından yeniden açılır. */

export function isKioskParam(search: string): boolean {
  const v = new URLSearchParams(search).get("kiosk");
  return v !== null && v !== "0" && v !== "false";
}

export const IS_KIOSK = typeof window !== "undefined" && isKioskParam(window.location.search);
