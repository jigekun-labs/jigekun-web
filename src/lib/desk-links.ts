/**
 * Where the shared views (보류 정산, 상태 기록) link to, per signed-in area.
 * The same view is rendered in /admin and in the customer-service desk at /cs;
 * each passes its own set so a page never links out of the area it is in —
 * a CS session would just be bounced to the /admin login.
 */
export type DeskLinks = {
  holds: (all?: boolean) => string;
  hold: (id: string) => string;
  timeline: (jobId: string) => string;
  user: (id: string) => string;
};

const enc = encodeURIComponent;

export const ADMIN_LINKS: DeskLinks = {
  holds: (all) => (all ? "/admin/payoutHolds?all=1" : "/admin/payoutHolds"),
  hold: (id) => `/admin/payoutHolds/${enc(id)}`,
  timeline: (jobId) => `/admin/timeline/${enc(jobId)}`,
  // /admin has no person page; its global search finds every doc naming them.
  user: (id) => `/admin?q=${enc(id)}`,
};

export const CS_LINKS: DeskLinks = {
  holds: (all) => (all ? "/cs/holds?all=1" : "/cs/holds"),
  hold: (id) => `/cs/holds/${enc(id)}`,
  timeline: (jobId) => `/cs/timeline/${enc(jobId)}`,
  user: (id) => `/cs/users/${enc(id)}`,
};
