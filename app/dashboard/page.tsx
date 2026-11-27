import { auth } from "@/lib/auth-server";
import DashboardClient from "./DashboardClient";
import { getDashboardData, parseDateRange } from "./dashboard-data";

export const dynamic = 'force-dynamic';

export default async function DashboardPage(props: { searchParams?: Promise<{ dateRange?: string }> }) {
  const { user, workspace } = await auth();

  // Extract search params dynamically in Next 15+ compatible way
  const searchParams = props.searchParams ? await props.searchParams : {};
  const dateRange = parseDateRange(searchParams.dateRange);

  // Every number on the home page comes from real rows (see dashboard-data.ts).
  const initialData = await getDashboardData({
    userId: user.id,
    userName: user.name,
    workspaceId: workspace.id,
    dateRange,
  });

  return <DashboardClient initialData={initialData} dateRange={dateRange} />;
}
