# PlantMind 🌱

Prototype logiciel V1 de PlantMind, une application de suivi intelligent des plantes basée sur de futures mesures physiques réelles : humidité du sol, lumière individuelle, température/humidité ambiantes et état du capteur.

## V1

- Dashboard mobile-first
- Liste et fiche détaillée des plantes
- Recommandation d'action avant les données techniques
- Humidité du sol + tendance 7 jours
- DLI / PPFD estimés (données simulées)
- Détection simulée d'arrosage superficiel pour un capteur multi-profondeur
- Alertes lumière, arrosage, batterie et connexion
- État du hub central
- Parcours d'ajout et d'appairage d'un capteur S/M/L
- Architecture de données prête à remplacer les mocks par les futures données BLE/hub

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Lucide React
- Recharts

## Lancer localement

```bash
npm install
npm run dev
```

Puis ouvrir l'adresse indiquée par Vite.

## Build

```bash
npm run build
```

> Cette version utilise volontairement des données simulées. Aucun backend, compte utilisateur, paiement ou API externe n'est encore nécessaire.
