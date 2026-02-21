import { useState } from 'react';
import { cn } from '@/lib/utils';
import { BlueprintCanvas } from './BlueprintCanvas';
import { StatsCard } from './StatsCard';
import { 
  Copy, 
  Check, 
  Code2, 
  Layers, 
  Ruler, 
  Home, 
  Mountain,
  Box
} from 'lucide-react';
import type { Blueprint } from '@/types';
import { getBlueprintSegments } from '@/types';

interface BlueprintViewerProps {
  blueprint: Blueprint;
  className?: string;
}

export function BlueprintViewer({ blueprint, className }: BlueprintViewerProps) {
  const [activeTab, setActiveTab] = useState<'visual' | 'json'>('visual');
  const [copied, setCopied] = useState(false);

  const { style } = blueprint;
  const segments = getBlueprintSegments(blueprint);
  const isMultiSegment = segments.length > 1;
  const firstSegment = segments[0];
  const totalWidth = segments.reduce((s, seg) => s + seg.width_blocks, 0);
  const { width_blocks, wall_height_blocks, depth_blocks, roof, openings } = firstSegment ?? {
    width_blocks: 0,
    wall_height_blocks: 0,
    depth_blocks: 0,
    roof: undefined,
    openings: [],
  };

  const jsonString = JSON.stringify(blueprint, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Syntax highlight JSON
  const highlightJson = (json: string) => {
    return json
      .replace(/"(\w+)":/g, '<span class="text-[#7CBD6B]">"$1"</span>:')
      .replace(/: "([^"]*)"/g, ': <span class="text-green-400">"$1"</span>')
      .replace(/: (\d+)/g, ': <span class="text-cyan-400">$1</span>')
      .replace(/: (true|false)/g, ': <span class="text-purple-400">$1</span>');
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Tabs - Minecraft style */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('visual')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium font-minecraft border-2 border-b-4 transition-all duration-200',
            activeTab === 'visual'
              ? 'bg-[#5a8c4a] text-white border-[#4a6b3a]'
              : 'bg-[#2a3a1a] text-white/70 border-[#1a2a0a] hover:bg-[#3a4a2a] hover:text-white/90'
          )}
        >
          <Layers className="w-4 h-4" />
          Visual Preview
        </button>
        <button
          onClick={() => setActiveTab('json')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium font-minecraft border-2 border-b-4 transition-all duration-200',
            activeTab === 'json'
              ? 'bg-[#5a8c4a] text-white border-[#4a6b3a]'
              : 'bg-[#2a3a1a] text-white/70 border-[#1a2a0a] hover:bg-[#3a4a2a] hover:text-white/90'
          )}
        >
          <Code2 className="w-4 h-4" />
          Blueprint JSON
        </button>
      </div>

      {/* Content */}
      <div className="relative">
        {activeTab === 'visual' ? (
          <div className="space-y-4">
            {/* Canvas */}
            <div className="relative aspect-video overflow-hidden border-2 border-[#4a6b3a] bg-black/60">
              <BlueprintCanvas blueprint={blueprint} className="w-full h-full" />
              
              {/* Overlay info - blocky */}
              <div className="absolute top-4 left-4 px-3 py-1.5 bg-black/80 border-2 border-[#5a6b4a] font-minecraft">
                <span className="text-xs text-[#7CBD6B] uppercase tracking-wider">Style</span>
                <p className="text-sm font-medium text-white capitalize">{style.theme}</p>
              </div>
              
              <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/80 border-2 border-[#5a6b4a] font-minecraft">
                <span className="text-xs text-[#7CBD6B] uppercase tracking-wider">
                  {isMultiSegment ? 'Segments' : 'Roof'}
                </span>
                <p className="text-sm font-medium text-white capitalize">
                  {isMultiSegment ? `${segments.length}` : roof ? roof.type : 'None'}
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatsCard
                icon={<Ruler className="w-5 h-5 text-[#7CBD6B]" />}
                label={isMultiSegment ? 'Total Width' : 'Width'}
                value={isMultiSegment ? totalWidth : width_blocks}
                unit="blocks"
                delay={0}
              />
              <StatsCard
                icon={<Home className="w-5 h-5 text-[#7CBD6B]" />}
                label="Wall Height"
                value={wall_height_blocks}
                unit="blocks"
                delay={100}
              />
              <StatsCard
                icon={<Box className="w-5 h-5 text-[#7CBD6B]" />}
                label="Depth"
                value={depth_blocks}
                unit="blocks"
                delay={200}
              />
              <StatsCard
                icon={<Mountain className="w-5 h-5 text-[#7CBD6B]" />}
                label={isMultiSegment ? 'Segments' : roof ? 'Roof Height' : 'Roof'}
                value={isMultiSegment ? segments.length : roof ? roof.height_blocks : 'None'}
                unit={isMultiSegment ? '' : roof ? 'blocks' : ''}
                delay={300}
              />
            </div>

            {/* Materials */}
            <div className="p-4 border-2 border-[#4a5b3a] bg-[#0d1a0a]/80">
              <h4 className="text-sm font-medium font-minecraft text-[#7CBD6B] mb-3">Materials</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(style.materials).map(([key, value]) => (
                  <div
                    key={key}
                    className="px-3 py-1.5 border-2 border-[#4a5b3a] bg-[#1a2d12]/60 text-xs font-minecraft"
                  >
                    <span className="text-white/50 capitalize">{key}:</span>{' '}
                    <span className="text-white/80">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Openings (all segments) */}
            {segments.some(seg => seg.openings.length > 0) && (
              <div className="p-4 border-2 border-[#4a5b3a] bg-[#0d1a0a]/80">
                <h4 className="text-sm font-medium font-minecraft text-[#7CBD6B] mb-3">
                  Openings
                  {isMultiSegment
                    ? ` (${segments.reduce((s, seg) => s + seg.openings.length, 0)} total)`
                    : ` (${openings.length})`}
                </h4>
                <div className="space-y-2">
                  {segments.map((seg, segIndex) =>
                    seg.openings.map((opening, index) => (
                      <div
                        key={`${segIndex}-${index}`}
                        className="flex items-center justify-between px-3 py-2 border-2 border-[#4a5b3a] bg-[#1a2d12]/60 font-minecraft"
                      >
                        <span className="text-sm text-white/70 capitalize">
                          {isMultiSegment ? `Seg ${segIndex + 1}: ` : ''}
                          {opening.type} #{index + 1}
                        </span>
                        <span className="text-xs text-white/50">
                          {opening.w}×{opening.h} at ({opening.x}, {opening.y})
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="relative overflow-hidden border-2 border-[#4a6b3a] bg-black/70">
            {/* JSON Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#1a2d12]/80 border-b-2 border-[#4a6b3a] font-minecraft">
              <span className="text-xs text-white/50 font-mono">blueprint.json</span>
              <button
                onClick={handleCopy}
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors duration-200',
                  copied 
                    ? 'bg-[#5a8c4a] text-white border-[#4a6b3a]' 
                    : 'bg-[#2a3a1a] text-white/70 border-2 border-[#4a5b3a] hover:bg-[#3a4a2a] hover:text-white/90'
                )}
              >
                {copied ? (
                  <><Check className="w-3 h-3" /> Copied</>
                ) : (
                  <><Copy className="w-3 h-3" /> Copy</>
                )}
              </button>
            </div>

            {/* JSON Content */}
            <div className="p-4 overflow-x-auto">
              <pre 
                className="font-mono text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: highlightJson(jsonString) }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}