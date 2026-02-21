import { useState, useEffect, useCallback } from 'react';

interface UseTypewriterOptions {
  text: string;
  speed?: number;
  delay?: number;
  onComplete?: () => void;
}

export function useTypewriter({
  text,
  speed = 30,
  delay = 0,
  onComplete,
}: UseTypewriterOptions) {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const startTyping = useCallback(() => {
    setDisplayText('');
    setIsTyping(true);
    setIsComplete(false);
  }, []);

  const reset = useCallback(() => {
    setDisplayText('');
    setIsTyping(false);
    setIsComplete(false);
  }, []);

  useEffect(() => {
    if (!isTyping) return;

    let timeout: ReturnType<typeof setTimeout>;
    
    const typeNextChar = (index: number) => {
      if (index >= text.length) {
        setIsTyping(false);
        setIsComplete(true);
        onComplete?.();
        return;
      }

      timeout = setTimeout(() => {
        setDisplayText(text.slice(0, index + 1));
        typeNextChar(index + 1);
      }, speed);
    };

    const startTimeout = setTimeout(() => {
      typeNextChar(0);
    }, delay);

    return () => {
      clearTimeout(timeout);
      clearTimeout(startTimeout);
    };
  }, [isTyping, text, speed, delay, onComplete]);

  return {
    displayText,
    isTyping,
    isComplete,
    startTyping,
    reset,
  };
}

export function useTypewriterArray({
  lines,
  speed = 20,
  lineDelay = 100,
}: {
  lines: string[];
  speed?: number;
  lineDelay?: number;
}) {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentLineIndex >= lines.length) {
      setIsComplete(true);
      return;
    }

    const currentLine = lines[currentLineIndex];
    let charIndex = 0;

    const typeChar = () => {
      if (charIndex <= currentLine.length) {
        setDisplayedLines(prev => {
          const newLines = [...prev];
          newLines[currentLineIndex] = currentLine.slice(0, charIndex);
          return newLines;
        });
        charIndex++;
        setTimeout(typeChar, speed);
      } else {
        setTimeout(() => {
          setCurrentLineIndex(prev => prev + 1);
        }, lineDelay);
      }
    };

    typeChar();
  }, [currentLineIndex, lines, speed, lineDelay]);

  return { displayedLines, isComplete, currentLineIndex };
}