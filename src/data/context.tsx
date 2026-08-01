import { createContext, useContext, type ReactNode } from 'react'
import type { DataProvider } from '../types'
import { getMockDataProvider } from './MockDataProvider'

const DataProviderContext = createContext<DataProvider | null>(null)

/**
 * Point de branchement unique de la source de données.
 * Aujourd'hui : toujours `MockDataProvider`. Le jour où un hub réel, un
 * capteur Bluetooth ou Home Assistant sera disponible, c'est ici — et
 * uniquement ici — que l'implémentation active changera.
 */
export function DataProviderRoot({ children }: { children: ReactNode }) {
  const provider = getMockDataProvider()
  return <DataProviderContext.Provider value={provider}>{children}</DataProviderContext.Provider>
}

export function useDataProviderContext(): DataProvider {
  const context = useContext(DataProviderContext)
  if (!context) {
    throw new Error('useDataProviderContext doit être utilisé à l’intérieur de <DataProviderRoot>.')
  }
  return context
}
