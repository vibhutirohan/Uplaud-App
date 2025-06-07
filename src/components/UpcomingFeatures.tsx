
import React, { useRef, useEffect } from "react";
interface UpcomingFeaturesProps {
  className?: string;
}
const UpcomingFeatures = ({
  className = ""
}: UpcomingFeaturesProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("appear");
        }
      });
    }, {
      threshold: 0.1
    });
    const section = sectionRef.current;
    if (section) {
      const fadeElements = section.querySelectorAll(".fade-in-scroll");
      fadeElements.forEach(element => {
        observer.observe(element);
      });
    }
    return () => {
      if (section) {
        const fadeElements = section.querySelectorAll(".fade-in-scroll");
        fadeElements.forEach(element => {
          observer.unobserve(element);
        });
      }
    };
  }, []);
  return <section id="features" ref={sectionRef} className={`py-20 bg-white ${className}`}>
      <div className="section-container">
        <h2 className="section-title fade-in-scroll text-gray-950">
          Coming <span className="gradient-text text-emerald-600">Soon</span>
        </h2>
        <p className="section-subtitle fade-in-scroll text-zinc-950">
          We're constantly evolving to bring you the best tools for customer feedback and referrals.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="rounded-xl p-8 transition-all duration-300 hover:shadow-md fade-in-scroll bg-teal-400">
            <div className="bg-uplaud-purple/10 rounded-full w-16 h-16 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-uplaud-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900">Verified Badges</h3>
            <p className="text-slate-700">Boost credibility with verified customer badges displayed alongside reviews to add an extra layer of trust.</p>
          </div>
          
          <div className="rounded-xl p-8 transition-all duration-300 hover:shadow-md fade-in-scroll bg-teal-400">
            <div className="bg-uplaud-purple/10 rounded-full w-16 h-16 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-uplaud-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900">Points Marketplace</h3>
            <p className="text-slate-700">
              A dynamic marketplace where customers can redeem their earned points for products, services, and exclusive offers.
            </p>
          </div>
          
          <div className="rounded-xl p-8 transition-all duration-300 hover:shadow-md fade-in-scroll bg-teal-400">
            <div className="bg-uplaud-purple/10 rounded-full w-16 h-16 flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-uplaud-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path>
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900">Premium Loyalty Programs</h3>
            <p className="text-slate-700">
              Advanced loyalty tiers with exclusive benefits for your most valuable customers and brand advocates.
            </p>
          </div>
        </div>
        
        <div className="mt-16">
          
        </div>
      </div>
    </section>;
};
export default UpcomingFeatures;
