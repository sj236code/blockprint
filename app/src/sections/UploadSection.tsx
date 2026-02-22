import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { UploadZone } from '@/components/UploadZone';
import { StylePresets } from '@/components/StylePresets';
import { MinecraftBlockLoader } from '@/components/MinecraftBlockLoader';
import { generateBlueprint, generateBlueprintFromAudio } from '@/lib/api';
import { Wand2, AlertCircle, Image as ImageIcon, Mic } from 'lucide-react';
import type { Blueprint, StylePreset } from '@/types';

type InputMode = 'image' | 'voice';

interface UploadSectionProps {
  onBlueprintGenerated: (blueprint: Blueprint) => void;
}

export function UploadSection({ onBlueprintGenerated }: UploadSectionProps) {
  const [inputMode, setInputMode] = useState<InputMode>('image');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<StylePreset>('ghibli');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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

  const handleClearVoice = useCallback(() => {
    setAudioFile(null);
    setError(null);
  }, []);

  const handleAudioFileSelect = useCallback((file: File) => {
    if (file.type.startsWith('audio/')) {
      setAudioFile(file);
      setError(null);
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioFile(new File([blob], 'recording.webm', { type: blob.type }));
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not access microphone.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
      setIsRecording(false);
    }
  }, []);

  const handleGenerate = async () => {
    if (inputMode === 'image') {
      if (!selectedFile) return;
      setIsGenerating(true);
      setError(null);
      try {
        const response = await generateBlueprint(selectedFile, selectedStyle);
        if (response.success && response.blueprint) {
          onBlueprintGenerated(response.blueprint);
          const blueprintSection = document.getElementById('blueprint-section');
          if (blueprintSection) blueprintSection.scrollIntoView({ behavior: 'smooth' });
        } else {
          setError('Failed to generate blueprint. Please try again.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setIsGenerating(false);
      }
    } else {
      if (!audioFile) return;
      setIsGenerating(true);
      setError(null);
      try {
        const response = await generateBlueprintFromAudio(audioFile, selectedStyle);
        if (response.success && response.blueprint) {
          onBlueprintGenerated(response.blueprint);
          const blueprintSection = document.getElementById('blueprint-section');
          if (blueprintSection) blueprintSection.scrollIntoView({ behavior: 'smooth' });
        } else {
          setError('Failed to generate blueprint. Please try again.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setIsGenerating(false);
      }
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
            Upload a drawing or describe your build with your voice. Our AI will create a detailed blueprint.
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
          {/* Tabs: Image / Voice */}
          <div className="flex gap-2 mb-6 border-b-2 border-[#4a5b3a] pb-2">
            <button
              type="button"
              onClick={() => { setInputMode('image'); setError(null); }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 font-minecraft text-sm transition-colors',
                inputMode === 'image'
                  ? 'bg-[#5a8c4a] text-white border-2 border-[#4a6b3a]'
                  : 'bg-[#2a3a1a] text-white/80 border-2 border-transparent hover:bg-[#3a4a2a]'
              )}
            >
              <ImageIcon className="w-4 h-4" />
              Upload image
            </button>
            <button
              type="button"
              onClick={() => { setInputMode('voice'); setError(null); }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 font-minecraft text-sm transition-colors',
                inputMode === 'voice'
                  ? 'bg-[#5a8c4a] text-white border-2 border-[#4a6b3a]'
                  : 'bg-[#2a3a1a] text-white/80 border-2 border-transparent hover:bg-[#3a4a2a]'
              )}
            >
              <Mic className="w-4 h-4" />
              Describe by voice
            </button>
          </div>

          {/* Loading overlay when generating */}
          {isGenerating && (
            <div 
              className="absolute inset-0 z-20 bg-black/70 flex flex-col items-center justify-center gap-4"
              aria-busy="true"
              aria-live="polite"
            >
              <MinecraftBlockLoader size="lg" />
              <p className="text-white font-medium">Generating blueprint...</p>
              <p className="text-sm text-white/60">
                {inputMode === 'voice' ? 'Transcribing and building...' : 'Analyzing your image with AI'}
              </p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: Upload or Voice */}
            <div className="space-y-6">
              {inputMode === 'image' ? (
                <UploadZone
                  onFileSelect={handleFileSelect}
                  selectedFile={selectedFile}
                  onClear={handleClear}
                  previewUrl={previewUrl}
                />
              ) : (
                <div className="p-6 border-2 border-[#4a5b3a] bg-[#0d1a0a]/80 space-y-4">
                  <h4 className="text-sm font-medium font-minecraft text-[#7CBD6B]">Record or upload audio</h4>
                  <div className="flex flex-wrap gap-3">
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={startRecording}
                        disabled={isGenerating}
                        className="flex items-center gap-2 px-4 py-3 font-minecraft bg-[#7CBD6B] border-2 border-[#5a8c4a] text-white hover:bg-[#8bc46b] disabled:opacity-50"
                      >
                        <Mic className="w-4 h-4" />
                        Start recording
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="flex items-center gap-2 px-4 py-3 font-minecraft bg-red-700 border-2 border-red-600 text-white hover:bg-red-600"
                      >
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        Stop recording
                      </button>
                    )}
                    <label className="flex items-center gap-2 px-4 py-3 font-minecraft bg-[#5a6b4a] border-2 border-[#4a5b3a] text-white hover:bg-[#6a7b5a] cursor-pointer">
                      <ImageIcon className="w-4 h-4" />
                      Upload audio
                      <input
                        type="file"
                        accept="audio/*"
                        className="sr-only"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleAudioFileSelect(f);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                  {audioFile && (
                    <div className="flex items-center justify-between text-sm text-white/80">
                      <span>Ready: {audioFile.name}</span>
                      <button
                        type="button"
                        onClick={handleClearVoice}
                        className="text-[#7CBD6B] hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-white/50">
                    Describe your building (e.g. “A small house with a gable roof and two windows”). We’ll transcribe and generate a blueprint.
                  </p>
                </div>
              )}
            </div>

            {/* Right: Style Selection */}
            <div className="space-y-6">
              <StylePresets
                selectedStyle={selectedStyle}
                onStyleChange={setSelectedStyle}
              />

              {/* Tips */}
              <div className="p-4 border-2 border-[#4a5b3a] bg-[#0d1a0a]/80">
                <h4 className="text-sm font-medium font-minecraft text-[#7CBD6B] mb-2">
                  {inputMode === 'voice' ? 'Voice tips' : 'Tips for best results'}
                </h4>
                <ul className="space-y-1.5 text-xs text-white/70">
                  {inputMode === 'voice' ? (
                    <>
                      <li className="flex items-start gap-2">
                        <span className="text-[#7CBD6B]">•</span>
                        Speak clearly (e.g. “A house with a pointed roof and a door”)
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#7CBD6B]">•</span>
                        Mention roof type, doors, and windows if you want them
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#7CBD6B]">•</span>
                        For castles or multi-part buildings, say “towers” or “wings”
                      </li>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
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
                  <p className="text-xs text-white/50 mt-1">
                    {inputMode === 'voice' ? 'Try recording again or upload a different audio file.' : 'You can try again with the same image or upload a different one.'}
                  </p>
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
              disabled={
                isGenerating ||
                (inputMode === 'image' ? !selectedFile : !audioFile)
              }
              className={cn(
                'group relative px-8 py-4 font-medium font-minecraft text-white border-2 border-b-4',
                'transition-all duration-200 ease-out',
                isGenerating || (inputMode === 'image' ? !selectedFile : !audioFile)
                  ? 'bg-[#3a4a2a] border-[#2a3a1a] cursor-not-allowed opacity-50'
                  : 'bg-[#7CBD6B] border-[#5a8c4a] hover:bg-[#8bc46b] active:border-b-2 active:translate-y-0.5'
              )}
            >
              <span className="flex items-center gap-2">
                {isGenerating ? (
                  <>
                    <MinecraftBlockLoader size="sm" />
                    {inputMode === 'voice' ? 'Transcribing & building...' : 'Analyzing Image...'}
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