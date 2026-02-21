import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { UploadZone } from '@/components/UploadZone';
import { StylePresets } from '@/components/StylePresets';
import { MinecraftBlockLoader } from '@/components/MinecraftBlockLoader';
import { generateBlueprint } from '@/lib/api';
import { Wand2, AlertCircle } from 'lucide-react';
import type { Blueprint, StylePreset } from '@/types';

interface UploadSectionProps {
  onBlueprintGenerated: (blueprint: Blueprint) => void;
}

export function UploadSection({ onBlueprintGenerated }: UploadSectionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<StylePreset>('ghibli');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
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
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setError(null);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, []);

  const handleClear = useCallback(() => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setError(null);
  }, [previewUrl]);

  const handleGenerate = async () => {
    if (!selectedFile) return;

    setIsGenerating(true);
    setError(null);

    try {
      const response = await generateBlueprint(selectedFile, selectedStyle);
      
      if (response.success && response.blueprint) {
        onBlueprintGenerated(response.blueprint);
        
        // Scroll to blueprint section
        const blueprintSection = document.getElementById('blueprint-section');
        if (blueprintSection) {
          blueprintSection.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        setError('Failed to generate blueprint. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section 
      id="upload-section"
      ref={sectionRef}
      className="relative py-24 px-6"
    >
      {/* Background - Minecraft cave/underground */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#2d5016]/95 via-[#1a2d0e] to-[#0d0d0d]" />
      
      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Section Header */}
        <div 
          className={cn(
            'text-center mb-12',
            'transition-all duration-700 ease-out',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#5a8c4a]/90 border-2 border-[#4a6b3a] mb-4 font-minecraft">
            <Wand2 className="w-4 h-4 text-[#7CBD6B]" />
            <span className="text-xs text-white uppercase tracking-wider">Step 1</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-minecraft text-white mb-4 drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)]">
            Upload Your Design
          </h2>
          <p className="text-white/60 max-w-lg mx-auto">
            Draw a building outline on paper and upload it. Our AI will analyze the structure 
            and create a detailed blueprint.
          </p>
        </div>

        {/* Upload Card - Minecraft block style */}
        <div 
          className={cn(
            'relative p-6 sm:p-8 border-2 border-[#5a6b4a]',
            'bg-[#1a2d12]/95 backdrop-blur-sm block-pattern',
            'transition-all duration-700 delay-150 ease-out',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          )}
        >
          {/* Loading overlay when generating */}
          {isGenerating && (
            <div 
              className="absolute inset-0 z-20 bg-black/70 flex flex-col items-center justify-center gap-4"
              aria-busy="true"
              aria-live="polite"
            >
              <MinecraftBlockLoader size="lg" />
              <p className="text-white font-medium">Generating blueprint...</p>
              <p className="text-sm text-white/60">Analyzing your image with AI</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: Upload */}
            <div className="space-y-6">
              <UploadZone
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
                onClear={handleClear}
                previewUrl={previewUrl}
              />
            </div>

            {/* Right: Style Selection */}
            <div className="space-y-6">
              <StylePresets
                selectedStyle={selectedStyle}
                onStyleChange={setSelectedStyle}
              />

              {/* Tips */}
              <div className="p-4 border-2 border-[#4a5b3a] bg-[#0d1a0a]/80">
                <h4 className="text-sm font-medium font-minecraft text-[#7CBD6B] mb-2">Tips for best results</h4>
                <ul className="space-y-1.5 text-xs text-white/70">
                  <li className="flex items-start gap-2">
                    <span className="text-[#7CBD6B]">•</span>
                    Use clear, dark lines on white paper
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#7CBD6B]">•</span>
                    Draw the front view of a building
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#7CBD6B]">•</span>
                    Include doors and windows if desired
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#7CBD6B]">•</span>
                    Avoid complex 3D perspectives
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Error message with retry */}
          {error && (
            <div 
              className={cn(
                'mt-6 p-4 bg-red-900/30 border-2 border-red-700',
                'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in fade-in slide-in-from-top-2'
              )}
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-400">{error}</p>
                  <p className="text-xs text-white/50 mt-1">You can try again with the same image or upload a different one.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="flex-shrink-0 px-4 py-2 text-sm font-medium font-minecraft bg-[#5a6b4a] text-white border-2 border-[#4a5b3a] hover:bg-[#6a7b5a] transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Generate Button - Minecraft grass block style */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleGenerate}
              disabled={!selectedFile || isGenerating}
              className={cn(
                'group relative px-8 py-4 font-medium font-minecraft text-white border-2 border-b-4',
                'transition-all duration-200 ease-out',
                !selectedFile || isGenerating
                  ? 'bg-[#3a4a2a] border-[#2a3a1a] cursor-not-allowed opacity-50'
                  : 'bg-[#7CBD6B] border-[#5a8c4a] hover:bg-[#8bc46b] active:border-b-2 active:translate-y-0.5'
              )}
            >
              <span className="flex items-center gap-2">
                {isGenerating ? (
                  <>
                    <MinecraftBlockLoader size="sm" />
                    Analyzing Image...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Generate Blueprint
                  </>
                )}
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}