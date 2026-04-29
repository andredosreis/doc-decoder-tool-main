/**
 * Convenções para nomes de canais Supabase Realtime (Tier 2 — race conditions).
 *
 * Bug documentado em useNotifications.tsx:
 *   - Canal criado sem userId → shared entre utilizadores em sessões paralelas
 *   - unsubscribe() cria um novo canal em vez de remover o original → leak
 *
 * Esta lib define e valida a convenção canónica. O hook useNotifications
 * deverá usar buildNotificationChannelName() após fix.
 */

export function buildNotificationChannelName(userId: string): string {
  if (!userId || !userId.trim()) {
    throw new Error("userId is required to build a user-scoped channel name");
  }
  return `notifications:${userId.trim()}`;
}

export function isUserScopedChannel(
  channelName: string,
  userId: string,
): boolean {
  if (!userId) return false;
  return channelName === buildNotificationChannelName(userId);
}

export function extractUserIdFromChannel(
  channelName: string,
): string | null {
  const prefix = "notifications:";
  if (!channelName.startsWith(prefix)) return null;
  const id = channelName.slice(prefix.length);
  return id || null;
}
