<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/utils/supabase';
  import { toast } from '$lib/stores/toast.svelte';
  import { auth } from '$lib/stores/auth.svelte';
  import { goto } from '$app/navigation';
  import Card from '$lib/components/ui/Card.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { Settings as SettingsIcon, Save, Building, DollarSign, CreditCard, RefreshCw } from 'lucide-svelte';

  interface SettingRecord {
    id: string;
    key: string;
    value: any;
  }

  interface AppSettings {
    site_name: string;
    site_email: string;
    site_phone: string;
    gst_percentage: number;
    default_transport_charges: number;
    razorpay_enabled: boolean;
    cod_enabled: boolean;
  }

  let settings = $state<AppSettings>({
    site_name: 'WOW! Organics',
    site_email: 'contact@woworganics.com',
    site_phone: '+91 1234567890',
    gst_percentage: 18,
    default_transport_charges: 50,
    razorpay_enabled: true,
    cod_enabled: true
  });

  let loading = $state(true);
  let saving = $state(false);
  let checkingAuth = $state(true);

  onMount(async () => {
    // Wait for auth to initialize
    let attempts = 0;
    while (auth.loading && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    // Check if user is admin
    if (!auth.isAuthenticated || !auth.isAdmin) {
      toast.error('You need admin access to manage settings');
      goto('/');
      return;
    }

    checkingAuth = false;
    await loadSettings();
  });

  async function loadSettings() {
    loading = true;
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*');

      if (error) throw error;

      // Map settings array to object
      if (data) {
        data.forEach((setting: SettingRecord) => {
          const key = setting.key as keyof AppSettings;
          const value = setting.value;
          
          // Handle different value types from JSONB
          if (key in settings) {
            if (typeof settings[key] === 'string') {
              (settings as any)[key] = String(value);
            } else if (typeof settings[key] === 'number') {
              (settings as any)[key] = Number(value);
            } else if (typeof settings[key] === 'boolean') {
              (settings as any)[key] = Boolean(value);
            }
          }
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      loading = false;
    }
  }

  async function saveSettings() {
    if (!auth.isAdmin) {
      toast.error('Only admins can save settings');
      return;
    }

    saving = true;
    try {
      // Update each setting
      const updates = Object.entries(settings).map(async ([key, value]) => {
        const { error } = await supabase
          .from('settings')
          .update({ 
            value: value,
            updated_by: auth.user?.id 
          })
          .eq('key', key);

        if (error) throw error;
      });

      await Promise.all(updates);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      saving = false;
    }
  }

  async function resetSettings() {
    if (!confirm('Are you sure you want to reset all settings to their default values?')) {
      return;
    }

    settings = {
      site_name: 'WOW! Organics',
      site_email: 'contact@woworganics.com',
      site_phone: '+91 1234567890',
      gst_percentage: 18,
      default_transport_charges: 50,
      razorpay_enabled: true,
      cod_enabled: true
    };

    toast.info('Settings reset to defaults. Click Save to apply changes.');
  }
</script>

<svelte:head>
  <title>Settings - Admin</title>
</svelte:head>

<div class="p-4 md:p-8 space-y-6">
  <!-- Header -->
  <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div>
      <h1 class="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
        <SettingsIcon class="text-primary-600" size={32} />
        Settings
      </h1>
      <p class="text-gray-600 mt-2">Manage your application settings and preferences</p>
    </div>
    <Button
      variant="secondary"
      onclick={loadSettings}
      disabled={loading}
    >
      <RefreshCw size={18} class={loading ? 'animate-spin' : ''} />
    </Button>
  </div>

  {#if checkingAuth || loading}
    <div class="max-w-4xl space-y-6">
      <Card class="border-0 shadow-lg">
        <div class="animate-pulse space-y-6">
          <div class="h-8 bg-gray-200 rounded w-1/3"></div>
          <div class="h-48 bg-gray-200 rounded"></div>
        </div>
      </Card>
    </div>
  {:else}
    <div class="max-w-4xl space-y-6">
      <!-- General Settings -->
      <Card class="border-0 shadow-lg">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Building size={24} class="text-white" />
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-900">General Settings</h2>
            <p class="text-sm text-gray-600">Basic information about your store</p>
          </div>
        </div>
        
        <div class="space-y-5">
          <div>
            <label for="site-name" class="block text-sm font-semibold text-gray-700 mb-2">
              Site Name <span class="text-red-500">*</span>
            </label>
            <Input
              id="site-name"
              bind:value={settings.site_name}
              placeholder="Enter site name"
              class="w-full"
              required
            />
          </div>
          
          <div>
            <label for="contact-email" class="block text-sm font-semibold text-gray-700 mb-2">
              Contact Email <span class="text-red-500">*</span>
            </label>
            <Input
              id="contact-email"
              type="email"
              bind:value={settings.site_email}
              placeholder="contact@example.com"
              class="w-full"
              required
            />
          </div>
          
          <div>
            <label for="contact-phone" class="block text-sm font-semibold text-gray-700 mb-2">
              Contact Phone <span class="text-red-500">*</span>
            </label>
            <Input
              id="contact-phone"
              type="tel"
              bind:value={settings.site_phone}
              placeholder="+91 1234567890"
              class="w-full"
              required
            />
          </div>
        </div>
      </Card>

      <!-- Pricing Settings -->
      <Card class="border-0 shadow-lg">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
            <DollarSign size={24} class="text-white" />
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-900">Pricing Settings</h2>
            <p class="text-sm text-gray-600">Configure default pricing and charges</p>
          </div>
        </div>
        
        <div class="space-y-5">
          <div>
            <label for="gst-percentage" class="block text-sm font-semibold text-gray-700 mb-2">
              Default GST Percentage (%)
            </label>
            <Input
              id="gst-percentage"
              type="number"
              bind:value={settings.gst_percentage}
              placeholder="18"
              min={0}
              max={100}
              step={0.01}
              class="w-full"
            />
            <p class="mt-2 text-xs text-gray-600">GST will be applied to all products by default</p>
          </div>
          
          <div>
            <label for="shipping-charges" class="block text-sm font-semibold text-gray-700 mb-2">
              Default Transport Charges (₹)
            </label>
            <Input
              id="shipping-charges"
              type="number"
              bind:value={settings.default_transport_charges}
              placeholder="50"
              min={0}
              step={0.01}
              class="w-full"
            />
            <p class="mt-2 text-xs text-gray-600">Standard shipping charge for orders</p>
          </div>
        </div>
      </Card>

      <!-- Payment Settings -->
      <Card class="border-0 shadow-lg">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <CreditCard size={24} class="text-white" />
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-900">Payment Settings</h2>
            <p class="text-sm text-gray-600">Configure payment methods</p>
          </div>
        </div>
        
        <div class="space-y-5">
          <label class="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-white rounded-xl border-2 border-blue-100 hover:border-blue-300 transition-all cursor-pointer group">
            <input
              type="checkbox"
              bind:checked={settings.razorpay_enabled}
              class="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 mt-0.5 flex-shrink-0"
            />
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <p class="font-semibold text-gray-900">Enable Razorpay Payments</p>
                <span class="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">Online</span>
              </div>
              <p class="text-sm text-gray-600">Accept online payments through Razorpay gateway (Credit/Debit Cards, UPI, Net Banking)</p>
            </div>
          </label>

          <label class="flex items-start gap-4 p-4 bg-gradient-to-r from-emerald-50 to-white rounded-xl border-2 border-emerald-100 hover:border-emerald-300 transition-all cursor-pointer group">
            <input
              type="checkbox"
              bind:checked={settings.cod_enabled}
              class="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 mt-0.5 flex-shrink-0"
            />
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <p class="font-semibold text-gray-900">Enable Cash on Delivery</p>
                <span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">COD</span>
              </div>
              <p class="text-sm text-gray-600">Allow customers to pay when the order is delivered to their doorstep</p>
            </div>
          </label>
        </div>
      </Card>

      <!-- Save Button -->
      <div class="flex justify-end gap-3 pt-4">
        <Button
          variant="secondary"
          onclick={resetSettings}
          class="px-6"
          disabled={saving}
        >
          Reset to Defaults
        </Button>
        <Button
          onclick={saveSettings}
          disabled={saving}
          size="lg"
          class="px-8 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800"
        >
          {#if saving}
            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Saving...
          {:else}
            <Save size={20} class="mr-2" />
            Save Settings
          {/if}
        </Button>
      </div>
    </div>
  {/if}
</div>
