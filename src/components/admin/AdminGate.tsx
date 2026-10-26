import { cookies } from "next/headers";
import { fetchWaitlist } from "@/lib/admin/brevo";
import { ADMIN_COOKIE, adminEnabled, isValidSession } from "@/lib/admin/session";
import { computeStats } from "@/lib/admin/stats";
import { Dashboard, LogoutButton } from "./Dashboard";
import { LoginForm } from "./LoginForm";

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-2 rounded-2xl border border-line bg-white p-6 text-[15px] leading-[1.6] text-ink-soft">
      <h1 className="m-0 text-[22px] font-extrabold text-ink">{title}</h1>
      {children}
    </div>
  );
}

// Runs per request (reads the session cookie), inside the page's <Suspense>.
export async function AdminGate() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;

  if (!adminEnabled()) {
    return (
      <Notice title="Admin is turned off">
        <p className="m-0">
          Set <code>ADMIN_PASSWORD</code> (at least 12 characters) in the environment variables and
          redeploy. See the README, section &quot;Admin page&quot;.
        </p>
      </Notice>
    );
  }
  if (!isValidSession(token)) return <LoginForm />;

  const result = await fetchWaitlist();
  if (!result.ok) {
    return (
      <Notice title={result.reason === "not_configured" ? "Brevo is not connected yet" : "Couldn't load the waitlist"}>
        <p className="m-0">
          {result.reason === "not_configured"
            ? "Set BREVO_API_KEY and BREVO_LIST_ID to see your signups here."
            : `Brevo didn't answer as expected (${result.detail ?? "unknown error"}). Try again in a minute.`}
        </p>
        <LogoutButton />
      </Notice>
    );
  }

  return <Dashboard stats={computeStats(result.contacts, result.listId, new Date())} />;
}
