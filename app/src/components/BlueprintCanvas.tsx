import { useEffect, useRef } from 'react';
import type { Blueprint } from '@/types';

interface BlueprintCanvasProps {
  blueprint: Blueprint;
  className?: string;
}

/** Normalize roof type (API may return "Gable" etc.) */
function normalizeRoofType(type: string): 'gable' | 'flat' | 'hip' {
  const t = String(type).toLowerCase();
  if (t === 'flat' || t === 'hip') return t;
  return 'gable';
}

export function BlueprintCanvas({ blueprint, className }: BlueprintCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { building } = blueprint;
    const { width_blocks, wall_height_blocks, roof, openings } = building;
    const roofType = normalizeRoofType(roof.type);
    const totalHeight = wall_height_blocks + roof.height_blocks;
    const dpr = window.devicePixelRatio || 1;
    const padding = 40;

    function run() {
      if (!canvas || !ctx) return;
      const c = canvas;
      const context = ctx;
      const rect = c.getBoundingClientRect();
      c.width = rect.width * dpr;
      c.height = rect.height * dpr;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(dpr, dpr);

      const availableWidth = rect.width - padding * 2;
      const availableHeight = rect.height - padding * 2;
      const scaleX = availableWidth / width_blocks;
      const scaleY = availableHeight / totalHeight;
      const scale = Math.min(scaleX, scaleY);

      const offsetX = (rect.width - width_blocks * scale) / 2;
      // Ground at offsetY; building top at offsetY - totalHeight*scale. Center building vertically.
      const offsetY = (rect.height + totalHeight * scale) / 2;

      const gridTopY = offsetY - totalHeight * scale;
      const roofLeftPx = offsetX - roof.overhang * scale;
      const roofWidthPx = (width_blocks + 2 * roof.overhang) * scale;
      const roofBaseY = offsetY - wall_height_blocks * scale;
      const roofFullWidth = (width_blocks + 2 * roof.overhang) * scale;
      const roofLeftX = offsetX - roof.overhang * scale;

      function draw() {
        context.clearRect(0, 0, rect.width, rect.height);

        // Grid (walls + roof area)
        context.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        context.lineWidth = 1;
        for (let x = 0; x <= width_blocks; x++) {
          context.beginPath();
          context.moveTo(offsetX + x * scale, offsetY);
          context.lineTo(offsetX + x * scale, gridTopY);
          context.stroke();
        }
        for (let x = 0; x <= width_blocks + 2 * roof.overhang; x++) {
          const px = roofLeftPx + x * scale;
          if (px < offsetX || px > offsetX + width_blocks * scale) {
            context.beginPath();
            context.moveTo(px, offsetY - wall_height_blocks * scale);
            context.lineTo(px, gridTopY);
            context.stroke();
          }
        }
        for (let y = 0; y <= wall_height_blocks; y++) {
          context.beginPath();
          context.moveTo(offsetX, offsetY - y * scale);
          context.lineTo(offsetX + width_blocks * scale, offsetY - y * scale);
          context.stroke();
        }
        for (let y = 1; y <= roof.height_blocks; y++) {
          context.beginPath();
          context.moveTo(roofLeftPx, offsetY - wall_height_blocks * scale - y * scale);
          context.lineTo(roofLeftPx + roofWidthPx, offsetY - wall_height_blocks * scale - y * scale);
          context.stroke();
        }

        // Walls (full height)
        context.fillStyle = 'rgba(139, 105, 20, 0.6)';
        context.fillRect(
          offsetX,
          offsetY - wall_height_blocks * scale,
          width_blocks * scale,
          wall_height_blocks * scale
        );

        // Roof (full) – always drawn so the triangular/gable shape is visible
        context.fillStyle = 'rgba(139, 69, 19, 0.85)';
        context.strokeStyle = 'rgba(100, 50, 10, 0.5)';
        context.lineWidth = 1;
        if (roofType === 'gable') {
          for (let r = 0; r < roof.height_blocks; r++) {
            const stepWidth = roofFullWidth * (1 - r / roof.height_blocks);
            const stepLeftX = roofLeftX + (roofFullWidth - stepWidth) / 2;
            const stepTopY = roofBaseY - (r + 1) * scale;
            const stepHeight = scale;
            context.fillRect(stepLeftX, stepTopY, stepWidth, stepHeight);
            context.strokeRect(stepLeftX, stepTopY, stepWidth, stepHeight);
          }
        } else if (roofType === 'flat') {
          const flatHeight = 2 * scale;
          context.fillRect(roofLeftX, roofBaseY - flatHeight, roofFullWidth, flatHeight);
          context.strokeRect(roofLeftX, roofBaseY - flatHeight, roofFullWidth, flatHeight);
        } else if (roofType === 'hip') {
          const centerX = roofLeftX + roofFullWidth / 2;
          for (let r = 0; r < roof.height_blocks; r++) {
            const halfStepWidth = (roofFullWidth / 2) * (1 - r / roof.height_blocks);
            const stepTopY = roofBaseY - (r + 1) * scale;
            const stepHeight = scale;
            context.fillRect(roofLeftX, stepTopY, halfStepWidth, stepHeight);
            context.strokeRect(roofLeftX, stepTopY, halfStepWidth, stepHeight);
            context.fillRect(centerX, stepTopY, halfStepWidth, stepHeight);
            context.strokeRect(centerX, stepTopY, halfStepWidth, stepHeight);
          }
        }

        // Openings (doors and windows)
        openings.forEach(opening => {
          if (opening.type === 'door') {
            context.fillStyle = 'rgba(101, 67, 33, 0.9)';
          } else {
            context.fillStyle = 'rgba(135, 206, 235, 0.5)';
          }
          const oy = offsetY - (opening.y + opening.h) * scale;
          context.fillRect(offsetX + opening.x * scale, oy, opening.w * scale, opening.h * scale);
          context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          context.lineWidth = 1;
          context.strokeRect(offsetX + opening.x * scale, oy, opening.w * scale, opening.h * scale);
        });

        // Dimensions label
        context.fillStyle = 'rgba(255, 255, 255, 0.6)';
        context.font = '12px sans-serif';
        context.textAlign = 'center';
        context.fillText(
          `${width_blocks} blocks`,
          offsetX + (width_blocks * scale) / 2,
          offsetY + 20
        );
      }

      draw();
    }

    run();
    const observer = new ResizeObserver(run);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [blueprint]);

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg"
        style={{ background: 'rgba(0, 0, 0, 0.3)' }}
      />
    </div>
  );
}