<script lang="ts">
  import { Facebook, Instagram, Linkedin } from 'lucide-svelte';
</script>

<footer class="bg-gray-900 text-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
      <!-- Company Info -->
      <div class="col-span-1 md:col-span-2">
        <div class="flex items-center space-x-2 mb-4">
          <div class="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-xl">W!</span>
          </div>
          <span class="text-xl font-bold">WOW! Organics</span>
        </div>
        <p class="text-gray-400 mb-4">
          Providing the highest quality organic agricultural products and services. 
          Creating a sustainable future through innovative farming practices.
        </p>
        <div class="flex space-x-4">
          <a href="https://www.facebook.com/p/WOW-Organics-61565657220020/" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-white transition-colors">
            <Facebook size={20} />
          </a>
          <a href="https://www.instagram.com/woworganics2024/" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-white transition-colors">
            <Instagram size={20} />
          </a>
          <a href="https://www.linkedin.com/company/104429773/admin/dashboard/" target="_blank" rel="noopener noreferrer" class="text-gray-400 hover:text-white transition-colors">
            <Linkedin size={20} />
          </a>
        </div>
      </div>

      <!-- Quick Links -->
      <div>
        <h3 class="text-lg font-semibold mb-4">Quick Links</h3>
        <ul class="space-y-2">
          <li><a href="/about" class="text-gray-400 hover:text-white transition-colors">About Us</a></li>
          <li><a href="/products" class="text-gray-400 hover:text-white transition-colors">Products</a></li>
          <li><a href="/projects" class="text-gray-400 hover:text-white transition-colors">Projects</a></li>
          <li><a href="/training" class="text-gray-400 hover:text-white transition-colors">Training</a></li>
          <li><a href="/gallery" class="text-gray-400 hover:text-white transition-colors">Gallery</a></li>
        </ul>
      </div>

      <!-- Contact Info -->
      <div>
        <h3 class="text-lg font-semibold mb-4">Contact Us</h3>
        <ul class="space-y-2 text-gray-400">
          <li>
            <strong>Roshan Raj Singh</strong><br/>
            <a href="tel:7002922754" class="hover:text-white transition-colors">7002922754</a>
          </li>
          <li>
            <strong>Parthajit Talukdar</strong><br/>
            <a href="tel:8721909678" class="hover:text-white transition-colors">8721909678</a>
          </li>
          <li class="pt-2">
            <strong>Location:</strong><br/>
            Assam, India
          </li>
        </ul>
      </div>
    </div>

    <div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
      <p>&copy; {new Date().getFullYear()} WOW! Organics. All rights reserved.</p>
    </div>
  </div>
</footer>
