// Price calculation — pure pricing logic shared by the booking form and the admin price calculator.
// Business content/branding live in SiteConfig (backend), fetched via ConfigContext — see contexts/ConfigContext.jsx.
export function calcTripPrice(pricing, { km, departureTime, tripType, busOnStay, stayDurationHours = 0 }) {
  const { kmRate, hourRate, nightSurcharge, weekendSurcharge, vatPercent, minInvoice } = pricing

  const hour = departureTime ? parseInt(departureTime.split(':')[0]) : 12
  const isNight = hour >= 21 || hour < 6
  const isWeekend = false // would need departure date to know day

  let surcharge = 0
  if (isNight) surcharge = nightSurcharge / 100
  if (isWeekend) surcharge = Math.max(surcharge, weekendSurcharge / 100)

  const effectiveHourRate = hourRate * (1 + surcharge)

  // Estimate travel hours from km (avg 80 km/h)
  const travelHours = km / 80
  const legs = tripType === 'return' ? 2 : 1

  let base = (km * legs * kmRate) + (travelHours * legs * effectiveHourRate)

  // Bus available during stay: add hourly charge for stay duration
  if (busOnStay && stayDurationHours > 0) {
    base += stayDurationHours * effectiveHourRate
  }

  // Apply custom variables that are always-on
  for (const v of (pricing.customVariables || [])) {
    if (v.optional) continue
    if (v.type === 'flat') base += v.value
    if (v.type === 'per_km') base += v.value * km * legs
    if (v.type === 'per_hour') base += v.value * travelHours * legs
    if (v.type === 'percent') base *= (1 + v.value / 100)
  }

  base = Math.max(base, minInvoice)
  const vat = base * (vatPercent / 100)
  return { base: Math.round(base), vat: Math.round(vat), total: Math.round(base + vat) }
}
