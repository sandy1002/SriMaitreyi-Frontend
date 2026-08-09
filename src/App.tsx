import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { PadocAuthProvider } from "@/context/PadocAuthContext";
import { SessionProvider } from "@/context/SessionContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import PadocLogin from "./pages/PadocLogin";
import PadocDashboard from "./pages/PadocDashboard";
import Dashboard from "./pages/Dashboard";
import ChangePassword from "./pages/ChangePassword";
import NewSession from "./pages/NewSession";
import SessionDetail from "./pages/SessionDetail";
import Architecture from "./pages/Architecture";
import AdminDashboard from "./pages/AdminDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import HealthHistory from "./pages/HealthHistory";
import CbpDiary from "./pages/CbpDiary";
import NutritionDiary from "./pages/NutritionDiary";
import AllergyDiary from "./pages/AllergyDiary";
import RenalFluidDiary from "./pages/RenalFluidDiary";
import MedicationDiary from "./pages/MedicationDiary";
import VaccineDiary from "./pages/VaccineDiary";
import MonthlyInvestigations from "./pages/MonthlyInvestigations";
import ReportComparison from "./pages/ReportComparison";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PublicOnlyRoute } from "@/components/auth/PublicOnlyRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { PatientRoute } from "@/components/auth/PatientRoute";
import { PatientScopeRoute } from "@/components/auth/PatientScopeRoute";
import { StaffRoute } from "@/components/auth/StaffRoute";
import { TechnicianRoute } from "@/components/auth/TechnicianRoute";
import { PadocProtectedRoute, PadocPublicOnlyRoute } from "@/components/auth/PadocRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <PadocAuthProvider>
          <SessionProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route
                  path="/padoc/login"
                  element={
                    <PadocPublicOnlyRoute>
                      <PadocLogin />
                    </PadocPublicOnlyRoute>
                  }
                />
                <Route
                  path="/padoc/dashboard"
                  element={
                    <PadocProtectedRoute>
                      <PadocDashboard />
                    </PadocProtectedRoute>
                  }
                />
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
                    <PatientScopeRoute>
                      <HealthHistory />
                    </PatientScopeRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/investigations"
                element={
                  <PatientRoute>
                    <MonthlyInvestigations />
                  </PatientRoute>
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
                    <PatientScopeRoute>
                      <CbpDiary />
                    </PatientScopeRoute>
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
              <Route path="/change-password" element={<ChangePassword />} />
              <Route
                path="/allergy-diary"
                element={
                  <PatientRoute>
                    <AllergyDiary />
                  </PatientRoute>
                }
              />
              <Route
                path="/allergy-diary/:patientId"
                element={
                  <ProtectedRoute>
                    <PatientScopeRoute>
                      <AllergyDiary />
                    </PatientScopeRoute>
                  </ProtectedRoute>
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
                    <PatientScopeRoute>
                      <NutritionDiary />
                    </PatientScopeRoute>
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
                    <PatientScopeRoute>
                      <RenalFluidDiary />
                    </PatientScopeRoute>
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
                    <PatientScopeRoute>
                      <MedicationDiary />
                    </PatientScopeRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vaccine-diary"
                element={
                  <PatientRoute>
                    <VaccineDiary />
                  </PatientRoute>
                }
              />
              <Route
                path="/vaccine-diary/:patientId"
                element={
                  <ProtectedRoute>
                    <PatientScopeRoute>
                      <VaccineDiary />
                    </PatientScopeRoute>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/report-comparison"
                element={
                  <PatientRoute>
                    <ReportComparison />
                  </PatientRoute>
                }
              />
              <Route
                path="/report-comparison/:patientId"
                element={
                  <ProtectedRoute>
                    <PatientScopeRoute>
                      <ReportComparison />
                    </PatientScopeRoute>
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
        </PadocAuthProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
