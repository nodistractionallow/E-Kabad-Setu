/**
 * Utility to generate the official Vercel tracking URL for any E-Waste lot.
 * Domain: https://e-kabad-setu.vercel.app
 */

export const VERCEL_DOMAIN = 'e-kabad-setu.vercel.app';
export const VERCEL_BASE_URL = `https://${VERCEL_DOMAIN}`;

export function getTrackingUrl(lotId: string): string {
  const cleanLotId = encodeURIComponent((lotId || '').trim());
  return `${VERCEL_BASE_URL}/?orderId=${cleanLotId}&view=order_status`;
}

// Aliases for compatibility
export const getLiveTrackingUrl = getTrackingUrl;
export const getVercelTrackingUrl = getTrackingUrl;
export const getLiveAppOrigin = () => VERCEL_BASE_URL;
