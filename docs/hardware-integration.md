# Intégration hardware future

**État actuel : aucun hardware PlantMind n'est validé.** Toutes les mesures affichées dans
l'application sont simulées (`src/mocks/scenarios.ts`). Ce document explique comment une
vraie source de données pourra un jour remplacer ces données simulées, sans réécrire
l'interface.

## Pourquoi c'est possible sans tout réécrire

Aucun composant d'interface ne lit `src/mocks/scenarios.ts` directement. Tout passe par
l'interface `DataProvider` (`src/types/index.ts`) :

```ts
interface DataProvider {
  getPlants(): Promise<Plant[]>
  getPlant(id: string): Promise<Plant | undefined>
  getReadings(plantId: string, range: HistoryRange): Promise<SensorReading[]>
  getAlerts(): Promise<Alert[]>
  getHubStatus(): Promise<Hub | null>
  subscribeToUpdates(callback: () => void): () => void
  addPlant(input: NewPlantInput): Promise<Plant>
  markAlertAsRead(alertId: string): Promise<void>
}
```

Remplacer la source de données consiste à écrire une nouvelle classe qui implémente cette
interface, puis à la brancher dans `src/data/context.tsx` (`DataProviderRoot`). Le moteur
de recommandations (`src/domain/recommendations`), les hooks et toutes les pages
continuent de fonctionner à l'identique, qu'ils reçoivent des données simulées ou réelles.

Trois implémentations existent déjà comme **stubs** dans `src/data/providers/` — elles
respectent l'interface mais échouent volontairement (`Promise.reject`) tant qu'aucun
hardware n'est branché, pour ne jamais laisser croire qu'une donnée simulée est réelle.

## Architecture matérielle prévue

### Capteur par plante

- Microcontrôleur nRF52840, Bluetooth Low Energy.
- Une ou plusieurs sondes capacitives d'humidité (selon la taille S / M / L).
- Capteur de lumière individuel, batterie, niveau de batterie.
- Envoi périodique des mesures, à fréquence **adaptative** (voir plus bas) — pas toutes
  les 15 minutes de façon fixe.

### Hub central (optionnel)

- ESP32-C3, Bluetooth Low Energy + Wi-Fi.
- Température et humidité ambiantes.
- Reçoit les données des capteurs à proximité, les transmet localement à l'application ou
  à Home Assistant.
- Le hub **n'est jamais obligatoire** dans l'architecture logicielle : `DataProvider`
  n'impose pas sa présence.

## LocalHubDataProvider

Lira les données depuis le hub PlantMind sur le réseau local, via HTTP local et/ou
WebSocket local (pour le temps réel) — sans dépendance cloud obligatoire. C'est la voie
prévue pour les utilisateurs qui achètent un hub PlantMind sans vouloir de compte ni de
service distant.

## BluetoothDataProvider

Lira directement les capteurs en BLE depuis le téléphone (probable candidat : format
BTHome, standard ouvert déjà supporté par de nombreux capteurs domestiques), via l'API
Web Bluetooth. Utile pour un usage sans hub, à portée directe du téléphone.

## HomeAssistantDataProvider

Pour les utilisateurs qui ont déjà une instance Home Assistant : lira les entités déjà
découvertes par HA (via MQTT ou un proxy Bluetooth HA), en HTTP local et/ou WebSocket
local vers cette instance. PlantMind ne l'exige jamais — c'est une option pour qui l'a déjà.

## Échantillonnage adaptatif

Le système réel n'échantillonnera pas à fréquence fixe :

- humidité : toutes les 1 à 3 heures en temps normal ;
- lumière : plus régulièrement le jour, quasiment jamais la nuit ;
- juste après un arrosage détecté : mesures plus fréquentes temporairement, puis retour au
  rythme normal.

C'est pour cette raison que les graphiques (MoistureChart, BatteryChart) utilisent un axe
temporel numérique (le vrai timestamp), et non une simple série de catégories également
espacées : l'interface doit rester correcte même avec des intervalles irréguliers. Les
données simulées reproduisent déjà des intervalles irréguliers pour vérifier ce
comportement avant qu'un vrai capteur existe.

## Ce qu'il restera à faire, dans l'ordre

1. Valider le hardware du capteur (carte, sondes, autonomie batterie réelle).
2. Implémenter BluetoothDataProvider avec un vrai appairage Web Bluetooth (l'écran
   Capteurs a déjà l'emplacement d'interface prévu pour ça, actuellement en attente).
3. Implémenter LocalHubDataProvider une fois le firmware du hub disponible.
4. Implémenter HomeAssistantDataProvider pour les utilisateurs avancés.
5. À chaque étape : remplacer MockDataProvider par la nouvelle implémentation dans
   DataProviderRoot, sans toucher au reste du code.

Tant qu'aucune de ces étapes n'est faite, l'application doit rester honnête sur ce qui est
simulé — voir la bannière « mode démonstration » présente sur l'accueil, la fiche plante et
les paramètres.
