import { useState, useEffect } from 'react';
import { uploadDocument, getDocuments, deleteDocument } from '../services/api';
import styles from '../pages/Dashboard.module.css';

export default function DocumentUpload({ tenantId }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState([]);

  // Fetch existing documents when the dashboard loads
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const data = await getDocuments(tenantId);
        setUploadedDocs(data.documents);
      } catch (err) {
        console.error("Failed to fetch documents", err);
      }
    };
    fetchDocs();
  }, [tenantId]);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setStatus('Uploading and learning...');
    try {
      const response = await uploadDocument(tenantId, file);
      
      if (response.status.includes('already exists')) {
        setStatus(response.status);
      } else {
        setStatus('Document successfully learned!');
        // Add the new file to our UI list immediately
        setUploadedDocs(prev => [...prev, file.name]);
        setFile(null);
      }
    } catch (err) {
      setStatus('Error uploading document.');
    }
    setLoading(false);
  };

  const handleDelete = async (filename) => {
    if (!window.confirm(`Are you sure you want to delete ${filename}? The bot will forget this information.`)) return;
    
    setLoading(true);
    setStatus('Deleting document...');
    try {
      await deleteDocument(tenantId, filename);
      // Remove it from the UI
      setUploadedDocs(prev => prev.filter(doc => doc !== filename));
      setStatus(`${filename} deleted successfully.`);
    } catch (err) {
      setStatus('Failed to delete document.');
    }
    setLoading(false);
  };

  // The condition you requested: Disable input if a document exists
  const hasDocument = uploadedDocs.length > 0;

  return (
    <div className={styles.card}>
      <div className={styles.cardTitle}>Internal Knowledge Base</div>
      <p className={styles.textMuted} style={{ marginBottom: '1.25rem' }}>
        Manage your private PDFs or DOCX files here.
      </p>
      
      {/* 1. The Active Document List */}
      {uploadedDocs.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          {uploadedDocs.map((docName, idx) => (
            <div key={idx} className={styles.questionItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>📄</span>
                <span className={styles.questionText} style={{ margin: 0 }}>{docName}</span>
              </div>
              <button 
                onClick={() => handleDelete(docName)} 
                disabled={loading}
                style={{ background: 'transparent', color: '#ff5f7a', border: '1px solid #ff5f7a', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer' }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 2. The Upload Area */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', opacity: hasDocument ? 0.5 : 1 }}>
        <input 
          type="file" 
          accept=".pdf,.docx" 
          className={styles.fileInput}
          onChange={(e) => setFile(e.target.files[0])} 
          disabled={hasDocument || loading} // Disables input if they already uploaded something!
        />
        <button 
          className={styles.btn} 
          onClick={handleUpload} 
          disabled={!file || hasDocument || loading}
        >
          {loading ? 'Processing...' : 'Upload & Train'}
        </button>
      </div>
      
      {/* Status Messages */}
      {status && (
        <p className={status.includes('Error') || status.includes('Failed') ? styles.textError : styles.textSuccess}>
          {status}
        </p>
      )}
      
      {hasDocument && (
        <p className={styles.textMuted} style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
          * Limit reached. Please delete your current document to upload a new one.
        </p>
      )}
    </div>
  );
}