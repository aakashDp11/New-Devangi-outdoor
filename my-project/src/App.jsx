
import { Routes, Route,Outlet } from 'react-router-dom'
import { Toaster } from 'sonner';
import InventoryDashboard from './components/Inventory'
import AddSpaceForm from './components/AddSpaceForm'
import PreviewAddSpaceForm from './components/PreviewAddSpaceForm'
import BookingDashboard from './components/Bookings'
import CreateBookingOrderForm from './components/BookingForm'
import BookingFormOrderInfo from './components/BookingFormOrderInfo'
import BookingFormAddSpaces from './components/BookingFormAddSpaces'
import ProposalDashboard from './components/Proposals'
import { SpaceFormProvider } from './context/SpaceFormContext'
import BookingPreview from './components/BookingPreview';
import { BookingFormProvider } from './context/BookingFormContext';
import ProposalForm from './components/ProposalForm'
import SpaceDetails from './components/SpaceDetails';
import EditSpace from './components/EditSpace';
import ProposalDetails from './components/ProposalDetails';
import EditProposal from './components/EditProposal';
import BookingsDashboard1 from './components/BookingDashboard';
import BookingDetails from './components/BookingDetails';
import BookingFormWizard from './components/BookingFormWizard';
import HomePage from './components/HomePage'
import Login from './components/Login';
import Register from './components/Register';
import User from './components/User';
import PipelineBoard from './components/PipelineBoard';
import BookingFlow from './components/BookingPipeline';
import { PipelineProvider } from './context/PipelineContext';
import { ReactFlowProvider } from '@xyflow/react';
import ListPipelines from './components/ListPipelines';
import Gallery from './components/Gallery';
export default function App() {
  return (
    <>
      <Toaster position="top-right"/>
    <Routes>
      <Route path='/'  element={
      <InventoryDashboard />
  } />
      <Route path='/add-space' element={
  <SpaceFormProvider>
    <AddSpaceForm />
  </SpaceFormProvider>
}  />
      <Route path='/preview-add-space' element={
  <SpaceFormProvider>
    <PreviewAddSpaceForm/>
  </SpaceFormProvider>
} />
      <Route path='/booking-dashboard' element={<BookingsDashboard1/>} />
      <Route
  element={
    <BookingFormProvider>
      <Outlet />
    </BookingFormProvider>
  }
>
  <Route path="/create-booking" element={<CreateBookingOrderForm />} />
  <Route path="/create-booking-orderInfo" element={<BookingFormOrderInfo />} />
  <Route path="/create-booking-addSpaces" element={<BookingFormAddSpaces />} />
  <Route path="/booking-preview" element={<BookingPreview />} />
      <Route path='/booking-fullForm' element={<BookingFormWizard/>}/>
      <Route path="/proposal/:id" element={<ProposalDetails />} />
</Route>
      <Route path='/proposal-form' element={<ProposalForm/>} />
      <Route path="/space/:id" element={<SpaceDetails />} />
      <Route path="/space/:id/edit" element={<EditSpace />} />
      <Route path='/proposal-dashboard' element={<ProposalDashboard/>}/>
      <Route path="/booking/:id" element={<BookingDetails/>} />
      <Route path="/proposal/:id/edit" element={<EditProposal />} />
      <Route path="/booking-dashboard1" element={<BookingsDashboard1/>} />
      <Route path="/finances" element={<ListPipelines/>} />
      <Route path="/home" element={<HomePage/>}/>
      <Route path='/login' element={<Login/>}/>
      <Route path='/create-user' element={<Register/>}/>
      <Route path='/users' element={<User/>}/>
      <Route path='/login' element={<Login/>}/>
      <Route path='/pipeline' element={
<div style={{ height: '100%', width: '100%' }}>
<PipelineProvider>
  <ReactFlowProvider>
  <BookingFlow />
  </ReactFlowProvider>
</PipelineProvider>
</div>
}/>
<Route path='/gallery' element={<Gallery/>}/>
      <Route path='/pipeline/:id' element={
<div style={{ height: '100%', width: '100%' }}>
<PipelineProvider>
  <ReactFlowProvider>
  <BookingFlow />
  </ReactFlowProvider>
</PipelineProvider>
</div>
}/>
    </Routes>
    </>
  )
}

