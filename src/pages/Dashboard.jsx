import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DocumentUpload from '../components/DocumentUpload';
import TrainingInbox from '../components/TrainingInbox';
import ChatSandbox from '../components/ChatSandbox';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [tenantId, setTenantId] = useState(null);

  useEffect(() => {
    const storedId = localStorage.getItem('tenant_id');
    if (!storedId) {
      navigate('/');
    } else {
      setTenantId(storedId);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  if (!tenantId) return null;

  return (
    <div className={styles.dashboardWrapper}>
      {/* Top Navigation */}
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>✦</div>
          <span className={styles.brandName}>olum<span className={styles.brandDot}>.ai</span></span>
        </div>
        <button onClick={handleLogout} className={styles.logoutBtn}>Log Out</button>
      </header>

      {/* Main Content */}
      <div className={styles.dashboardLayout}>
        <div className={styles.leftColumn}>
          <DocumentUpload tenantId={tenantId} />
          <TrainingInbox tenantId={tenantId} />
        </div>
        <div>
          <ChatSandbox />
        </div>
      </div>
    </div>
  );
}