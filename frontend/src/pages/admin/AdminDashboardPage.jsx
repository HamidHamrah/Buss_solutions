import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { TrendingUp, TrendingDown, Minus, ClipboardList, CheckCircle, XCircle, Inbox, DollarSign, RefreshCw } from 'lucide-react'
import { api } from '../../services/api'

const BLUE   = '#1E40AF'
const GREEN  = '#16a34a'
const RED    = '#dc2626'
const GRAY   = '#9ca3af'
const YELLOW = '#d97706'

function KpiCard({ label, value, sub, icon: Icon, color, trend }) {
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const trendColor = trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-400' : 'text-gray-400'
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
            <TrendIcon size={13} />
            {Math.abs(trend)}% vs forrige måned
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-brand-dark">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  )
}

const norKr = n => n?.toLocaleString('nb-NO', { style: 'currency', currency: 'NOK', maximumFractionDigits: 0 })

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-bold text-brand-dark mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="mb-0.5">
          {p.name}: <span className="font-semibold">{p.name === 'Omsetning' ? norKr(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  )
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = () => {
    setLoading(true)
    setError(false)
    api.getBookingStats()
      .then(setStats)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(n => <div key={n} className="h-28 bg-gray-100 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-64 bg-gray-100 rounded-2xl" />
        <div className="h-64 bg-gray-100 rounded-2xl" />
      </div>
    </div>
  )

  if (error || !stats) return (
    <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl p-6 text-sm flex items-center justify-between gap-4">
      <span>Kunne ikke laste statistikk — start backend-serveren og prøv igjen.</span>
      <button onClick={load}
        className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors flex-shrink-0">
        <RefreshCw size={14} /> Prøv igjen
      </button>
    </div>
  )

  const { totals, perMonth, byBus } = stats

  const trend = totals.lastMonth > 0
    ? Math.round(((totals.thisMonth - totals.lastMonth) / totals.lastMonth) * 100)
    : totals.thisMonth > 0 ? 100 : 0

  const barData = perMonth.map(m => ({
    name: m.month,
    'Ny':        m.new_,
    'Bekreftet': m.confirmed,
    'Avlyst':    m.cancelled,
  }))

  const revenueData = perMonth.map(m => ({
    name: m.month,
    Omsetning: m.revenue,
  }))

  const pieData = [
    { name: 'Ny',        value: totals.newCount,  color: BLUE   },
    { name: 'Bekreftet', value: totals.confirmed,  color: GREEN  },
    { name: 'Avlyst',    value: totals.cancelled,  color: RED    },
  ].filter(d => d.value > 0)

  const busData = (byBus || []).map(b => ({ name: b.bus || 'Ukjent', Bestillinger: b.count }))

  return (
    <div className="space-y-6">

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Totale bestillinger"
          value={totals.all}
          icon={ClipboardList}
          color="bg-blue-50 text-brand-blue"
          trend={trend}
          sub={`${totals.thisMonth} denne måneden`}
        />
        <KpiCard
          label="Innboks (nye)"
          value={totals.newCount}
          icon={Inbox}
          color="bg-yellow-50 text-yellow-600"
          sub={<Link to="/admin/bookings" className="text-brand-blue underline">Gå til innboks</Link>}
        />
        <KpiCard
          label="Bekreftede"
          value={totals.confirmed}
          icon={CheckCircle}
          color="bg-green-50 text-green-600"
        />
        <KpiCard
          label="Estimert omsetning"
          value={norKr(totals.revenue)}
          icon={DollarSign}
          color="bg-indigo-50 text-indigo-600"
          sub="kun bekreftede bestillinger"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Bookings per month bar chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-bold text-brand-dark text-sm mb-4">Bestillinger siste 6 måneder</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barSize={10} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={24} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
              <Bar dataKey="Ny"        fill={BLUE}   radius={[4,4,0,0]} />
              <Bar dataKey="Bekreftet" fill={GREEN}  radius={[4,4,0,0]} />
              <Bar dataKey="Avlyst"    fill={RED}    radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status donut */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-bold text-brand-dark text-sm mb-4">Fordeling etter status</h2>
          {pieData.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-gray-300 text-sm">Ingen data ennå</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72}
                    dataKey="value" strokeWidth={0}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1.5 mt-3">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-gray-600">{d.name}</span>
                    </span>
                    <span className="font-bold text-brand-dark">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Revenue line chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-bold text-brand-dark text-sm mb-4">Estimert omsetning siste 6 måneder (kr)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={52}
                tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="Omsetning" stroke={BLUE} strokeWidth={2.5}
                dot={{ fill: BLUE, r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Most booked buses */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-bold text-brand-dark text-sm mb-4">Mest bestilte buss</h2>
          {busData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-gray-300 text-sm">Ingen data ennå</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={busData} layout="vertical" barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Bestillinger" fill={BLUE} radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  )
}
