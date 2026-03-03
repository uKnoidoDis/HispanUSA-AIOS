import type { DocStatus } from '@/types';

const statusConfig: Record<DocStatus, { label: string; className: string }> = {
  not_sent: {
    label: 'Not Sent',
    className: 'bg-red-100 text-red-700',
  },
  checklist_sent: {
    label: 'Checklist Sent',
    className: 'bg-yellow-100 text-yellow-700',
  },
  confirmed: {
    label: 'Appt Confirmed',
    className: 'bg-blue-100 text-blue-700',
  },
  folder_opened: {
    label: 'Folder Opened',
    className: 'bg-purple-100 text-purple-700',
  },
  docs_received: {
    label: 'Docs Received',
    className: 'bg-green-100 text-green-700',
  },
};

interface BadgeProps {
  status: DocStatus;
}

export default function Badge({ status }: BadgeProps) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
