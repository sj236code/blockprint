import { cn } from '@/lib/utils';
import { Check, AlertCircle } from 'lucide-react';
import { MinecraftBlockLoader } from '@/components/MinecraftBlockLoader';
import type { BuildStatus } from '@/types';

interface BuildProgressProps {
  status: BuildStatus;
  className?: string;
}

export function BuildProgress({ status, className }: BuildProgressProps) {
  const { progress, blocks_placed, total_blocks, current_action, status: buildStatus } = status;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Status header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {buildStatus === 'building' && (
            <>
              <div className="w-8 h-8 border-2 border-[#5a8c4a] bg-[#5a8c4a]/20 flex items-center justify-center">
                <MinecraftBlockLoader size="sm" />
              </div>
              <div>
                <p className="text-white font-medium">Building in Minecraft...</p>
                <p className="text-sm text-white/50">{current_action}</p>
              </div>
            </>
          )}
          
          {buildStatus === 'completed' && (
            <>
              <div className="w-8 h-8 border-2 border-[#5a8c4a] bg-[#5a8c4a]/30 flex items-center justify-center">
                <Check className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-white font-medium">Build Complete!</p>
                <p className="text-sm text-white/50">Structure is ready in Minecraft</p>
              </div>
            </>
          )}
          
          {buildStatus === 'error' && (
            <>
              <div className="w-8 h-8 border-2 border-red-700 bg-red-900/30 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-white font-medium">Build Failed</p>
                <p className="text-sm text-white/50">{status.error || 'An error occurred'}</p>
              </div>
            </>
          )}
        </div>

        {/* Progress percentage */}
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{Math.round(progress)}%</p>
          <p className="text-sm text-white/50">
            {blocks_placed.toLocaleString()} / {total_blocks.toLocaleString()} blocks
          </p>
        </div>
      </div>

      {/* Progress bar - blocky */}
      <div className="relative h-4 bg-[#1a2d12] border-2 border-[#4a5b3a] overflow-hidden">
        <div
          className={cn(
            'absolute left-0 top-0 bottom-0 transition-all duration-300 ease-out',
            buildStatus === 'error' ? 'bg-red-600' : 'bg-[#7CBD6B]'
          )}
          style={{ width: `${progress}%` }}
        >
          {/* Shimmer effect */}
          {buildStatus === 'building' && (
            <div className="absolute inset-0 overflow-hidden">
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                style={{
                  animation: 'shimmer 1.5s infinite',
                  transform: 'translateX(-100%)',
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Block counter pills - Minecraft style */}
      <div className="flex gap-2 flex-wrap font-minecraft">
        <div className="px-3 py-1 border-2 border-[#4a5b3a] bg-[#1a2d12]/80 text-xs text-white/80">
          Foundation
        </div>
        <div className="px-3 py-1 border-2 border-[#4a5b3a] bg-[#1a2d12]/80 text-xs text-white/80">
          Walls
        </div>
        <div className="px-3 py-1 border-2 border-[#4a5b3a] bg-[#1a2d12]/80 text-xs text-white/80">
          Roof
        </div>
        <div className="px-3 py-1 border-2 border-[#4a5b3a] bg-[#1a2d12]/80 text-xs text-white/80">
          Decorations
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}