/**
 * Shared parcel domain constants used across customer, clerk, and driver flows.
 */

/* ── Status config ─────────────────────────────────────── */
export const STATUS_CONFIG = {
  created:        { label: 'Created',        badge: 'badge-gray',  color: '#94a3b8', step: 0 },
  at_origin:      { label: 'At Station',     badge: 'badge-blue',  color: '#1241a6', step: 1 },
  in_transit:     { label: 'In Transit',     badge: 'badge-amber', color: '#d97706', step: 2 },
  at_destination: { label: 'Arrived',        badge: 'badge-blue',  color: '#1241a6', step: 3 },
  delivered:      { label: 'Delivered',      badge: 'badge-green', color: '#16a34a', step: 4 },
  failed_attempt: { label: 'Failed Attempt', badge: 'badge-red',   color: '#dc2626', step: -1 },
  returned:       { label: 'Returned',       badge: 'badge-gray',  color: '#94a3b8', step: -1 },
}

/* Full journey steps (for the tracking timeline) */
export const JOURNEY_STEPS = [
  { status: 'created',        label: 'Parcel Created',        desc: 'Booking confirmed. Awaiting check-in at origin station.' },
  { status: 'at_origin',      label: 'At Origin Station',     desc: 'Scanned in and ready for dispatch.' },
  { status: 'in_transit',     label: 'In Transit',            desc: 'On the way to the destination.' },
  { status: 'at_destination', label: 'Arrived at Destination',desc: 'Receiver has been notified with an OTP.' },
  { status: 'delivered',      label: 'Delivered',             desc: 'Parcel collected by the receiver.' },
]

/* ── Stations ───────────────────────────────────────────── */
export const STATIONS = [
  { id: 'tad-stc',      name: 'Takoradi STC Terminal',    city: 'Takoradi'   },
  { id: 'tad-vip',      name: 'Takoradi VIP Station',     city: 'Takoradi'   },
  { id: 'acc-central',  name: 'Accra Central Station',    city: 'Accra'      },
  { id: 'acc-kaneshie', name: 'Accra Kaneshie',           city: 'Accra'      },
  { id: 'ksi-kejetia',  name: 'Kumasi Kejetia Terminal',  city: 'Kumasi'     },
  { id: 'cpc-station',  name: 'Cape Coast Station',       city: 'Cape Coast' },
  { id: 'ho-station',   name: 'Ho Bus Terminal',          city: 'Ho'         },
  { id: 'suny-station', name: 'Sunyani Station',          city: 'Sunyani'    },
]

/* ── Weight options ─────────────────────────────────────── */
export const WEIGHT_OPTIONS = [
  { value: 'under-1', label: 'Under 1 kg',  fee: 0  },
  { value: '1-3',     label: '1 – 3 kg',    fee: 5  },
  { value: '3-5',     label: '3 – 5 kg',    fee: 15 },
  { value: '5-10',    label: '5 – 10 kg',   fee: 25 },
  { value: 'over-10', label: 'Over 10 kg',  fee: 40 },
]

/* ── Item categories ────────────────────────────────────── */
export const ITEM_CATEGORIES = [
  'Documents',
  'Electronics',
  'Clothing & Textiles',
  'Food & Groceries',
  'Household Items',
  'Medical Supplies',
  'Other',
]

/* ── Fee calculator ─────────────────────────────────────── */
const BASE_FEES = { intercity: 25, local: 15 }
const FRAGILE_FEE = 5

export function calculateFee(deliveryType, weightValue, fragile) {
  const base    = BASE_FEES[deliveryType] || 15
  const weight  = WEIGHT_OPTIONS.find((w) => w.value === weightValue)?.fee || 0
  const fragileFee = fragile ? FRAGILE_FEE : 0
  return base + weight + fragileFee
}

export function formatFeeBreakdown(deliveryType, weightValue, fragile) {
  const base    = BASE_FEES[deliveryType] || 15
  const weight  = WEIGHT_OPTIONS.find((w) => w.value === weightValue)?.fee || 0
  const fragileFee = fragile ? FRAGILE_FEE : 0
  return [
    { label: `Base fee (${deliveryType === 'intercity' ? 'intercity' : 'local'})`, amount: base },
    ...(weight > 0 ? [{ label: 'Weight surcharge', amount: weight }] : []),
    ...(fragileFee > 0 ? [{ label: 'Fragile handling', amount: fragileFee }] : []),
  ]
}
