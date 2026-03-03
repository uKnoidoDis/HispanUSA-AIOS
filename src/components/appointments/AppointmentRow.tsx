'use client';

import { useRouter } from 'next/navigation';
import Badge from '@/components/ui/Badge';
import { TableRow, TableCell } from '@/components/ui/Table';
import { formatTime } from '@/lib/utils';
import type { AppointmentWithClient } from '@/types';

interface AppointmentRowProps {
  appointment: AppointmentWithClient;
}

const typeLabels: Record<string, string> = {
  personal_returning: 'Personal (Returning)',
  personal_new: 'Personal (New)',
  corporate: 'Corporate',
};

export default function AppointmentRow({ appointment }: AppointmentRowProps) {
  const router = useRouter();
  const { client } = appointment;

  return (
    <TableRow onClick={() => router.push(`/dashboard/appointments/${appointment.id}`)}>
      <TableCell>{formatTime(appointment.appointment_time)}</TableCell>
      <TableCell className="font-medium text-gray-900">
        {client.first_name} {client.last_name}
      </TableCell>
      <TableCell>{client.phone ?? '—'}</TableCell>
      <TableCell>{typeLabels[appointment.appointment_type] ?? appointment.appointment_type}</TableCell>
      <TableCell>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          appointment.method === 'in_person' ? 'bg-gray-100 text-gray-600' :
          appointment.method === 'zoom' ? 'bg-indigo-100 text-indigo-700' :
          appointment.method === 'telephone' ? 'bg-orange-100 text-orange-700' :
          'bg-green-100 text-green-700'
        }`}>
          {appointment.method.replace('_', ' ')}
        </span>
      </TableCell>
      <TableCell>
        <Badge status={appointment.doc_status} />
      </TableCell>
      <TableCell className="text-blue-600 font-medium">View &rarr;</TableCell>
    </TableRow>
  );
}
