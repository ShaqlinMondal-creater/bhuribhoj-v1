/**
 * SSR-safe contact address (env). Live inbox still comes from API CONTACT_INBOX
 * via ContactEmailLink on the client.
 */
export function getContactEmailFallback(): string {
  return (process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@bhuribhoj.com").trim();
}
