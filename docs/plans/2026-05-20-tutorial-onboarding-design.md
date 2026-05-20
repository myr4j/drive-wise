# Design — Tutoriel d'onboarding « pop-up cartes »

**Date :** 2026-05-20
**Branche :** refonte-graphique
**Statut :** approuvé

## 1. Objectif

Présenter brièvement Drive-Wise (mission + fonctionnement + outils) aux
utilisateurs à chaque connexion / après création de compte, jusqu'à ce
qu'ils cochent « ne plus afficher ». Le tutoriel reste réouvrable via les
Réglages.

## 2. Décisions clés (issues du brainstorm)

| # | Décision | Choix |
|---|---|---|
| 1 | Persistance du flag | AsyncStorage local + bouton « Revoir le tutoriel » dans Settings |
| 2 | Style visuel | Bottom sheet (carte qui monte du bas, backdrop sombre) |
| 3 | Nombre de cartes | 3 cartes ultra-court |
| 4 | Navigation interne | Swipe horizontal + dots cliquables + bouton Suivant/Terminer + bouton Passer |

## 3. Flux de déclenchement

```
Login / Register
   ↓
(ConsentScreen si nouveau compte)
   ↓
MainTabs (Dashboard chargé)
   ↓
useEffect au montage du Dashboard :
   - lit le store tutoriel (hydraté depuis AsyncStorage)
   - si dismissed = false → ouvre la bottom sheet tutoriel
   - si dismissed = true  → ne fait rien
```

Pas de modification de la navigation : le tuto est un overlay `Modal` RN
déclenché par un `useEffect` sur le Dashboard. On évite ainsi d'ajouter
une étape dans le RootStack.

## 4. État & persistance

**Nouveau store** `frontend/src/store/tutorialStore.ts`
(modèle calqué sur `preferenceStore.ts`) :

```ts
interface TutorialState {
  dismissed: boolean;          // flag persisté
  isLoaded: boolean;
  hydrate: () => Promise<void>;    // lit AsyncStorage au démarrage app
  dismiss: () => Promise<void>;    // user a coché « ne plus afficher »
  reset: () => Promise<void>;      // bouton « Revoir » dans Settings
}
```

**Clé AsyncStorage** : `@drivewise:tutorial_dismissed`
→ `"true"` quand l'utilisateur a coché « ne plus afficher », absente sinon.

Le store est hydraté au boot de l'app (au montage du Dashboard suffit ;
inutile de le faire dans `App.tsx`).

## 5. Composant `TutorialModal`

**Fichier :** `frontend/src/components/tutorial/TutorialModal.tsx`

```
<Modal transparent animationType="slide" visible={visible}>
  <Pressable style={backdrop} onPress={onClose} />     ← tap hors carte = fermer
  <View style={sheet}>                                 ← carte qui monte du bas
    <View style={grabber} />                           ← barre grise du haut
    <Pressable onPress={onClose} style={skipBtn}>
      <Text>Passer</Text>
    </Pressable>
    <ScrollView                                        ← pager horizontal
      horizontal pagingEnabled
      onMomentumScrollEnd={updateActiveIndex}>
      <TutorialCard {...card1} />
      <TutorialCard {...card2} />
      <TutorialCard {...card3} />
    </ScrollView>
    <PaginationDots count={3} active={index} />
    {/* Card 3 only: */}
    <Checkbox label="Ne plus afficher ce tutoriel" />
    <Button>{isLast ? "Terminer" : "Suivant →"}</Button>
  </View>
</Modal>
```

**Détails :**
- Backdrop semi-opaque (`rgba(0,0,0,0.45)`).
- Carte : ~70 % de la hauteur écran, `borderTopLeftRadius/RightRadius: borderRadius.xl`.
- Slide-up via `animationType="slide"` de la Modal RN (gratuit, natif).
- Swipe horizontal via `ScrollView pagingEnabled` (pas de lib externe).
- Pagination dots cliquables (tap → scroll vers la carte).
- La case « Ne plus afficher » apparaît **uniquement sur la 3e carte**,
  juste au-dessus du bouton Terminer.

## 6. Contenu des cartes (FR, ton bienveillant)

### Carte 1 — Bienvenue *(icône `Car`)*

> **Bienvenue sur Drive-Wise**
>
> Votre copilote intelligent contre la fatigue au volant. Conduisez plus
> sereinement grâce à un suivi en temps réel.

### Carte 2 — Comment ça marche *(icône `Brain`)*

> **Une IA qui veille sur vous**
>
> Pendant vos trajets, Drive-Wise analyse votre conduite (durée, pauses,
> heure) pour estimer votre niveau de fatigue et vous alerter si besoin.

### Carte 3 — Vos outils *(icône `LayoutGrid` ou 4 mini-icônes)*

> **Tout est à portée de main**
>
> 🏠 **Accueil** — vue d'ensemble
> 🚗 **Trajet** — démarrer une session
> 💬 **DriveSafe** — assistant conseils
> 📊 **Stats** — vos tendances
>
> `☐ Ne plus afficher ce tutoriel`
> `[Terminer]`

## 7. Réglages — entrée « Revoir le tutoriel »

Dans `SettingsScreen.tsx`, ajout d'une row dans la section « Aide » (ou
nouvelle section si besoin) :

```
─────────────────────
 Aide
─────────────────────
 ▸ Revoir le tutoriel       →
```

**Comportement au tap :**

1. Appelle `tutorialStore.reset()` → `dismissed = false` + clé AsyncStorage effacée.
2. Navigation back vers Dashboard (`navigation.navigate('Dashboard')`).
3. Le `useEffect` du Dashboard redéclenche le `TutorialModal`.

Pattern simple, sans flag global supplémentaire.

## 8. Composants à créer

| Fichier | Rôle |
|---|---|
| `frontend/src/store/tutorialStore.ts` | Store Zustand + AsyncStorage |
| `frontend/src/components/tutorial/TutorialModal.tsx` | Modal bottom-sheet conteneur |
| `frontend/src/components/tutorial/TutorialCard.tsx` | Carte individuelle (icône, titre, texte) |
| `frontend/src/components/tutorial/PaginationDots.tsx` | Dots cliquables |
| `frontend/src/components/tutorial/index.ts` | Barrel export |

## 9. Composants à modifier

| Fichier | Changement |
|---|---|
| `frontend/src/store/index.ts` | Exporter `useTutorialStore` |
| `frontend/src/screens/dashboard/DashboardScreen.tsx` | Hydrater le store + monter `<TutorialModal />` |
| `frontend/src/screens/settings/SettingsScreen.tsx` | Ajouter row « Revoir le tutoriel » |

## 10. Tests

- **`tutorialStore`** (jest) : `hydrate` lit AsyncStorage, `dismiss` persiste,
  `reset` efface.
- **`PaginationDots`** : rend N dots, met en surbrillance l'actif, callback
  `onPress`.
- **`TutorialModal`** : ouvre/ferme, swipe avance l'index, la case n'apparaît
  que sur la dernière carte, click Terminer + case cochée → appelle `dismiss`.

Pas de test e2e ; l'intégration au Dashboard est vérifiée manuellement.

## 11. YAGNI / hors scope

- Pas d'analytics / event tracking sur les cartes vues.
- Pas de versioning du tuto (`tutorial_version`) : si on change le contenu
  plus tard, on peut bumper la clé AsyncStorage
  (`@drivewise:tutorial_dismissed_v2`).
- Pas de tutoriel contextuel par feature (juste l'onboarding global).
- Pas de support multi-langue : tout en français comme le reste de l'app.
- Pas de migration backend ; flag uniquement local au device.
