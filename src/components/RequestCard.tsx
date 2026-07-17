import styles from '@/styles/tables.module.css';

interface RequestCardProps {
  request: {
    id: number;
    title: string;
    description: string;
    status: string;
    priority: string;
    createdAt: string;
    category: {
      name: string;
    };
    creator?: {
      fullName: string;
    };
  };
  isActive?: boolean;
  onClick?: () => void;
}

export default function RequestCard({ request, isActive, onClick }: RequestCardProps) {
  // Format Date
  const dateStr = new Date(request.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Shorten description
  const excerpt =
    request.description.length > 90
      ? `${request.description.substring(0, 90)}...`
      : request.description;

  return (
    <div
      onClick={onClick}
      className={`${styles.requestCard} ${isActive ? styles.activeCard : ''}`}
      style={isActive ? { borderColor: 'var(--accent-color)', boxShadow: '0 4px 20px rgba(59, 130, 246, 0.15)' } : {}}
    >
      <div className={styles.cardHeader}>
        <h4 className={styles.cardTitle}>{request.title}</h4>
        <span className={`${styles.badge} ${styles[`status_${request.status}`]}`}>
          {request.status.replace('_', ' ')}
        </span>
      </div>
      
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{excerpt}</p>
      
      <div className={styles.cardMeta}>
        <span>📁 {request.category.name}</span>
        <span className={`${styles.badge} ${styles[`priority_${request.priority}`]}`}>
          {request.priority}
        </span>
        {request.creator && <span>👤 Reporter: {request.creator.fullName}</span>}
        <span style={{ marginLeft: 'auto' }}>📅 {dateStr}</span>
      </div>
    </div>
  );
}
