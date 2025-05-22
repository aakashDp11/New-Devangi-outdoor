import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import PdfLogo from '../assets/pdf.png'
const Card = ({ children, className = '', ...props }) => (
  <div className={`bg-white border shadow-sm rounded-xl  ${className}`} {...props}>
    {children}
  </div>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`p-3 py-2 ${className}`}>{children}</div>
);

export default function FinancePage() {
  const [data, setData] = useState({});
  const [currentView, setCurrentView] = useState('year'); // 'year' | 'month' | 'documents'
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/pipeline/finance');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Error fetching finance data:', err);
      }
    };

    fetchData();
  }, []);

  const handleBack = () => {
    if (currentView === 'documents') {
      setCurrentView('month');
      setSelectedMonth(null);
    } else if (currentView === 'month') {
      setCurrentView('year');
      setSelectedYear(null);
    }
  };

  const journey = () => {
    if (currentView === 'year') return '';
    if (currentView === 'month') return `📁 ${selectedYear}`;
    if (currentView === 'documents') return `📁 ${selectedYear} / 📂 ${selectedMonth}`;
  };

  return (
    <div className="min-h-screen w-screen bg-white text-black flex flex-col lg:flex-row overflow-hidden">
      <Navbar />
      <main className="flex-1 h-full overflow-y-auto px-6 py-6 ml-0 lg:ml-64">
        {/* Journey Bar */}
        <div className="text-sm text-gray-500 mb-4">
          {currentView !== 'year' && (
            <button onClick={handleBack} className="text-black hover:underline mr-[3%]">⬅ Back</button>
          )}
          {journey()}
        </div>

        <h1 className="text-2xl font-semibold mb-4">
          {currentView === 'year' && '📁 Finance Years'}
          {currentView === 'month' && '📂 Select a Month'}
          {currentView === 'documents' && '📄 Finance Documents'}
        </h1>

        {/* Year View */}
        {currentView === 'year' && (
          <div className="grid grid-cols-1 gap-4">
            {Object.keys(data).map((year) => (
              <Card key={year} onClick={() => {
                setSelectedYear(year);
                setCurrentView('month');
              }} className="cursor-pointer w-[13%] h-[80px] hover:shadow-md">
                <CardContent className="text-lg font-semibold mt-[7%]">📁 Year {year}</CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Month View */}
        {currentView === 'month' && (
          <div className="grid grid-cols-1 gap-4">
            {Object.keys(data[selectedYear] || {}).map((month) => (
              <Card key={month} onClick={() => {
                setSelectedMonth(month);
                setCurrentView('documents');
              }} className="cursor-pointer hover:shadow-md">
                <CardContent className="text-md font-medium">📂 {month}</CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Documents View */}
        {currentView === 'documents' && (
          <>
           
            {/* <Card className="mb-4">
              <CardContent>
                <h2 className="font-semibold mb-2">Purchase Orders</h2>
                <ul className="list-disc ml-6 text-sm">
                  {data[selectedYear]?.[selectedMonth]?.purchaseOrders?.length > 0 ? (
                    data[selectedYear][selectedMonth].purchaseOrders.map((po, i) => (
                      <li key={i}>
                        {po.fileUrl ? (
                          <a
                            href={`http://localhost:3000${po.fileUrl}`}
                            download
                            className="text-blue-600 hover:underline"
                          >
                            {po.fileUrl?.trim(6)}
                          </a>
                        ) : (
                          <span className="text-gray-400">{po.documentName || 'Unnamed PO'} (no file)</span>
                        )}
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-400">No POs available</li>
                  )}
                </ul>
              </CardContent>
            </Card>

            
            <Card>
              <CardContent>
                <h2 className="font-semibold mb-2">Invoices</h2>
                <ul className="list-disc ml-6 text-sm">
                  {data[selectedYear]?.[selectedMonth]?.invoices?.length > 0 ? (
                    data[selectedYear][selectedMonth].invoices.map((inv, i) => (
                      <li key={i}>
                        {inv.fileUrl ? (
                          <a
                            href={`http://localhost:3000${inv.fileUrl}`}
                            download
                            className="text-blue-600 hover:underline"
                          >
                            {inv.documentName}
                          </a>
                        ) : (
                          <span className="text-gray-400">{inv.documentName || 'Unnamed Invoice'} (no file)</span>
                        )}
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-400">No Invoices available</li>
                  )}
                </ul>
              </CardContent>
            </Card> */}
            {/* Thumbnail-style layout */}
<div className='mt-[3%]'>
    <h2 className="font-semibold mb-4">Purchase Orders</h2>
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {data[selectedYear]?.[selectedMonth]?.purchaseOrders?.length > 0 ? (
        data[selectedYear][selectedMonth].purchaseOrders.map((po, i) => (
          <div key={i} className="flex flex-col items-center bg-gray-100 p-3 rounded shadow-sm">
            <div className="w-20 h-24 flex items-center justify-center bg-white border rounded">
              {po.fileUrl?.endsWith('.pdf') ? (
                <img
                  src={PdfLogo} // use your own PDF icon here
                  alt="PDF"
                  className="w-8 h-8"
                />
              ) : (
                <span className="text-4xl">📄</span>
              )}
            </div>
            <div className="mt-2 text-sm text-center line-clamp-2">{po.documentName || 'PO Document'}</div>
            {po.fileUrl && (
              <a
                href={`http://localhost:3000/api/uploads/${po.fileUrl}`}
                download
                className="mt-1 text-xs text-blue-600 hover:underline"
              >
                Download
              </a>
            )}
          </div>
        ))
      ) : (
        <div className="text-gray-400">No POs available</div>
      )}
    </div>
  </div>

<div className='mt-[3%]'>
    <h2 className="font-semibold mb-4">Invoices</h2>
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {data[selectedYear]?.[selectedMonth]?.invoices?.length > 0 ? (
        data[selectedYear][selectedMonth].invoices.map((inv, i) => (
          <div key={i} className="flex flex-col items-center bg-gray-100 p-3 rounded shadow-sm">
            <div className="w-20 h-24 flex items-center justify-center bg-white border rounded">
              {inv.fileUrl?.endsWith('.pdf') ? (
                <img
                  src="/pdf-icon.png" // use your own icon
                  alt="PDF"
                  className="w-8 h-8"
                />
              ) : (
                <span className="text-4xl">📄</span>
              )}
            </div>
            <div className="mt-2 text-sm text-center line-clamp-2">{inv.documentName || 'Invoice'}</div>
            {inv.fileUrl && (
              <a
                href={`http://localhost:3000/api/uploads/${inv.fileUrl}`}
                download
                className="mt-1 text-xs text-blue-600 hover:underline"
              >
                Download
              </a>
            )}
          </div>
        ))
      ) : (
        <div className="text-gray-400">No Invoices available</div>
      )}
    </div>
 </div>

          </>
        )}
      </main>
    </div>
  );
}