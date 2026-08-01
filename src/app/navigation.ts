import { Activity, Bell, Home, Radio, Settings, Sprout, type LucideIcon } from 'lucide-react'

export type Page = 'home' | 'plants' | 'alerts' | 'history' | 'sensors' | 'settings'

export interface NavItem {
  key: Page
  label: string
  icon: LucideIcon
}

/** Les 6 sections principales de l'application (cahier des charges §9). */
export const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: 'Accueil', icon: Home },
  { key: 'plants', label: 'Mes plantes', icon: Sprout },
  { key: 'alerts', label: 'Alertes', icon: Bell },
  { key: 'history', label: 'Historique', icon: Activity },
  { key: 'sensors', label: 'Capteurs', icon: Radio },
  { key: 'settings', label: 'Paramètres', icon: Settings },
]
