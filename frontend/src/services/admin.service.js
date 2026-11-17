import api from './api'
import { STATIONS } from '../constants/parcel'

const PARCEL_KEY   = 'tc_demo_parcels'
const MANIFEST_KEY = 'tc_demo_manifests'

function stored(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}

/* ── Seed parcels — past deliveries for realistic demo ──── */
function seedParcels() {
  const ago = (d, h = 0) => new Date(Date.now() - d * 86_400_000 - h * 3_600_000).toISOString()
  return [
    { trackingId: 'TC-2026-10001', originStation: 'acc-central', destinationStation: 'ksi-asafo',   receiverName: 'Kweku Mensah',  category: 'Electronics', weight: '1-3',  status: 'delivered',       createdAt: ago(2), deliveryType: 'intercity' },
    { trackingId: 'TC-2026-10002', originStation: 'ksi-asafo',   destinationStation: 'tad-stc',     receiverName: 'Akua Poku',     category: 'Documents',   weight: '<1',   status: 'delivered',       createdAt: ago(3), deliveryType: 'intercity' },
    { trackingId: 'TC-2026-10003', originStation: 'acc-central', destinationStation: 'cco-unt',     receiverName: 'Yaw Boateng',   category: 'Clothing',    weight: '1-3',  status: 'delivered',       createdAt: ago(4), deliveryType: 'intercity' },
    { trackingId: 'TC-2026-10004', originStation: 'tma-central', destinationStation: 'acc-central', receiverName: 'Abena Osei',    category: 'Food Items',  weight: '3-10', status: 'delivered',       createdAt: ago(5), deliveryType: 'intercity' },
    { trackingId: 'TC-2026-10005', originStation: 'cco-unt',     destinationStation: 'ksi-asafo',   receiverName: 'Kofi Asante',   category: 'Electronics', weight: '1-3',  status: 'delivered',       createdAt: ago(6), deliveryType: 'intercity' },
    { trackingId: 'TC-DEMO-00001', originStation: 'tad-stc',     destinationStation: 'acc-central', receiverName: 'Kwame Asante',  category: 'Electronics', weight: '1-3',  status: 'at_destination',  createdAt: ago(0, 3), deliveryType: 'intercity' },
    { trackingId: 'TC-DEMO-00002', originStation: 'ksi-asafo',   destinationStation: 'acc-central', receiverName: 'Ama Boateng',   category: 'Documents',   weight: '<1',   status: 'in_transit',      createdAt: ago(0, 3), deliveryType: 'intercity' },
  ]
}

function mergeWithSeed() {
  const live = stored(PARCEL_KEY)
  const liveIds = new Set(live.map((p) => p.trackingId))
  return [...live, ...seedParcels().filter((s) => !liveIds.has(s.trackingId))]
}

/* ═══════════════════════════════════════════════════════
   Admin API
   ═══════════════════════════════════════════════════════ */

export async function getAllParcels() {
  try { return await api.get('/admin/parcels') }
  catch { return import.meta.env.DEV ? mergeWithSeed() : [] }
}

export async function getSystemStats() {
  try { return await api.get('/admin/stats') }
  catch {
    if (!import.meta.env.DEV) return {}
    const parcels   = mergeWithSeed()
    const manifests = stored(MANIFEST_KEY)
    const today     = new Date().toDateString()
    return {
      totalParcels:    parcels.length,
      inTransit:       parcels.filter((p) => p.status === 'in_transit').length,
      atStations:      parcels.filter((p) => ['at_origin', 'at_destination'].includes(p.status)).length,
      deliveredToday:  parcels.filter((p) => p.status === 'delivered' && new Date(p.createdAt).toDateString() === today).length,
      totalDelivered:  parcels.filter((p) => p.status === 'delivered').length,
      activeManifests: manifests.filter((m) => m.status === 'dispatched').length,
      stations: STATIONS.length,
    }
  }
}

export async function getStationStats() {
  try { return await api.get('/admin/stations') }
  catch {
    if (!import.meta.env.DEV) return []
    const parcels = mergeWithSeed()
    return STATIONS.map((s) => ({
      ...s,
      atStation: parcels.filter((p) =>
        (p.originStation === s.id && p.status === 'at_origin') ||
        (p.destinationStation === s.id && p.status === 'at_destination')
      ).length,
      totalIn:  parcels.filter((p) => p.destinationStation === s.id).length,
      totalOut: parcels.filter((p) => p.originStation      === s.id).length,
    }))
  }
}

export async function getReportData() {
  try { return await api.get('/admin/reports') }
  catch {
    if (!import.meta.env.DEV) return {}
    const parcels   = mergeWithSeed()
    const manifests = stored(MANIFEST_KEY)
    const byStatus  = {
      created:        parcels.filter((p) => p.status === 'created').length,
      at_origin:      parcels.filter((p) => p.status === 'at_origin').length,
      in_transit:     parcels.filter((p) => p.status === 'in_transit').length,
      at_destination: parcels.filter((p) => p.status === 'at_destination').length,
      delivered:      parcels.filter((p) => p.status === 'delivered').length,
    }
    const byCategory = {}
    parcels.forEach((p) => { byCategory[p.category || 'Other'] = (byCategory[p.category || 'Other'] || 0) + 1 })
    return {
      parcels,
      byStatus,
      completionRate: parcels.length ? Math.round((byStatus.delivered / parcels.length) * 100) : 0,
      byCategory,
      manifests,
      recentDeliveries: parcels.filter((p) => p.status === 'delivered')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10),
    }
  }
}

export async function getDriverRoster() {
  try { return await api.get('/admin/drivers') }
  catch {
    return [
      { id: 'demo-driver', name: 'Demo Driver',   phone: '0244000003', status: 'online',  station: 'On the Road',      trips: 3,  parcels:  7, rating: 4.8 },
      { id: 'drv-002',     name: 'Kwame Asante',  phone: '0244000010', status: 'online',  station: 'Accra Central',    trips: 12, parcels: 31, rating: 4.9 },
      { id: 'drv-003',     name: 'Akosua Manu',   phone: '0244000011', status: 'offline', station: 'Kumasi Asafo',     trips:  8, parcels: 19, rating: 4.7 },
      { id: 'drv-004',     name: 'Yaw Boakye',    phone: '0244000012', status: 'offline', station: 'Takoradi STC',     trips:  5, parcels: 11, rating: 4.6 },
      { id: 'drv-005',     name: 'Efua Darko',    phone: '0244000013', status: 'online',  station: 'Cape Coast',       trips:  7, parcels: 16, rating: 4.8 },
    ]
  }
}
