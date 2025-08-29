// src/components/DisclaimerPolicy.jsx (or your preferred path)
import React from 'react';
import Navbar from './Navbar'; // Adjust path if Navbar.jsx is elsewhere

export default function DisclaimerPolicy() {
  return (
    <div className="min-h-screen bg-gray-100 text-black flex flex-col lg:flex-row w-[130%] overflow-x-hidden">
      <Navbar />
      <main className="flex-1 h-full overflow-y-auto px-4 md:px-6 py-8 ml-0 lg:ml-64">
        <div className="max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-6 border-b pb-4">
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

            <h2>External Links Disclaimer</h2>
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

            <h2>Professional Disclaimer</h2>
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
            
            <h2>Testimonials Disclaimer</h2>
            <p>
              The Service may contain testimonials by users of our products and/or services. These testimonials 
              reflect the real-life experiences and opinions of such users. However, the experiences are personal 
              to those particular users, and may not necessarily be representative of all users of our products 
              and/or services. We do not claim, and you should not assume, that all users will have the same 
              experiences. YOUR INDIVIDUAL RESULTS MAY VARY.
            </p>

            <h2>Contact Us</h2>
            <p>
              Should you have any feedback, comments, requests for technical support or other inquiries, 
              please contact us by email: [Your Contact Email Address].
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}