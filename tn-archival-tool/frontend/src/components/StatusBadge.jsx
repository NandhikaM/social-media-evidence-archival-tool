const STATUS_STYLES = {
  completed: 'status-completed',
  archived: 'status-completed',
  pending: 'status-pending',
  processing: 'status-processing',
}

export default function StatusBadge({ status, label }) {
  const style = STATUS_STYLES[status] || 'status-pending'
  const text = label || status

  return (
    <span className={`${style} px-2 py-1 rounded-md text-[10px] font-bold uppercase`}>
      {text}
    </span>
  )
}
