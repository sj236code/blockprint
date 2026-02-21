import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ArrowRight, Sparkles } from 'lucide-react';

export function Hero() {
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const scrollToUpload = () => {
    const uploadSection = document.getElementById('upload-section');
    if (uploadSection) {
      uploadSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section 
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Dark gradient - matches site dark theme */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d1a0a] via-[#1a2d12] to-[#0d1a0a]" />
      
      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Badge - blocky */}
        <div 
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 mb-8 font-minecraft',
            'bg-[#5a7c4a]/90 border-2 border-[#4a6b3a]',
            'transition-all duration-700 ease-out',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          <Sparkles className="w-4 h-4 text-[#7CBD6B]" />
          <span className="text-sm text-white">AI-Powered Minecraft Builder</span>
        </div>

        {/* Title - blocky Minecraft style */}
        <h1 
          className={cn(
            'text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-minecraft mb-6',
            'leading-tight tracking-tight text-white drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]',
            'transition-all duration-700 delay-150 ease-out',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          Turn Drawings into{' '}
          <span className="relative inline-block">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7CBD6B] via-[#5a8c4a] to-[#57C2C5]">
              Minecraft Worlds
            </span>
            <span 
              className={cn(
                'absolute -bottom-2 left-0 h-2 bg-[#5a8c4a] border-b-2 border-[#4a6b3a]',
                'transition-all duration-1000 delay-500 ease-out',
                isVisible ? 'w-full' : 'w-0'
              )}
            />
          </span>
        </h1>

        {/* Subtitle */}
        <p 
          className={cn(
            'text-lg sm:text-xl text-white/90 mb-10 max-w-2xl mx-auto drop-shadow-md',
            'transition-all duration-700 delay-300 ease-out',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          Upload a building sketch and watch AI transform it into a live Minecraft structure. 
          From paper to pixels in seconds.
        </p>

        {/* CTA Buttons - Minecraft style */}
        <div 
          className={cn(
            'flex flex-col sm:flex-row items-center justify-center gap-4',
            'transition-all duration-700 delay-450 ease-out',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          <button
            onClick={scrollToUpload}
            className={cn(
              'group relative px-8 py-4 font-medium font-minecraft text-white',
              'bg-[#7CBD6B] border-2 border-b-4 border-[#5a8c4a]',
              'hover:bg-[#8bc46b] hover:border-[#6b9c5a] active:border-b-2 active:translate-y-0.5',
              'transition-all duration-200 ease-out'
            )}
          >
            <span className="flex items-center gap-2">
              Start Building
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </button>

          <button
            onClick={scrollToUpload}
            className={cn(
              'px-8 py-4 font-medium font-minecraft text-white',
              'bg-[#8B6914] border-2 border-b-4 border-[#6B4E0A]',
              'hover:bg-[#9a7a1a] hover:border-[#7a5c12] active:border-b-2 active:translate-y-0.5',
              'transition-all duration-200 ease-out'
            )}
          >
            See How It Works
          </button>
        </div>

      </div>

      {/* Scroll indicator - blocky */}
      <div 
        className={cn(
          'absolute bottom-8 left-1/2 -translate-x-1/2',
          'transition-all duration-700 delay-700 ease-out',
          isVisible ? 'opacity-100' : 'opacity-0'
        )}
      >
        <div className="w-6 h-10 border-2 border-[#5a8c4a] bg-[#5a8c4a]/30 flex items-start justify-center p-2">
          <div 
            className="w-2 h-2 bg-[#7CBD6B]"
            style={{
              animation: 'bounce 1.5s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(12px); }
        }
      `}</style>
    </section>
  );
}