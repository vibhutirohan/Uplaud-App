
import React, { useRef, useEffect } from "react";
interface HowItWorksProps {
  className?: string;
}
const HowItWorks = ({
  className = ""
}: HowItWorksProps) => {
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
  return <section id="how-it-works" ref={sectionRef} className={`py-20 ${className}`}>
      <div className="section-container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          <div className="backdrop-blur-md rounded-xl shadow-md p-8 relative fade-in-scroll hover:shadow-lg transition-all duration-300 border border-white/20 bg-uplaud-purple">
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-[#5EEAD4] text-[#111827] w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold">
              1
            </div>
            <div className="text-center mt-4">
              <div className="bg-white/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-[#5EEAD4]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Invite</h3>
              <p className="text-gray-100">Send review requests to your customers via WhatsApp- or any other channel, after their purchase or service experience.</p>
            </div>
          </div>
          
          <div className="backdrop-blur-md rounded-xl shadow-md p-8 relative fade-in-scroll hover:shadow-lg transition-all duration-300 border border-white/20 bg-uplaud-purple">
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-[#5EEAD4] text-[#111827] w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold">
              2
            </div>
            <div className="text-center mt-4">
              <div className="bg-white/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-[#5EEAD4]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Feedback</h3>
              <p className="text-gray-100">Customers share their experience through a conversational WhatsApp flow that feels natural and engaging. Collect reviews via text, or voice notes- in over 50 languages.</p>
            </div>
          </div>
          
          <div className="backdrop-blur-md rounded-xl shadow-md p-8 relative fade-in-scroll hover:shadow-lg transition-all duration-300 border border-white/20 bg-uplaud-purple">
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-[#5EEAD4] text-[#111827] w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold">
              3
            </div>
            <div className="text-center mt-4">
              <div className="bg-white/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-[#5EEAD4]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0l-8 8-4-4-6 6"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">Growth</h3>
              <p className="text-gray-100">We convert reviews to one click referrals. Delight customers, reward loyalty, and grow 3X faster.</p>
            </div>
          </div>
        </div>
        
        <div className="mt-16 text-center">
          <div className="mt-6 fade-in-scroll">
            <a 
              href="https://docs.google.com/forms/d/e/1FAIpQLScOFSp2wEGN50-d58e43laMRW2RuPbEr4407R34pZVw4eDYhA/viewform?usp=header" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-[#5EEAD4] hover:bg-[#5EEAD4]/80 text-[#111827] font-medium px-8 py-3 rounded-lg flex items-center justify-center mx-auto"
            >
              Start Collecting Reviews
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>;
};
export default HowItWorks;
