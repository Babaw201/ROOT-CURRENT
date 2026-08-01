# PlantMind

PlantMind est un prototype d'application de surveillance pour plantes d'intérieur. Sa
promesse : **comprendre ce qui se passe dans le pot, pas seulement afficher un pourcentage
d'humidité.** Plutôt que « Humidité : 42 % », PlantMind vise à dire des choses comme
*« La surface est humide, mais l'eau n'a probablement pas atteint la zone racinaire »*.

> **Aucun hardware PlantMind n'est encore validé.** Toutes les données de ce prototype sont
> simulées. Voir [« Ce qui est simulé »](#ce-qui-est-simulé) plus bas et
> [`docs/hardware-integration.md`](docs/hardware-integration.md) pour la suite prévue.

## Fonctionnalités

- **Accueil** — vue d'ensemble : plantes suivies, plantes à surveiller, statut du hub,
  climat ambiant, alertes importantes, et un encart « Ce que PlantMind apprend » qui met en
  mots une tendance observée (ex. séchage plus lent que la semaine dernière).
- **Mes plantes** — liste des plantes avec état concret (Bien / À surveiller / Action
  nécessaire / Hors ligne — jamais un score abstrait), humidité, lumière, batterie et
  action recommandée.
- **Fiche plante** — recommandation mise en avant en premier, explication (« Pourquoi
  PlantMind pense ça »), visualisation d'humidité par profondeur (surface / milieu / zone
  racinaire), graphiques 24 h / 7 j / 30 j, historique d'arrosage et de batterie.
- **Alertes** — les 10 types d'anomalies détectées, avec niveau, explication et action
  recommandée ; marquables comme lues.
- **Historique** — courbes par plante et journal d'arrosage toutes plantes confondues.
- **Capteurs** — statut du hub, capteurs associés, batterie, signal, sondes actives.
- **Paramètres** — rappel du mode démonstration, réinitialisation des données locales.
- **Ajout d'une plante** — parcours guidé en 9 étapes (surnom, espèce, pièce, taille de
  pot, type de capteur, profondeurs disponibles, position par rapport à une fenêtre, mode
  démo ou capteur réel, confirmation).

## Stack technique

React 19 + TypeScript (strict) + Vite + Tailwind CSS + Lucide React + Recharts +
localStorage. Aucun backend, aucune authentification, aucun paiement — voir
[« Hors périmètre »](#hors-périmètre-de-ce-prototype).

## Installation

```bash
npm install
```

## Commandes disponibles

| Commande | Effet |
| --- | --- |
| `npm run dev` | Lance le serveur de développement Vite |
| `npm run build` | Vérifie les types (`tsc --noEmit`) puis construit pour la production |
| `npm run preview` | Sert le build de production en local |
| `npm test` | Lance les tests unitaires une fois |
| `npm run test:watch` | Lance les tests unitaires en mode watch |

## Architecture

Voir [`docs/architecture.md`](docs/architecture.md) pour le détail (structure des dossiers,
rôle de chaque couche, choix de conception). En résumé :

```
src/
  app/            Composant racine + navigation
  components/     Composants réutilisables (UI, mise en page, formulaires)
  pages/          Une page par section de navigation
  domain/         Moteur de recommandations (règles pures, seuils centralisés)
  data/           DataProvider (mock fonctionnel + stubs hub/Bluetooth/Home Assistant)
  mocks/          8 scénarios de données simulées
  hooks/          Ponts React ↔ DataProvider
  types/          Modèles TypeScript partagés
  utils/          Formatage, temps, localStorage
```

Les composants d'interface ne dépendent jamais directement des données simulées : tout
passe par l'interface `DataProvider`, ce qui permettra de brancher un vrai capteur plus
tard sans réécrire l'application — voir
[`docs/hardware-integration.md`](docs/hardware-integration.md).

## Tests

```bash
npm test
```

Les tests couvrent la logique métier la plus importante (`src/domain/recommendations/engine.test.ts`) :
détection d'arrosage superficiel, détection d'humidité profonde persistante, batterie
faible, prévision de sécheresse, et **absence de faux positif quand une seule sonde
existe**. Les détails visuels ne sont volontairement pas testés.

## Ce qui est simulé

Rien de ce que vous voyez ne vient d'un vrai capteur :

- les 8 plantes de démonstration et leur historique (30 jours, intervalles irréguliers) ;
- le statut du hub, le Wi-Fi, la version de firmware affichée dans l'écran Capteurs ;
- l'association d'un capteur (l'interface existe, le vrai Bluetooth n'est pas connecté) ;
- les plantes que vous ajoutez vous-même, même en choisissant « capteur réel » — un
  bandeau le rappelle tant que le hardware n'est pas appairé.

Rien de tout cela n'est présenté comme une mesure réelle nulle part dans l'application.

## Hors périmètre de ce prototype

Paiement, abonnement, authentification, backend, chatbot IA, diagnostic médical des
plantes, réseau social, gamification, arrosage automatique, firmware, vrai Bluetooth, PCB,
notifications push natives, application mobile native.

## Accessibilité

Contrastes lisibles, navigation clavier, `aria-label` sur les boutons-icônes, labels de
formulaire explicites, statuts et alertes toujours signalés par icône **et** texte (jamais
la couleur seule), zones tactiles dimensionnées pour mobile.
