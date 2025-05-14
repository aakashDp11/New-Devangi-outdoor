import React, { createContext, useContext, useState } from 'react';

// Create context
const SpaceFormContext = createContext();

// Custom hook to access the context
export const useSpaceForm = () => useContext(SpaceFormContext);

// Provider component
export function SpaceFormProvider({ children }) {
  // const [form, setForm] = useState({
  //   spaceName: '', landlord: '', organization: 'Devangi Outdoor', peerMediaOwner: '', spaceType: '', category: '',
  //   medium: 'No Medium available', mediaType: '', price: '', footfall: '', audience: '', demographics: '',
  //   description: '', illumination: '', resolution: '', width: '0', height: '0', unit: '', additionalTags: '',
  //   previousBrands: '', tags: '', address: '', city: 'Mumbai', state: 'Maharashtra', zip: '', latitude: '', longitude: '',
  //   zone: 'West', landmark: '', tier: 'Tier 1', facing: 'Single facing', faciaTowards: ''
  // });
  const [form, setForm] = useState({
    spaceName: '', landlord: '', organization: 'Devangi Outdoor', peerMediaOwner: '', spaceType: '', category: '',
    medium: 'No Medium available', mediaType: '', price: '', footfall: '', audience: '', demographics: '',
    description: '', illumination: '', resolution: '', width: '0', height: '0', unit: '', additionalTags: '',
    previousBrands: '', tags: '', address: '', city: 'Mumbai', state: 'Maharashtra', zip: '', latitude: '', longitude: '',
    zone: 'West', landmark: '', tier: 'Tier 1', facing: 'Single facing', faciaTowards: '',
    
    // ✅ Add image upload fields
    mainPhoto: null,
    longShot: null,
    closeShot: null,
    otherPhotos: []
  });

  const [step, setStep] = useState('Basic');
  const [completedSteps, setCompletedSteps] = useState([]);
  const stepOrder = ['Basic', 'Specifications', 'Location'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <SpaceFormContext.Provider value={{
      form,
      setForm,
      handleInputChange,
      step,
      setStep,
      completedSteps,
      setCompletedSteps,
      stepOrder
    }}>
      {children}
    </SpaceFormContext.Provider>
  );
}
