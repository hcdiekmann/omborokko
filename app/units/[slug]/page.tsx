import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function UnitDetailPage({ params }: PageProps) {
  await params;
  redirect("/book");
}
