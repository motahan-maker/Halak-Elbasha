// Server-only secrets. Never import this module from client code — the `*.server.ts`
// suffix keeps it out of the browser bundle (see src/integrations/supabase/config.ts
// for the public values that are safe to ship).
export const SERVER_SECRETS = {
  serviceRoleKey:
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tYnR1dXdzYXZxcWt2ZnZjbmdjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc5NDAzNiwiZXhwIjoyMDk3MzcwMDM2fQ.h4p4PV2hekvIT9j2pZZQ7DwylULOrq_OpRe8WURYWRM",
  vapidPrivateKey:
    process.env.VAPID_PRIVATE_KEY || "JURkK33VzEP3zuBnQl_7toIWr-xS5jTq-Qo4Xcws6tk",
};
