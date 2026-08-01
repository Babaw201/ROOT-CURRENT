# Architecture de PlantMind

Ce document explique comment le code est organisé et pourquoi, pour qu'il reste facile à
faire évoluer. Il complète le README (installation, commandes) et
`docs/hardware-integration.md` (comment brancher un vrai capteur plus tard).

## Vue d'ensemble

```
src/
  app/            Composant racine + définition de la navigation
  components/     Composants React réutilisables (UI, mise en page, formulaires)
  pages/          Un composant par section de la navigation principale
  domain/         Règles métier pures (aucun JSX, aucun accès aux données)
  data/           Implémentations de DataProvider + contexte React
  mocks/          Données simulées (8 scénarios), aucune règle de décision
  hooks/          Ponts React ↔ DataProvider (chargement, abonnement, écriture)
  types/          Modèles TypeScript partagés
  utils/          Formatage, temps, localStorage — sans dépendance React
```

La règle générale : **les données descendent, les décisions remontent**. Un composant de
page appelle un hook, le hook appelle le `DataProvider`, et la mise en forme
(recommandation, statut, alertes) est calculée une seule fois, dans `domain/`, jamais dans
un composant.

## Pourquoi un `DataProvider` ?

Toute l'application lit les données à travers l'interface `DataProvider`
(`src/types/index.ts`). Aujourd'hui, une seule implémentation existe réellement :
`MockDataProvider` (`src/data/MockDataProvider.ts`), qui combine :

- les 8 plantes de démonstration (`src/mocks/scenarios.ts`) ;
- les plantes réellement ajoutées par l'utilisateur, persistées en `localStorage`.

Trois autres implémentations existent en tant que **stubs** dans `src/data/providers/` :
`LocalHubDataProvider`, `BluetoothDataProvider`, `HomeAssistantDataProvider`. Chacune
respecte la même interface mais échoue volontairement (`Promise.reject`) tant qu'aucun
hardware réel n'est branché — voir `docs/hardware-integration.md` pour le détail de ce qui
devra être implémenté.

Le point de branchement unique est `src/data/context.tsx` (`DataProviderRoot`). Pour
brancher une vraie source de données plus tard, c'est le **seul** endroit à modifier :
aucun composant de page ni aucun hook n'a besoin de changer.

## Domaine : `src/domain/recommendations/`

C'est le cœur du produit — la transformation « mesures → phrase compréhensible ».

- `config.ts` centralise tous les seuils (humidité, batterie, lumière, température,
  fenêtres de comparaison). Aucun composant ni aucune fonction du moteur ne doit contenir
  un nombre « en dur » qui devrait plutôt vivre ici.
- `engine.ts` contient :
  - un détecteur par type d'anomalie (`detectShallowWatering`, `detectOverwateringRisk`,
    `detectDrySoon`, `detectLowBattery`, `detectLowLight`, `detectHighTemperature`,
    `detectLowTemperature`, `detectSensorOffline`, `detectUnusualDrying`,
    `detectUnusualDrainage`) — chacun est une fonction pure `(historique, …) => Detection | null` ;
  - `computeRecommendation(plant)` : choisit **une seule** recommandation à mettre en avant,
    par ordre de priorité ;
  - `generateAlertsForPlant(plant)` : fait tourner **tous** les détecteurs et produit la
    liste complète des alertes actives (pas seulement la priorité n°1).

Chaque détecteur qui a besoin d'une mesure de profondeur vérifie explicitement sa présence
et renvoie `null` si elle manque — jamais de valeur inventée. C'est ce que couvre le test
« absence de faux positif avec une seule sonde ».

Toutes les formulations générées utilisent un vocabulaire prudent (« possible », «
semble », « probablement », « à vérifier ») : les algorithmes sont expérimentaux et ne
sont jamais présentés comme une certitude.

## Données simulées : `src/mocks/scenarios.ts`

Ce fichier ne fait que produire des relevés de capteur bruts (historique irrégulier sur 30
jours, événements d'arrosage). Il ne calcule ni statut ni recommandation — c'est
`src/data/hydratePlant.ts` qui appelle le moteur de règles pour transformer une « graine »
(`PlantSeed`) en `Plant` complète. Résultat : impossible que les données de démo et la
logique de règles divergent, puisque c'est le même moteur qui traite les vraies données et
les données simulées.

## Hooks : `src/hooks/`

Chaque hook a une seule responsabilité et s'abonne à `DataProvider.subscribeToUpdates` pour
se recharger automatiquement après une écriture (ajout de plante, alerte marquée comme lue) :

- `usePlants` / `usePlant(id)` — liste ou plante unique ;
- `useAlerts` — liste des alertes + `markAsRead` ;
- `useHubStatus` — statut du hub ;
- `useLocalStorageState` — état de composant persistant (filtres de graphique, etc.).

## Composants et pages

- `components/ui/` — composants sans état métier (cartes, badges, graphiques, états
  vides/chargement). Réutilisables tels quels.
- `components/layout/` — `Sidebar` (ordinateur), `BottomNav` (mobile), `AppShell`.
- `components/forms/AddPlantWizard.tsx` — le parcours d'ajout en 9 étapes.
- `pages/` — un composant par section de navigation, qui assemble hooks + composants UI.
  Chaque page reste concentrée sur la mise en page ; aucune logique de détection n'y est
  écrite.
- `app/App.tsx` — ~40 lignes : état de navigation (page courante, plante sélectionnée) et
  câblage du `DataProviderRoot`. Volontairement minimal.

## Persistance locale

`src/utils/storage.ts` centralise toutes les clés `localStorage` sous un même espace de
noms (`plantmind:`) et un numéro de schéma (`STORAGE_SCHEMA_VERSION`). Une seule fonction,
`runStorageMigrationsIfNeeded`, sera le point d'entrée pour toute migration future — pour
l'instant elle ne fait qu'initialiser la version.

## Ce qui est délibérément hors de cette architecture

Aucune gestion d'état globale (Redux, Zustand…) : la navigation est un simple `useState`
dans `App.tsx`, et les données passent par le contexte `DataProvider` + des hooks dédiés.
Avec une seule source de données active et un nombre de plantes raisonnable, un store
global ajouterait de la complexité sans bénéfice pour ce MVP.
