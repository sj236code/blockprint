import { cn } from '@/lib/utils';
import type { StylePreset } from '@/types';

interface StylePresetsProps {
  selectedStyle: StylePreset;
  onStyleChange: (style: StylePreset) => void;
}

const styles: { id: StylePreset; name: string; description: string; gradient: string }[] = [
  {
    id: 'ghibli',
    name: 'Ghibli',
    description: 'Whimsical, cozy cottages with warm colors',
    gradient: 'from-amber-400/30 to-orange-500/30',
  },
  {
    id: 'medieval',
    name: 'Medieval',
    description: 'Stone castles and fortified structures',
    gradient: 'from-slate-400/30 to-gray-600/30',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean lines and contemporary design',
    gradient: 'from-cyan-400/30 to-blue-500/30',
  },
  {
    id: 'fantasy',
    name: 'Fantasy',
    description: 'Magical towers and enchanted buildings',
    gradient: 'from-purple-400/30 to-pink-500/30',
  },
];

export function StylePresets({ selectedStyle, onStyleChange }: StylePresetsProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-white/80">
        Choose a Style
      </label>
      
      <div className="grid grid-cols-2 gap-3">
        {styles.map((style) => (
          <button
            key={style.id}
            onClick={() => onStyleChange(style.id)}
            className={cn(
              'relative p-4 text-left transition-all duration-300 font-minecraft border-2',
              selectedStyle === style.id
                ? 'border-[#7CBD6B] bg-[#5a8c4a]/20'
                : 'border-[#4a5b3a] bg-[#0d1a0a]/60 hover:border-[#5a8c4a] hover:bg-[#1a2d12]/60'
            )}
          >
            {/* Gradient background */}
            <div className={cn(
              'absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity duration-300 pointer-events-none',
              style.gradient,
              selectedStyle === style.id ? 'opacity-70' : 'opacity-30'
            )} />
            
            {/* Content */}
            <div className="relative z-10">
              <span className={cn(
                'text-sm font-semibold transition-colors duration-300',
                selectedStyle === style.id ? 'text-white' : 'text-white/80'
              )}>
                {style.name}
              </span>
              <p className="text-xs text-white/50 mt-1 leading-relaxed">
                {style.description}
              </p>
            </div>
            
            {/* Selection indicator - blocky */}
            {selectedStyle === style.id && (
              <div className="absolute top-2 right-2 w-2 h-2 bg-[#7CBD6B] animate-pulse" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}