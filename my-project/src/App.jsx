
// import { Routes, Route,Outlet } from 'react-router-dom'
// import { Toaster } from 'sonner';
// import InventoryDashboard from './components/Inventory'
// import AddSpaceForm from './components/AddSpaceForm'
// import PreviewAddSpaceForm from './components/PreviewAddSpaceForm'
// import BookingDashboard from './components/Bookings'
// import CreateBookingOrderForm from './components/BookingForm'
// import BookingFormOrderInfo from './components/BookingFormOrderInfo'
// import BookingFormAddSpaces from './components/BookingFormAddSpaces'
// import ProposalDashboard from './components/Proposals'
// import { SpaceFormProvider } from './context/SpaceFormContext'
// import BookingPreview from './components/BookingPreview';
// import { BookingFormProvider } from './context/BookingFormContext';
// import ProposalForm from './components/ProposalForm'
// import SpaceDetails from './components/SpaceDetails';
// import EditSpace from './components/EditSpace';
// import ProposalDetails from './components/ProposalDetails';
// import EditProposal from './components/EditProposal';
// import BookingsDashboard1 from './components/BookingDashboard';
// import BookingDetails from './components/BookingDetails';
// import BookingFormWizard from './components/BookingFormWizard';
// import HomePage from './components/HomePage'
// import Login from './components/Login';
// import Register from './components/Register';
// import User from './components/User';
// import PipelineBoard from './components/PipelineBoard';
// import BookingFlow from './components/BookingPipeline';
// import { PipelineProvider } from './context/PipelineContext';
// import { ReactFlowProvider } from '@xyflow/react';
// // import ListPipelines from './components/ListPipelines';
// import Gallery from './components/Gallery';
// import CampaignPipeline from './components/CampaignPipeline';
// import FinancePage from './components/FinancePage';
// import CampaignDetails from './components/CampaignDetails';
// import Report from './components/Report.jsx';

// export default function App() {
//   return (
//     < >
//     <div className=''>
//       <Toaster position="top-right"/>
//     <Routes>
//       <Route path='/'  element={
//       <InventoryDashboard />
//   } />
//       <Route path='/add-space' element={
//   <SpaceFormProvider>
//     <AddSpaceForm />
//   </SpaceFormProvider>
// }  />
//       <Route path='/preview-add-space' element={
//   <SpaceFormProvider>
//     <PreviewAddSpaceForm/>
//   </SpaceFormProvider>
// } />
//       <Route path='/booking-dashboard' element={<BookingsDashboard1/>} />
//       <Route
//   element={
//     <BookingFormProvider>
//       <Outlet />
//     </BookingFormProvider>
//   }
// >
//   <Route path="/reports" element={<Report/>} />
//   <Route path="/create-booking" element={<CreateBookingOrderForm />} />
//   <Route path="/create-booking-orderInfo" element={<BookingFormOrderInfo />} />
//   <Route path="/create-booking-addSpaces" element={<BookingFormAddSpaces />} />
//   <Route path="/campaign-details/:id" element={
//     <div className="">
//       <PipelineProvider>
// <ReactFlowProvider>

//       <CampaignDetails />
// </ReactFlowProvider>
//       </PipelineProvider>
//     </div>
//     } />
//   <Route path="/booking-preview" element={<BookingPreview />} />
//       <Route path='/booking-fullForm' element={<BookingFormWizard/>}/>
//       <Route path="/proposal/:id" element={<ProposalDetails />} />
// </Route>
//       <Route path='/proposal-form' element={<ProposalForm/>} />
//       <Route path="/space/:id" element={<SpaceDetails />} />
//       <Route path="/space/:id/edit" element={<EditSpace />} />
//       <Route path='/proposal-dashboard' element={<ProposalDashboard/>}/>
//       <Route path="/booking/:id" element={<BookingDetails/>} />
//       <Route path="/proposal/:id/edit" element={<EditProposal />} />
//       <Route path="/booking-dashboard1" element={<BookingsDashboard1/>} />
//       <Route path="/finances" element={<FinancePage/>} />
//       <Route path="/home" element={<HomePage/>}/>
//       <Route path='/login' element={<Login/>}/>
//       <Route path='/create-user' element={<Register/>}/>
//       <Route path='/users' element={<User/>}/>
//       <Route path='/login' element={<Login/>}/>
//       <Route path='/pipeline' element={
// <div style={{ height: '100%', width: '100%' }}>
// <PipelineProvider>
//   <ReactFlowProvider>
//   {/* <BookingFlow /> */}
  
//   <CampaignPipeline/>
//   </ReactFlowProvider>
// </PipelineProvider>
// </div>
// }/>
// <Route path='/gallery' element={<Gallery/>}/>
//       <Route path='/pipeline/:id' element={
// <div style={{ height: '100%', width: '100%' }}>
// <PipelineProvider>
//   <ReactFlowProvider>
//   {/* <BookingFlow /> */}
//   <CampaignPipeline/>
//   </ReactFlowProvider>
// </PipelineProvider>
// </div>

// }/>
//     </Routes>
//     </div>
//     </>
//   )
// }


import { Routes, Route, Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import InventoryDashboard from './components/Inventory';
import AddSpaceForm from './components/AddSpaceForm';
import PreviewAddSpaceForm from './components/PreviewAddSpaceForm';
import BookingDashboard from './components/Bookings';
import CreateBookingOrderForm from './components/BookingForm';
import BookingFormOrderInfo from './components/BookingFormOrderInfo';
import BookingFormAddSpaces from './components/BookingFormAddSpaces';
import ProposalDashboard from './components/Proposals';
import { SpaceFormProvider } from './context/SpaceFormContext';
import BookingPreview from './components/BookingPreview';
import { BookingFormProvider } from './context/BookingFormContext';
import ProposalForm from './components/ProposalForm';
import SpaceDetails from './components/SpaceDetails';
import EditSpace from './components/EditSpace';
import ProposalDetails from './components/ProposalDetails';
import EditProposal from './components/EditProposal';
import BookingsDashboard1 from './components/BookingDashboard';
import BookingDetails from './components/BookingDetails';
import BookingFormWizard from './components/BookingFormWizard';
import HomePage from './components/HomePage';
import Login from './components/Login';
import Register from './components/Register';
import User from './components/User';
import PipelineBoard from './components/PipelineBoard';
import BookingFlow from './components/BookingPipeline';
import { PipelineProvider } from './context/PipelineContext';
import { ReactFlowProvider } from '@xyflow/react';
import Gallery from './components/Gallery';
import CampaignPipeline from './components/CampaignPipeline';
import FinancePage from './components/FinancePage';
import CampaignDetails from './components/CampaignDetails';
import Report from './components/Report.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

export default function App() {
  return (
    <AuthProvider>
      <div className=''>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route path='/create-user' element={<Register />} />
          <Route path='/register' element={<Register />} />
          <Route path='/login' element={<Login />} />
           <Route path='/' element={
            <ProtectedRoute>
              <InventoryDashboard/>
            </ProtectedRoute>
          } />
          {/* Protected Routes */}
          <Route path='/home' element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />
          <Route path='/inventory' element={
            <ProtectedRoute>
              <InventoryDashboard/>
            </ProtectedRoute>
          } />
         
          {/* <Route path='/' element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } /> */}
          <Route path='/users' element={<ProtectedRoute><User/></ProtectedRoute>}/>
          <Route path='/add-space' element={
              <SpaceFormProvider>
            <ProtectedRoute>
                <AddSpaceForm />
            </ProtectedRoute>
              </SpaceFormProvider>
          } />
          <Route path='/booking-dashboard' element={
            <ProtectedRoute>
              <BookingsDashboard1 />
            </ProtectedRoute>
          } />
          <Route path='/reports' element={
            <ProtectedRoute>
              <Report />
            </ProtectedRoute>
          } />
                <Route path='/preview-add-space' element={
   <SpaceFormProvider>
    <ProtectedRoute>
     <PreviewAddSpaceForm/>
     </ProtectedRoute>
  </SpaceFormProvider>
 } />
          <Route path='/create-booking' element={
            <BookingFormProvider>
  <ProtectedRoute>
    <CreateBookingOrderForm />
  </ProtectedRoute>
</BookingFormProvider>
          } />
             <Route path="/create-booking-orderInfo" element={<BookingFormProvider>
  <ProtectedRoute><BookingFormOrderInfo /></ProtectedRoute></BookingFormProvider>} />
   <Route path="/create-booking-addSpaces" element={<BookingFormProvider><ProtectedRoute><BookingFormAddSpaces /></ProtectedRoute></BookingFormProvider>} />
          <Route path='/proposal-dashboard' element={
            <ProtectedRoute>
              <ProposalDashboard />
            </ProtectedRoute>
          } />
          <Route path='/finances' element={
            <ProtectedRoute>
              <FinancePage />
            </ProtectedRoute>
          } />
          <Route path='/booking/:id' element={
            <ProtectedRoute>
             < BookingDetails />
            </ProtectedRoute>
          } />
          <Route path='/booking-preview' element={
            <BookingFormProvider>
            <ProtectedRoute>
             <BookingPreview />
            </ProtectedRoute>
            </BookingFormProvider>
          } />
             <Route path="/proposal/:id" element={ <ProtectedRoute><ProposalDetails /></ProtectedRoute>} />
           <Route path='/pipeline' element={
            <ProtectedRoute>
              <div style={{ height: '100%', width: '100%' }}>
                
                <PipelineProvider>
                  <ReactFlowProvider>
                    <CampaignPipeline />
                  </ReactFlowProvider>
                </PipelineProvider>
              </div>
              </ProtectedRoute>
            } />
            <Route path='/pipeline/:id' element={
              <ProtectedRoute>
              <div style={{ height: '100%', width: '100%' }}>
                <PipelineProvider>
                  <ReactFlowProvider>
                    <CampaignPipeline />
                  </ReactFlowProvider>
                </PipelineProvider>
              </div>
              </ProtectedRoute>
            } />
            <Route path='/campaign-details/:id' element={
              <ProtectedRoute>
              <div className="">
                <PipelineProvider>
                  <ReactFlowProvider>
                    <CampaignDetails />
                  </ReactFlowProvider>
                </PipelineProvider>
              </div>
              </ProtectedRoute>
            } />
             <Route path='/proposal/:id' element={<BookingFormProvider><ProtectedRoute><ProposalDetails /></ProtectedRoute></BookingFormProvider>} />
            <Route path='/space/:id' element={<ProtectedRoute><SpaceDetails /></ProtectedRoute>} />
            <Route path='/space/:id/edit' element={<ProtectedRoute><EditSpace /></ProtectedRoute>} />
             <Route path='/gallery' element={<ProtectedRoute><Gallery /></ProtectedRoute>} />

         


        </Routes>
      </div>
    </AuthProvider>
  );
}
