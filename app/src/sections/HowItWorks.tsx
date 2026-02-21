import { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  Upload, 
  Brain, 
  ShieldCheck, 
  Hammer,
  ArrowRight
} from 'lucide-react';

const steps = [
  {
    icon: Upload,
    title: 'Upload',
    description: 'Draw a building outline on paper and upload it as a PNG or JPG image.',
    color: 'from-blue-500/20 to-cyan-500/20',
    iconColor: 'text-blue-400',
  },
  {
    icon: Brain,
    title: 'AI Analysis',
    description: 'Our vision AI analyzes your drawing and extracts structural blueprint data.',
    color: 'from-purple-500/20 to-pink-500/20',
    iconColor: 'text-purple-400',
  },
  {
    icon: ShieldCheck,
    title: 'Validation',
    description: 'The backend validates and optimizes the blueprint for Minecraft compatibility.',
    color: 'from-amber-500/20 to-orange-500/20',
    iconColor: 'text-amber-400',
  },
  {
    icon: Hammer,
    title: 'Live Build',
    description: 'RCON commands construct your building block by block in real-time.',
    color: 'from-green-500/20 to-emerald-500/20',
    iconColor: 'text-green-400',
  },
];

export function HowItWorks() {
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Animate steps sequentially
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setActiveStep(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <section 
      ref={sectionRef}
      className="relative py-24 px-6"
    >
      {/* Background - underground/cave gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d1a0a] via-[#1a2d12] to-[#0d1a0a] block-pattern" />
      
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section Header */}
        <div 
          className={cn(
            'text-center mb-16',
            'transition-all duration-700 ease-out',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-minecraft">
            How It Works
          </h2>
          <p className="text-white/60 max-w-lg mx-auto">
            From a simple sketch to a fully-built Minecraft structure in four easy steps.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection line - Minecraft block line */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-1 bg-[#1a2d12] border-y border-[#4a5b3a]">
            <div 
              className="h-full bg-[#7CBD6B] transition-all duration-1000 ease-out"
              style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
            />
          </div>

          {/* Steps grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index <= activeStep;
              
              return (
                <div
                  key={index}
                  className={cn(
                    'relative text-center',
                    'transition-all duration-500 ease-out',
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
                    { 'transition-delay': `${index * 100}ms` }
                  )}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  {/* Icon - blocky */}
                  <div 
                    className={cn(
                      'relative w-20 h-20 mx-auto mb-6 flex items-center justify-center border-2 transition-all duration-500',
                      isActive 
                        ? 'border-[#7CBD6B] bg-[#5a8c4a]/30 scale-100' 
                        : 'border-[#4a5b3a] bg-[#0d1a0a]/60 scale-95 opacity-50'
                    )}
                  >
                    <div className={cn(
                      'absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none',
                      step.color
                    )} />
                    
                    <Icon className={cn(
                      'relative z-10 w-8 h-8 transition-colors duration-500',
                      isActive ? step.iconColor : 'text-white/30'
                    )} />
                    
                    {/* Step number - blocky */}
                    <div className={cn(
                      'absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center text-xs font-bold font-minecraft border border-[#4a5b3a]',
                      'transition-all duration-500',
                      isActive 
                        ? 'bg-[#7CBD6B] text-[#0d1a0a]' 
                        : 'bg-[#1a2d12] text-white/30'
                    )}>
                      {index + 1}
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className={cn(
                    'text-lg font-semibold mb-2 transition-colors duration-500',
                    isActive ? 'text-white' : 'text-white/30'
                  )}>
                    {step.title}
                  </h3>
                  <p className={cn(
                    'text-sm leading-relaxed transition-colors duration-500',
                    isActive ? 'text-white/60' : 'text-white/20'
                  )}>
                    {step.description}
                  </p>

                  {/* Mobile arrow */}
                  {index < steps.length - 1 && (
                    <div className="lg:hidden flex justify-center mt-4">
                      <ArrowRight className={cn(
                        'w-5 h-5 rotate-90 transition-colors duration-500',
                        isActive ? 'text-white/30' : 'text-white/10'
                      )} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tech stack - blocky */}
        <div 
          className={cn(
            'mt-20 p-6 border-2 border-[#4a5b3a] font-minecraft',
            'bg-[#0d1a0a]/80',
            'transition-all duration-700 delay-500 ease-out',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          <h3 className="text-center text-sm font-medium text-white/50 uppercase tracking-wider mb-6">
            Powered By
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {['React', 'FastAPI', 'OpenAI Vision', 'RCON', 'Minecraft Java'].map((tech) => (
              <div 
                key={tech}
                className="px-4 py-2 border-2 border-[#5a6b4a] bg-[#1a2d12]/80 text-sm text-white/80"
              >
                {tech}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
