# Plan d'implémentation — Tutoriel d'onboarding

**Design :** [`2026-05-20-tutorial-onboarding-design.md`](2026-05-20-tutorial-onboarding-design.md)
**Branche :** `refonte-graphique`
**Estimation totale :** ~45-60 min

## Note sur la stratégie de tests

Le frontend n'a actuellement pas d'infra Jest configurée et aucun test
unitaire projet (`grep` confirme : 0 fichier `.test.*` hors `node_modules`,
aucun `jest.config.*`, pas de script `test` dans `package.json`).

Ajouter Jest + preset RN + mocks (AsyncStorage, react-native-paper,
Lucide ESM, navigation, theme context...) juste pour ce feature serait du
scope creep majeur (~plusieurs heures de config seule).

**Stratégie adoptée pour ce plan :**

- TypeScript strict mode comme garantie au moment de la compilation (le projet
  l'a déjà activé).
- Vérification manuelle ciblée après chaque tâche (lancement Expo +
  scénario précis).
- Conformité visuelle aux composants existants (réutilisation `Button`,
  `Card`, `FadeSlideIn`).
- Commit fréquent après chaque tâche verte.

Si une infra de test est ajoutée plus tard au projet, ce feature sera
rétrofitté.

---

## Pré-requis

- [ ] Être sur la branche `refonte-graphique` (vérifier `git status`).
- [ ] `npm install` à jour dans `frontend/` (rien à ajouter, on n'utilise
      que des deps déjà présentes : zustand, async-storage, lucide,
      react-native).

---

## Tâche 1 — Store `tutorialStore`

**Objectif :** Persister le flag « ne plus afficher » dans AsyncStorage,
exposer `hydrate / dismiss / reset`.

**Fichier à créer :** `frontend/src/store/tutorialStore.ts`

**Détail :**

```ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@drivewise:tutorial_dismissed';

interface TutorialState {
  dismissed: boolean;
  isLoaded: boolean;
  hydrate: () => Promise<void>;
  dismiss: () => Promise<void>;
  reset: () => Promise<void>;
}

export const useTutorialStore = create<TutorialState>((set) => ({
  dismissed: false,
  isLoaded: false,
  hydrate: async () => {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEY);
      set({ dismissed: value === 'true', isLoaded: true });
    } catch {
      set({ isLoaded: true });
    }
  },
  dismiss: async () => {
    set({ dismissed: true });
    try { await AsyncStorage.setItem(STORAGE_KEY, 'true'); } catch {}
  },
  reset: async () => {
    set({ dismissed: false });
    try { await AsyncStorage.removeItem(STORAGE_KEY); } catch {}
  },
}));

export default useTutorialStore;
```

**Modifier aussi :** `frontend/src/store/index.ts` — ajouter
`export { default as useTutorialStore } from './tutorialStore';`.

**Vérification :**

- `npx tsc --noEmit` (depuis `frontend/`) → 0 erreur.
- Lecture visuelle : pattern identique à `preferenceStore.ts`.

**Commit :** `feat(tutorial): store Zustand pour le flag « ne plus afficher »`

---

## Tâche 2 — Composant `PaginationDots`

**Objectif :** Indicateur de page (3 dots), dot actif mis en surbrillance,
tap → callback `onPress(index)`.

**Fichier à créer :** `frontend/src/components/tutorial/PaginationDots.tsx`

**Détail :**

```tsx
import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface PaginationDotsProps {
  count: number;
  active: number;
  onPress?: (index: number) => void;
}

export default function PaginationDots({ count, active, onPress }: PaginationDotsProps) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.xs }}>
      {Array.from({ length: count }).map((_, i) => {
        const isActive = i === active;
        return (
          <Pressable
            key={i}
            onPress={() => onPress?.(i)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Aller à la carte ${i + 1}`}
            style={{
              width: isActive ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: isActive ? colors.accent : colors.hairlineStrong,
            }}
          />
        );
      })}
    </View>
  );
}
```

**Vérification :** `npx tsc --noEmit` OK. Pattern stylistique cohérent avec
les composants UI existants (`useTheme`, pas de `StyleSheet.create` inline
nécessaire).

**Commit :** `feat(tutorial): composant PaginationDots`

---

## Tâche 3 — Composant `TutorialCard`

**Objectif :** Rendre une carte de tuto = icône + titre + corps. Pas de
logique métier.

**Fichier à créer :** `frontend/src/components/tutorial/TutorialCard.tsx`

**Détail :**

```tsx
import React from 'react';
import { useWindowDimensions, View, Text } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface TutorialCardProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;     // contenu corps (Text ou liste)
}

export default function TutorialCard({ icon, title, children }: TutorialCardProps) {
  const { colors, fonts, spacing, typeScale, borderRadius } = useTheme();
  const { width } = useWindowDimensions();
  // Largeur = largeur de la sheet (assemblée par le parent)
  return (
    <View style={{ width, paddingHorizontal: spacing.lg, alignItems: 'center' }}>
      <View style={{
        width: 72, height: 72,
        borderRadius: borderRadius.lg,
        backgroundColor: colors.accent + '18',
        alignItems: 'center', justifyContent: 'center',
        marginTop: spacing.md,
      }}>
        {icon}
      </View>
      <Text style={{
        fontFamily: fonts.displayItalic,
        fontSize: 26, lineHeight: 32,
        color: colors.ink, marginTop: spacing.lg,
        textAlign: 'center', letterSpacing: -0.3,
      }}>
        {title}
      </Text>
      <View style={{ marginTop: spacing.md, alignItems: 'center' }}>
        {typeof children === 'string'
          ? <Text style={{ ...typeScale.bodyMd, color: colors.inkMuted, textAlign: 'center', lineHeight: 22 }}>{children}</Text>
          : children}
      </View>
    </View>
  );
}
```

**Vérification :** `tsc --noEmit` OK.

**Commit :** `feat(tutorial): composant TutorialCard`

---

## Tâche 4 — Composant `TutorialModal`

**Objectif :** Assembler le bottom sheet : backdrop, slide-up animé,
ScrollView pager horizontal avec les 3 cartes, dots, bouton « Passer »,
case « ne plus afficher » (carte 3 uniquement), bouton « Suivant/Terminer ».

**Fichier à créer :** `frontend/src/components/tutorial/TutorialModal.tsx`

**Détail :**

- Props : `visible: boolean`, `onClose: (dismiss: boolean) => void`.
- Utilise `<Modal transparent animationType="slide">`.
- `useRef<ScrollView>` pour scroller programmatiquement quand on tape un dot
  ou le bouton Suivant.
- State local : `activeIndex` (0..2), `dontShow` (boolean, false par défaut).
- Backdrop `Pressable` qui appelle `onClose(dontShow)` (skip == treat as
  dismiss only if checkbox is checked).
- Bouton Suivant : si pas la dernière carte, scroll vers `index+1` ; sinon
  appelle `onClose(dontShow)`.
- Carte 3 affiche la checkbox (`<Pressable>` qui toggle un carré + label).
- Carte 1/2 ne montrent PAS la checkbox.

Contenu des cartes (icônes via `lucide-react-native`) :
- Card 1 : `Car`, titre « Bienvenue sur Drive-Wise »
- Card 2 : `Brain`, titre « Une IA qui veille sur vous »
- Card 3 : `LayoutGrid`, titre « Tout est à portée de main »
  + corps avec 4 items (Accueil/Trajet/DriveSafe/Stats)
  + checkbox + bouton Terminer

**Hauteur du sheet :** `Math.min(height * 0.72, 600)` ou similaire pour ne pas
exploser sur tablette.

**Vérification :**

- `tsc --noEmit` OK.
- Lancer Expo (`cd frontend && npm start`), forcer le rendu temporairement
  dans `DashboardScreen` (`<TutorialModal visible onClose={...} />`),
  scénario manuel :
  1. La modal slide up bien.
  2. Swipe horizontal change le dot actif.
  3. Tap sur un dot scrolle vers la bonne carte.
  4. Carte 1/2 → pas de checkbox visible.
  5. Carte 3 → checkbox visible + bouton « Terminer ».
  6. Tap « Passer » ferme.
  7. Tap backdrop ferme.
  8. Tap « Terminer » avec case cochée → onClose(true) bien appelé.

Retirer le rendu forcé après vérif (sera câblé proprement en tâche 6).

**Commit :** `feat(tutorial): composant TutorialModal (bottom sheet)`

---

## Tâche 5 — Barrel export

**Objectif :** Permettre `import { TutorialModal } from '@/components/tutorial'`.

**Fichier à créer :** `frontend/src/components/tutorial/index.ts`

```ts
export { default as TutorialModal } from './TutorialModal';
export { default as TutorialCard } from './TutorialCard';
export { default as PaginationDots } from './PaginationDots';
```

**Vérification :** `tsc --noEmit` OK.

**Commit :** `feat(tutorial): barrel export composants`

---

## Tâche 6 — Câbler dans `DashboardScreen`

**Objectif :** Le `TutorialModal` s'ouvre automatiquement quand l'utilisateur
arrive sur le Dashboard et que `dismissed === false`.

**Fichier à modifier :** `frontend/src/screens/dashboard/DashboardScreen.tsx`

**Changements :**

1. Importer `useTutorialStore` et `TutorialModal`.
2. Dans le composant :

```ts
const { dismissed, isLoaded, hydrate, dismiss } = useTutorialStore();
const [tutorialOpen, setTutorialOpen] = useState(false);

useEffect(() => {
  if (!isLoaded) hydrate();
}, [isLoaded, hydrate]);

useEffect(() => {
  if (isLoaded && !dismissed) {
    setTutorialOpen(true);
  }
}, [isLoaded, dismissed]);

const handleTutorialClose = async (shouldDismiss: boolean) => {
  setTutorialOpen(false);
  if (shouldDismiss) await dismiss();
};
```

3. Monter `<TutorialModal visible={tutorialOpen} onClose={handleTutorialClose} />`
   en fin du JSX du Dashboard (juste avant la balise fermante du conteneur racine).

**Vérification manuelle :**

- Cas A — premier login (état frais) :
  1. `await AsyncStorage.clear()` dans la console dev (ou désinstaller/réinstaller).
  2. Login → arrivée sur Dashboard → modal s'ouvre.
  3. Cocher « ne plus afficher » + Terminer.
  4. Logout + relogin → modal NE s'ouvre PAS.

- Cas B — second login sans avoir coché :
  1. Reset AsyncStorage.
  2. Login → modal s'ouvre, fermer via « Passer » sans cocher.
  3. Relogin → modal s'ouvre à nouveau (comportement attendu : le tuto
     est répété tant que l'utilisateur n'a pas explicitement coché « ne
     plus afficher »).

**Commit :** `feat(tutorial): déclenchement automatique sur le Dashboard`

---

## Tâche 7 — Entrée « Revoir le tutoriel » dans Settings

**Objectif :** L'utilisateur peut rouvrir le tuto à tout moment.

**Fichier à modifier :** `frontend/src/screens/settings/SettingsScreen.tsx`

**Étapes :**

1. Lire la structure actuelle de `SettingsScreen` pour repérer la
   convention (sections, rows).
2. Ajouter une row « Revoir le tutoriel » dans une section appropriée
   (« Aide » si elle existe, sinon « À propos » ou en bas).
3. Au tap :

```ts
const { reset } = useTutorialStore();
const navigation = useNavigation();

const handleReplayTutorial = async () => {
  await reset();
  navigation.navigate('MainTabs', { screen: 'Dashboard' } as any);
};
```

**Vérification manuelle :**

1. Settings → tap « Revoir le tutoriel ».
2. Navigation back vers Dashboard.
3. Le tuto se ré-ouvre automatiquement (grâce au `useEffect` du Dashboard
   qui voit `dismissed` repassé à `false`).

**Commit :** `feat(tutorial): bouton « Revoir le tutoriel » dans Settings`

---

## Tâche 8 — Vérification finale & polish

**Objectif :** S'assurer que tout fonctionne ensemble et que rien d'autre
n'a régressé.

**Checklist :**

- [ ] `npx tsc --noEmit` depuis `frontend/` → 0 erreur.
- [ ] Lancement Expo, login complet, modal s'ouvre.
- [ ] Swipe entre les 3 cartes fluide.
- [ ] Dots cliquables, dot actif visuellement distinct.
- [ ] Bouton « Passer » (en haut) ferme sans persister.
- [ ] Tap backdrop ferme sans persister.
- [ ] Checkbox uniquement carte 3.
- [ ] « Terminer » + case cochée → relogin ne ré-ouvre pas.
- [ ] « Terminer » + case non cochée → relogin ré-ouvre (cohérent avec design).
- [ ] Settings → « Revoir » fait réapparaître le tuto.
- [ ] Aucune régression sur la nav (Tabs, ConsentScreen pour nouveau compte).
- [ ] Dark mode visuellement correct (vérifier les couleurs `colors.surfaceElevated`, `colors.ink`, `colors.accent`).

**Si tout est vert :** passer à Phase 5 (finishing branch).

**Commit final** *(optionnel, si polish)* : `chore(tutorial): polish & finalisation`

---

## Récapitulatif fichiers touchés

**Créés (5) :**
- `frontend/src/store/tutorialStore.ts`
- `frontend/src/components/tutorial/PaginationDots.tsx`
- `frontend/src/components/tutorial/TutorialCard.tsx`
- `frontend/src/components/tutorial/TutorialModal.tsx`
- `frontend/src/components/tutorial/index.ts`

**Modifiés (3) :**
- `frontend/src/store/index.ts`
- `frontend/src/screens/dashboard/DashboardScreen.tsx`
- `frontend/src/screens/settings/SettingsScreen.tsx`

**Aucune dépendance npm ajoutée.**
**Aucune modification backend.**
