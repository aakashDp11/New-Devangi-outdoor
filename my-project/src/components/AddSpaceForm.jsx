import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { useSpaceForm } from '../context/SpaceFormContext';
export default function AddSpaceForm() {
    const navigate=useNavigate();
    const {
      form, handleInputChange,
      step, setStep,
      completedSteps, setCompletedSteps,
      stepOrder
    } = useSpaceForm();

    const handleSubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData();
    
      // Append all form fields (non-file)
      for (const key in form) {
        if (
          key !== 'mainPhoto' &&
          key !== 'longShot' &&
          key !== 'closeShot' &&
          key !== 'otherPhotos'
        ) {
          formData.append(key, form[key]);
        }
      }
    
      // Append single files
      if (form.mainPhoto) formData.append('mainPhoto', form.mainPhoto);
      if (form.longShot) formData.append('longShot', form.longShot);
      if (form.closeShot) formData.append('closeShot', form.closeShot);
    
      // Append multiple files
      if (form.otherPhotos && Array.isArray(form.otherPhotos)) {
        form.otherPhotos.forEach((file) => {
          formData.append('otherPhotos', file);
        });
      }
    
      try {
        const res = await fetch('http://localhost:3000/api/spaces/create', {
          method: 'POST',
          body: formData,
        });
    
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        console.log('Created successfully:', data);
        alert('Space created!');
        navigate('/success'); // or redirect wherever
      } catch (err) {
        console.error(err);
        alert('Something went wrong!');
      }
    };
    
  const handleNext = () => {    
    if (!completedSteps.includes(step)) {
      setCompletedSteps((prev) => [...prev, step]);
    }
    if(step==='Location'){
        navigate('/preview-add-space');
       }
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex < stepOrder.length - 1) {
      setStep(stepOrder[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex > 0) {
      const newStep = stepOrder[currentIndex - 1];
      setStep(newStep);
      setCompletedSteps((prev) => prev.filter((s) => s !== newStep));
    }
  };



  return (
    <div className="p-6 md:ml-64 min-h-screen">
        <Navbar/>
      <form onSubmit={handleSubmit} className="max-w-screen-xl mx-auto">
        <div className="text-2xl font-semibold mb-6">Create Spaces</div>
        
        <div className="flex gap-6 mb-6 text-sm font-medium">
  {stepOrder.map((label) => (
    <div
      key={label}
      className={`flex items-center gap-1 pb-1 min-w-fit ${
        step === label
          ? 'border-b-2 border-black text-black'
          : completedSteps.includes(label)
          ? 'text-green-600'
          : 'text-black'
      }`}
    >
      {completedSteps.includes(label) ? '✓' : ''} {label} Information
    </div>
  ))}
</div>



        {step === 'Basic' && (
          <div className='flex'>
          <div className="grid grid-cols-1  text-xs lg:grid-cols-2">
            <div className="space-y-4">
              <Input label="Space name" name="spaceName" value={form.spaceName} onChange={handleInputChange} required />
              <Input label="Landlord" name="landlord" value={form.landlord} onChange={handleInputChange} />
              <Input label="Inventory Owner (Organization)" name="organization" value={form.organization} disabled />
              <Input label="Peer Media Owner" name="peerMediaOwner" value={form.peerMediaOwner} onChange={handleInputChange} />
              <Select
  label="Traded"
  name="traded"
  value={form.traded}
  onChange={handleInputChange}
  required
>
  <option value="">Select...</option>
  <option value="true">Yes</option>
  <option value="false">No</option>
</Select>

              <Select label="Space Type" name="spaceType" value={form.spaceType} onChange={handleInputChange} required>
                <option value="">Select...</option>
                <option value="Billboard">Billboard</option>
                <option value="DOOH">DOOH</option>
                <option value="Pole kiosk">Pole kiosk</option>
                <option value="Gantry">Gantry</option>
              </Select>
              <Select label="Category" name="category" value={form.category} onChange={handleInputChange} required>
                <option value="">Select...</option>
                <option value="Retail">Retail</option>
                <option value="Transit">Transit</option>
              </Select>
              <Input label="Medium" name="medium" value={form.medium} disabled />
              <Select label="Media Type" name="mediaType" value={form.mediaType} onChange={handleInputChange} required>
                <option value="">Select...</option>
                <option value="Static">Static</option>
                <option value="Digital">Digital</option>
              </Select>
              <Input label="Price" name="price" value={form.price} onChange={handleInputChange} />
              <Input label="Footfall" name="footfall" value={form.footfall} onChange={handleInputChange} />
              <Select label="Audience" name="audience" value={form.audience} onChange={handleInputChange}>
                <option value="">Select...</option>
                <option value="Youth">Youth</option>
                <option value="Working Professionals">Working Professionals</option>
              </Select>
              <Select label="Demographics" name="demographics" value={form.demographics} onChange={handleInputChange} required>
                <option value="">Select...</option>
                <option value="Urban">Urban</option>
                <option value="Rural">Rural</option>
              </Select>
              <div>
                <label className="text-sm">Description</label>
                <textarea name="description" value={form.description} onChange={handleInputChange} className="w-full border px-3 py-2 rounded mt-1" rows={4} maxLength={400} />
                              
              </div>    
            </div>
          </div>
          <div className="pt-6 border-t mt-6 mr-6">
  <div className="text-lg font-semibold mb-4">Photo</div>
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <ImageUpload label="Upload Inventory Image" name="mainPhoto" />
    <div className="grid grid-cols-2 gap-4">
      <ImageUpload label="Long Shot" name="longShot" />
      <ImageUpload label="Close Shot" name="closeShot" />
    </div>
    <div className="col-span-2">
      <label className="text-sm font-medium">Other Images</label>
      <div className="flex flex-col gap-2 mt-2">
        <ImageUpload name="otherPhotos" multiple />
        <span className="text-xs text-gray-600">To add more photos, click "Add More Photo" and select the files you wish to upload.</span>
      </div>
    </div>
  </div>
</div>

          </div>
        )}

        {step === 'Specifications' && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select label="Illumination" name="illumination" value={form.illumination} onChange={handleInputChange} required>
                <option value="">Select...</option>
                <option value="Front Lit">Front Lit</option>
                <option value="Back Lit">Back Lit</option>
              </Select>
              {/* <Input label="Unit" name="unit" value={form.unit} onChange={handleInputChange} required /> */}
              <Input
  label="Unit"
  name="unit"
  value={form.unit}
  onChange={(e) => {
    const { value } = e.target;
    const maxMap = {
      Billboard: 2,
      DOOH: 10,
      'Pole kiosk': 10,
      Gantry: 1
    };
    const max = maxMap[form.spaceType];
    if (value === '' || Number(value) <= max) {
      handleInputChange(e);
    } else {
      alert(`Max units allowed for ${form.spaceType || 'this type'} is ${max}`);
    }
  }}
  required
/>

              <Input label="Resolutions" name="resolution" value={form.resolution} onChange={handleInputChange} />
              <Input label="Width (in ft)" name="width" value={form.width} onChange={handleInputChange} />
              <Input label="Height (in ft)" name="height" value={form.height} onChange={handleInputChange} />
            </div>
            <div className="space-y-4">
              <Input label="Additional Tags" name="additionalTags" value={form.additionalTags} onChange={handleInputChange} />
              <Input label="Previous brands" name="previousBrands" value={form.previousBrands} onChange={handleInputChange} />
              <Input label="Tags" name="tags" value={form.tags} onChange={handleInputChange} />
            </div>
          </div>
        )}

        {step === 'Location' && (
          <div className="grid text-xs grid-cols-1 md:grid-cols-2 gap-6">
      
            <Input label="Address"  name="address" value={form.address} onChange={handleInputChange}/>
        
         
            <Input label="City" name="city" value={form.city} onChange={handleInputChange} required />
            <Select label="State" name="state" value={form.state} onChange={handleInputChange} required>
  <option value="">-- Select State --</option>
  <option value="Andhra Pradesh">Andhra Pradesh</option>
  <option value="Arunachal Pradesh">Arunachal Pradesh</option>
  <option value="Assam">Assam</option>
  <option value="Bihar">Bihar</option>
  <option value="Chhattisgarh">Chhattisgarh</option>
  <option value="Goa">Goa</option>
  <option value="Gujarat">Gujarat</option>
  <option value="Haryana">Haryana</option>
  <option value="Himachal Pradesh">Himachal Pradesh</option>
  <option value="Jharkhand">Jharkhand</option>
  <option value="Karnataka">Karnataka</option>
  <option value="Kerala">Kerala</option>
  <option value="Madhya Pradesh">Madhya Pradesh</option>
  <option value="Maharashtra">Maharashtra</option>
  <option value="Manipur">Manipur</option>
  <option value="Meghalaya">Meghalaya</option>
  <option value="Mizoram">Mizoram</option>
  <option value="Nagaland">Nagaland</option>
  <option value="Odisha">Odisha</option>
  <option value="Punjab">Punjab</option>
  <option value="Rajasthan">Rajasthan</option>
  <option value="Sikkim">Sikkim</option>
  <option value="Tamil Nadu">Tamil Nadu</option>
  <option value="Telangana">Telangana</option>
  <option value="Tripura">Tripura</option>
  <option value="Uttar Pradesh">Uttar Pradesh</option>
  <option value="Uttarakhand">Uttarakhand</option>
  <option value="West Bengal">West Bengal</option>
  <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
  <option value="Chandigarh">Chandigarh</option>
  <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
  <option value="Delhi">Delhi</option>
  <option value="Jammu and Kashmir">Jammu and Kashmir</option>
  <option value="Ladakh">Ladakh</option>
  <option value="Lakshadweep">Lakshadweep</option>
  <option value="Puducherry">Puducherry</option>
</Select>

            <Input label="Pin-code" name="zip" value={form.zip} onChange={handleInputChange} />
            <Input label="Latitude" name="latitude" value={form.latitude} onChange={handleInputChange} />
            <Input label="Longitude" name="longitude" value={form.longitude} onChange={handleInputChange} />
            <Input label="Landmark" name="landmark" value={form.landmark} onChange={handleInputChange} />
            <Select label="Zone" name="zone" value={form.zone} onChange={handleInputChange} required>
              <option value="West">West</option>
              <option value="East">East</option>
            </Select>
            <Select label="Tier" name="tier" value={form.tier} onChange={handleInputChange} required>
              <option value="Tier 1">Tier 1</option>
              <option value="Tier 2">Tier 2</option>
            </Select>
            <Select label="Facing" name="facing" value={form.facing} onChange={handleInputChange} required>
              <option value="Single facing">Single facing</option>
              <option value="Double facing">Double facing</option>
            </Select>
            <Input label="Facia towards" name="faciaTowards" value={form.faciaTowards} onChange={handleInputChange} />
          
          </div>
        )}

        <div className="flex text-xs justify-between mt-8">
          <button type="button" className="border px-4 py-2 rounded">Cancel</button>
          <div className="space-x-2 text-xs">
            <button type="button" onClick={handleBack} className="bg-black text-white px-3 py-1 rounded">Back</button>
            <button type="button" onClick={handleNext} className="bg-black text-white px-3 py-1 rounded">{step === 'Location' ? 'Preview' : 'Next'}</button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div>
      <label className="text-sm ">{label}</label>
      <input {...props} className="w-3/4 block border px-2 py-1 rounded mt-1" />
    </div>
  );
}

function Select({ label, children, ...props }) {
  return (
    <div>
      <label className="text-sm">{label}</label>
      <select {...props} className="w-3/4 block border px-1 py-1 rounded mt-1">
        {children}
      </select>
    </div>
  );
}

function ImageUpload({ label, name, multiple = false }) {
  const { form, setForm } = useSpaceForm();

  const handleFileChange = (e) => {
    const files = multiple ? Array.from(e.target.files) : e.target.files[0];
    setForm((prev) => ({ ...prev, [name]: files }));
  };

  const preview =
    multiple && Array.isArray(form[name])
      ? form[name].map((file, i) => URL.createObjectURL(file))
      : form[name]
      ? URL.createObjectURL(form[name])
      : null;

  return (
    <div className="border border-dashed border-gray-300 rounded-lg p-4 h-48 relative bg-gray-50 flex flex-col items-center justify-center text-center">
      <label className="cursor-pointer w-full h-full flex flex-col items-center justify-center text-sm text-gray-500">
        {label || 'Upload Image'}
        <input type="file" accept="image/*" onChange={handleFileChange} multiple={multiple} className="hidden" />
        {preview && !multiple && (
          <img src={preview} alt="Preview" className="mt-2 h-20 object-contain" />
        )}
        {preview && multiple && (
          <div className="flex gap-2 mt-2 overflow-x-auto">
            {preview.map((src, idx) => (
              <img key={idx} src={src} alt={`Preview ${idx}`} className="h-20 object-contain" />
            ))}
          </div>
        )}
      </label>
    </div>
  );
}



