import React, { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Share, Users } from "lucide-react";

const WHATSAPP_GREEN = "#25D366";

const ForCustomers = () => {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("appear");
        }
      });
    }, { threshold: 0.1 });

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

  return (
    <section id="for-customers" ref={sectionRef} className="py-20 bg-white">
      <div className="section-container">
        <h2 className="section-title fade-in-scroll text-slate-950">
          Trusted Word of Mouth,{" "}
          <span
            className="gradient-text text-gray-800"
            style={{
              background: `linear-gradient(90deg, ${WHATSAPP_GREEN} 0%, ${WHATSAPP_GREEN} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}
          >
            Straight From WhatsApp.
          </span>
        </h2>
        <p className="section-subtitle fade-in-scroll text-slate-950">
          Uplaud makes it easy to share honest feedback and earn rewards for your loyalty (coming soon).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mt-16">
          <div className="order-2 md:order-1">
            <div className="bg-white rounded-xl shadow-xl overflow-hidden fade-in-scroll">
              <div className="bg-uplaud-purple p-4">
                <h3 className="text-white font-bold text-lg">Your Rewards Dashboard</h3>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <p className="text-gray-600 mb-1">Available Points</p>
                    <p className="text-3xl font-bold text-uplaud-purple">450</p>
                  </div>
                  <div className="bg-uplaud-purple/10 p-4 rounded-full">
                    <svg className="w-8 h-8 text-uplaud-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                </div>
                <div className="mb-6">
                  <p className="text-gray-600 mb-1">Recent Activity</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                      <div>
                        <p className="font-medium text-uplaud-purple">Review Submitted</p>
                        <p className="text-sm text-gray-500">Tech Gadgets Store</p>
                      </div>
                      <p className="text-uplaud-green font-bold">+100</p>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                      <div>
                        <p className="font-medium text-uplaud-purple">Referral Bonus</p>
                        <p className="text-sm text-gray-500">Friend signed up</p>
                      </div>
                      <p className="text-uplaud-green font-bold">+250</p>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                      <div>
                        <p className="font-medium text-uplaud-purple">Points Redeemed</p>
                        <p className="text-sm text-gray-500">$10 Gift Card</p>
                      </div>
                      <p className="text-red-500 font-bold">-200</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-gray-600 mb-3">Available Rewards</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-3 hover:border-uplaud-purple cursor-pointer transition-colors">
                      <p className="font-medium text-uplaud-purple">$5 Gift Card</p>
                      <p className="text-sm text-gray-800">200 points</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-3 hover:border-uplaud-purple cursor-pointer transition-colors">
                      <p className="font-medium text-uplaud-purple">Free Coffee</p>
                      <p className="text-sm text-gray-900">150 points</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <h3 className="text-2xl md:text-3xl font-bold mb-6 fade-in-scroll text-gray-900">
              Your feedback is{" "}
              <span
                className="gradient-text font-bold text-zinc-800"
                style={{
                  background: `linear-gradient(90deg, ${WHATSAPP_GREEN} 0%, ${WHATSAPP_GREEN} 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text"
                }}
              >
                valuable
              </span>
            </h3>
            <div className="space-y-6">
              {/* Your list of features remains unchanged */}
              <div className="flex items-start fade-in-scroll">
                <div className="bg-uplaud-purple/10 p-3 rounded-full mr-4 flex-shrink-0">
                  <svg className="w-6 h-6 text-uplaud-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                  </svg>
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2 text-uplaud-purple">Verified Authenticity</h4>
                  <p className="text-gray-600">All reviews are from real customers. No fake profiles or generated content.</p>
                </div>
              </div>
              <div className="flex items-start fade-in-scroll">
                <div className="bg-uplaud-purple/10 p-3 rounded-full mr-4 flex-shrink-0">
                  <svg className="w-6 h-6 text-uplaud-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2 text-uplaud-purple">Earn While You Share</h4>
                  <p className="text-gray-600">Get points for every review and referral. Redeem for rewards you'll actually want.</p>
                </div>
              </div>
              <div className="flex items-start fade-in-scroll">
                <div className="bg-uplaud-purple/10 p-3 rounded-full mr-4 flex-shrink-0">
                  <svg className="w-6 h-6 text-uplaud-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2 text-uplaud-purple">Quick and Convenient</h4>
                  <p className="text-gray-600">Share feedback directly on WhatsApp. No apps to install or complicated forms to fill out.</p>
                </div>
              </div>
            </div>
            {/* Discover recommendations section */}
            <div className="mt-10 p-5 bg-white rounded-xl shadow-md fade-in-scroll">
              <h3 className="text-xl md:text-2xl mb-4 font-bold text-uplaud-purple">
                Discover what your friends are recommending
              </h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center text-white text-sm border-2 border-white">JD</div>
                  <div className="w-10 h-10 rounded-full bg-green-400 flex items-center justify-center text-white text-sm border-2 border-white">KL</div>
                  <div className="w-10 h-10 rounded-full bg-purple-400 flex items-center justify-center text-white text-sm border-2 border-white">MN</div>
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm border-2 border-white">+8</div>
                </div>
                <p className="text-gray-600 text-sm">8 friends are active in Uplaud Circles</p>
              </div>
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 rounded-full bg-uplaud-purple/10 flex items-center justify-center mr-2">
                      <span className="font-bold text-uplaud-purple">AK</span>
                    </div>
                    <div>
                      <p className="font-medium">Alex K.</p>
                      <p className="text-xs text-gray-500">2 hours ago</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">"Just tried the new coffee place downtown - amazing pastries and great atmosphere!"</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 rounded-full bg-uplaud-purple/10 flex items-center justify-center mr-2">
                      <span className="font-bold text-uplaud-purple">JT</span>
                    </div>
                    <div>
                      <p className="font-medium">Jamie T.</p>
                      <p className="text-xs text-gray-500">Yesterday</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">"This tech repair shop saved my laptop! Great service and reasonable prices."</p>
                </div>
              </div>
              <div className="flex space-x-3 mt-4">
                <Button variant="outline" size="sm" className="flex items-center text-uplaud-purple rounded-sm" asChild>
                  <a href="https://docs.google.com/forms/d/e/1FAIpQLScOFSp2wEGN50-d58e43laMRW2RuPbEr4407R34pZVw4eDYhA/viewform?usp=header" target="_blank" rel="noopener noreferrer">
                    <Share className="h-4 w-4 mr-1" /> Share Recommendation
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="flex items-center text-uplaud-purple" asChild>
                  {/* Extra button if you want */}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForCustomers;
