import React from 'react';
import Navbar from './Navbar'; // Adjust path if Navbar.jsx is elsewhere

export default function DisclaimerPolicy() {
  return (
    // Updated main container with the consistent gradient background
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-900 flex flex-col lg:flex-row overflow-hidden">
      <Navbar />
      
      {/* Main content area with centering and sidebar offset */}
      <main className="flex-1 h-full overflow-y-auto px-4 md:px-8 py-8 ml-0 lg:ml-64 flex justify-center animate-slideDown">
        
        {/* Content card updated with rounded-2xl shadow-2xl styling and background flair */}
        <div className="max-w-4xl w-full bg-white p-6 md:p-8 rounded-2xl shadow-2xl relative overflow-hidden">
            {/* Gradient overlay for card flair */}
            <div className='absolute inset-0 bg-gradient-to-br from-white via-indigo-50 to-purple-50 opacity-20 animate-bg-gradient-flow-diagonal z-0'></div>
            <div className='relative z-10'>
                <h1 className="text-2xl md:text-3xl font-bold text-indigo-700 mb-6 border-b pb-4">
                    Disclaimer Policy
                </h1>

                <div className="space-y-4 text-gray-700 prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none">
                    <p><strong>Last updated: [Insert Date Here - e.g., October 26, 2023]</strong></p>

                    <p>
                        The information provided by Devangi Outdoor Advertising ("we," "us," or "our") on 
                        [Your Website/Application Name, e.g., Devangi Admin Panel] (the "Service") is for general informational 
                        purposes only. All information on the Service is provided in good faith, however, 
                        we make no representation or warranty of any kind, express or implied, regarding 
                        the accuracy, adequacy, validity, reliability, availability, or completeness 
                        of any information on the Service.
                    </p>
                    <p>
                        UNDER NO CIRCUMSTANCE SHALL WE HAVE ANY LIABILITY TO YOU FOR ANY LOSS OR DAMAGE
                        OF ANY KIND INCURRED AS A RESULT OF THE USE OF THE SERVICE OR RELIANCE ON ANY
                        INFORMATION PROVIDED ON THE SERVICE. YOUR USE OF THE SERVICE AND YOUR RELIANCE
                        ON ANY INFORMATION ON THE SERVICE IS SOLELY AT YOUR OWN RISK.
                    </p>

                    <h2 className="text-xl font-bold pt-4 text-gray-800">External Links Disclaimer</h2>
                    <p>
                        The Service may contain (or you may be sent through the Service) links to other websites or 
                        content belonging to or originating from third parties or links to websites and features 
                        in banners or other advertising. Such external links are not investigated, monitored, 
                        or checked for accuracy, adequacy, validity, reliability, availability, or 
                        completeness by us.
                    </p>
                    <p>
                        WE DO NOT WARRANT, ENDORSE, GUARANTEE, OR ASSUME RESPONSIBILITY FOR THE ACCURACY OR 
                        RELIABILITY OF ANY INFORMATION OFFERED BY THIRD-PARTY WEBSITES LINKED THROUGH THE SERVICE 
                        OR ANY WEBSITE OR FEATURE LINKED IN ANY BANNER OR OTHER ADVERTISING. WE WILL NOT BE A 
                        PARTY TO OR IN ANY WAY BE RESPONSIBLE FOR MONITORING ANY TRANSACTION BETWEEN YOU AND 
                        THIRD-PARTY PROVIDERS OF PRODUCTS OR SERVICES.
                    </p>

                    <h2 className="text-xl font-bold pt-4 text-gray-800">Professional Disclaimer</h2>
                    <p>
                        The Service cannot and does not contain professional [e.g., legal, financial, business] advice. 
                        The [e.g., legal, financial, business] information is provided for general informational and educational 
                        purposes only and is not a substitute for professional advice.
                    </p>
                    <p>
                        Accordingly, before taking any actions based upon such information, we encourage you to 
                        consult with the appropriate professionals. We do not provide any kind of 
                        professional [e.g., legal, financial, business] advice. THE USE OR RELIANCE OF ANY INFORMATION CONTAINED ON THIS SERVICE 
                        IS SOLELY AT YOUR OWN RISK.
                    </p>
                    
                    <h2 className="text-xl font-bold pt-4 text-gray-800">Testimonials Disclaimer</h2>
                    <p>
                        The Service may contain testimonials by users of our products and/or services. These testimonials 
                        reflect the real-life experiences and opinions of such users. However, the experiences are personal 
                        to those particular users, and may not necessarily be representative of all users of our products 
                        and/or services. We do not claim, and you should not assume, that all users will have the same 
                        experiences. YOUR INDIVIDUAL RESULTS MAY VARY.
                    </p>

                    <h2 className="text-xl font-bold pt-4 text-gray-800">Contact Us</h2>
                    <p>
                        Should you have any feedback, comments, requests for technical support or other inquiries, 
                        please contact us by email: <strong className="text-indigo-600">[Your Contact Email Address]</strong>.
                    </p>
                </div>
            </div>
        </div>
      </main>
      {/* Global CSS for Animations (copied from PrivacyPolicy.jsx) */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes bg-gradient-flow-diagonal { 0% { background-position: 0% 0%; } 100% { background-position: 100% 100%; } }
        .animate-bg-gradient-flow-diagonal {
          background-size: 200% 200%;
          animation: bg-gradient-flow-diagonal 10s linear infinite;
        }
        .animate-slideDown { animation: slideDown 0.4s ease-out; }
      `}</style>
    </div>
  );
}
