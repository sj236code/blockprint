import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Terminal } from 'lucide-react';

interface TerminalLogProps {
  logs: string[];
  className?: string;
}

export function TerminalLog({ logs, className }: TerminalLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogColor = (log: string): string => {
    if (log.includes('Error') || log.includes('error') || log.includes('failed')) {
      return 'text-red-400';
    }
    if (log.includes('Success') || log.includes('complete') || log.includes('done')) {
      return 'text-green-400';
    }
    if (log.includes('Warning') || log.includes('warning')) {
      return 'text-yellow-400';
    }
    if (log.includes('→') || log.includes('Building') || log.includes('Placing')) {
      return 'text-cyan-400';
    }
    return 'text-white/70';
  };

  return (
    <div className={cn(
      'relative rounded-xl overflow-hidden border border-white/10 bg-black/60',
      className
    )}>
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border-b border-white/10">
        <Terminal className="w-4 h-4 text-white/50" />
        <span className="text-xs text-white/50 font-mono">Build Log</span>
        <div className="flex-1" />
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
        </div>
      </div>

      {/* Log content */}
      <div
        ref={scrollRef}
        className="p-4 font-mono text-sm h-64 overflow-y-auto space-y-1"
        style={{ scrollBehavior: 'smooth' }}
      >
        {logs.length === 0 ? (
          <p className="text-white/30 italic">Waiting to start...</p>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              className={cn(
                'animate-in fade-in slide-in-from-left-2 duration-200',
                getLogColor(log)
              )}
            >
              <span className="text-white/30 mr-2">
                [{new Date().toLocaleTimeString('en-US', { 
                  hour12: false, 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                })}]
              </span>
              {log}
            </div>
          ))
        )}
        
        {/* Blinking cursor */}
        {logs.length > 0 && (
          <div className="flex items-center">
            <span className="text-white/30 mr-2">
              [{new Date().toLocaleTimeString('en-US', { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit',
                second: '2-digit'
              })}]
            </span>
            <span className="w-2 h-4 bg-[#ff6b35] animate-pulse" />
          </div>
        )}
      </div>

      {/* Gradient fade at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
    </div>
  );
}