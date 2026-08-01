import { useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { DataProviderRoot } from '../data/context'
import { useAlerts } from '../hooks/useAlerts'
import { AlertsPage } from '../pages/AlertsPage'
import { HistoryPage } from '../pages/HistoryPage'
import { HomePage } from '../pages/HomePage'
import { PlantDetailPage } from '../pages/PlantDetailPage'
import { PlantsPage } from '../pages/PlantsPage'
import { SensorsPage } from '../pages/SensorsPage'
import { SettingsPage } from '../pages/SettingsPage'
import type { Page } from './navigation'

function AppContent() {
  const [page, setPage] = useState<Page>('home')
  const [selectedPlantId, setSelectedPlantId] = useState<string | undefined>(undefined)
  const { unreadCount } = useAlerts()

  function openPlant(id: string) {
    setSelectedPlantId(id)
    setPage('plants')
  }

  function navigate(next: Page) {
    setSelectedPlantId(undefined)
    setPage(next)
  }

  return (
    <AppShell currentPage={page} unreadAlertCount={unreadCount} onNavigate={navigate}>
      {page === 'home' && <HomePage onOpenPlant={openPlant} onSeeAllPlants={() => navigate('plants')} />}
      {page === 'plants' &&
        (selectedPlantId ? (
          <PlantDetailPage plantId={selectedPlantId} onBack={() => setSelectedPlantId(undefined)} />
        ) : (
          <PlantsPage onOpenPlant={setSelectedPlantId} />
        ))}
      {page === 'alerts' && <AlertsPage onOpenPlant={openPlant} />}
      {page === 'history' && <HistoryPage />}
      {page === 'sensors' && <SensorsPage />}
      {page === 'settings' && <SettingsPage />}
    </AppShell>
  )
}

export default function App() {
  return (
    <DataProviderRoot>
      <AppContent />
    </DataProviderRoot>
  )
}
