import React from 'react';

const Background = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base Clean Light Background */}
      <div className="absolute inset-0 bg-[#f8fafc]"></div>
      
      {/* Mesh Gradient Layer 1 */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[100px] animate-mesh"></div>
      
      {/* Mesh Gradient Layer 2 */}
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-500/10 blur-[100px] animate-mesh" style={{ animationDelay: '-5s' }}></div>
      
      {/* Subtle Glow 1 */}
      <div className="absolute top-1/4 right-[10%] w-[30%] h-[30%] rounded-full bg-indigo-500/5 blur-[80px] animate-glow"></div>
      
      {/* Subtle Glow 2 */}
      <div className="absolute bottom-1/4 left-[10%] w-[25%] h-[25%] rounded-full bg-emerald-500/5 blur-[80px] animate-glow" style={{ animationDelay: '-8s' }}></div>

      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay pointer-events-none" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>
    </div>
  );
};

export default Background;
