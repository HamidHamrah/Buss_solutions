import { Navigate } from 'react-router-dom'
import { driverMustChangePassword } from '../services/driverApi'

export default function DriverProtectedRoute({ children }) {
  const auth = sessionStorage.getItem('driver_auth')
  if (!auth) return <Navigate to="/driver/login" replace />
  if (driverMustChangePassword()) return <Navigate to="/driver/bytt-passord" replace />
  return children
}
