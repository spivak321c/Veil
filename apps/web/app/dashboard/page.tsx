import { DashboardContent } from "@/components/dashboard/DashboardContent";
import VeilHeader from "@/components/VeilHeader";
import VeilFooter from "@/components/VeilFooter";

export const metadata = {
  title: "Dashboard | Veil",
};

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen bg-veil-bg text-veil-text font-body">
      <VeilHeader />
      <main className="flex-1 pt-16">
        <DashboardContent />
      </main>
      <VeilFooter />
    </div>
  );
}
