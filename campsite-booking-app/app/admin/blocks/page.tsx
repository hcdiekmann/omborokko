import { AdminBlocksClient } from "@/components/admin-blocks-client";
import { AdminPageHeader } from "@/components/admin-page-header";

export default function AdminBlocksPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Availability control"
        title="Manual blocks"
        description="Create and remove date blocks that should make a campsite unavailable."
      />
      <AdminBlocksClient />
    </div>
  );
}
