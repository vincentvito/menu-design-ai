import { redirect } from "next/navigation";

export default async function LegacyOrderRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/menus/${id}/package`);
}
