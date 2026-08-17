import Dashboard from "@/components/Dashboard";

export default async function HouseholdPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <Dashboard code={code.toUpperCase()} />;
}
