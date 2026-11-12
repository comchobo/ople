import { InterviewScreen } from "@/components/interview/interview";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <InterviewScreen id={(await params).id} />;
}
