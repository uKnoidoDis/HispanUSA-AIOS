import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Table, TableRow, TableCell } from '@/components/ui/Table';
import type { Client } from '@/types';

export const dynamic = 'force-dynamic';

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  const supabase = createServerClient();
  const search = searchParams.search ?? '';

  let query = supabase
    .from('clients')
    .select('*')
    .order('last_name', { ascending: true })
    .limit(100);

  if (search) {
    query = query.or(
      `last_name.ilike.%${search}%,first_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`
    );
  }

  const { data } = await query;
  const clients = (data ?? []) as Client[];

  return (
    <>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h2 className="text-lg font-bold text-[#03296A]">Clients</h2>
        <p className="text-sm text-gray-500 font-normal">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          })}
        </p>
      </header>

      <div className="flex-1 p-6">
        <form className="flex gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              name="search"
              defaultValue={search}
              placeholder="Search by name, phone, or email..."
              className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/40 focus:border-[#1B3A5C] transition-colors duration-150"
            />
          </div>
          <button type="submit" className="px-4 py-2 text-sm font-medium bg-[#1B3A5C] text-white rounded-md hover:bg-[#244B75] transition-colors duration-150 shadow-sm">
            Search
          </button>
        </form>

        <p className="text-sm text-gray-500 mb-3 font-normal">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>

        <div className="bg-white rounded-lg border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
          <Table headers={['Name', 'Phone', 'Email', 'Language', 'Type', '']}>
            {clients.map(client => (
              <TableRow key={client.id}>
                <TableCell className="font-medium text-gray-900">
                  {client.first_name} {client.last_name}
                </TableCell>
                <TableCell>{client.phone ?? '—'}</TableCell>
                <TableCell>{client.email ?? '—'}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                    client.language_preference === 'es'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {client.language_preference === 'es' ? 'ES' : 'EN'}
                  </span>
                </TableCell>
                <TableCell>
                  {client.is_corporate ? (
                    <span className="text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full">Corporate</span>
                  ) : client.is_new_client ? (
                    <span className="text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full">New</span>
                  ) : (
                    <span className="text-[11px] font-medium bg-gray-50 text-gray-600 border border-gray-200 px-2.5 py-0.5 rounded-full">Returning</span>
                  )}
                </TableCell>
                <TableCell>
                  <Link href={`/dashboard/clients/${client.id}`} className="text-sm text-[#1B3A5C] font-medium hover:text-[#244B75] transition-colors duration-150">
                    View
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </Table>
        </div>
      </div>
    </>
  );
}
