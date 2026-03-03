import { createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Header from '@/components/dashboard/Header';
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
      <Header title="Clients" />
      <div className="flex-1 p-6">
        <form className="flex gap-3 mb-5">
          <input
            name="search"
            defaultValue={search}
            placeholder="Search by name, phone, or email..."
            className="border border-gray-300 rounded-md px-3 py-2 text-sm flex-1 max-w-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="px-4 py-2 text-sm bg-blue-700 text-white rounded-md hover:bg-blue-800">
            Search
          </button>
        </form>

        <p className="text-sm text-gray-500 mb-3">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <Table headers={['Name', 'Phone', 'Email', 'Language', 'Type', '']}>
            {clients.map(client => (
              <TableRow key={client.id}>
                <TableCell className="font-medium text-gray-900">
                  {client.first_name} {client.last_name}
                </TableCell>
                <TableCell>{client.phone ?? '—'}</TableCell>
                <TableCell>{client.email ?? '—'}</TableCell>
                <TableCell>{client.language_preference === 'es' ? 'ES' : 'EN'}</TableCell>
                <TableCell>
                  {client.is_corporate ? (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Corporate</span>
                  ) : client.is_new_client ? (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">New</span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Returning</span>
                  )}
                </TableCell>
                <TableCell>
                  <Link href={`/dashboard/clients/${client.id}`} className="text-blue-600 text-sm hover:underline">
                    View →
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
