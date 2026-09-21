// Renders a booking as a printable/downloadable invoice document. Shared by the booking
// detail card (fresh invoice generation) and the Fakturaer list (re-download an existing
// invoice) — see AdminBookingsPage.jsx and AdminInvoicesPage.jsx.
export function printInvoice(booking, invoiceNumber, invoiceDate, bankAccountNumber = '', company) {
  const date = (d) => d ? new Date(d).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' }) : '–'
  const kr = (n) => n != null ? Number(n).toLocaleString('nb-NO') + ' kr' : '–'
  const dueDate = new Date(invoiceDate)
  dueDate.setDate(dueDate.getDate() + 14)

  const html = `<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8"/>
  <title>Faktura ${invoiceNumber} – ${booking.contactName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a2e; padding: 40px; }
    .toolbar { position: fixed; top: 0; left: 0; right: 0; background: #1a3a6b; color: white; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; z-index: 999; font-size: 13px; }
    .toolbar span { opacity: 0.8; }
    .btn-pdf { background: white; color: #1a3a6b; border: none; padding: 8px 20px; border-radius: 6px; font-weight: 700; font-size: 13px; cursor: pointer; }
    .btn-pdf:hover { background: #f0f4ff; }
    body { padding-top: 60px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 3px solid #1a3a6b; padding-bottom: 20px; }
    .company { font-size: 22px; font-weight: 900; color: #1a3a6b; letter-spacing: -0.5px; }
    .company-sub { font-size: 11px; color: #666; margin-top: 2px; }
    .doc-title { text-align: right; }
    .doc-title h2 { font-size: 22px; font-weight: 900; color: #1a3a6b; }
    .doc-title .inv-num { font-size: 15px; font-weight: 700; color: #333; margin-top: 4px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
    .meta-box h4 { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 8px; }
    .meta-box p { font-size: 13px; line-height: 1.6; }
    .meta-box .highlight { font-weight: 700; font-size: 14px; color: #1a3a6b; }
    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 10px; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-bottom: 24px; }
    .field label { font-size: 10px; color: #888; display: block; margin-bottom: 2px; }
    .field span { font-weight: 600; font-size: 13px; }
    .price-table { width: 100%; border-collapse: collapse; }
    .price-table th { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #888; font-weight: 600; text-align: left; padding: 6px 12px; border-bottom: 2px solid #eee; }
    .price-table td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; }
    .price-table tr.total td { font-weight: 700; font-size: 15px; background: #1a3a6b; color: white; border-bottom: none; }
    .price-table tr.vat td { color: #666; font-size: 12px; }
    .amount { text-align: right; }
    .payment-box { background: #f0f4ff; border: 1px solid #c5d5f5; border-radius: 6px; padding: 16px; margin-top: 24px; }
    .payment-box h4 { font-size: 12px; font-weight: 700; color: #1a3a6b; margin-bottom: 8px; }
    .payment-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; }
    .payment-label { color: #666; }
    .payment-value { font-weight: 700; }
    .note { font-size: 11px; color: #888; margin-top: 20px; line-height: 1.6; border-top: 1px solid #eee; padding-top: 12px; }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #ddd; font-size: 11px; color: #888; display: flex; justify-content: space-between; }
    @media print { .toolbar { display: none; } body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="toolbar">
    <span>Faktura ${invoiceNumber} – ${booking.contactName}</span>
    <button class="btn-pdf" onclick="window.print()">⬇ Last ned PDF</button>
  </div>

  <div class="header">
    <div>
      <div class="company">${company.name}</div>
      <div class="company-sub">${company.address}</div>
      ${company.orgNr ? `<div class="company-sub">Org.nr. ${company.orgNr} · MVA-registrert</div>` : ''}
      <div class="company-sub">${company.email} · ${company.phone}</div>
    </div>
    <div class="doc-title">
      <h2>FAKTURA</h2>
      <div class="inv-num">${invoiceNumber}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-box">
      <h4>Fakturert til</h4>
      <p><strong>${booking.contactName || '–'}</strong></p>
      ${booking.orgName ? `<p>${booking.orgName}${booking.orgNumber ? ' · Org.nr. ' + booking.orgNumber : ''}</p>` : ''}
      <p>${booking.contactEmail || ''}</p>
      <p>${booking.contactPhone || ''}</p>
    </div>
    <div class="meta-box" style="text-align:right">
      <h4>Fakturadetaljer</h4>
      <p><span class="payment-label">Fakturadato: </span><strong>${date(invoiceDate)}</strong></p>
      <p><span class="payment-label">Forfallsdato: </span><strong class="highlight">${date(dueDate)}</strong></p>
      <p><span class="payment-label">Referanse: </span><strong>${booking.reference}</strong></p>
    </div>
  </div>

  <div class="section-title">Tjenestebeskrivelse</div>
  <table class="price-table">
    <thead>
      <tr>
        <th>Beskrivelse</th>
        <th>Detaljer</th>
        <th class="amount">Beløp eks. mva</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Busstransport – ${booking.tripType === 'return' ? 'Tur/retur' : 'Enveis'}</strong><br/><span style="font-size:11px;color:#666">${booking.fromAddress} → ${booking.toAddress}</span></td>
        <td style="font-size:12px;color:#555">${date(booking.departureDate)} kl. ${booking.departureTime || '–'}<br/>${booking.busName || '–'} · ${booking.passengers || '–'} pass.${booking.busCount > 1 ? ' · ' + booking.busCount + ' busser' : ''}<br/>${booking.distanceKm || 0} km</td>
        <td class="amount"><strong>${kr(booking.estimatedBase)}</strong></td>
      </tr>
      ${booking.needsTrailer || booking.needsWheelchair || booking.selectedExtras?.length > 0 ? `
      <tr>
        <td>Tilleggstjenester</td>
        <td style="font-size:11px;color:#666">${[booking.needsTrailer ? 'Tilhenger' : '', booking.needsWheelchair ? 'Rullestoltilpasset' : '', ...(booking.selectedExtras || [])].filter(Boolean).join(', ')}</td>
        <td class="amount">–</td>
      </tr>` : ''}
      ${booking.priceAdjustment ? `
      <tr>
        <td><strong>${booking.priceAdjustment > 0 ? 'Tillegg' : 'Rabatt'}</strong></td>
        <td style="font-size:11px;color:#666">${booking.priceAdjustmentNote || '–'}</td>
        <td class="amount"><strong>${booking.priceAdjustment > 0 ? '+' : ''}${kr(booking.priceAdjustment)}</strong></td>
      </tr>` : ''}
      ${(booking.extraCharges || []).map(c => `
      <tr>
        <td><strong>Ekstra kostnad</strong></td>
        <td style="font-size:11px;color:#666">${c.description}</td>
        <td class="amount"><strong>${c.amount > 0 ? '+' : ''}${kr(c.amount)}</strong></td>
      </tr>`).join('')}
      <tr class="vat">
        <td colspan="2" style="text-align:right;padding-right:12px">MVA 12 %</td>
        <td class="amount">${kr(booking.estimatedVat)}</td>
      </tr>
      <tr class="total">
        <td colspan="2"><strong>TOTALT Å BETALE inkl. MVA</strong></td>
        <td class="amount"><strong>${kr(booking.estimatedTotal)}</strong></td>
      </tr>
    </tbody>
  </table>

  <div class="payment-box">
    <h4>Betalingsinformasjon</h4>
    <div class="payment-grid">
      <span class="payment-label">Kontonummer:</span><span class="payment-value">${bankAccountNumber || 'Ikke konfigurert — sett opp i Admin → Innhold'}</span>
      <span class="payment-label">KID / melding:</span><span class="payment-value">${invoiceNumber}</span>
      <span class="payment-label">Forfallsdato:</span><span class="payment-value">${date(dueDate)}</span>
      <span class="payment-label">Beløp:</span><span class="payment-value">${kr(booking.estimatedTotal)}</span>
    </div>
  </div>

  ${booking.message ? `<div style="margin-top:16px;font-size:12px;color:#555;background:#f9f9f9;padding:10px 14px;border-radius:4px;border-left:3px solid #ccc"><strong>Merknad:</strong> ${booking.message}</div>` : ''}

  <p class="note">
    Betalingsbetingelser: 14 dager netto. Ved forsinket betaling påløper lovpålagt forsinkelsesrente.
    Fakturert av ${company.name}.
    Spørsmål om denne fakturaen? Kontakt ${company.email} eller ${company.phone}.
  </p>

  <div class="footer">
    <span>${company.name} · ${company.address} · ${company.email}</span>
    <span>Faktura ${invoiceNumber}</span>
  </div>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}
