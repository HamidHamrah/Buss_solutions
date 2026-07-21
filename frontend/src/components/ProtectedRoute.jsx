import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children }) {
  const auth = sessionStorage.getItem('admin_auth')
  if (!auth) return <Navigate to="/logg-inn" replace />
  return children
}
