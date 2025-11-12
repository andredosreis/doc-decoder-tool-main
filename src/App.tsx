import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Checkout from "./pages/Checkout";
import ThankYou from "./pages/ThankYou";
import PaymentSuccess from "./pages/PaymentSuccess";
import Login from "./pages/auth/Login";
import StudentLogin from "./pages/auth/StudentLogin";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import { AuthProvider, ProtectedRoute } from "./hooks/useAuth";
import { AdminLayout } from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminModules from "./pages/admin/Modules";
import AdminCustomers from "./pages/admin/Customers";
import AdminPurchases from "./pages/admin/Purchases";
import AdminSettings from "./pages/admin/Settings";
import StudentDashboard from "./pages/student/Dashboard";
import StudentProductView from "./pages/student/ProductView";
import StudentModuleView from "./pages/student/ModuleView";
import StudentCertificate from "./pages/student/Certificate";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Rota inicial (landing page) */}
            <Route path="/" element={<Index />} />
            
            {/* Checkout e Thank You */}
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            
            {/* Rotas de autenticação */}
            <Route path="/auth/admin-login" element={<Login />} />
            <Route path="/auth/student-login" element={<StudentLogin />} />
            <Route path="/auth/login" element={<Navigate to="/auth/student-login" replace />} />
            <Route path="/auth/signup" element={<Signup />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            
            {/* Redirects antigos para nova rota */}
            <Route path="/admin/login" element={<Navigate to="/auth/admin-login" replace />} />
            <Route path="/app/login" element={<Navigate to="/auth/student-login" replace />} />
            
            {/* Rotas Admin - Protegidas (somente admin) */}
            <Route path="/admin/*" element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout>
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="products/:productId/modules" element={<AdminModules />} />
                    <Route path="customers" element={<AdminCustomers />} />
                    <Route path="purchases" element={<AdminPurchases />} />
                    <Route path="settings" element={<AdminSettings />} />
                  </Routes>
                </AdminLayout>
              </ProtectedRoute>
            } />
            
            {/* Rotas do Aluno - Protegidas (somente user) */}
            <Route path="/student" element={
              <ProtectedRoute requiredRole="user">
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/student/product/:productId" element={
              <ProtectedRoute requiredRole="user">
                <StudentProductView />
              </ProtectedRoute>
            } />
            <Route path="/student/module/:moduleId" element={
              <ProtectedRoute requiredRole="user">
                <StudentModuleView />
              </ProtectedRoute>
            } />
            <Route path="/student/certificate/:productId" element={
              <ProtectedRoute requiredRole="user">
                <StudentCertificate />
              </ProtectedRoute>
            } />
            
            {/* 404 - Não encontrado */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
