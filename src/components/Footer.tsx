
import React from "react";
import { Link } from "react-router-dom";
const Footer = () => {
  return <footer className="bg-gray-50 pt-16 pb-8">
      <div className="container max-w-7xl mx-auto sm:px-6 lg:px-8 px-0">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          

          <div>
            
            <ul className="space-y-3">
              <li>
                
              </li>
              
              
            </ul>
          </div>

          <div>
            
            <ul className="space-y-3">
              <li>
                
              </li>
              <li>
                
              </li>
              <li>
                
              </li>
            </ul>
          </div>

          <div>
            
            <ul className="space-y-3">
              <li>
                
              </li>
              <li>
                
              </li>
              <li>
                
              </li>
              <li>
                
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} Uplaud. All rights reserved.
          </p>
          <div className="flex justify-center space-x-6 mt-4">
            <Link to="/privacy-policy" className="text-sm text-gray-500 hover:text-[#6214a8] transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="text-sm text-gray-500 hover:text-[#6214a8] transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;
