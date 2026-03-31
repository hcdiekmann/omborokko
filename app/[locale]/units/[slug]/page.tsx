import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function UnitDetailPage({ params }: PageProps) {
  const { locale } = await params;
  redirect(`/${locale}/book`);
}
