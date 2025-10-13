import { supabase } from './supabase';

interface Settings {
  site_name: string;
  site_email: string;
  site_phone: string;
  gst_percentage: number;
  default_transport_charges: number;
  razorpay_enabled: boolean;
  cod_enabled: boolean;
}

let cachedSettings: Settings | null = null;
let lastFetch: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getSettings(): Promise<Settings> {
  const now = Date.now();
  
  // Return cached settings if still valid
  if (cachedSettings && (now - lastFetch) < CACHE_DURATION) {
    return cachedSettings;
  }

  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*');

    if (error) throw error;

    // Convert array to object
    const settings: any = {};
    data?.forEach((setting) => {
      settings[setting.key] = setting.value;
    });

    cachedSettings = settings as Settings;
    lastFetch = now;
    
    return cachedSettings;
  } catch (error) {
    console.error('Error loading settings:', error);
    
    // Return defaults if fetch fails
    return {
      site_name: 'WOW! Organics',
      site_email: 'contact@woworganics.com',
      site_phone: '+91 1234567890',
      gst_percentage: 18,
      default_transport_charges: 50,
      razorpay_enabled: true,
      cod_enabled: true
    };
  }
}

// Helper to clear cache (call after updating settings)
export function clearSettingsCache() {
  cachedSettings = null;
  lastFetch = 0;
}
