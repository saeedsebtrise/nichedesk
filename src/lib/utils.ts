export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}
