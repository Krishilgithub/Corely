import { redirect } from "next/navigation";

export const metadata = {
  title: "Settings — Corely Enterprise",
  description: "Manage your workspace, preferences, and configurations",
};

export default function SettingsPage() {
  redirect("/dashboard/settings/general");
}
