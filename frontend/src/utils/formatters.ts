import { FatigueLevel } from '@/types/api';
import { colors } from './theme';

/**
 * Format a date string to a readable format
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Format a date string to time format
 */
export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  });
};

/**
 * Format date and time
 */
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris',
  });
};

/**
 * Format duration in hours to readable string
 */
export const formatDuration = (hours: number): string => {
  if (!hours || hours <= 0) return '0 min';
  
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);

  if (h === 0) {
    return `${m} min`;
  }
  if (m === 0) {
    return `${h} h`;
  }
  return `${h} h ${m} min`;
};

/**
 * Format duration in minutes to readable string
 */
export const formatMinutes = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) {
    return `${h} h`;
  }
  return `${h} h ${m}`;
};

/**
 * Get fatigue level color
 */
export const getFatigueColor = (level: FatigueLevel | null | undefined): string => {
  switch (level) {
    case FatigueLevel.LOW:
      return colors.fatigueLow;
    case FatigueLevel.MODERATE:
      return colors.fatigueModerate;
    case FatigueLevel.HIGH:
      return colors.fatigueHigh;
    case FatigueLevel.CRITICAL:
      return colors.fatigueCritical;
    default:
      return colors.gray;
  }
};

/**
 * Get fatigue level label in French
 */
export const getFatigueLabel = (level: FatigueLevel | null | undefined): string => {
  switch (level) {
    case FatigueLevel.LOW:
      return 'Faible';
    case FatigueLevel.MODERATE:
      return 'Modéré';
    case FatigueLevel.HIGH:
      return 'Élevé';
    case FatigueLevel.CRITICAL:
      return 'Critique';
    default:
      return 'Inconnu';
  }
};

/**
 * Get fatigue level message
 */
export const getFatigueMessage = (level: FatigueLevel | null | undefined): string => {
  switch (level) {
    case FatigueLevel.LOW:
      return 'Vous êtes en forme. Continuez à faire des pauses régulières.';
    case FatigueLevel.MODERATE:
      return 'Votre niveau de fatigue augmente. Pensez à faire une pause bientôt.';
    case FatigueLevel.HIGH:
      return 'Votre fatigue est élevée. Il est recommandé de faire une pause.';
    case FatigueLevel.CRITICAL:
      return 'Fatigue critique ! Arrêtez-vous dès que possible pour vous reposer.';
    default:
      return '';
  }
};

/**
 * Calculate time difference in minutes
 */
export const getMinutesDifference = (startDate: string, endDate: Date = new Date()): number => {
  // S'assurer que la date de début est interprétée comme UTC
  // Si la date ne se termine pas par 'Z', on l'ajoute pour forcer l'interprétation UTC
  const startStr = startDate.endsWith('Z') ? startDate : startDate + 'Z';
  const start = new Date(startStr).getTime();
  const end = endDate.getTime();
  return Math.round((end - start) / 60000);
};

/**
 * Format score as percentage
 */
export const formatScore = (score: number): string => {
  return `${Math.round(score * 100)}%`;
};
