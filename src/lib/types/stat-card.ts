// src/lib/types/stat-card.ts
export interface StatCard {
  title: string;
  value: string;
  icon: string;
  iconClass: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary';
  change?: {
    value: string;
    isPositive: boolean;
    text: string;
  };
}
