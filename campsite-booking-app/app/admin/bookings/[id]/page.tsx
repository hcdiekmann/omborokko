import { AdminBookingDetailClient } from "@/components/admin-booking-detail-client";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminBookingDetailPage({ params }: PageProps) {
  const { id } = await params;

  return <AdminBookingDetailClient bookingId={id} />;
}
