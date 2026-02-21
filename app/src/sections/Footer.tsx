import { Github, Heart, Box } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative py-12 px-6 border-t-2 border-[#4a5b3a]">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0d1a0a]" />
      
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo - blocky */}
          <div className="flex items-center gap-3 font-minecraft">
            <div className="w-10 h-10 border-2 border-[#5a8c4a] bg-[#5a8c4a]/30 flex items-center justify-center">
              <Box className="w-5 h-5 text-[#7CBD6B]" />
            </div>
            <div>
              <p className="text-white font-semibold">Image-to-Minecraft</p>
              <p className="text-xs text-white/50">AI Blueprint Generator</p>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <a 
              href="#" 
              className="text-sm text-white/50 hover:text-white transition-colors duration-200"
            >
              Documentation
            </a>
            <a 
              href="#" 
              className="text-sm text-white/50 hover:text-white transition-colors duration-200"
            >
              API Reference
            </a>
            <a 
              href="#" 
              className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors duration-200"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
          </div>

          {/* Copyright */}
          <div className="flex items-center gap-1 text-sm text-white/40">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-400 fill-red-400" />
            <span>for Minecraft builders</span>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t-2 border-[#4a5b3a]/50 text-center">
          <p className="text-xs text-white/30">
            Not affiliated with Mojang Studios or Microsoft. Minecraft is a trademark of Mojang Studios.
          </p>
        </div>
      </div>
    </footer>
  );
}