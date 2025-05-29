import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { CssBaseline, Box, CircularProgress } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import './App.css';

// Contexts
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Components
import NotificationSystem from './components/common/NotificationSystem';
import MainLayout from './components/layout/MainLayout';

// Auth Pages
import Login from './pages/auth/Login';

// App Pages
import Dashboard from './pages/dashboard/index';
import AppointmentCalendar from './components/appointments/AppointmentCalendar';
import PatientProfile from './pages/patients/PatientProfile';
import PatientRegistration from './pages/patients/PatientRegistration';
import PatientEdit from './pages/patients/PatientEdit';
import PatientsList from './pages/patients/PatientsList';
import UserSettings from './pages/settings/UserSettings';
import TaskBoard from './pages/tasks/TaskBoard';
import ServiciosList from './pages/services/ServiciosList';
import BillingPage from './pages/billing/BillingPage';

// Dentistas Pages
import DentistasPage from './pages/dentistas/index';
import DentistaForm from './pages/dentistas/DentistaForm';
import DentistaDetalle from './pages/dentistas/DentistaDetalle';

// Componente para proteger rutas
const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    // Mostrar indicador de carga mientras se verifica la autenticación
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Redirige a login si no está autenticado, de lo contrario muestra las rutas protegidas
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

function AppRoutes() {
  const { isAuthenticated, loading, logout } = useAuth();

  if (loading) {
    // Mostrar indicador de carga mientras se verifica la autenticación
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
        } 
      />
      
      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route
          path="/dashboard"
          element={
            <MainLayout onLogout={logout}>
              <Dashboard />
            </MainLayout>
          }
        />
        
        {/* Appointments Routes - Accesible para todos los roles */}
        <Route path="/appointments">
          <Route
            index
            element={<Navigate to="/appointments/calendar" replace />}
          />
          <Route
            path="calendar"
            element={
              <MainLayout onLogout={logout}>
                <AppointmentCalendar />
              </MainLayout>
            }
          />
          <Route
            path="list"
            element={
              <MainLayout onLogout={logout}>
                <AppointmentCalendar />
              </MainLayout>
            }
          />
        </Route>

        {/* Patients Routes - Accesible para todos los roles */}
        <Route path="/patients">
          <Route
            index
            element={<Navigate to="/patients/list" replace />}
          />
          <Route
            path="list"
            element={
              <MainLayout onLogout={logout}>
                <PatientsList />
              </MainLayout>
            }
          />
          <Route
            path="new"
            element={
              <MainLayout onLogout={logout}>
                <PatientRegistration />
              </MainLayout>
            }
          />
          <Route
            path=":id"
            element={
              <MainLayout onLogout={logout}>
                <PatientProfile />
              </MainLayout>
            }
          />
          <Route
            path=":id/edit"
            element={
              <MainLayout onLogout={logout}>
                <PatientEdit />
              </MainLayout>
            }
          />
        </Route>

        {/* Services Routes */}
        <Route path="/services">
          <Route
            index
            element={
              <MainLayout onLogout={logout}>
                <ServiciosList />
              </MainLayout>
            }
          />
        </Route>

        {/* Settings Route */}
        <Route
          path="/settings"
          element={
            <MainLayout onLogout={logout}>
              <UserSettings />
            </MainLayout>
          }
        />

        {/* Dentistas Routes */}
        <Route path="/dentistas">
          <Route
            index
            element={
              <MainLayout onLogout={logout}>
                <DentistasPage />
              </MainLayout>
            }
          />
          <Route
            path="nuevo"
            element={
              <MainLayout onLogout={logout}>
                <DentistaForm />
              </MainLayout>
            }
          />
          <Route
            path=":id/editar"
            element={
              <MainLayout onLogout={logout}>
                <DentistaForm />
              </MainLayout>
            }
          />
          <Route
            path=":id"
            element={
              <MainLayout onLogout={logout}>
                <DentistaDetalle />
              </MainLayout>
            }
          />
        </Route>

        {/* Tasks Routes */}        <Route path="/tasks">
          <Route
            index
            element={
              <MainLayout onLogout={logout}>
                <TaskBoard />
              </MainLayout>
            }
          />
          <Route
            path="list"
            element={
              <MainLayout onLogout={logout}>
                <TaskBoard />
              </MainLayout>
            }
          />
          <Route
            path="new"
            element={
              <MainLayout onLogout={logout}>
                <TaskBoard />
              </MainLayout>
            }
          />
        </Route>

        {/* Billing Routes */}
        <Route path="/billing">
          <Route
            index
            element={
              <MainLayout onLogout={logout}>
                <BillingPage />
              </MainLayout>
            }
          />
        </Route>

        {/* Alternative Spanish route for Billing */}
        <Route path="/facturacion">
          <Route
            index
            element={
              <MainLayout onLogout={logout}>
                <BillingPage />
              </MainLayout>
            }
          />
        </Route>
      </Route>
      
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <NotificationProvider>
          <AuthProvider>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <CssBaseline />
              <NotificationSystem />
              <AppRoutes />
            </LocalizationProvider>
          </AuthProvider>
        </NotificationProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
