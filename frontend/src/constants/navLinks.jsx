import {
  LayoutDashboard,
  Search,
  Package,
  ScanLine,
  Layers,
  Truck,
  MapPin,
  Building2,
  BarChart2,
  Users,
} from 'lucide-react'

/**
 * Role-based navigation link definitions.
 * Shared between the desktop Header and the mobile BottomNav.
 *
 * Shape: { to, label, icon: LucideComponent, end?: bool, badge?: number }
 */
export const NAV_LINKS = {
  customer: [
    { to: '/customer/dashboard', label: 'Home',    icon: LayoutDashboard, end: true },
    { to: '/track',              label: 'Track',   icon: Search },
    { to: '/customer/parcels',   label: 'Parcels', icon: Package },
  ],

  clerk: [
    { to: '/clerk/dashboard',  label: 'Home',      icon: LayoutDashboard, end: true },
    { to: '/clerk/scan',       label: 'Scan',      icon: ScanLine },
    { to: '/clerk/manifests',  label: 'Manifests', icon: Layers },
    { to: '/clerk/parcels',    label: 'Parcels',   icon: Package },
  ],

  driver: [
    { to: '/driver/dashboard',  label: 'Home',      icon: LayoutDashboard, end: true },
    { to: '/driver/jobs',       label: 'My Jobs',   icon: Truck },
    { to: '/driver/manifests',  label: 'Manifests', icon: Layers },
    { to: '/driver/location',   label: 'Location',  icon: MapPin },
  ],

  admin: [
    { to: '/admin/dashboard', label: 'Home',     icon: LayoutDashboard, end: true },
    { to: '/admin/parcels',   label: 'Parcels',  icon: Package },
    { to: '/admin/drivers',   label: 'Drivers',  icon: Truck },
    { to: '/admin/stations',  label: 'Stations', icon: Building2 },
    { to: '/admin/reports',   label: 'Reports',  icon: BarChart2 },
  ],
}

export { Users }
