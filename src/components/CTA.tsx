
import React from "react";
import { Button } from "@/components/ui/button";

const CTA = () => {
  return <section className="py-20 bg-[#5EEAD4] text-[#111827]">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-950">
            Ready to Transform Your Customer Feedback Into Growth?
          </h2>
          <p className="text-xl text-slate-950 mb-10 max-w-2xl mx-auto">
            Join businesses that are already using Uplaud to gather authentic reviews and turn happy customers into powerful referrals.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button size="lg" className="text-lg px-8 bg-[#6214a8] hover:bg-[#6214a8]/80 text-white" asChild>
              <a href="https://docs.google.com/forms/d/e/1FAIpQLScOFSp2wEGN50-d58e43laMRW2RuPbEr4407R34pZVw4eDYhA/viewform?usp=header" target="_blank" rel="noopener noreferrer">
                Get Started Free
              </a>
            </Button>
          </div>
          <p className="mt-6 text-slate-800 text-sm">
            No credit card required. Free plan available.
          </p>
        </div>
      </div>
    </section>;
};

export default CTA;
