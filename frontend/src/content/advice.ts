export interface Advice {
  id: string;
  text: string;
  category: 'pre' | 'post';
}

const PRE_SHIFT_TIPS: Advice[] = [
  { id: 'pre-1', category: 'pre', text: 'Dormez au moins 7h avant votre service pour un départ en forme.' },
  { id: 'pre-2', category: 'pre', text: 'Hydratez-vous bien avant de prendre le volant — un verre d\'eau suffit.' },
  { id: 'pre-3', category: 'pre', text: 'Évitez les repas trop lourds juste avant de démarrer.' },
  { id: 'pre-4', category: 'pre', text: 'Étirez vos épaules et votre nuque 2 minutes avant de partir.' },
  { id: 'pre-5', category: 'pre', text: 'Prévoyez vos pauses à l\'avance — une toutes les 2h minimum.' },
  { id: 'pre-6', category: 'pre', text: 'Vérifiez que l\'habitacle est bien ventilé pour rester alerte.' },
];

const POST_SHIFT_TIPS: Advice[] = [
  { id: 'post-1', category: 'post', text: 'Prenez quelques minutes de marche avant de rentrer chez vous.' },
  { id: 'post-2', category: 'post', text: 'Mangez un repas léger pour récupérer sans alourdir la digestion.' },
  { id: 'post-3', category: 'post', text: 'Évitez les écrans au moins 30 min avant de dormir.' },
  { id: 'post-4', category: 'post', text: 'Notez votre ressenti de la journée — cela aide à ajuster votre rythme.' },
  { id: 'post-5', category: 'post', text: 'Un étirement du dos après une longue session aide à décompresser.' },
  { id: 'post-6', category: 'post', text: 'Hydratez-vous bien en fin de journée — la conduite déshydrate.' },
];

function seededIndex(arr: Advice[]): number {
  const day = new Date().getDate();
  return day % arr.length;
}

export function getTodayPreShiftTip(): Advice {
  return PRE_SHIFT_TIPS[seededIndex(PRE_SHIFT_TIPS)];
}

export function getTodayPostShiftTip(): Advice {
  return POST_SHIFT_TIPS[seededIndex(POST_SHIFT_TIPS)];
}
