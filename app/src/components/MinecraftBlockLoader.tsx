import { cn } from '@/lib/utils';

/** Minecraft grass-block style cube that rotates. No image required. */
export function MinecraftBlockLoader({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  // Smaller block: sm 12px, md 18px, lg 32px (was 16/24/48)
  const px = size === 'sm' ? 12 : size === 'md' ? 18 : 32;
  const half = px / 2;

  const dirtLight = 'linear-gradient(180deg, #8b6914 0%, #7a5c12 30%, #9a7a1a 70%, #7a5c12 100%)';
  const dirtDark = 'linear-gradient(180deg, #5c4520 0%, #4a3510 50%, #6b4e0a 100%)';
  const grass = 'linear-gradient(135deg, #4a6b3a 0%, #5a7c4a 15%, #4a6b3a 30%, #6b8c5a 45%, #5a7c4a 60%, #4a6b3a 75%, #5a7c4a 90%, #3d5c2e 100%)';

  return (
    <div
      className={cn('flex items-center justify-center', className)}
      style={{ width: px, height: px }}
      role="img"
      aria-label="Loading"
    >
      {/* Strong perspective so depth is visible; tilt so we look down at the block */}
      <div
        className="relative w-full h-full"
        style={{
          perspective: `${Math.max(80, px * 1.2)}px`,
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          className="absolute"
          style={{
            width: px,
            height: px,
            left: 0,
            top: 0,
            transformStyle: 'preserve-3d',
            transformOrigin: `${half}px ${half}px ${half}px`,
            animation: 'minecraft-block-spin 1.2s linear infinite',
          }}
        >
          {/* 1. Top (y=0) - grass lid, horizontal face on top */}
          <div
            className="absolute border border-[#4a6b3a]"
            style={{
              width: px,
              height: px,
              left: 0,
              top: 0,
              transformOrigin: '50% 50%',
              transform: `translate3d(${half}px, 0px, ${half}px) rotateX(-90deg)`,
              background: grass,
              backgroundSize: `${Math.max(4, px / 3)}px ${Math.max(4, px / 3)}px`,
            }}
          />
          {/* 2. Bottom (y=px) - dirt */}
          <div
            className="absolute border border-[#3d2a08]"
            style={{
              width: px,
              height: px,
              left: 0,
              top: 0,
              transformOrigin: '50% 50%',
              transform: `translate3d(${half}px, ${px}px, ${half}px) rotateX(90deg)`,
              background: dirtDark,
              backgroundSize: '100% 6px',
            }}
          />
          {/* 3. Left (x=0) - dirt */}
          <div
            className="absolute border border-[#6b4e0a]"
            style={{
              width: px,
              height: px,
              left: 0,
              top: 0,
              transformOrigin: '50% 50%',
              transform: `translate3d(0px, ${half}px, ${half}px) rotateY(-90deg)`,
              background: dirtLight,
              backgroundSize: '100% 6px',
            }}
          />
          {/* 4. Right (x=px) - dirt */}
          <div
            className="absolute border border-[#3d2a08]"
            style={{
              width: px,
              height: px,
              left: 0,
              top: 0,
              transformOrigin: '50% 50%',
              transform: `translate3d(${px}px, ${half}px, ${half}px) rotateY(90deg)`,
              background: dirtDark,
              backgroundSize: '100% 6px',
            }}
          />
          {/* 5. Front (z=px, toward viewer) - dirt */}
          <div
            className="absolute border border-[#6b4e0a]"
            style={{
              width: px,
              height: px,
              left: 0,
              top: 0,
              transformOrigin: '50% 50%',
              transform: `translate3d(${half}px, ${half}px, ${px}px)`,
              background: dirtLight,
              backgroundSize: '100% 6px',
            }}
          />
          {/* 6. Back (z=0) - dirt */}
          <div
            className="absolute border border-[#3d2a08]"
            style={{
              width: px,
              height: px,
              left: 0,
              top: 0,
              transformOrigin: '50% 50%',
              transform: `translate3d(${half}px, ${half}px, 0px) rotateY(180deg)`,
              background: dirtDark,
              backgroundSize: '100% 6px',
            }}
          />
        </div>
      </div>
      <style>{`
        @keyframes minecraft-block-spin {
          from { transform: rotateX(-28deg) rotateY(0deg); }
          to { transform: rotateX(-28deg) rotateY(360deg); }
        }
      `}</style>
    </div>
  );
}