import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-green-800 text-white py-8 mt-8">
      {/* Center the content block */}
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-green-100">TiffinTrails</h3>
            <p className="text-green-200 text-sm">
              Reducing food waste, one rescue meal at a time. 
              Join us in building a sustainable future for food delivery.
            </p>
          </div>

          {/* Quick Links Section */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-green-100">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://github.com/YashDhavale/CSC-510-SE-Project" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-green-200 hover:text-white transition-colors duration-200 flex items-center text-sm"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.424 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483
                      0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608
                      1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951
                      0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.56 9.56 0 0112 6.844c.85.004 1.705.115
                      2.504.337 1.909-1.296 2.748-1.027 2.748-1.027.546 1.379.203 2.398.1 2.651.64.7 1.027 1.595 1.027 2.688 0 3.848-2.339
                      4.695-4.566 4.943.359.31.679.921.679 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022
                      12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  GitHub Repository
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/YashDhavale/CSC-510-SE-Project/blob/main/Proj2/SE_Proj2_Documentation%20-%202.pdf" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-green-200 hover:text-white transition-colors duration-200 flex items-center text-sm"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m0 0l-4-4m4 4l4-4M6 4h12a2 2 0 012 2v3m-2 11H6a2 2 0 01-2-2V6a2 2 0 012-2"
                    />
                  </svg>
                  Documentation
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-green-100">Contact Us</h3>
            <a
              href="mailto:tiffintrails.team@gmail.com"
              className="text-green-200 hover:text-white transition-colors duration-200 flex items-center text-sm"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 12H8m0 0l4-4m-4 4l4 4m7 4H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v11a2 2 0 01-2 2z"
                />
              </svg>
              tiffintrails.team@gmail.com
            </a>
            <p className="text-green-200 mt-4 text-xs">
              For inquiries, partnerships, or support
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-green-700 mt-8 pt-6 text-center">
          <p className="text-green-200 text-sm">
            © {new Date().getFullYear()} TiffinTrails. All rights reserved. |
            <span className="ml-2">CSC-510 Software Engineering Project</span>
          </p>
          <p className="text-green-300 text-xs mt-2">
            North Carolina State University
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
