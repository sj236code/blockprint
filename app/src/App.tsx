import { useState } from 'react';
import { ParticleBackground } from '@/components/ParticleBackground';
import { Hero } from '@/sections/Hero';
import { UploadSection } from '@/sections/UploadSection';
import { BlueprintSection } from '@/sections/BlueprintSection';
import { HowItWorks } from '@/sections/HowItWorks';
import { Footer } from '@/sections/Footer';
import type { Blueprint } from '@/types';

function App() {
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);

  const handleBlueprintGenerated = (newBlueprint: Blueprint) => {
    setBlueprint(newBlueprint);
  };

  const handleReset = () => {
    setBlueprint(null);
    // Scroll back to upload section
    const uploadSection = document.getElementById('upload-section');
    if (uploadSection) {
      uploadSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen text-white overflow-x-hidden block-pattern bg-gradient-to-b from-[#87CEEB] via-[#87CEEB]/30 to-[#2d5016]">
      {/* Particle Background */}
      <ParticleBackground />
      
      {/* Main Content */}
      <main className="relative z-10">
        <Hero />
        <UploadSection onBlueprintGenerated={handleBlueprintGenerated} />
        <BlueprintSection blueprint={blueprint} onReset={handleReset} />
        <HowItWorks />
        <Footer />
      </main>
    </div>
  );
}

export default App;