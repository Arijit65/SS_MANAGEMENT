import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './lib/theme'
import Layout from './components/cmsfullform/layout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AdminRoute from './components/auth/AdminRoute'
import ToastContainer from './components/ui/toast-container'

// Pages
import DashboardPage from './pages/dashboard'
import DashboardCMSPage from './pages/dashboard-cms'
import DashboardSaaSPage from './pages/dashboard-saas'
import SettingsPage from './pages/settings'
import PluginsPage from './pages/plugins'
import BlankPage from './pages/blank'
import ProfilePage from './pages/profile'
import DataTablesPage from './pages/data-tables'

// Auth Pages
import LoginPage from './pages/auth/login'
import ForgotPage from './pages/auth/forgot'
import ResetPasswordPage from './pages/auth/reset-password'

// Plugin Settings Pages
import SuperCacheSettings from './pages/plugins/super-cache/settings'
import AllsiteSEOSettings from './pages/plugins/allsite-seo/settings'

// Admin Pages
import CustomTablesPage from './pages/admin/custom-tables'
import UsersPage from './pages/admin/users'

// Custom Tables / Dynamic Pages
import DynamicListPage from './pages/dynamic-list'
import DynamicFormPage from './pages/dynamic-form'

// Project Management Pages
import ProjectsPage from './pages/Projects'
import ProjectListPage from './pages/Projects/list'
import ProjectDetailPage from './pages/Projects/detail'
import ProjectCalendarPage from './pages/Projects/calendar'
import ProjectTimelinePage from './pages/Projects/timeline'

// 404 Page
import NotFoundPage from './pages/not-found'

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/forgot" element={<ForgotPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Dashboard Routes with Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard-cms" replace />} />
               <Route path="/dashboard/analytics" element={<Navigate to="/dashboard-cms" replace />} />
             
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/dashboard-cms" element={<DashboardCMSPage />} />
              <Route path="/dashboard-saas" element={<DashboardSaaSPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/data-tables" element={<DataTablesPage />} />
              <Route path="/plugins" element={<PluginsPage />} />
              <Route path="/plugins/super-cache/settings" element={<SuperCacheSettings />} />
              <Route path="/plugins/allsite-seo/settings" element={<AllsiteSEOSettings />} />
              
              {/* Admin Routes - Admin Only */}
              <Route element={<AdminRoute />}>
                <Route path="/admin/tables" element={<CustomTablesPage />} />
                <Route path="/admin/users" element={<UsersPage />} />
              </Route>
              
              {/* Dynamic Custom Table Routes */}
              <Route path="/custom/:tableName/list" element={<DynamicListPage />} />
              <Route path="/custom/:tableName/form" element={<DynamicFormPage />} />
              <Route path="/custom/:tableName/form/:id" element={<DynamicFormPage />} />
              <Route path="/blank" element={<BlankPage />} />
              
              {/* Project Management Routes */}
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/list" element={<ProjectListPage />} />
              <Route path="/projects/calendar" element={<ProjectCalendarPage />} />
              <Route path="/projects/timeline" element={<ProjectTimelinePage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
            </Route>
          </Route>

          {/* 404 Catch-all Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        
        {/* Global Toast Container */}
        <ToastContainer />
      </Router>
    </ThemeProvider>
  )
}
