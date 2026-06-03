import type { TriggeredAlert } from "./alertRules";

// in-memory store — resets on server restart (fine for a demo, use Redis/DB in prod)
const alerts: TriggeredAlert[] = [];
const MAX_ALERTS = 100;

export function addAlert(alert: TriggeredAlert) {
  // avoid duplicate alerts for the same rule firing on the same event
  const isDuplicate = alerts.some(
    (a) => a.ruleId === alert.ruleId && a.relatedEventId === alert.relatedEventId
  );
  if (isDuplicate) return;

  alerts.unshift(alert); // newest first

  // cap the store so it doesn't grow forever
  if (alerts.length > MAX_ALERTS) {
    alerts.splice(MAX_ALERTS);
  }
}

export function getAlerts(): TriggeredAlert[] {
  return [...alerts];
}

export function getUnreadCount(): number {
  return alerts.filter((a) => !a.read && !a.resolved).length;
}

export function markAllAsRead() {
  alerts.forEach((a) => (a.read = true));
}

export function markAsRead(alertId: string) {
  const alert = alerts.find((a) => a.id === alertId);
  if (alert) alert.read = true;
}

export function resolveAlert(
  alertId: string,
  action: "deleted" | "allowed" | "dismissed"
) {
  const alert = alerts.find((a) => a.id === alertId);
  if (alert) {
    alert.resolved = true;
    alert.read = true;
    alert.resolvedAction = action;
  }
}
