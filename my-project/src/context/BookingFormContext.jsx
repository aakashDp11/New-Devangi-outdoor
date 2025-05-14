  // src/context/BookingFormContext.jsx
  import React, { createContext, useContext, useState } from 'react';

  const BookingFormContext = createContext();

  export const useBookingForm = () => useContext(BookingFormContext);

  export const BookingFormProvider = ({ children }) => {
    const [basicInfo, setBasicInfo] = useState({
      companyName: '',
      clientName: '',
      clientEmail: '',
      clientContact: '',
      clientPan: '',
      clientGst: '',
      brandName: '',
      clientType: '',
      campaignImages: [],
    });
    const [proposalId, setProposalId] = useState(null);

    const [orderInfo, setOrderInfo] = useState({
      campaignName: '',
      industry: '',
      description: '',
    });
    const [bookingDates, setBookingDates] = useState({
      startDate: '',
      endDate: '',
    });
    

    const [selectedSpaces, setSelectedSpaces] = useState([]);
    const resetForm = () => {
      setBasicInfo({
        companyName: '',
        clientName: '',
        clientEmail: '',
        clientContact: '',
        clientPan: '',
        clientGst: '',
        brandName: '',
        clientType: '',
        campaignImages: [],
      });
  
      setOrderInfo({
        campaignName: '',
        industry: '',
        description: '',
      });
  
      setSelectedSpaces([]);
    };

    return (
      <BookingFormContext.Provider
        value={{
          basicInfo,
          setBasicInfo,
          orderInfo,
          setOrderInfo,
          selectedSpaces,
          setSelectedSpaces,
          bookingDates,
        setBookingDates,
        proposalId,
        setProposalId,
          resetForm
        }}
      >
        {children}
      </BookingFormContext.Provider>
    );
  };
