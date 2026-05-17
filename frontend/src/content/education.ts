export interface EducationCard {
  id: string;
  emoji: string;
  title: string;
  body: string;
  tips: string[];
}

export const EDUCATION_CARDS: EducationCard[] = [
  {
    id: 'signs',
    emoji: '👁️',
    title: 'Reconnaître la fatigue',
    body: 'La fatigue au volant se manifeste avant que vous ne vous en rendiez compte. Apprendre à identifier les signaux précoces peut sauver des vies.',
    tips: [
      'Bâillements fréquents et yeux lourds',
      'Difficultés à maintenir la trajectoire',
      'Pensées qui vagabondent, perte de concentration',
    ],
  },
  {
    id: 'breaks',
    emoji: '☕',
    title: 'L\'importance des pauses',
    body: 'Une pause toutes les 2h est recommandée, même si vous ne ressentez pas de fatigue. Le cerveau se fatigue de façon invisible et progressive.',
    tips: [
      'Pause de 15–20 min toutes les 2h de conduite',
      'Sortez du véhicule et marchez quelques minutes',
      'Évitez de conduire plus de 8h par jour',
    ],
  },
  {
    id: 'circadian',
    emoji: '🕐',
    title: 'Rythme circadien',
    body: 'Notre vigilance fluctue naturellement au fil de la journée. Deux créneaux sont particulièrement risqués : le creux post-déjeuner et la nuit.',
    tips: [
      'Vigilance au plus bas entre 2h–5h du matin',
      'Creux de 13h–15h : vigilance réduite de 30%',
      'Planifiez les trajets importants le matin',
    ],
  },
  {
    id: 'hydration',
    emoji: '💧',
    title: 'Hydratation et vigilance',
    body: 'Une déshydratation légère (1–2%) suffit à réduire la concentration et allonger le temps de réaction. Boire régulièrement est essentiel.',
    tips: [
      '1,5–2L d\'eau par jour de travail',
      'Évitez les boissons sucrées qui entraînent des pics d\'énergie',
      'Un verre d\'eau toutes les heures de conduite',
    ],
  },
  {
    id: 'nutrition',
    emoji: '🥗',
    title: 'Nutrition avant de conduire',
    body: 'Ce que vous mangez influence directement votre vigilance. Les repas lourds favorisent l\'endormissement en déviant le sang vers la digestion.',
    tips: [
      'Privilégiez des repas légers et équilibrés',
      'Évitez l\'alcool, même en faible quantité',
      'Les fruits et protéines maintiennent l\'énergie stable',
    ],
  },
  {
    id: 'sleep',
    emoji: '😴',
    title: 'La dette de sommeil',
    body: 'Dormir 6h au lieu de 8h crée une dette qui s\'accumule. Après 5 jours, votre réactivité au volant est équivalente à 0,5g d\'alcool dans le sang.',
    tips: [
      'Visez 7–9h de sommeil par nuit',
      'Une sieste de 20 min peut remplacer 2h de sommeil manqué',
      'Dormez à des heures régulières pour stabiliser le rythme',
    ],
  },
];
