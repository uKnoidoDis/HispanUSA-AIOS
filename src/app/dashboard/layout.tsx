import Sidebar from '@/components/dashboard/Sidebar';
import SmsBanner from '@/components/dashboard/SmsBanner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-auto">
        <SmsBanner />
        <main className="flex-1 flex flex-col pt-14 lg:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
