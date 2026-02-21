import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  delay?: number;
  className?: string;
}

export function StatsCard({ icon, label, value, unit, delay = 0, className }: StatsCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Animate number counting
  useEffect(() => {
    const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
    if (isNaN(numericValue)) return;

    const duration = 1000;
    const startTime = performance.now();
    const startDelay = delay;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime - startDelay;
      
      if (elapsed < 0) {
        requestAnimationFrame(animate);
        return;
      }

      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      
      setDisplayValue(Math.round(numericValue * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, delay]);

  // Intersection observer for reveal animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  const isNumeric = typeof value === 'number' || !isNaN(parseFloat(value as string));

  return (
    <div
      ref={cardRef}
      className={cn(
        'relative p-4 border-2 border-[#4a5b3a] font-minecraft',
        'bg-[#1a2d12]/80',
        'transition-all duration-500 ease-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        className
      )}
    >
      <div className="relative flex items-start gap-3">
        <div className="w-10 h-10 border-2 border-[#5a6b4a] bg-[#0d1a0a]/80 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white/50 uppercase tracking-wider mb-1">
            {label}
          </p>
          <p className="text-xl font-semibold text-white truncate">
            {isNumeric ? displayValue : value}
            {unit && <span className="text-sm text-white/50 ml-1">{unit}</span>}
          </p>
        </div>
      </div>
    </div>
  );
}