<script lang="ts">
  import { MapPin, Phone, Mail, Clock, Send, Instagram, Facebook, Linkedin } from 'lucide-svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import { toast } from '$lib/stores/toast.svelte';

  let formData = $state({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  let loading = $state(false);

  async function handleSubmit() {
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    loading = true;
    try {
      // Here you would send the form data to your backend
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Message sent successfully! We will get back to you soon.');
      
      // Reset form
      formData = {
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      };
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Contact Us - WOW! Organics</title>
</svelte:head>

<div class="bg-gradient-to-b from-gray-50 to-white min-h-screen py-12">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="text-center mb-12">
      <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Get In Touch</h1>
      <p class="text-xl text-gray-600 max-w-2xl mx-auto">
        Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
      <!-- Contact Information Cards -->
      <div class="lg:col-span-1 space-y-6">
        <!-- Partners Info -->
        <Card class="bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
          <div class="p-6">
            <h3 class="text-xl font-bold text-gray-900 mb-4">Our Partners</h3>
            <div class="space-y-4">
              <div class="flex items-start space-x-3">
                <div class="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone size={20} class="text-white" />
                </div>
                <div>
                  <p class="font-semibold text-gray-900">Roshan Raj Singh</p>
                  <a href="tel:7002922754" class="text-primary-700 hover:text-primary-800 font-medium">
                    7002922754
                  </a>
                </div>
              </div>
              <div class="flex items-start space-x-3">
                <div class="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone size={20} class="text-white" />
                </div>
                <div>
                  <p class="font-semibold text-gray-900">Parthajit Talukdar</p>
                  <a href="tel:8721909678" class="text-primary-700 hover:text-primary-800 font-medium">
                    8721909678
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <!-- Location -->
        <Card class="hover:shadow-lg transition-shadow">
          <div class="p-6">
            <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <MapPin size={24} class="text-primary-600" />
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Our Location</h3>
            <p class="text-gray-600">
              Bongaigaon, Assam<br />
              India
            </p>
          </div>
        </Card>

        <!-- Email -->
        <Card class="hover:shadow-lg transition-shadow">
          <div class="p-6">
            <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <Mail size={24} class="text-primary-600" />
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Email Us</h3>
            <a href="mailto:info@woworganics.com" class="text-primary-600 hover:text-primary-700 font-medium">
              info@woworganics.com
            </a>
          </div>
        </Card>

        <!-- Business Hours -->
        <Card class="hover:shadow-lg transition-shadow">
          <div class="p-6">
            <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <Clock size={24} class="text-primary-600" />
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Business Hours</h3>
            <div class="space-y-1 text-gray-600">
              <p>Monday - Saturday: 9:00 AM - 6:00 PM</p>
              <p>Sunday: Closed</p>
            </div>
          </div>
        </Card>

        <!-- Social Media -->
        <Card class="bg-gradient-to-br from-primary-600 to-primary-700 text-white hover:shadow-lg transition-shadow">
          <div class="p-6">
            <h3 class="text-lg font-bold mb-4">Connect With Us</h3>
            <div class="flex space-x-4">
              <a 
                href="https://www.instagram.com/woworganics2024/" 
                target="_blank"
                rel="noopener noreferrer"
                class="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <Instagram size={20} />
              </a>
              <a 
                href="https://www.facebook.com/p/WOW-Organics-61565657220020/" 
                target="_blank"
                rel="noopener noreferrer"
                class="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <Facebook size={20} />
              </a>
              <a 
                href="https://www.linkedin.com/company/104429773/admin/dashboard/" 
                target="_blank"
                rel="noopener noreferrer"
                class="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <Linkedin size={20} />
              </a>
            </div>
          </div>
        </Card>
      </div>

      <!-- Contact Form -->
      <div class="lg:col-span-2">
        <Card class="shadow-xl">
          <div class="p-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h2>
            
            <form 
              action="https://formsubmit.co/woworganics2024@gmail.com" 
              method="POST" 
              onsubmit={handleSubmit} 
              class="space-y-6"
            >
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  type="text"
                  label="Your Name"
                  bind:value={formData.name}
                  placeholder="John Doe"
                  required
                />
                <Input
                  type="email"
                  label="Email Address"
                  bind:value={formData.email}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  type="tel"
                  label="Phone Number"
                  bind:value={formData.phone}
                  placeholder="9876543210"
                />
                <Input
                  type="text"
                  label="Subject"
                  bind:value={formData.subject}
                  placeholder="How can we help?"
                />
              </div>

              <div>
                <label for="message" class="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  bind:value={formData.message}
                  rows="6"
                  required
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                  placeholder="Tell us more about your requirements..."
                ></textarea>
              </div>

              <Button
                type="submit"
                size="lg"
                fullWidth
                loading={loading}
                class="shadow-lg hover:shadow-xl transition-shadow"
              >
                <Send size={20} class="mr-2" />
                Send Message
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>

    <!-- Map Section (Optional - you can embed Google Maps here) -->
    <Card class="overflow-hidden">
      <div class="aspect-video bg-gray-100 flex items-center justify-center">
        <div class="text-center p-8">
          <MapPin size={48} class="text-gray-400 mx-auto mb-4" />
          <p class="text-gray-600 font-medium">Map Integration Coming Soon</p>
          <p class="text-sm text-gray-500 mt-2">We're located in Bongaigaon, Assam, India</p>
        </div>
      </div>
    </Card>
  </div>
</div>
