import { Info, RotateCcw, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '../components/ui/Metrics'
import { STORAGE_SCHEMA_VERSION, resetAllPlantMindStorage } from '../utils/storage'

export function SettingsPage() {
  const [confirmingReset, setConfirmingReset] = useState(false)

  function handleReset() {
    resetAllPlantMindStorage()
    window.location.reload()
  }

  return (
    <>
      <PageHeader title="Paramètres" subtitle="Préférences de l’application et informations sur le mode démonstration." />

      <div className="space-y-5">
        <section className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#eef4e8] text-[#426238]">
              <ShieldCheck size={18} aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-semibold">Source des données</h2>
              <p className="text-xs text-stone-500">Mode démonstration actif</p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-stone-500">
            Aucun hardware PlantMind n’est encore validé : toutes les mesures affichées sont simulées. Le hub local,
            le Bluetooth direct et l’intégration Home Assistant sont prévus dans l’architecture mais pas encore
            actifs — voir <code className="rounded bg-stone-100 px-1.5 py-0.5">docs/hardware-integration.md</code>{' '}
            dans le dépôt.
          </p>
        </section>

        <section className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#eef4e8] text-[#426238]">
              <Info size={18} aria-hidden="true" />
            </div>
            <h2 className="font-semibold">À propos</h2>
          </div>
          <dl className="mt-3 space-y-1.5 text-sm text-stone-600">
            <div className="flex justify-between">
              <dt>Version</dt>
              <dd className="font-medium text-stone-800">Prototype 0.1</dd>
            </div>
            <div className="flex justify-between">
              <dt>Schéma de stockage local</dt>
              <dd className="font-medium text-stone-800">v{STORAGE_SCHEMA_VERSION}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Compte requis</dt>
              <dd className="font-medium text-stone-800">Non</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-[28px] border border-rose-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-50 text-rose-600">
              <RotateCcw size={18} aria-hidden="true" />
            </div>
            <h2 className="font-semibold">Réinitialiser les données locales</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-stone-500">
            Supprime les plantes ajoutées, les préférences et l’état de lecture des alertes, stockés uniquement sur
            cet appareil. Les 8 plantes de démonstration reviendront à leur état initial.
          </p>
          {confirmingReset ? (
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={handleReset}
                className="rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2"
              >
                Confirmer la réinitialisation
              </button>
              <button
                onClick={() => setConfirmingReset(false)}
                className="rounded-2xl border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
              >
                Annuler
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingReset(true)}
              className="mt-4 rounded-2xl border border-rose-200 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
            >
              Réinitialiser
            </button>
          )}
        </section>
      </div>
    </>
  )
}
