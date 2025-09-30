import React from 'react';
import Navbar from './Navbar'; // Adjust path if Navbar.jsx is elsewhere

export default function PrivacyPolicy() {
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
                    Privacy Policy
                </h1>
                
                <div className="space-y-4 text-gray-700 prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none">
                    <p><strong>Last updated: [Insert Date Here - e.g., October 26, 2023]</strong></p>

                    <p>
                        Devangi Outdoor Advertising ("us", "we", or "our") operates the [Your Website/Application Name, e.g., Devangi Admin Panel] 
                        (hereinafter referred to as the "Service").
                    </p>

                    <p>
                        This page informs you of our policies regarding the collection, use, and disclosure of personal
                        data when you use our Service and the choices you have associated with that data.
                    </p>

                    <p>
                        We use your data to provide and improve the Service. By using the Service, you agree to the
                        collection and use of information in accordance with this policy. Unless otherwise defined in
                        this Privacy Policy, the terms used in this Privacy Policy have the same meanings as in our
                        Terms and Conditions.
                    </p>

                    <h2 className="text-xl font-bold pt-4 text-gray-800">Information Collection and Use</h2>
                    <p>
                        We collect several different types of information for various purposes to provide and improve
                        our Service to you.
                    </p>

                    <h3 className="text-lg font-bold text-gray-800">Types of Data Collected</h3>
                    
                    <h4 className="text-base font-semibold text-gray-700">Personal Data</h4>
                    <p>
                        While using our Service, we may ask you to provide us with certain personally identifiable
                        information that can be used to contact or identify you ("Personal Data"). Personally
                        identifiable information may include, but is not limited to:
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-4">
                        <li>Email address</li>
                        <li>First name and last name</li>
                        <li>Phone number</li>
                        <li>Company Name</li>
                        <li>Address, State, Province, ZIP/Postal code, City</li>
                        <li>Usage Data</li>
                    </ul>

                    <h4 className="text-base font-semibold text-gray-700">Usage Data</h4>
                    <p>
                        We may also collect information on how the Service is accessed and used ("Usage Data").
                        This Usage Data may include information such as your computer's Internet Protocol address
                        (e.g. IP address), browser type, browser version, the pages of our Service that you visit,
                        the time and date of your visit, the time spent on those pages, unique device identifiers
                        and other diagnostic data.
                    </p>

                    <h2 className="text-xl font-bold pt-4 text-gray-800">Use of Data</h2>
                    <p>Devangi Outdoor Advertising uses the collected data for various purposes:</p>
                    <ul className="list-disc list-inside space-y-1 pl-4">
                        <li>To provide and maintain the Service</li>
                        <li>To notify you about changes to our Service</li>
                        <li>To allow you to participate in interactive features of our Service when you choose to do so</li>
                        <li>To provide customer care and support</li>
                        <li>To provide analysis or valuable information so that we can improve the Service</li>
                        <li>To monitor the usage of the Service</li>
                        <li>To detect, prevent and address technical issues</li>
                    </ul>

                    <h2 className="text-xl font-bold pt-4 text-gray-800">Security of Data</h2>
                    <p>
                        The security of your data is important to us, but remember that no method of transmission
                        over the Internet, or method of electronic storage is 100% secure. While we strive to
                        use commercially acceptable means to protect your Personal Data, we cannot guarantee its
                        absolute security.
                    </p>

                    <h2 className="text-xl font-bold pt-4 text-gray-800">Changes to This Privacy Policy</h2>
                    <p>
                        We may update our Privacy Policy from time to time. We will notify you of any changes by
                        posting the new Privacy Policy on this page.
                    </p>
                    <p>
                        We will let you know via email and/or a prominent notice on our Service, prior to the
                        change becoming effective and update the "last updated" date at the top of this Privacy Policy.
                    </p>
                    <p>
                        You are advised to review this Privacy Policy periodically for any changes. Changes to this
                        Privacy Policy are effective when they are posted on this page.
                    </p>

                    <h2 className="text-xl font-bold pt-4 text-gray-800">Contact Us</h2>
                    <p>
                        If you have any questions about this Privacy Policy, please contact us:
                    </p>
                    <ul className="list-disc list-inside space-y-1 pl-4">
                        <li>By email: <strong className="text-indigo-600">[Your Contact Email Address]</strong></li>
                        <li>By visiting this page on our website: <strong className="text-indigo-600">[Link to Your Contact Page, if any]</strong></li>
                        <li>By phone number: <strong className="text-indigo-600">[Your Contact Phone Number]</strong></li>
                    </ul>
                </div>
            </div>
        </div>
      </main>
      {/* Global CSS for Animations */}
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
