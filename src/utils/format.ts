/**
 * Utility functions for consistent number, currency, and percentage formatting across the UI.
 * Rules:
 * - If a number has a fraction / decimal part, formats to exactly 2 digits after the fraction.
 * - If a number is an integer, displays as a clean integer without unnecessary trailing zeros.
 */

export const formatNumber = (val: any, decimals: number = 2): string => {
  if (val === null || val === undefined || val === '') return '0';
  const num = Number(val);
  if (isNaN(num)) return '0';
  if (Number.isInteger(num)) return num.toString();
  return num.toFixed(decimals);
};

export const formatCurrency = (val: any, decimals: number = 2): string => {
  if (val === null || val === undefined || val === '') return '₹0.00';
  const num = Number(val);
  if (isNaN(num)) return '₹0.00';
  return `₹${num.toFixed(decimals)}`;
};

export const formatPercent = (val: any, decimals: number = 2): string => {
  if (val === null || val === undefined || val === '') return '0%';
  const num = Number(val);
  if (isNaN(num)) return '0%';
  if (Number.isInteger(num)) return `${num}%`;
  return `${num.toFixed(decimals)}%`;
};
