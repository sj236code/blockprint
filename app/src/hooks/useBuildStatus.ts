import { useState, useCallback, useRef } from 'react';
import type { BuildStatus, Blueprint } from '@/types';

interface UseBuildStatusOptions {
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export function useBuildStatus({ onComplete, onError }: UseBuildStatusOptions = {}) {
  const [status, setStatus] = useState<BuildStatus>({
    status: 'idle',
    progress: 0,
    blocks_placed: 0,
    total_blocks: 0,
    current_action: '',
    logs: [],
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const startBuild = useCallback(async (blueprint: Blueprint) => {
    // Reset status
    setStatus({
      status: 'building',
      progress: 0,
      blocks_placed: 0,
      total_blocks: 0,
      current_action: 'Initializing build...',
      logs: ['Connecting to Minecraft server...'],
    });

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blueprint,
          origin: { x: 100, y: 70, z: 100 },
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Build failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          
          try {
            const data = JSON.parse(line);
            
            setStatus(prev => ({
              ...prev,
              status: data.status as BuildStatus['status'],
              progress: data.progress || 0,
              blocks_placed: data.blocks_placed || 0,
              total_blocks: data.total_blocks || 0,
              current_action: data.current_action || '',
              logs: [...prev.logs, ...(data.logs || [])].slice(-50),
            }));

            if (data.status === 'completed') {
              onComplete?.();
            } else if (data.status === 'error') {
              onError?.(data.error || 'Build failed');
            }
          } catch (e) {
            console.warn('Failed to parse SSE data:', line);
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setStatus(prev => ({
          ...prev,
          status: 'idle',
          logs: [...prev.logs, 'Build cancelled.'],
        }));
      } else {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        setStatus(prev => ({
          ...prev,
          status: 'error',
          error: errorMsg,
          logs: [...prev.logs, `Error: ${errorMsg}`],
        }));
        onError?.(errorMsg);
      }
    }
  }, [onComplete, onError]);

  const cancelBuild = useCallback(() => {
    abortControllerRef.current?.abort();
    setStatus(prev => ({
      ...prev,
      status: 'idle',
      logs: [...prev.logs, 'Cancelling...'],
    }));
  }, []);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setStatus({
      status: 'idle',
      progress: 0,
      blocks_placed: 0,
      total_blocks: 0,
      current_action: '',
      logs: [],
    });
  }, []);

  return {
    status,
    startBuild,
    cancelBuild,
    reset,
    isBuilding: status.status === 'building',
    isComplete: status.status === 'completed',
    isError: status.status === 'error',
  };
}