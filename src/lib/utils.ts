import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function calculateAge(birthDate: string): string {
  if (!birthDate) return 'Unknown';
  
  const birth = new Date(birthDate);
  const now = new Date();
  
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  
  if (months < 0 || (months === 0 && now.getDate() < birth.getDate())) {
    years--;
    months += 12;
  }
  
  if (years === 0) {
    return `${months} months`;
  } else if (years === 1 && months === 0) {
    return `1 year`;
  } else if (months === 0) {
    return `${years} years`;
  } else {
    return `${years} years, ${months} months`;
  }
}