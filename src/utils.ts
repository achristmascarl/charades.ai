export function c(...classNames: string[]): string {
  return classNames
    .filter((v) => v)
    .join(" ")
    .trim()
    .replace(/\s{2,}/g, " ");
}

export function track(
  action: string,
  category: string,
  label: string,
  value = 0,
  non_interaction = false,
): void {
  if (process.env.NODE_ENV === "production") {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value,
      non_interaction,
    });
  } else {
    console.debug(
      `[${"TRACKING_OFF"}] ` +
        `${action}: category-${category}, ` +
        `label-${label}, value-${value}, ` +
        `non_interactive-${non_interaction}`,
    );
  }
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export const numGuesses = 5;

export const referralParams =
  "utm_source=charades_ai&utm_medium=referral&utm_campaign=page_links";

export function percentString(decimal: number): string {
  return `${(decimal * 100).toFixed(0)}%`;
}
