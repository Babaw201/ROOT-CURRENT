import { Leaf, Radio, Wifi } from 'lucide-react'
import { useHubStatus } from '../../hooks/useHubStatus'
import { NAV_ITEMS, type Page } from '../../app/navigation'

export function Sidebar({
  currentPage,
  unreadAlertCount,
  onNavigate,
}: {
  currentPage: Page
  unreadAlertCount: number
  onNavigate: (page: Page) => void
}) {
  const { hub } = useHubStatus()

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-stone-200 bg-white/95 px-5 py-7 lg:flex lg:flex-col">
      <div className="flex items-center gap-3 px-2">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#43683b] text-white shadow-sm">
          <Leaf size={21} aria-hidden="true" />
        </div>
        <div>
          <div className="text-lg font-semibold tracking-tight">PlantMind</div>
          <div className="text-xs text-stone-400">Prototype · mode démo</div>
        </div>
      </div>

      <nav className="mt-10 space-y-1" aria-label="Navigation principale">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
          const active = currentPage === key
          return (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              aria-current={active ? 'page' : undefined}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426238] ${
                active ? 'bg-[#eef4e8] font-medium text-[#36572f]' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'
              }`}
            >
              <Icon size={19} aria-hidden="true" />
              <span>{label}</span>
              {key === 'alerts' && unreadAlertCount > 0 && (
                <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-100 px-1.5 text-[10px] font-semibold text-rose-700">
                  {unreadAlertCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="mt-auto rounded-3xl bg-[#263428] p-4 text-white">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Radio size={16} aria-hidden="true" /> {hub?.online ? 'Hub connecté' : 'Hub hors ligne'}
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-white/60">
          <Wifi size={14} aria-hidden="true" /> Wi-Fi {hub?.wifiQuality ?? '—'}
        </div>
        {hub && (
          <div className="mt-1 text-xs text-white/60">
            {hub.ambientTemperature.toFixed(1)} °C · {Math.round(hub.ambientHumidity)} % HR
          </div>
        )}
      </div>
    </aside>
  )
}
