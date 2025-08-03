import React, { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ForBusinessesProps {
  className?: string;
}

const ForBusinesses = ({
  className = ""
}: ForBusinessesProps) => {
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

  return (
    <section id="for-businesses" ref={sectionRef} className={`py-20 bg-uplaud-purple ${className}`}>
      <div className="section-container">
        <h2 className="section-title fade-in-scroll text-white">
          Turn Customer Love Into <span className="gradient-text">Business Growth.</span>
        </h2>
        <p className="section-subtitle fade-in-scroll text-white">
          Uplaud helps businesses collect authentic reviews and transform satisfied customers into your most effective marketing channel.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mt-16">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold mb-6 fade-in-scroll">
              <span className="gradient-text">Turn Reviews to Revenue</span>
            </h3>
            <div className="space-y-6">
              <div className="flex items-start fade-in-scroll">
                <div className="bg-uplaud-purple/10 p-3 rounded-full mr-4 flex-shrink-0">
                  <svg className="w-6 h-6 text-uplaud-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">🚀Boost Reviews</h4>
                  <p className="text-slate-50">Get 60% more reviews via voice, text on WhatsApp.</p>
                </div>
              </div>
              <div className="flex items-start fade-in-scroll">
                <div className="bg-uplaud-purple/10 p-3 rounded-full mr-4 flex-shrink-0">
                  <svg className="w-6 h-6 text-uplaud-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path>
                  </svg>
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">📣 Supercharge Social Proof</h4>
                  <p className="text-slate-50">We transform reviews into viral, shareable social proof- that you can instantly share on social media.</p>
                </div>
              </div>
              <div className="flex items-start fade-in-scroll">
                <div className="bg-uplaud-purple/10 p-3 rounded-full mr-4 flex-shrink-0">
                  <svg className="w-6 h-6 text-uplaud-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                  </svg>
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">🎯 Maximize Revenue</h4>
                  <p className="text-slate-50">Turn reviews into warm leads, reward your best advocates.</p>
                </div>
              </div>
              <div className="flex items-start fade-in-scroll">
                <div className="bg-uplaud-purple/10 p-3 rounded-full mr-4 flex-shrink-0">
                  <svg className="w-6 h-6 text-uplaud-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path>
                  </svg>
                </div>
                <div>
                  <h4 className="text-xl font-semibold mb-2">🎁Customizable Rewards</h4>
                  <p className="text-slate-50">Design a loyalty program that aligns with your brand and resonates with your customers.</p>
                </div>
              </div>

              {/* Updated Button Section */}
              <div className="mt-10 fade-in-scroll flex justify-center">
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLScOFSp2wEGN50-d58e43laMRW2RuPbEr4407R34pZVw4eDYhA/viewform?usp=header"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="big-glow-btn font-extrabold text-lg sm:text-xl px-10 py-4 rounded-full bg-emerald-400 text-zinc-50 transition-all duration-200 shadow-lg hover:bg-emerald-300"
                  style={{ minWidth: 250, letterSpacing: ".03em" }}
                >
                  Start Growing Your Business!
                </a>
              </div>
            </div>
          </div>
          <div>
            <div className="bg-white rounded-xl shadow-xl overflow-hidden fade-in-scroll">
              <div className="p-4 bg-teal-300">
                <h3 className="font-bold text-lg text-uplaud-purple">Business Dashboard</h3>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-8">
                  <h4 className="font-bold text-xl text-gray-900">Performance Overview</h4>
                  <div className="bg-gray-100 rounded-lg px-3 py-1">
                    <span className="text-sm text-gray-500">Last 30 days</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Reviews Collected</p>
                    <div className="flex items-end">
                      <p className="text-2xl font-bold mr-2 text-uplaud-purple">248</p>
                      <p className="text-uplaud-green flex items-center text-sm">
                        <span className="mr-1">↑</span>
                        12%
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Avg. Rating</p>
                    <div className="flex items-end">
                      <p className="text-2xl font-bold mr-2 text-uplaud-purple">4.8</p>
                      <p className="text-uplaud-green flex items-center text-sm">
                        <span className="mr-1">↑</span>
                        0.3
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">Referrals Generated</p>
                    <div className="flex items-end">
                      <p className="text-2xl font-bold mr-2 text-uplaud-purple">72</p>
                      <p className="text-uplaud-green flex items-center text-sm">
                        <span className="mr-1">↑</span>
                        18%
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500 mb-1">New Customers</p>
                    <div className="flex items-end">
                      <p className="text-2xl font-bold mr-2 text-uplaud-purple">23</p>
                      <p className="text-uplaud-green flex items-center text-sm">
                        <span className="mr-1">↑</span>
                        5
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <h4 className="font-bold text-lg mb-4 text-gray-900">Recent Reviews</h4>
                  <div className="space-y-3">
                    <div className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center mb-2">
                        <div className="bg-uplaud-purple/10 rounded-full w-8 h-8 flex items-center justify-center mr-2">
                          <span className="font-bold text-uplaud-purple">JD</span>
                        </div>
                        <div>
                          <p className="font-medium">John D.</p>
                          <div className="flex">
                            <span className="text-yellow-400">★★★★★</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">"Great service! Will definitely recommend to friends."</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center mb-2">
                        <div className="bg-uplaud-purple/10 rounded-full w-8 h-8 flex items-center justify-center mr-2">
                          <span className="font-bold text-uplaud-purple">SM</span>
                        </div>
                        <div>
                          <p className="font-medium">Sarah M.</p>
                          <div className="flex">
                            <span className="text-yellow-400">★★★★</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">"Quality product and fast shipping. Very satisfied!"</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Custom styles for the big CTA button */}
      <style>{`
        .big-glow-btn {
          font-size: 1.35rem;
          font-weight: 800;
          padding: 1.4rem 2.7rem;
          box-shadow: 0 6px 24px 0 #10B98155, 0 1.5px 4px #3331;
          transition: 
            background 0.15s,
            color 0.14s,
            box-shadow 0.17s,
            transform 0.18s;
        }
        .big-glow-btn:hover {
          background: #34D399 !important;
          color: #222 !important;
          transform: scale(1.065);
          box-shadow: 0 2px 34px 6px #5EEAD4cc, 0 8px 24px 0 #10B98166, 0 2px 8px #261c4dcc;
          letter-spacing: 0.03em;
        }
      `}</style>
    </section>
  );
};

export default ForBusinesses;
