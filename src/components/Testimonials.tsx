import React, { useRef, useEffect } from "react";
const Testimonials = () => {
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
  return <section ref={sectionRef} className="py-20 bg-uplaud-purple">
      <div className="section-container">
        <h2 className="section-title fade-in-scroll font-normal text-white">
          Trusted by <span className="gradient-text">Forward-Thinking Businesses</span>
        </h2>
        <p className="section-subtitle fade-in-scroll text-white">
          See what our customers are saying about the Uplaud experience.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white rounded-xl shadow-md p-8 fade-in-scroll">
            <div className="flex items-center mb-6">
              <div className="bg-uplaud-purple/10 rounded-full w-12 h-12 flex items-center justify-center mr-3">
                <span className="font-bold text-uplaud-purple">BV</span>
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Balaji Venkataswamy</h4>
                <p className="text-sm text-gray-950">Balaji On Brand</p>
              </div>
            </div>
            <div className="mb-4">
              <span className="text-yellow-400 text-lg">★★★★★</span>
            </div>
            <p className="text-gray-600">
              "Uplaud has transformed how we collect customer feedback. Our review rate increased by 65% and the quality of insights is exceptional. The referral system has been a game-changer for our growth."
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-8 fade-in-scroll">
            <div className="flex items-center mb-6">
              <div className="bg-uplaud-purple/10 rounded-full w-12 h-12 flex items-center justify-center mr-3">
                <span className="font-bold text-uplaud-purple">CP</span>
              </div>
              <div>
                <h4 className="font-bold text-slate-950">Charu Pel</h4>
                <p className="text-sm text-gray-950">GRC3</p>
              </div>
            </div>
            <div className="mb-4">
              <span className="text-yellow-400 text-lg">★★★★★</span>
            </div>
            <p className="text-gray-600">"As a new business, authentic word-of-mouth is everything. Uplaud made it simple to collect reviews and turn our happy customers into our best marketing channel. Worth every penny!"</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-8 fade-in-scroll">
            <div className="flex items-center mb-6">
              <div className="bg-uplaud-purple/10 rounded-full w-12 h-12 flex items-center justify-center mr-3">
                <span className="font-bold text-uplaud-purple">BV</span>
              </div>
              <div>
                <h4 className="font-bold text-slate-950">Birjoo Vaishnav</h4>
                <p className="text-sm text-slate-950">Art of Living</p>
              </div>
            </div>
            <div className="mb-4">
              <span className="text-yellow-400 text-lg">★★★★★</span>
            </div>
            <p className="text-gray-600">This is an awesome creative service which will benefit millions!</p>
          </div>
        </div>

        <div className="mt-16 fade-in-scroll">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
          </div>
        </div>
      </div>
    </section>;
};
export default Testimonials;