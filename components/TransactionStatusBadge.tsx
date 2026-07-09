'use client';

export default function TransactionStatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    EXECUTED: '#16a34a',
    PENDING: '#d97706',
    CANCELED: '#dc2626',
    REJECTED: '#b91c1c',
    EXPIRED: '#64748b',
  };

  return (
    <span style={{ background: colorMap[status] || '#64748b', color: 'white', padding: '4px 8px', borderRadius: '999px', fontSize: '12px' }}>
      {status}
    </span>
  );
}
