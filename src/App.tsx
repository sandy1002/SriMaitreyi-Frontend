import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { SessionProvider } from "@/context/SessionContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewSession from "./pages/NewSession";
import SessionDetail from "./pages/SessionDetail";
import Architecture from "./pages/Architecture";
import AdminDashboard from "./pages/AdminDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import HealthHistory from "./pages/HealthHistory";
import CbpDiary from "./pages/CbpDiary";
import NutritionDiary from "./pages/NutritionDiary";
import RenalFluidDiary from "./pages/RenalFluidDiary";
import MedicationDiary from "./pages/MedicationDiary";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PublicOnlyRoute } from "@/components/auth/PublicOnlyRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { PatientRoute } from "@/components/auth/PatientRoute";
import { StaffRoute } from "@/components/auth/StaffRoute";
import { TechnicianRoute } from "@/components/auth/TechnicianRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SessionProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route
                path="/architecture"
                element={
                  <AdminRoute>
                    <Architecture />
                  </AdminRoute>
                }
              />
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <Login />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/health-history"
                element={
                  <ProtectedRoute>
                    <HealthHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/health-history/:patientId"
                element={
                  <ProtectedRoute>
                    <HealthHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cbp"
                element={
                  <PatientRoute>
                    <CbpDiary />
                  </PatientRoute>
                }
              />
              <Route
                path="/cbp/:patientId"
                element={
                  <ProtectedRoute>
                    <CbpDiary />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/staff"
                element={
                  <StaffRoute>
                    <StaffDashboard />
                  </StaffRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <PatientRoute>
                    <Dashboard />
                  </PatientRoute>
                }
              />
              <Route
                path="/nutrition-diary"
                element={
                  <PatientRoute>
                    <NutritionDiary />
                  </PatientRoute>
                }
              />
              <Route
                path="/nutrition-diary/:patientId"
                element={
                  <ProtectedRoute>
                    <NutritionDiary />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fluid-diary"
                element={
                  <PatientRoute>
                    <RenalFluidDiary />
                  </PatientRoute>
                }
              />
              <Route
                path="/fluid-diary/:patientId"
                element={
                  <ProtectedRoute>
                    <RenalFluidDiary />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/medication-diary"
                element={
                  <PatientRoute>
                    <MedicationDiary />
                  </PatientRoute>
                }
              />
              <Route
                path="/medication-diary/:patientId"
                element={
                  <ProtectedRoute>
                    <MedicationDiary />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/session/new"
                element={
                  <PatientRoute>
                    <NewSession />
                  </PatientRoute>
                }
              />
              <Route
                path="/session/new/:patientId"
                element={
                  <TechnicianRoute>
                    <NewSession />
                  </TechnicianRoute>
                }
              />
              <Route
                path="/session/:sessionId"
                element={
                  <ProtectedRoute>
                    <SessionDetail />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </SessionProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
