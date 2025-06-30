// src/lib/types/chart.ts
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill: boolean;
    tension: number;
    borderWidth?: number;
    pointRadius?: number;
    pointBackgroundColor?: string;
    pointBorderColor?: string;
    pointBorderWidth?: number;
    pointHoverRadius?: number;
    pointHoverBackgroundColor?: string;
    pointHoverBorderColor?: string;
    pointHoverBorderWidth?: number;
  }[];
}