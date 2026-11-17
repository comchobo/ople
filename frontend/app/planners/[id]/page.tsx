import { Ople } from "@/components/ople";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <Ople key={id} view="board" plannerId={id} />;
}
