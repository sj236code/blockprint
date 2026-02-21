import { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { BlueprintViewer } from '@/components/BlueprintViewer';
import { BuildProgress } from '@/components/BuildProgress';
import { TerminalLog } from '@/components/TerminalLog';
import { buildInMinecraft } from '@/lib/api';
import { 
  FileCheck, 
  Play, 
  RotateCcw, 
  Check,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import type { Blueprint, BuildStatus } from '@/types';

interface BlueprintSectionProps {
  blueprint: Blueprint | null;
  onReset: () => void;
}

export function BlueprintSection({ blueprint, onReset }: BlueprintSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildStatus, setBuildStatus] = useState<BuildStatus>({
    status: 'idle',
    progress: 0,
    blocks_placed: 0,
    total_blocks: 0,
    current_action: '',
    logs: [],
  });
  const sectionRef = useRef<HTMLDivElement>(null);

  // Intersection observer for scroll animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Update visibility when blueprint changes
  useEffect(() => {
    if (blueprint) {
      setIsVisible(true);
    }
  }, [blueprint]);

  const handleBuild = async () => {
    if (!blueprint) return;

    setIsBuilding(true);
    setBuildStatus({
      status: 'building',
      progress: 0,
      blocks_placed: 0,
      total_blocks: 0,
      current_action: 'Connecting to Minecraft server...',
      logs: ['Initializing build process...', 'Connecting to RCON...'],
    });

    try {
      await buildInMinecraft(
        {
          blueprint,
          origin: { x: 100, y: 70, z: 100 },
        },
        (status) => {
          setBuildStatus(prev => ({
            ...prev,
            ...status,
            logs: [...prev.logs, ...(status.logs || [])].slice(-100),
          }));
        }
      );
    } catch (error) {
      setBuildStatus(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Build failed',
        logs: [...prev.logs, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      }));
    } finally {
      setIsBuilding(false);
    }
  };

  const handleReset = () => {
    setBuildStatus({
      status: 'idle',
      progress: 0,
      blocks_placed: 0,
      total_blocks: 0,
      current_action: '',
      logs: [],
    });
    onReset();
  };

  if (!blueprint) return null;

  return (
    <section 
      id="blueprint-section"
      ref={sectionRef}
      className="relative py-24 px-6"
    >
      {/* Background - Minecraft underground */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a2d0e] via-[#0d1a0a] to-[#0d0d0d]" />
      
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section Header */}
        <div 
          className={cn(
            'text-center mb-12',
            'transition-all duration-700 ease-out',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#5a8c4a]/90 border-2 border-[#4a6b3a] mb-4 font-minecraft">
            <FileCheck className="w-4 h-4 text-[#7CBD6B]" />
            <span className="text-xs text-white uppercase tracking-wider">Step 2</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-minecraft text-white mb-4 drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
            Your Blueprint is Ready
          </h2>
          <p className="text-white/60 max-w-lg mx-auto">
            Review the generated blueprint below. When you're ready, click "Build in Minecraft" 
            to construct it in your world.
          </p>
        </div>

        {/* Blueprint Viewer */}
        <div 
          className={cn(
            'mb-8',
            'transition-all duration-700 delay-150 ease-out',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          <BlueprintViewer blueprint={blueprint} />
        </div>

        {/* Build Controls */}
        <div 
          className={cn(
            'flex flex-wrap items-center justify-center gap-4 mb-8',
            'transition-all duration-700 delay-300 ease-out',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          {buildStatus.status === 'idle' && (
            <button
              onClick={handleBuild}
              disabled={isBuilding}
              className={cn(
                'px-8 py-4 font-medium font-minecraft text-white border-2 border-b-4',
                'bg-[#7CBD6B] border-[#5a8c4a] hover:bg-[#8bc46b] active:border-b-2 active:translate-y-0.5',
                'transition-all duration-200 ease-out'
              )}
            >
              <span className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Build in Minecraft
              </span>
            </button>
          )}

          {buildStatus.status === 'completed' && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-6 py-4 bg-[#5a8c4a]/90 border-2 border-[#4a6b3a] font-minecraft">
                <Check className="w-5 h-5 text-[#7CBD6B]" />
                <span className="text-[#7CBD6B] font-medium">Build Complete!</span>
              </div>
              <button
                onClick={handleReset}
                className={cn(
                  'flex items-center gap-2 px-6 py-4 font-medium font-minecraft',
                  'bg-[#8B6914] border-2 border-b-4 border-[#6B4E0A] text-white',
                  'hover:bg-[#9a7a1a] active:border-b-2 active:translate-y-0.5 transition-all duration-200'
                )}
              >
                <RotateCcw className="w-5 h-5" />
                Start Over
              </button>
            </div>
          )}

          {buildStatus.status === 'error' && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-6 py-4 bg-red-900/40 border-2 border-red-700 font-minecraft">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-400 font-medium">Build Failed</span>
              </div>
              <button
                onClick={handleBuild}
                className={cn(
                  'flex items-center gap-2 px-6 py-4 font-medium font-minecraft text-white',
                  'bg-[#7CBD6B] border-2 border-b-4 border-[#5a8c4a]',
                  'hover:bg-[#8bc46b] active:border-b-2 active:translate-y-0.5 transition-all duration-200'
                )}
              >
                <RotateCcw className="w-5 h-5" />
                Retry
              </button>
            </div>
          )}

          {buildStatus.status === 'idle' && (
            <button
              onClick={handleReset}
              className={cn(
                'flex items-center gap-2 px-6 py-4 font-medium font-minecraft',
                'bg-[#8B6914] border-2 border-b-4 border-[#6B4E0A] text-white',
                'hover:bg-[#9a7a1a] active:border-b-2 active:translate-y-0.5 transition-all duration-200'
              )}
            >
              <RotateCcw className="w-5 h-5" />
              Start Over
            </button>
          )}
        </div>

        {/* Build Progress & Logs */}
        {(buildStatus.status === 'building' || buildStatus.status === 'completed' || buildStatus.status === 'error') && (
          <div 
            className={cn(
              'grid lg:grid-cols-2 gap-6',
              'animate-in fade-in slide-in-from-bottom-4 duration-500'
            )}
          >
            <BuildProgress status={buildStatus} />
            <TerminalLog logs={buildStatus.logs} />
          </div>
        )}

        {/* Connection info */}
        <div 
          className={cn(
            'mt-8 p-4 border-2 border-[#5a6b4a] bg-[#0d1a0a]/80 block-pattern',
            'transition-all duration-700 delay-450 ease-out',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-[#5a8c4a]/30 border-2 border-[#4a6b3a] flex items-center justify-center flex-shrink-0">
              <ExternalLink className="w-4 h-4 text-[#7CBD6B]" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-white/80 mb-1">Minecraft Server Connection</h4>
              <p className="text-xs text-white/50">
                Make sure your Minecraft Java server is running with RCON enabled at{' '}
                <code className="px-1.5 py-0.5 rounded bg-white/10 text-white/70">localhost:25575</code>.
                The structure will be built at coordinates{' '}
                <code className="px-1.5 py-0.5 rounded bg-white/10 text-white/70">X:100, Y:70, Z:100</code>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}