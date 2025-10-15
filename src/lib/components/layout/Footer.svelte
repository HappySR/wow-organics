<script lang="ts">
  import { Facebook, Instagram, Linkedin } from 'lucide-svelte';
</script>

<footer class="bg-primary-600 text-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-10">
      <!-- Company Info -->
      <div class="col-span-1 md:col-span-2">
        <div class="flex items-center space-x-2 mb-5">
          <div class="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center shadow-lg">
            <span class="text-gray-900 font-bold text-2xl">W!</span>
          </div>
          <span class="text-2xl font-bold">WOW! Organics</span>
        </div>
        <p class="text-gray-400 mb-6 leading-relaxed text-base">
          Providing the highest quality organic agricultural products and services. 
          Creating a sustainable future through innovative farming practices.
        </p>
        <div class="flex space-x-4">
          <a href="https://www.facebook.com/p/WOW-Organics-61565657220020/" target="_blank" rel="noopener noreferrer" class="p-3 text-gray-400 hover:text-white hover:bg-primary-600 rounded-lg transition-all">
            <Facebook size={22} />
          </a>
          <a href="https://www.instagram.com/woworganics2024/" target="_blank" rel="noopener noreferrer" class="p-3 text-gray-400 hover:text-white hover:bg-primary-600 rounded-lg transition-all">
            <Instagram size={22} />
          </a>
          <a href="https://www.linkedin.com/company/104429773/admin/dashboard/" target="_blank" rel="noopener noreferrer" class="p-3 text-gray-400 hover:text-white hover:bg-primary-600 rounded-lg transition-all">
            <Linkedin size={22} />
          </a>
        </div>
      </div>

      <!-- Quick Links -->
      <div>
        <h3 class="text-lg font-bold mb-5">Quick Links</h3>
        <ul class="space-y-3">
          <li><a href="/about" class="text-gray-400 hover:text-primary-400 transition-colors font-medium">About Us</a></li>
          <li><a href="/products" class="text-gray-400 hover:text-primary-400 transition-colors font-medium">Products</a></li>
          <li><a href="/projects" class="text-gray-400 hover:text-primary-400 transition-colors font-medium">Projects</a></li>
          <li><a href="/training" class="text-gray-400 hover:text-primary-400 transition-colors font-medium">Training</a></li>
          <li><a href="/gallery" class="text-gray-400 hover:text-primary-400 transition-colors font-medium">Gallery</a></li>
        </ul>
      </div>

      <!-- Contact Info -->
      <div>
        <h3 class="text-lg font-bold mb-5">Contact Us</h3>
        <ul class="space-y-3 text-gray-400">
          <li>
            <strong class="text-white">Roshan Raj Singh</strong><br/>
            <a href="tel:7002922754" class="hover:text-primary-400 transition-colors font-medium">7002922754</a>
          </li>
          <li>
            <strong class="text-white">Parthajit Talukdar</strong><br/>
            <a href="tel:8721909678" class="hover:text-primary-400 transition-colors font-medium">8721909678</a>
          </li>
          <li class="pt-2">
            <strong class="text-white">Location:</strong><br/>
            <span class="font-medium">Assam, India</span>
          </li>
        </ul>
      </div>
    </div>

    <div class="border-t border-gray-800 mt-10 pt-8 text-center text-gray-400">
      <p class="font-medium">&copy; {new Date().getFullYear()} WOW! Organics. All rights reserved.</p>
    </div>
  </div>
</footer>
