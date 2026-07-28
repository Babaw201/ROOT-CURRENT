import { useMemo, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BatteryMedium,
  Bell,
  Bluetooth,
  CheckCircle2,
  ChevronRight,
  Droplets,
  Gauge,
  Home,
  Leaf,
  Lightbulb,
  Plus,
  Radio,
  Settings,
  Sprout,
  Sun,
  Thermometer,
  Wifi,
  X,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type Page = 'home' | 'plants' | 'alerts' | 'history' | 'settings'
type Severity = 'ok' | 'warning' | 'danger'
type SensorSize = 'S' | 'M' | 'L'

type HistoryPoint = {
  day: string
  moisture: number
  deepMoisture?: number
  dli: number
}

type Plant = {
  id: string
  nickname: string
  species: string
  room: string
  potSize: 'Petit' | 'Moyen' | 'Grand'
  sensorSize: SensorSize
  healthScore: number
  soilMoisture: number
  deepMoisture?: number
  lightDLI: number
  estimatedPPFD: number
  ambientTemp: number
  ambientHumidity: number
  battery: number
  lastSync: string
  severity: Severity
  recommendedAction: string
  detail: string
  alerts: string[]
  history: HistoryPoint[]
  wateringEvents: string[]
}

const demoPlants: Plant[] = [
  {
    id: 'monstera',
    nickname: 'Mona',
    species: 'Monstera deliciosa',
    room: 'Salon · près de la fenêtre',
    potSize: 'Moyen',
    sensorSize: 'M',
    healthScore: 88,
    soilMoisture: 54,
    lightDLI: 7.6,
    estimatedPPFD: 214,
    ambientTemp: 22.4,
    ambientHumidity: 56,
    battery: 87,
    lastSync: 'il y a 2 min',
    severity: 'ok',
    recommendedAction: 'Rien à faire aujourd’hui',
    detail: 'Le sol sèche normalement et la lumière reçue est adaptée.',
    alerts: [],
    history: [
      { day: 'Lun', moisture: 72, dli: 7.2 },
      { day: 'Mar', moisture: 66, dli: 7.8 },
      { day: 'Mer', moisture: 61, dli: 6.9 },
      { day: 'Jeu', moisture: 57, dli: 8.1 },
      { day: 'Ven', moisture: 54, dli: 7.6 },
      { day: 'Sam', moisture: 51, dli: 7.4 },
      { day: 'Dim', moisture: 54, dli: 7.6 },
    ],
    wateringEvents: ['Arrosage normal · il y a 6 jours', 'Arrosage normal · il y a 14 jours'],
  },
  {
    id: 'pothos',
    nickname: 'Rio',
    species: 'Epipremnum aureum',
    room: 'Bureau · étagère',
    potSize: 'Petit',
    sensorSize: 'S',
    healthScore: 64,
    soilMoisture: 29,
    lightDLI: 4.2,
    estimatedPPFD: 104,
    ambientTemp: 23.1,
    ambientHumidity: 49,
    battery: 74,
    lastSync: 'il y a 4 min',
    severity: 'warning',
    recommendedAction: 'Prévois un arrosage demain',
    detail: 'Le pot approche de son seuil habituel de sécheresse. La lumière reste correcte.',
    alerts: ['Humidité basse bientôt'],
    history: [
      { day: 'Lun', moisture: 55, dli: 4.9 },
      { day: 'Mar', moisture: 49, dli: 4.6 },
      { day: 'Mer', moisture: 43, dli: 4.5 },
      { day: 'Jeu', moisture: 37, dli: 4.3 },
      { day: 'Ven', moisture: 33, dli: 4.1 },
      { day: 'Sam', moisture: 31, dli: 4.0 },
      { day: 'Dim', moisture: 29, dli: 4.2 },
    ],
    wateringEvents: ['Arrosage normal · il y a 9 jours'],
  },
  {
    id: 'calathea',
    nickname: 'Luna',
    species: 'Calathea orbifolia',
    room: 'Chambre · commode',
    potSize: 'Grand',
    sensorSize: 'L',
    healthScore: 42,
    soilMoisture: 79,
    deepMoisture: 31,
    lightDLI: 3.1,
    estimatedPPFD: 78,
    ambientTemp: 22.8,
    ambientHumidity: 52,
    battery: 66,
    lastSync: 'il y a 1 min',
    severity: 'danger',
    recommendedAction: 'Arrosage superficiel détecté',
    detail: 'Le dessus du pot est très humide mais l’eau n’a pas atteint la zone racinaire profonde.',
    alerts: ['Arrosage superficiel', 'Lumière faible cette semaine'],
    history: [
      { day: 'Lun', moisture: 38, deepMoisture: 35, dli: 3.5 },
      { day: 'Mar', moisture: 35, deepMoisture: 33, dli: 3.4 },
      { day: 'Mer', moisture: 31, deepMoisture: 31, dli: 3.0 },
      { day: 'Jeu', moisture: 29, deepMoisture: 30, dli: 2.9 },
      { day: 'Ven', moisture: 83, deepMoisture: 31, dli: 3.2 },
      { day: 'Sam', moisture: 81, deepMoisture: 31, dli: 3.0 },
      { day: 'Dim', moisture: 79, deepMoisture: 31, dli: 3.1 },
    ],
    wateringEvents: ['Arrosage superficiel suspect · aujourd’hui 18:42', 'Arrosage normal · il y a 11 jours'],
  },
  {
    id: 'ficus',
    nickname: 'Atlas',
    species: 'Ficus elastica',
    room: 'Salon · angle droit',
    potSize: 'Grand',
    sensorSize: 'L',
    healthScore: 75,
    soilMoisture: 46,
    lightDLI: 5.4,
    estimatedPPFD: 142,
    ambientTemp: 22.4,
    ambientHumidity: 56,
    battery: 18,
    lastSync: 'il y a 7 min',
    severity: 'warning',
    recommendedAction: 'Recharge le capteur cette semaine',
    detail: 'La plante va bien, mais la batterie du capteur est basse.',
    alerts: ['Batterie capteur faible'],
    history: [
      { day: 'Lun', moisture: 67, dli: 5.7 },
      { day: 'Mar', moisture: 62, dli: 5.8 },
      { day: 'Mer', moisture: 58, dli: 5.0 },
      { day: 'Jeu', moisture: 54, dli: 5.2 },
      { day: 'Ven', moisture: 51, dli: 5.5 },
      { day: 'Sam', moisture: 48, dli: 5.4 },
      { day: 'Dim', moisture: 46, dli: 5.4 },
    ],
    wateringEvents: ['Arrosage normal · il y a 7 jours'],
  },
]

const severityStyle: Record<Severity, string> = {
  ok: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  warning: 'bg-amber-50 text-amber-700 border-amber-100',
  danger: 'bg-rose-50 text-rose-700 border-rose-100',
}

function ScoreRing({ score }: { score: number }) {
  const tone = score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-rose-600'
  return (
    <div className="relative grid h-16 w-16 place-items-center rounded-full bg-white shadow-sm ring-1 ring-black/5">
      <span className={`text-xl font-semibold ${tone}`}>{score}</span>
      <span className="absolute bottom-1.5 text-[9px] uppercase tracking-[.18em] text-stone-400">santé</span>
    </div>
  )
}

function MetricCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-3xl border border-stone-200/80 bg-white p-4 shadow-sm">
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-2xl bg-[#eef4e8] text-[#426238]">{icon}</div>
      <div className="text-sm text-stone-500">{label}</div>
      <div className="mt-1 text-xl font-semibold tracking-tight text-stone-900">{value}</div>
      <div className="mt-1 text-xs leading-5 text-stone-400">{hint}</div>
    </div>
  )
}

function PlantCard({ plant, onOpen }: { plant: Plant; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="group w-full rounded-[28px] border border-stone-200/80 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-[#eef4e8] text-[#426238]">
            <Sprout size={26} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-lg font-semibold text-stone-900">{plant.nickname}</h3>
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${severityStyle[plant.severity]}`}>
                {plant.severity === 'ok' ? 'Stable' : plant.severity === 'warning' ? 'À surveiller' : 'Action requise'}
              </span>
            </div>
            <p className="mt-0.5 truncate text-sm text-stone-500">{plant.species}</p>
            <p className="mt-2 text-xs text-stone-400">{plant.room}</p>
          </div>
        </div>
        <ScoreRing score={plant.healthScore} />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 border-t border-stone-100 pt-4">
        <div><div className="text-[11px] text-stone-400">Sol</div><div className="mt-0.5 text-sm font-medium text-stone-800">{plant.soilMoisture}%</div></div>
        <div><div className="text-[11px] text-stone-400">DLI</div><div className="mt-0.5 text-sm font-medium text-stone-800">{plant.lightDLI}</div></div>
        <div><div className="text-[11px] text-stone-400">Batterie</div><div className="mt-0.5 text-sm font-medium text-stone-800">{plant.battery}%</div></div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-stone-50 px-4 py-3">
        <span className="text-sm font-medium text-stone-700">{plant.recommendedAction}</span>
        <ChevronRight className="shrink-0 text-stone-400 transition group-hover:translate-x-0.5" size={18} />
      </div>
    </button>
  )
}

function App() {
  const [page, setPage] = useState<Page>('home')
  const [plants, setPlants] = useState<Plant[]>(demoPlants)
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const alerts = useMemo(() => plants.flatMap((plant) => plant.alerts.map((text) => ({ plant, text }))), [plants])
  const attentionCount = plants.filter((plant) => plant.severity !== 'ok').length

  const addDemoPlant = () => {
    const next: Plant = {
      ...demoPlants[0],
      id: `plant-${Date.now()}`,
      nickname: 'Nouvelle plante',
      species: 'Plante à identifier',
      room: 'Non défini',
      healthScore: 82,
      soilMoisture: 48,
      battery: 100,
      lastSync: 'à l’instant',
      recommendedAction: 'Observe les premières mesures',
      detail: 'PlantMind apprend maintenant le rythme de séchage de ce pot.',
      alerts: [],
    }
    setPlants((current) => [...current, next])
    setShowAdd(false)
    setSelectedPlant(next)
  }

  return (
    <div className="min-h-screen bg-[#f6f7f2] text-stone-900">
      <div className="mx-auto flex min-h-screen max-w-[1500px]">
        <aside className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 px-2 py-2 backdrop-blur lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:border-r lg:border-t-0 lg:px-5 lg:py-7">
          <div className="hidden items-center gap-3 px-2 lg:flex">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#43683b] text-white shadow-sm"><Leaf size={21} /></div>
            <div><div className="text-lg font-semibold tracking-tight">PlantMind</div><div className="text-xs text-stone-400">Prototype 01</div></div>
          </div>
          <nav className="flex justify-around gap-1 lg:mt-10 lg:block lg:space-y-1">
            {[
              ['home', Home, 'Accueil'],
              ['plants', Sprout, 'Mes plantes'],
              ['alerts', Bell, 'Alertes'],
              ['history', Activity, 'Historique'],
              ['settings', Settings, 'Capteurs'],
            ].map(([key, Icon, label]) => {
              const active = page === key && !selectedPlant
              return (
                <button key={key as string} onClick={() => { setSelectedPlant(null); setPage(key as Page) }} className={`flex min-w-14 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[11px] transition lg:w-full lg:flex-row lg:gap-3 lg:px-4 lg:py-3 lg:text-sm ${active ? 'bg-[#eef4e8] font-medium text-[#36572f]' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'}`}>
                  <Icon size={19} />
                  <span>{label}</span>
                  {key === 'alerts' && alerts.length > 0 && <span className="hidden lg:ml-auto lg:inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-100 px-1.5 text-[10px] font-semibold text-rose-700">{alerts.length}</span>}
                </button>
              )
            })}
          </nav>
          <div className="mt-auto hidden rounded-3xl bg-[#263428] p-4 text-white lg:block">
            <div className="flex items-center gap-2 text-sm font-medium"><Radio size={16} /> Hub connecté</div>
            <div className="mt-2 flex items-center gap-2 text-xs text-white/60"><Wifi size={14} /> Wi-Fi excellent</div>
            <div className="mt-1 text-xs text-white/60">22,4 °C · 56 % HR</div>
          </div>
        </aside>

        <main className="w-full min-w-0 px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-10 lg:pt-8">
          {selectedPlant ? (
            <PlantDetail plant={selectedPlant} onBack={() => setSelectedPlant(null)} />
          ) : page === 'home' ? (
            <>
              <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="mb-1 text-sm font-medium text-[#597451]">Bonjour 👋</div>
                  <h1 className="text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Tes plantes, sans deviner.</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">PlantMind transforme les vraies mesures de chaque pot en actions simples à faire.</p>
                </div>
                <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 rounded-2xl bg-[#426238] px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#36532f]"><Plus size={18} /> Ajouter une plante</button>
              </header>

              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={<Sprout size={18} />} label="Plantes suivies" value={`${plants.length}`} hint="Toutes synchronisées" />
                <MetricCard icon={<AlertTriangle size={18} />} label="À surveiller" value={`${attentionCount}`} hint="Action recommandée aujourd’hui" />
                <MetricCard icon={<Wifi size={18} />} label="Hub central" value="En ligne" hint="Dernière synchro il y a 1 min" />
                <MetricCard icon={<Gauge size={18} />} label="Ambiance salon" value="22,4 °C" hint="56 % d’humidité relative" />
              </section>

              <section className="mt-8 grid gap-6 xl:grid-cols-[1.45fr_.8fr]">
                <div>
                  <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-semibold tracking-tight">Mes plantes</h2><button onClick={() => setPage('plants')} className="text-sm font-medium text-[#4b6845]">Tout voir</button></div>
                  <div className="grid gap-4 md:grid-cols-2">{plants.slice(0, 4).map((plant) => <PlantCard key={plant.id} plant={plant} onOpen={() => setSelectedPlant(plant)} />)}</div>
                </div>
                <div>
                  <h2 className="mb-4 text-xl font-semibold tracking-tight">Ce qui demande ton attention</h2>
                  <div className="rounded-[28px] border border-stone-200/80 bg-white p-4 shadow-sm">
                    {alerts.length === 0 ? <div className="p-6 text-center text-sm text-stone-500">Aucune alerte.</div> : alerts.map(({ plant, text }, index) => (
                      <button key={`${plant.id}-${text}`} onClick={() => setSelectedPlant(plant)} className={`flex w-full items-start gap-3 p-3 text-left ${index !== alerts.length - 1 ? 'border-b border-stone-100' : ''}`}>
                        <div className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${plant.severity === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}><AlertTriangle size={17} /></div>
                        <div className="min-w-0"><div className="text-sm font-medium text-stone-800">{text}</div><div className="mt-0.5 text-xs text-stone-400">{plant.nickname} · {plant.species}</div></div>
                        <ChevronRight size={17} className="ml-auto mt-2 text-stone-300" />
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 rounded-[28px] bg-[#263428] p-5 text-white shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-medium"><Lightbulb size={17} /> Ce que PlantMind apprend</div>
                    <p className="mt-3 text-sm leading-6 text-white/70">Mona sèche environ 14 % plus lentement que la semaine dernière. Aucun changement d’arrosage n’est nécessaire.</p>
                  </div>
                </div>
              </section>
            </>
          ) : page === 'plants' ? (
            <section><PageHeader title="Mes plantes" subtitle="Chaque plante possède son propre micro-environnement." action={<button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 rounded-2xl bg-[#426238] px-4 py-3 text-sm font-medium text-white"><Plus size={18}/> Ajouter</button>} /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{plants.map((plant) => <PlantCard key={plant.id} plant={plant} onOpen={() => setSelectedPlant(plant)} />)}</div></section>
          ) : page === 'alerts' ? (
            <section><PageHeader title="Alertes" subtitle="Uniquement ce qui peut changer ta prochaine action." /><div className="space-y-3">{alerts.map(({ plant, text }) => <button onClick={() => setSelectedPlant(plant)} key={`${plant.id}-${text}`} className="flex w-full items-center gap-4 rounded-3xl border border-stone-200 bg-white p-4 text-left shadow-sm"><div className={`grid h-11 w-11 place-items-center rounded-2xl ${plant.severity === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}><AlertTriangle size={20}/></div><div><div className="font-medium">{text}</div><div className="mt-1 text-sm text-stone-500">{plant.nickname} · {plant.room}</div></div><ChevronRight size={18} className="ml-auto text-stone-300"/></button>)}</div></section>
          ) : page === 'history' ? (
            <section><PageHeader title="Historique" subtitle="Observe les tendances, pas seulement une mesure isolée." /><div className="grid gap-5 xl:grid-cols-2">{plants.map((plant) => <div key={plant.id} className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><div className="font-semibold">{plant.nickname}</div><div className="text-xs text-stone-400">Humidité du sol · 7 jours</div></div><span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-500">{plant.soilMoisture}% aujourd’hui</span></div><div className="h-52"><ResponsiveContainer width="100%" height="100%"><LineChart data={plant.history}><CartesianGrid stroke="#eeeae3" vertical={false}/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize:11, fill:'#9a948a'}}/><YAxis axisLine={false} tickLine={false} tick={{fontSize:11, fill:'#9a948a'}} domain={[0,100]}/><Tooltip/><Line type="monotone" dataKey="moisture" stroke="#52764a" strokeWidth={3} dot={false}/>{plant.deepMoisture !== undefined && <Line type="monotone" dataKey="deepMoisture" stroke="#b76553" strokeWidth={2} strokeDasharray="5 5" dot={false}/>}</LineChart></ResponsiveContainer></div></div>)}</div></section>
          ) : (
            <SettingsPage />
          )}
        </main>
      </div>

      {showAdd && <AddPlantModal onClose={() => setShowAdd(false)} onAdd={addDemoPlant} />}
    </div>
  )
}

function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return <header className="mb-7 flex items-start justify-between gap-4"><div><h1 className="text-3xl font-semibold tracking-[-0.03em]">{title}</h1><p className="mt-2 text-sm text-stone-500">{subtitle}</p></div>{action}</header>
}

function PlantDetail({ plant, onBack }: { plant: Plant; onBack: () => void }) {
  return (
    <section>
      <button onClick={onBack} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-900"><ArrowLeft size={17}/> Retour</button>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4"><div className="grid h-16 w-16 place-items-center rounded-3xl bg-[#eaf1e4] text-[#426238]"><Sprout size={30}/></div><div><div className="flex items-center gap-2"><h1 className="text-3xl font-semibold tracking-tight">{plant.nickname}</h1><span className="rounded-full bg-white px-2.5 py-1 text-xs text-stone-500 ring-1 ring-stone-200">Capteur {plant.sensorSize}</span></div><p className="mt-1 text-sm text-stone-500">{plant.species} · {plant.room}</p></div></div>
        <ScoreRing score={plant.healthScore}/>
      </div>

      <div className={`mb-6 rounded-[30px] border p-5 ${severityStyle[plant.severity]}`}>
        <div className="flex items-start gap-4"><div className="mt-0.5">{plant.severity === 'ok' ? <CheckCircle2 size={24}/> : <AlertTriangle size={24}/>}</div><div><div className="text-lg font-semibold">{plant.recommendedAction}</div><p className="mt-1 max-w-3xl text-sm leading-6 opacity-80">{plant.detail}</p>{plant.id === 'calathea' && <div className="mt-4 rounded-2xl bg-white/70 p-4 text-sm"><div className="font-medium">Pourquoi PlantMind pense ça</div><div className="mt-2 grid gap-2 sm:grid-cols-2"><div>Surface : <strong>{plant.soilMoisture}%</strong></div><div>Zone profonde : <strong>{plant.deepMoisture}%</strong></div></div><p className="mt-2 text-xs opacity-70">L’écart est trop important pour considérer l’arrosage comme complet.</p></div>}</div></div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<Droplets size={18}/>} label="Humidité du sol" value={`${plant.soilMoisture}%`} hint={plant.deepMoisture ? `${plant.deepMoisture}% en profondeur` : 'Courbe de séchage normale'} />
        <MetricCard icon={<Sun size={18}/>} label="Lumière aujourd’hui" value={`${plant.lightDLI} DLI`} hint={`PPFD estimé ${plant.estimatedPPFD} µmol/m²/s`} />
        <MetricCard icon={<Thermometer size={18}/>} label="Micro-climat" value={`${plant.ambientTemp} °C`} hint={`${plant.ambientHumidity}% humidité relative`} />
        <MetricCard icon={<BatteryMedium size={18}/>} label="Capteur" value={`${plant.battery}%`} hint={`Synchro ${plant.lastSync}`} />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.4fr_.7fr]">
        <div className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm">
          <div className="mb-4"><h2 className="font-semibold">Humidité · 7 jours</h2><p className="mt-1 text-xs text-stone-400">La tendance compte plus que la valeur instantanée.</p></div>
          <div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={plant.history}><CartesianGrid stroke="#eeeae3" vertical={false}/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize:11, fill:'#9a948a'}}/><YAxis axisLine={false} tickLine={false} tick={{fontSize:11, fill:'#9a948a'}} domain={[0,100]}/><Tooltip/><Line name="Surface" type="monotone" dataKey="moisture" stroke="#52764a" strokeWidth={3} dot={{r:3}}/>{plant.deepMoisture !== undefined && <Line name="Profondeur" type="monotone" dataKey="deepMoisture" stroke="#b76553" strokeWidth={2.5} strokeDasharray="6 5" dot={{r:2}}/>}</LineChart></ResponsiveContainer></div>
        </div>
        <div className="space-y-5">
          <div className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Arrosages récents</h2><div className="mt-4 space-y-3">{plant.wateringEvents.map((event) => <div key={event} className="flex gap-3 text-sm text-stone-600"><div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#52764a]"/>{event}</div>)}</div></div>
          <div className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm"><h2 className="font-semibold">Capteur PlantMind</h2><div className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><span className="text-stone-500">Bluetooth</span><span className="font-medium text-emerald-700">Connecté</span></div><div className="flex justify-between"><span className="text-stone-500">Taille</span><span className="font-medium">{plant.sensorSize}</span></div><div className="flex justify-between"><span className="text-stone-500">Pot</span><span className="font-medium">{plant.potSize}</span></div><div className="flex justify-between"><span className="text-stone-500">Dernière synchro</span><span className="font-medium">{plant.lastSync}</span></div></div></div>
        </div>
      </div>
    </section>
  )
}

function SettingsPage() {
  return (
    <section>
      <PageHeader title="Capteurs & hub" subtitle="État simulé du futur système physique PlantMind." />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#eef4e8] text-[#426238]"><Radio size={21}/></div><div><div className="font-semibold">Hub PlantMind</div><div className="text-sm text-emerald-700">En ligne</div></div></div><div className="mt-6 grid grid-cols-2 gap-3"><MetricMini label="Wi-Fi" value="Excellent" icon={<Wifi size={15}/>}/><MetricMini label="BLE" value="4 capteurs" icon={<Bluetooth size={15}/>}/><MetricMini label="Température" value="22,4 °C" icon={<Thermometer size={15}/>}/><MetricMini label="Humidité" value="56 %" icon={<Droplets size={15}/>}/></div><button className="mt-5 w-full rounded-2xl border border-stone-200 py-3 text-sm font-medium">Tester la connexion</button></div>
        <div className="rounded-[30px] border border-stone-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-stone-100 text-stone-600"><Bluetooth size={21}/></div><div><div className="font-semibold">Ajouter un capteur</div><div className="text-sm text-stone-500">Simulation du futur appairage BLE</div></div></div><ol className="mt-6 space-y-4 text-sm text-stone-600"><li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-stone-100 text-xs font-semibold">1</span>Approche le capteur du hub.</li><li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-stone-100 text-xs font-semibold">2</span>Maintiens le bouton d’appairage.</li><li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-stone-100 text-xs font-semibold">3</span>Associe-le à une plante et à une taille S/M/L.</li></ol><button className="mt-6 w-full rounded-2xl bg-[#426238] py-3 text-sm font-medium text-white">Lancer une démo d’appairage</button></div>
      </div>
    </section>
  )
}

function MetricMini({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <div className="rounded-2xl bg-stone-50 p-3"><div className="flex items-center gap-2 text-xs text-stone-400">{icon}{label}</div><div className="mt-1 text-sm font-medium text-stone-800">{value}</div></div>
}

function AddPlantModal({ onClose, onAdd }: { onClose: () => void; onAdd: () => void }) {
  const [step, setStep] = useState(1)
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/30 p-0 backdrop-blur-sm sm:place-items-center sm:p-4">
      <div className="w-full max-w-lg rounded-t-[32px] bg-white p-5 shadow-2xl sm:rounded-[32px] sm:p-6">
        <div className="flex items-start justify-between"><div><div className="text-xs font-semibold uppercase tracking-[.16em] text-[#5b7653]">Étape {step}/3</div><h2 className="mt-1 text-2xl font-semibold tracking-tight">Ajouter une plante</h2></div><button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full bg-stone-100"><X size={18}/></button></div>
        {step === 1 && <div className="mt-6 space-y-4"><label className="block text-sm font-medium">Nom de la plante<input className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-[#64825d]" placeholder="Ex. Monstera du salon"/></label><label className="block text-sm font-medium">Espèce<input className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3 outline-none focus:border-[#64825d]" placeholder="Monstera deliciosa"/></label></div>}
        {step === 2 && <div className="mt-6"><div className="text-sm font-medium">Taille du pot / capteur</div><div className="mt-3 grid grid-cols-3 gap-2">{['S · Petit','M · Moyen','L · Grand'].map((size) => <button key={size} className="rounded-2xl border border-stone-200 p-4 text-sm hover:border-[#64825d] hover:bg-[#f1f6ed]">{size}</button>)}</div><label className="mt-5 block text-sm font-medium">Pièce<input className="mt-2 w-full rounded-2xl border border-stone-200 px-4 py-3" placeholder="Salon"/></label></div>}
        {step === 3 && <div className="mt-7 rounded-3xl bg-[#f3f6ef] p-6 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white text-[#426238] shadow-sm"><Bluetooth size={28}/></div><div className="mt-4 font-semibold">Capteur PlantMind détecté</div><p className="mt-2 text-sm leading-6 text-stone-500">Simulation : le vrai prototype sera appairé en Bluetooth avec le hub central.</p></div>}
        <div className="mt-7 flex gap-3">{step > 1 && <button onClick={() => setStep(step - 1)} className="flex-1 rounded-2xl border border-stone-200 py-3 text-sm font-medium">Retour</button>}<button onClick={() => step < 3 ? setStep(step + 1) : onAdd()} className="flex-1 rounded-2xl bg-[#426238] py-3 text-sm font-medium text-white">{step < 3 ? 'Continuer' : 'Ajouter la plante'}</button></div>
      </div>
    </div>
  )
}

export default App
