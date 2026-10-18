import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from './contexts/ConfigContext'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'
import DriverLayout from './components/DriverLayout'
import DriverProtectedRoute from './components/DriverProtectedRoute'
import DriverChangePasswordPage from './pages/driver/DriverChangePasswordPage'
import DriverTripsPage from './pages/driver/DriverTripsPage'
import DriverTripDetailPage from './pages/driver/DriverTripDetailPage'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import BookingPage from './pages/BookingPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminInboxPage from './pages/admin/AdminInboxPage'
import AdminPricesPage from './pages/admin/AdminPricesPage'
import AdminBusesPage from './pages/admin/AdminBusesPage'
import AdminContentPage from './pages/admin/AdminContentPage'
import AdminBookingsPage from './pages/admin/AdminBookingsPage'
import AdminInvoicesPage from './pages/admin/AdminInvoicesPage'
import AdminTripsOverviewPage from './pages/admin/AdminTripsOverviewPage'
import AdminNewBookingPage from './pages/admin/AdminNewBookingPage'
import AdminPartnersPage from './pages/admin/AdminPartnersPage'
import AdminRecruitmentPage from './pages/admin/AdminRecruitmentPage'
import AdminTestimonialsPage from './pages/admin/AdminTestimonialsPage'
import AdminOppdragPage from './pages/admin/AdminOppdragPage'
import AdminFaqPage from './pages/admin/AdminFaqPage'
import AdminKontaktPage from './pages/admin/AdminKontaktPage'
import AdminPlanningPage from './pages/admin/AdminPlanningPage'
import KontaktPage from './pages/KontaktPage'
import DriverApplicationPage from './pages/DriverApplicationPage'
import OmOssPage from './pages/OmOssPage'
import TurerPage from './pages/TurerPage'
import BusserPage from './pages/BusserPage'
import BusDetailPage from './pages/BusDetailPage'
import PriserPage from './pages/PriserPage'
import TurDetailPage from './pages/TurDetailPage'
import NotFoundPage from './pages/NotFoundPage'
import BookingLookupPage from './pages/BookingLookupPage'
import VilkarPage from './pages/VilkarPage'
import FaqPage from './pages/FaqPage'
import PersonvernPage from './pages/PersonvernPage'
import TrackingPage from './pages/TrackingPage'

function App() {
  return (
    <ErrorBoundary>
    <ConfigProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/book" element={<BookingPage />} />
            <Route path="/jobb" element={<DriverApplicationPage />} />
            <Route path="/om-oss" element={<OmOssPage />} />
            <Route path="/priser" element={<PriserPage />} />
            <Route path="/kontakt" element={<KontaktPage />} />
            <Route path="/turer" element={<TurerPage />} />
            <Route path="/turer/:slug" element={<TurDetailPage />} />
            <Route path="/busser" element={<BusserPage />} />
            <Route path="/busser/:id" element={<BusDetailPage />} />
            <Route path="/bestilling" element={<BookingLookupPage />} />
            <Route path="/bestilling/:ref" element={<BookingLookupPage />} />
            <Route path="/vilkar" element={<VilkarPage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/personvern" element={<PersonvernPage />} />
          </Route>
          <Route path="/sporing/:token" element={<TrackingPage />} />
          <Route path="/logg-inn" element={<LoginPage />} />
          <Route path="/admin/login" element={<Navigate to="/logg-inn" replace />} />
          <Route path="/driver/login" element={<Navigate to="/logg-inn" replace />} />
          <Route path="/driver/bytt-passord" element={<DriverChangePasswordPage />} />
          <Route path="/driver" element={
            <DriverProtectedRoute><DriverLayout /></DriverProtectedRoute>
          }>
            <Route index element={<DriverTripsPage />} />
            <Route path="turer/:id" element={<DriverTripDetailPage />} />
          </Route>
          <Route path="/admin" element={
            <ProtectedRoute><AdminLayout /></ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="inbox" element={<AdminInboxPage />} />
            <Route path="bookings" element={<AdminBookingsPage />} />
            <Route path="invoices" element={<AdminInvoicesPage />} />
            <Route path="trips" element={<AdminTripsOverviewPage />} />
            <Route path="bookings/new" element={<AdminNewBookingPage />} />
            <Route path="prices" element={<AdminPricesPage />} />
            <Route path="buses" element={<AdminBusesPage />} />
            <Route path="partners" element={<AdminPartnersPage />} />
            <Route path="recruitment" element={<AdminRecruitmentPage />} />
            <Route path="testimonials" element={<AdminTestimonialsPage />} />
            <Route path="oppdrag" element={<AdminOppdragPage />} />
            <Route path="faq" element={<AdminFaqPage />} />
            <Route path="kontakt" element={<AdminKontaktPage />} />
            <Route path="planning" element={<AdminPlanningPage />} />
            <Route path="content" element={<AdminContentPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
    </ErrorBoundary>
  )
}

export default App
