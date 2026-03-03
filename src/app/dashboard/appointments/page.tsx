import { createServerClient } from '@/lib/supabase/server';
import Header from '@/components/dashboard/Header';
import AppointmentRow from '@/components/appointments/AppointmentRow';
import { Table } from '@/components/ui/Table';
import type { AppointmentWithClient } from '@/types';

export const dynamic = 'force-dynamic';

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string };
}) {
  const supabase = createServerClient();
  const search = searchParams.search ?? '';
  const status = searchParams.status ?? '';

  let query = supabase
    .from('appointments')
    .select('*, client:clients(*)')
    .order('appointment_date', { ascending: false })
    .order('appointment_time', { ascending: true })
    .limit(100);

  if (status) {
    query = query.eq('doc_status', status);
  }

  const { data: raw } = await query;
  let appointments = (raw ?? []) as AppointmentWithClient[];

  if (search) {
    const lower = search.toLowerCase();
    appointments = appointments.filter(a =>
      a.client.first_name?.toLowerCase().includes(lower) ||
      a.client.last_name?.toLowerCase().includes(lower) ||
      a.client.phone?.includes(search) ||
      a.client.email?.toLowerCase().includes(lower)
    );
  }

  return (
    <>
      <Header title="All Appointments" />
      <div className="flex-1 p-6">
        {/* Filters */}
        <form className="flex gap-3 mb-5">
          <input
            name="search"
            defaultValue={search}
            placeholder="Search by name, phone, email..."
            className="border border-gray-300 rounded-md px-3 py-2 text-sm flex-1 max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            name="status"
            defaultValue={status}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="not_sent">Not Sent</option>
            <option value="checklist_sent">Checklist Sent</option>
            <option value="confirmed">Confirmed</option>
            <option value="folder_opened">Folder Opened</option>
            <option value="docs_received">Docs Received</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-blue-700 text-white rounded-md hover:bg-blue-800"
          >
            Filter
          </button>
        </form>

        <p className="text-sm text-gray-500 mb-3">{appointments.length} appointment{appointments.length !== 1 ? 's' : ''}</p>

        {appointments.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-400">
            No appointments found.
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <Table headers={['Time', 'Client', 'Phone', 'Type', 'Method', 'Status', '']}>
              {appointments.map(appt => (
                <AppointmentRow key={appt.id} appointment={appt} />
              ))}
            </Table>
          </div>
        )}
      </div>
    </>
  );
}
