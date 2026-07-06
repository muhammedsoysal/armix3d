/** Genişleyen enerji küresi yarıçapı: cubic ease-out — dalga hızlı fırlar,
 * kenarlara yaklaşırken yavaşlar (sinematik "wash" hissi). Saf, test edilir. */
export function revealRadiusAt(t: number, duration: number, maxRadius: number): number {
  const u = Math.min(Math.max(t / duration, 0), 1);
  const eased = 1 - Math.pow(1 - u, 3);
  return eased * maxRadius;
}
