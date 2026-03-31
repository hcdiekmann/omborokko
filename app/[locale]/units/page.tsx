import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function UnitsPage({ params }: PageProps) {
  const { locale } = await params;
  redirect(`/${locale}/book`);
}
