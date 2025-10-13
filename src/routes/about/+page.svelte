<script lang="ts">
  import { Target, Eye, Heart, Users } from 'lucide-svelte';
  import Card from '$lib/components/ui/Card.svelte';
</script>

<svelte:head>
  <title>About Us - WOW! Organics</title>
</svelte:head>

<div class="bg-gray-50">
  <!-- Hero Section -->
  <section class="bg-primary-600 text-white py-20">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h1 class="text-4xl md:text-5xl font-bold mb-6">About WOW! Organics</h1>
      <p class="text-xl text-primary-100">
        Transforming agriculture through innovation and sustainability
      </p>
    </div>
  </section>

  <!-- About Content -->
  <section class="py-16">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <Card>
        <div class="prose max-w-none">
          <p class="text-lg text-gray-700 leading-relaxed mb-6">
            WOW! Organics is a dynamic partnership firm established in 2024, located in the vibrant state of Assam, India. 
            Our firm was founded with a clear mission: to provide people and farmers with the highest quality organic 
            agricultural products and services.
          </p>

          <p class="text-lg text-gray-700 leading-relaxed mb-6">
            Our goal is to benefit the market and create a new agricultural ecosystem that enhances and diversifies farming 
            practices. By integrating both conventional and unconventional methods of farming, we aim to help farmers earn 
            a better livelihood and establish new connections within the market.
          </p>

          <p class="text-lg text-gray-700 leading-relaxed">
            Our company prides itself on serving the community with top-tier agricultural products, ensuring that the 
            produce we offer is both sustainable and beneficial for consumers and the environment. We are dedicated to 
            fostering innovation in the agricultural industry by bringing fresh, new minds into the field, promoting 
            cutting-edge practices, and encouraging sustainable farming techniques.
          </p>
        </div>
      </Card>
    </div>
  </section>

  <!-- Mission & Vision -->
  <section class="py-16 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <div class="text-center">
            <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target size={32} class="text-primary-600" />
            </div>
            <h2 class="text-2xl font-bold text-gray-900 mb-4">Our Purpose</h2>
            <p class="text-gray-700">
              To revolutionize agriculture by providing innovative soilless farming solutions that are sustainable, 
              efficient, and accessible to farmers of all scales.
            </p>
          </div>
        </Card>

        <Card>
          <div class="text-center">
            <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye size={32} class="text-primary-600" />
            </div>
            <h2 class="text-2xl font-bold text-gray-900 mb-4">Our Goals</h2>
            <p class="text-gray-700">
              To establish WOW! Organics as the leading provider of organic farming solutions in Assam and expand 
              our reach across India, empowering farmers with cutting-edge technology.
            </p>
          </div>
        </Card>
      </div>
    </div>
  </section>

  <!-- Objectives -->
  <section class="py-16">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 class="text-3xl font-bold text-gray-900 text-center mb-12">Our Objectives</h2>
      
      <div class="space-y-6">
        <Card hover>
          <div class="flex items-start space-x-4">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <span class="text-primary-600 font-bold text-xl">1</span>
              </div>
            </div>
            <div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">Market Innovation</h3>
              <p class="text-gray-700">
                Create a new agricultural ecosystem that enhances and diversifies farming practices across Assam.
              </p>
            </div>
          </div>
        </Card>

        <Card hover>
          <div class="flex items-start space-x-4">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <span class="text-primary-600 font-bold text-xl">2</span>
              </div>
            </div>
            <div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">Farmer Empowerment</h3>
              <p class="text-gray-700">
                Provide resources, knowledge, and support to help farmers earn better livelihoods and succeed 
                in modern agriculture.
              </p>
            </div>
          </div>
        </Card>

        <Card hover>
          <div class="flex items-start space-x-4">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <span class="text-primary-600 font-bold text-xl">3</span>
              </div>
            </div>
            <div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">Sustainable Practices</h3>
              <p class="text-gray-700">
                Promote and implement cutting-edge sustainable farming techniques that benefit both producers and consumers.
              </p>
            </div>
          </div>
        </Card>

        <Card hover>
          <div class="flex items-start space-x-4">
            <div class="flex-shrink-0">
              <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <span class="text-primary-600 font-bold text-xl">4</span>
              </div>
            </div>
            <div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">Education & Outreach</h3>
              <p class="text-gray-700">
                Conduct training programs, workshops, and awareness campaigns about the benefits of organic agriculture.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </section>

  <!-- Team -->
  <section class="py-16 bg-white">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 class="text-3xl font-bold text-gray-900 text-center mb-12">Our Partners</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <div class="text-center">
            <div class="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={48} class="text-primary-600" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Roshan Raj Singh</h3>
            <p class="text-primary-600 mb-2">Co-Founder & Partner</p>
            <a href="tel:7002922754" class="text-gray-700 hover:text-primary-600">
              7002922754
            </a>
          </div>
        </Card>

        <Card>
          <div class="text-center">
            <div class="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={48} class="text-primary-600" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Parthajit Talukdar</h3>
            <p class="text-primary-600 mb-2">Co-Founder & Partner</p>
            <a href="tel:8721909678" class="text-gray-700 hover:text-primary-600">
              8721909678
            </a>
          </div>
        </Card>
      </div>
    </div>
  </section>

  <!-- Values -->
  <section class="py-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 class="text-3xl font-bold text-gray-900 text-center mb-12">Our Core Values</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card>
          <div class="text-center">
            <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart size={32} class="text-primary-600" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Sustainability</h3>
            <p class="text-gray-700">
              Committed to environmentally friendly practices that preserve our planet for future generations.
            </p>
          </div>
        </Card>

        <Card>
          <div class="text-center">
            <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target size={32} class="text-primary-600" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Innovation</h3>
            <p class="text-gray-700">
              Constantly evolving with cutting-edge technology and farming methods to serve our community better.
            </p>
          </div>
        </Card>

        <Card>
          <div class="text-center">
            <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={32} class="text-primary-600" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Community</h3>
            <p class="text-gray-700">
              Working closely with farmers and consumers to build a stronger, more connected agricultural network.
            </p>
          </div>
        </Card>
      </div>
    </div>
  </section>
</div>
