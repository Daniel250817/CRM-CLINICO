import { Routes, Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import PrivateRoute from '../components/auth/PrivateRoute';
import NotificationsPage from '../pages/notifications';
import DashboardPage from '../pages/dashboard';
import LoginPage from '../pages/auth/Login';
// import RegisterPage from '../pages/auth/Register';
// import ForgotPasswordPage from '../pages/auth/ForgotPassword';
// import ResetPasswordPage from '../pages/auth/ResetPassword';
import UserSettingsPage from '../pages/settings/UserSettings';
// import CitasPage from '../pages/citas';
// import PacientesPage from '../pages/pacientes';
import DentistasPage from '../pages/dentistas';
import DentistaForm from '../pages/dentistas/DentistaForm';
import DentistaDetalle from '../pages/dentistas/DentistaDetalle';
// import ServiciosPage from '../pages/servicios';
import TaskBoard from '../pages/tasks/TaskBoard';
import BillingPage from '../pages/billing/BillingPage';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {/* <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} /> */}
      
      <Route path="/" element={
        <PrivateRoute>
          <MainLayout>
            <DashboardPage />
          </MainLayout>
        </PrivateRoute>
      } />
      
      <Route path="/notifications" element={
        <PrivateRoute>
          <MainLayout>
            <NotificationsPage />
          </MainLayout>
        </PrivateRoute>
      } />
      
      <Route path="/settings" element={
        <PrivateRoute>
          <MainLayout>
            <UserSettingsPage />
          </MainLayout>
        </PrivateRoute>
      } />
      
      {/* <Route path="/citas" element={
        <PrivateRoute>
          <MainLayout>
            <CitasPage />
          </MainLayout>
        </PrivateRoute>
      } />
      
      <Route path="/pacientes" element={
        <PrivateRoute>
          <MainLayout>
            <PacientesPage />
          </MainLayout>
        </PrivateRoute>
      } /> */}
      
      <Route path="/dentistas" element={
        <PrivateRoute>
          <MainLayout>
            <DentistasPage />
          </MainLayout>
        </PrivateRoute>
      } />
      
      <Route path="/dentistas/nuevo" element={
        <PrivateRoute>
          <MainLayout>
            <DentistaForm />
          </MainLayout>
        </PrivateRoute>
      } />
      
      <Route path="/dentistas/:id/editar" element={
        <PrivateRoute>
          <MainLayout>
            <DentistaForm />
          </MainLayout>
        </PrivateRoute>
      } />
      
      <Route path="/dentistas/:id" element={
        <PrivateRoute>
          <MainLayout>
            <DentistaDetalle />
          </MainLayout>
        </PrivateRoute>
      } />
      
      {/* <Route path="/servicios" element={
        <PrivateRoute>
          <MainLayout>
            <ServiciosPage />
          </MainLayout>
        </PrivateRoute>
      } /> */}
      
      <Route path="/tasks" element={
        <PrivateRoute>
          <MainLayout>
            <TaskBoard />
          </MainLayout>
        </PrivateRoute>
      } />

      <Route path="/tasks/list" element={
        <PrivateRoute>
          <MainLayout>
            <TaskBoard />
          </MainLayout>
        </PrivateRoute>
      } />

      <Route path="/tasks/new" element={
        <PrivateRoute>
          <MainLayout>
            <TaskBoard />
          </MainLayout>
        </PrivateRoute>
      } />

      <Route path="/billing" element={
        <PrivateRoute>
          <MainLayout>
            <BillingPage />
          </MainLayout>
        </PrivateRoute>
      } />

      <Route path="/facturacion" element={
        <PrivateRoute>
          <MainLayout>
            <BillingPage />
          </MainLayout>
        </PrivateRoute>
      } />
    </Routes>
  );
};

export default AppRoutes; 