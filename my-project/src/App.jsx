import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";

// --- Context Providers ---
import { AuthProvider } from "./context/AuthContext.jsx";
import { SidebarProvider } from "./context/SidebarContext";
import { SpaceFormProvider } from "./context/SpaceFormContext";
import { BookingFormProvider } from "./context/BookingFormContext";
import { PipelineProvider } from "./context/PipelineContext";
import { ReactFlowProvider } from "@xyflow/react";

// --- Pages & Components ---
import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import HomePage from "./components/HomePage";
import InventoryDashboard from "./components/Inventory";
import User from "./components/User";
import AddSpaceForm from "./components/AddSpaceForm";
import PreviewAddSpaceForm from "./components/PreviewAddSpaceForm";
import CreateBookingOrderForm from "./components/BookingForm";
import BookingFormOrderInfo from "./components/BookingFormOrderInfo";
import BookingFormAddSpaces from "./components/BookingFormAddSpaces";
import ProposalDashboard from "./components/Proposals";
import BookingPreview from "./components/BookingPreview";
import SpaceDetails from "./components/SpaceDetails";
import EditSpace from "./components/EditSpace";
import ProposalDetails from "./components/ProposalDetails";
import BookingsDashboard1 from "./components/BookingDashboard";
import BookingDetails from "./components/BookingDetails";
import Gallery from "./components/Gallery";
import CampaignPipeline from "./components/CampaignPipeline";
import FinancePage from "./components/FinancePage";
import CampaignDetails from "./components/CampaignDetails";
import Report from "./components/Report.jsx";
import PrivacyPolicy from "./components/PrivacyPolicy";
import DisclaimerPolicy from "./components/DisclaimerPolicy";
import NotificationsPage from "./components/NotificationsPage";
import Settings from "./components/Settings";
import EditProposal from "./components/EditProposal";
import CloneCampaignPage from "./components/CloneCampaignPage"; 

// --- Error Pages ---
import NotFound from "./components/NotFound";
import InternalServerError from "./components/InternalServerError";

// --- Theme Controls ---
import ThemeControls from "./components/ThemeControls";  // ✅ import theme switcher

export default function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <Toaster position="top-right" />
        
        {/* ✅ Theme Switcher visible globally */}
        <ThemeControls />

        <Routes>
          {/* ======= Public Routes ======= */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/create-user" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* ======= Protected Routes ======= */}
          <Route path="/users" element={<User />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/inventory" element={<InventoryDashboard />} />
            <Route path="/booking-dashboard" element={<BookingsDashboard1 />} />
            <Route path="/reports" element={<Report />} />
            <Route path="/proposal-dashboard" element={<ProposalDashboard />} />
            <Route path="/finances" element={<FinancePage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/booking/:id" element={<BookingDetails />} />
            <Route
              path="/clone-campaign/:campaignId/from-booking/:bookingId"
              element={<CloneCampaignPage />}
            />
            <Route path="/space/:id" element={<SpaceDetails />} />
            <Route path="/space/:id/edit" element={<EditSpace />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/disclaimer-policy" element={<DisclaimerPolicy />} />

            {/* Booking & Space Form Flow */}
            <Route
              path="/add-space"
              element={
                <SpaceFormProvider>
                  <AddSpaceForm />
                </SpaceFormProvider>
              }
            />
            <Route
              path="/preview-add-space"
              element={
                <SpaceFormProvider>
                  <PreviewAddSpaceForm />
                </SpaceFormProvider>
              }
            />
            <Route
              path="/create-booking"
              element={
                <BookingFormProvider>
                  <CreateBookingOrderForm />
                </BookingFormProvider>
              }
            />
            <Route
              path="/create-booking-orderInfo"
              element={
                <BookingFormProvider>
                  <BookingFormOrderInfo />
                </BookingFormProvider>
              }
            />
            <Route
              path="/create-booking-addSpaces"
              element={
                <BookingFormProvider>
                  <BookingFormAddSpaces />
                </BookingFormProvider>
              }
            />
            <Route
              path="/booking-preview"
              element={
                <BookingFormProvider>
                  <BookingPreview />
                </BookingFormProvider>
              }
            />
            <Route
              path="/proposal/:id"
              element={
                <BookingFormProvider>
                  <ProposalDetails />
                </BookingFormProvider>
              }
            />

            <Route path="/edit-proposal/:id" element={<EditProposal />} />

            {/* Campaign Pipeline Flow */}
            <Route
              path="/pipeline"
              element={
                <PipelineProvider>
                  <ReactFlowProvider>
                    <CampaignPipeline />
                  </ReactFlowProvider>
                </PipelineProvider>
              }
            />
            <Route
              path="/pipeline/:id"
              element={
                <PipelineProvider>
                  <ReactFlowProvider>
                    <CampaignPipeline />
                  </ReactFlowProvider>
                </PipelineProvider>
              }
            />
            <Route
              path="/campaign-details/:id"
              element={
                <PipelineProvider>
                  <ReactFlowProvider>
                    <CampaignDetails />
                  </ReactFlowProvider>
                </PipelineProvider>
              }
            />

            {/* 🆕 Notifications */}
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>

          {/* ======= Error Routes ======= */}
          <Route path="/500" element={<InternalServerError />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </SidebarProvider>
    </AuthProvider>
  );
}
