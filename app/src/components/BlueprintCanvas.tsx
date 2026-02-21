import { useEffect, useRef } from 'react';
import type { Blueprint, Building } from '@/types';
import { getBlueprintSegments } from '@/types';

interface BlueprintCanvasProps {
  blueprint: Blueprint;
  className?: string;
}

/** Normalize roof type (API may return "Gable" etc.) */
function normalizeRoofType(type: string): 'gable' | 'hip' {
  const t = String(type).toLowerCase();
  if (t === 'hip') return 'hip';
  return 'gable';
}

export function BlueprintCanvas({ blueprint, className }: BlueprintCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const segments = getBlueprintSegments(blueprint);
    if (segments.length === 0) return;

    const totalWidthBlocks = segments.reduce((s, seg) => s + seg.width_blocks, 0);
    const maxTotalHeight = Math.max(
      ...segments.map(seg =>
        seg.wall_height_blocks + (seg.roof ? seg.roof.height_blocks : 1)
      )
    );
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
      const scaleX = availableWidth / totalWidthBlocks;
      const scaleY = availableHeight / maxTotalHeight;
      const scale = Math.min(scaleX, scaleY);

      const baseOffsetX = (rect.width - totalWidthBlocks * scale) / 2;
      const offsetY = (rect.height + maxTotalHeight * scale) / 2;

      context.clearRect(0, 0, rect.width, rect.height);

      let segmentOffsetX = 0;
      for (const building of segments) {
        const segBaseX = baseOffsetX + segmentOffsetX * scale;
        drawSegment(context, building, segBaseX, offsetY, scale);
        segmentOffsetX += building.width_blocks;
      }

      // Dimensions label (total width)
      context.fillStyle = 'rgba(255, 255, 255, 0.6)';
      context.font = '12px sans-serif';
      context.textAlign = 'center';
      context.fillText(
        `${totalWidthBlocks} blocks total`,
        baseOffsetX + (totalWidthBlocks * scale) / 2,
        offsetY + 20
      );
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

function drawSegment(
  context: CanvasRenderingContext2D,
  building: Building,
  offsetX: number,
  offsetY: number,
  scale: number
) {
  const { width_blocks, wall_height_blocks, roof, openings } = building;
  const roofHeight = roof ? roof.height_blocks : 1;
  const totalHeight = wall_height_blocks + roofHeight;
  const gridTopY = offsetY - totalHeight * scale;

  // Grid (walls, and roof if present)
  context.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  context.lineWidth = 1;
  for (let x = 0; x <= width_blocks; x++) {
    context.beginPath();
    context.moveTo(offsetX + x * scale, offsetY);
    context.lineTo(offsetX + x * scale, gridTopY);
    context.stroke();
  }
  for (let y = 0; y <= wall_height_blocks; y++) {
    context.beginPath();
    context.moveTo(offsetX, offsetY - y * scale);
    context.lineTo(offsetX + width_blocks * scale, offsetY - y * scale);
    context.stroke();
  }
  if (roof) {
    for (let y = 1; y <= roofHeight; y++) {
      const roofLeftPx = offsetX - roof.overhang * scale;
      const roofWidthPx = (width_blocks + 2 * roof.overhang) * scale;
      context.beginPath();
      context.moveTo(roofLeftPx, offsetY - wall_height_blocks * scale - y * scale);
      context.lineTo(roofLeftPx + roofWidthPx, offsetY - wall_height_blocks * scale - y * scale);
      context.stroke();
    }
  }

  // Walls
  context.fillStyle = 'rgba(139, 105, 20, 0.6)';
  context.fillRect(
    offsetX,
    offsetY - wall_height_blocks * scale,
    width_blocks * scale,
    wall_height_blocks * scale
  );

  // Roof or cap (when no roof, draw one layer to close the top)
  if (roof) {
    const roofType = normalizeRoofType(roof.type);
    const roofLeftPx = offsetX - roof.overhang * scale;
    const roofWidthPx = (width_blocks + 2 * roof.overhang) * scale;
    const roofBaseY = offsetY - wall_height_blocks * scale;
    const roofFullWidth = (width_blocks + 2 * roof.overhang) * scale;
    const roofLeftX = offsetX - roof.overhang * scale;
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
  } else {
    const roofBaseY = offsetY - wall_height_blocks * scale;
    const capHeight = scale;
    context.fillStyle = 'rgba(139, 69, 19, 0.85)';
    context.strokeStyle = 'rgba(100, 50, 10, 0.5)';
    context.lineWidth = 1;
    context.fillRect(offsetX, roofBaseY - capHeight, width_blocks * scale, capHeight);
    context.strokeRect(offsetX, roofBaseY - capHeight, width_blocks * scale, capHeight);
  }

  // Openings
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
}
