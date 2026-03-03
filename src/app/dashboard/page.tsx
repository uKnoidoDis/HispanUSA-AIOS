import { createServerClient } from '@/lib/supabase/server';
import Header from '@/components/dashboard/Header';
import StatsBar from '@/components/dashboard/StatsBar';
import AppointmentRow from '@/components/appointments/AppointmentRow';
import { Table } from '@/components/ui/Table';
import { todayString, formatDate } from '@/lib/utils';
import type { AppointmentWithClient } from '@/types';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const supabase = createServerClient();
  const date = searchParams.date ?? todayString();

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, client:clients(*)')
    .eq('appointment_date', date)
    .order('appointment_time', { ascending: true });

  const appts = (appointments ?? []) as AppointmentWithClient[];
  const docsReceived = appts.filter(a => a.doc_status === 'docs_received').length;

  return (
    <>
      <Header title="Dashboard" />
      <div className="flex-1 p-6">
        <StatsBar total={appts.length} docsReceivedCount={docsReceived} />

        {/* Date nav */}
        <div className="flex items-center gap-4 mb-4">
          <h3 className="text-base font-semibold text-gray-800">
            {date === todayString() ? 'Today' : formatDate(date)} — {appts.length} appointment{appts.length !== 1 ? 's' : ''}
          </h3>
          <form className="flex items-center gap-2">
            <input
              type="date"
              name="date"
              defaultValue={date}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700"
            >
              Go
            </button>
          </form>
        </div>

        {appts.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-400">
            No appointments for this date.
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <Table headers={['Time', 'Client', 'Phone', 'Type', 'Method', 'Status', '']}>
              {appts.map(appt => (
                <AppointmentRow key={appt.id} appointment={appt} />
              ))}
            </Table>
          </div>
        )}
      </div>
    </>
  );
}
