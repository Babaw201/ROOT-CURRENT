import { NAV_ITEMS, type Page } from '../../app/navigation'

export function BottomNav({
  currentPage,
  unreadAlertCount,
  onNavigate,
}: {
  currentPage: Page
  unreadAlertCount: number
  onNavigate: (page: Page) => void
}) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 px-0.5 py-1.5 backdrop-blur lg:hidden"
      aria-label="Navigation principale"
    >
      <div className="flex justify-around">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
          const active = currentPage === key
          return (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              aria-current={active ? 'page' : undefined}
              className={`relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl px-0.5 py-2 text-center text-[9.5px] leading-[1.15] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#426238] ${
                active ? 'font-medium text-[#36572f]' : 'text-stone-500'
              }`}
            >
              <span className="relative">
                <Icon size={19} aria-hidden="true" />
                {key === 'alerts' && unreadAlertCount > 0 && (
                  <span
                    className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-rose-500"
                    aria-hidden="true"
                  />
                )}
              </span>
              <span className="w-full break-words">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
