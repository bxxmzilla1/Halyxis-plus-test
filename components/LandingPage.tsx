
import React from 'react';
import { SparklesIcon, UsersIcon, KeyIcon, WandIcon } from './IconComponents';

// Placeholder for feature icons
const FeatureIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-teal-900/20 border border-teal-500/20 mb-4 text-teal-400 shadow-lg shadow-teal-900/20">
        {children}
    </div>
);

const CheckMark = () => (
    <svg className="w-5 h-5 text-teal-400 flex-shrink-0 mr-3 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
    </svg>
);

// Example Image Grid component
const ImageGallery: React.FC = () => {
    // Using divs as placeholders for images to maintain layout
    const images = [
        "bg-rose-500", "bg-cyan-500", "bg-emerald-500",
        "bg-amber-500", "bg-violet-500", "bg-lime-500",
        "bg-fuchsia-500", "bg-sky-500", "bg-orange-500"
    ];
    return (
        <div className="grid grid-cols-3 gap-3 sm:gap-4 -rotate-3 opacity-60 mix-blend-screen">
            {images.map((color, index) => (
                 <div key={index} className="aspect-square rounded-xl shadow-2xl transition-transform duration-700 hover:scale-105 hover:shadow-teal-500/10">
                    <div className={`w-full h-full rounded-xl ${color} opacity-40 backdrop-blur-sm border border-white/5`}></div>
                </div>
            ))}
        </div>
    );
}

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-[#020408] text-gray-100 font-sans overflow-x-hidden selection:bg-teal-500/30">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SparklesIcon className="w-10 h-10 text-teal-400" />
            <h1 className="text-3xl font-bold tracking-tighter text-white">
              Halyxis
            </h1>
          </div>
          <button
            onClick={onGetStarted}
            className="bg-white/5 hover:bg-white/10 text-white border border-white/10 text-sm font-medium px-8 py-2.5 rounded-full transition-all backdrop-blur-md"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative pt-32 pb-16 sm:pt-48 sm:pb-32">
         {/* Subtle background glow */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-full bg-teal-900/10 blur-[120px] pointer-events-none"></div>
         
         <div className="container mx-auto px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="text-center lg:text-left">
                    <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-[1.1] tracking-tight mb-8">
                        The Operating System <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-200 via-teal-400 to-teal-500">
                            For Digital Identity.
                        </span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-light">
                        Professional persona synthesis for high-volume creators. Unlimited generation. BYO infrastructure. The ultimate tool for scaling influence.
                    </p>
                    
                    <div className="mt-12 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5">
                        <button
                            onClick={onGetStarted}
                            className="w-full sm:w-auto bg-teal-500 hover:bg-teal-400 text-black font-bold px-10 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(20,184,166,0.3)] hover:shadow-[0_0_30px_rgba(20,184,166,0.5)]"
                        >
                            Start Creating
                        </button>
                        <span className="text-sm text-gray-500 font-medium px-4 tracking-wide">
                            CREATOR PLAN ACCESS INCLUDED
                        </span>
                    </div>
                </div>
                <div className="hidden lg:block relative perspective-1000">
                    <ImageGallery />
                </div>
            </div>
         </div>
      </main>

      {/* Value Props Section */}
      <section className="py-24 bg-[#05070a] border-y border-white/5">
        <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-20">
                <h3 className="text-3xl font-bold text-white mb-6 tracking-tight">Unrestricted Creative Power</h3>
                <p className="text-gray-400 text-lg font-light leading-relaxed">
                    We removed the limits so you can focus on the output. Halyxis is designed for high-volume, professional workflows.
                </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Feature 1 */}
                <div className="bg-[#0a0c10] p-8 rounded-3xl border border-white/5 hover:border-teal-500/30 transition-all group hover:-translate-y-1 duration-300">
                    <FeatureIcon><WandIcon className="w-6 h-6" /></FeatureIcon>
                    <h4 className="text-lg font-bold text-white mb-3">Simple Prompts</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Stop fighting with complex engineering. Our engine translates simple instructions into high-end, cinematic results instantly.
                    </p>
                </div>

                {/* Feature 2 */}
                <div className="bg-[#0a0c10] p-8 rounded-3xl border border-white/5 hover:border-teal-500/30 transition-all group hover:-translate-y-1 duration-300">
                    <FeatureIcon><UsersIcon className="w-6 h-6" /></FeatureIcon>
                    <h4 className="text-lg font-bold text-white mb-3">Multi-Person Scenes</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Generate complex ensembles with ease. Perfect identity replication for multiple subjects in a single cohesive scene.
                    </p>
                </div>

                {/* Feature 3 */}
                <div className="bg-[#0a0c10] p-8 rounded-3xl border border-white/5 hover:border-teal-500/30 transition-all group hover:-translate-y-1 duration-300">
                    <FeatureIcon><SparklesIcon className="w-6 h-6" /></FeatureIcon>
                    <h4 className="text-lg font-bold text-white mb-3">Hyper-Realistic</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Industry-leading fidelity. Achieve photorealistic textures, lighting, and anatomy without the "AI look."
                    </p>
                </div>

                {/* Feature 4 */}
                <div className="bg-[#0a0c10] p-8 rounded-3xl border border-white/5 hover:border-teal-500/30 transition-all group hover:-translate-y-1 duration-300">
                    <FeatureIcon><KeyIcon className="w-6 h-6" /></FeatureIcon>
                    <h4 className="text-lg font-bold text-white mb-3">Bring Your Own Key</h4>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Connect your own Gemini API key for unlimited generation volume at cost. No hidden token markups.
                    </p>
                </div>
            </div>
        </div>
      </section>

      {/* Pricing Strip */}
      <section className="py-24 relative overflow-hidden">
          {/* Decorative gradients */}
          <div className="absolute top-1/2 left-0 w-1/3 h-full bg-teal-900/5 blur-3xl rounded-full -translate-y-1/2 pointer-events-none"></div>

          <div className="container mx-auto px-6 relative z-10">
              <div className="bg-[#080a0e] rounded-[2rem] border border-white/10 relative overflow-hidden shadow-2xl">
                  
                  <div className="relative z-10 grid md:grid-cols-2 gap-12 lg:gap-20 p-10 md:p-16 items-center">
                      
                      {/* Left Column: Brand & Promise */}
                      <div className="text-left space-y-8">
                          <div>
                            <h3 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tighter mb-4">
                                The Creator Plan
                            </h3>
                            <div className="h-1.5 w-24 bg-teal-500 rounded-full"></div>
                          </div>
                          <p className="text-2xl md:text-3xl text-gray-300 font-light leading-relaxed max-w-md">
                              Built for creators who scale.
                          </p>
                      </div>

                      {/* Right Column: Pricing & Action */}
                      <div className="bg-[#0f1115] rounded-3xl p-8 md:p-10 border border-white/5 shadow-xl relative group">
                          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                          
                          <div className="flex items-baseline gap-2 mb-10">
                              <span className="text-5xl md:text-6xl font-bold text-white tracking-tight">$89</span>
                              <span className="text-lg text-gray-500 font-medium">/ month</span>
                          </div>

                          <ul className="space-y-6 mb-10">
                              <li className="flex items-start">
                                  <CheckMark />
                                  <span className="text-gray-300 text-lg font-light">Unlimited hyper-realistic generation</span>
                              </li>
                              <li className="flex items-start">
                                  <CheckMark />
                                  <span className="text-gray-300 text-lg font-light">Simple prompts, cinematic results</span>
                              </li>
                              <li className="flex items-start">
                                  <CheckMark />
                                  <span className="text-gray-300 text-lg font-light">Multi-person image generation</span>
                              </li>
                              <li className="flex items-start">
                                  <CheckMark />
                                  <span className="text-gray-300 text-lg font-light">Bring your own API key</span>
                              </li>
                          </ul>
                          
                          <button
                            onClick={onGetStarted}
                            className="w-full bg-teal-600 hover:bg-teal-500 text-white text-lg font-bold px-8 py-4 rounded-xl shadow-lg shadow-teal-900/20 transition-all transform hover:translate-y-[-1px] active:translate-y-[1px]"
                          >
                              Get Started Now
                          </button>
                          <p className="mt-5 text-center text-xs text-gray-500 uppercase tracking-widest font-semibold">Cancel anytime</p>
                      </div>
                  </div>
              </div>
          </div>
      </section>

       {/* Footer */}
      <footer className="bg-[#020408] border-t border-white/5 pt-12 pb-12">
          <div className="container mx-auto px-6 text-center">
              <p className="text-gray-600 text-sm font-medium">&copy; {new Date().getFullYear()} Halyxis Creator Studio. All rights reserved.</p>
          </div>
      </footer>
    </div>
  );
};
