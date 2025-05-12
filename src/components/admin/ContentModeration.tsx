import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AlertTriangle, CheckCircle, XCircle, MessageSquare, Flag, Trash2, Eye, X } from 'lucide-react';

interface Report {
  id: string;
  type: string;
  reference_id: string;
  reason: string;
  reported_by: string;
  status: string;
  created_at: string;
  content?: {
    title?: string;
    content: string;
    author?: {
      username: string;
    };
  };
  reporter?: {
    username: string;
  };
}

const ContentModeration = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, reviewed, resolved, dismissed
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showReportDetails, setShowReportDetails] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [filter]);

  async function fetchReports() {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          content:reference_id (
            title,
            content,
            author:user_id (username)
          ),
          reporter:reported_by (username)
        `)
        .eq('status', filter)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateReportStatus(reportId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('reports')
        .update({
          status: newStatus,
          resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null
        })
        .eq('id', reportId);

      if (error) throw error;
      fetchReports();
      
      if (selectedReport?.id === reportId) {
        setSelectedReport(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      console.error('Error updating report status:', error);
    }
  }

  async function deleteContent(reportId: string, type: string, contentId: string) {
    try {
      const table = type === 'thread' ? 'group_threads' : 'group_comments';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', contentId);

      if (error) throw error;

      // Mark report as resolved
      await updateReportStatus(reportId, 'resolved');
      
      if (selectedReport?.id === reportId) {
        setShowReportDetails(false);
      }
    } catch (error) {
      console.error('Error deleting content:', error);
    }
  }
  
  function viewReportDetails(report: Report) {
    setSelectedReport(report);
    setShowReportDetails(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Inhaltsmoderation</h2>
        <div className="flex gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="pending">Ausstehend</option>
            <option value="reviewed">In Prüfung</option>
            <option value="resolved">Erledigt</option>
            <option value="dismissed">Abgelehnt</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {reports.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 text-center">
            <Flag size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">Keine Meldungen</h3>
            <p className="text-gray-400">
              Es gibt aktuell keine {filter === 'pending' ? 'ausstehenden' : filter === 'reviewed' ? 'in Prüfung befindlichen' : filter === 'resolved' ? 'erledigten' : 'abgelehnten'} Meldungen.
            </p>
          </div>
        ) : (
          reports.map((report) => (
            <div key={report.id} className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
                      {report.type === 'thread' ? 'Thread' : 'Kommentar'}
                    </span>
                    <span className="text-sm text-gray-400">
                      Gemeldet von {report.reporter?.username} • {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold mb-1">
                    {report.content?.title || 'Gemeldeter Inhalt'}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Von {report.content?.author?.username}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => viewReportDetails(report)}
                    className="p-2 text-gray-400 hover:bg-gray-500/20 rounded-lg transition-colors"
                    title="Details anzeigen"
                  >
                    <Eye size={20} />
                  </button>
                  <button
                    onClick={() => updateReportStatus(report.id, 'reviewed')}
                    className="p-2 text-yellow-400 hover:bg-yellow-500/20 rounded-lg transition-colors"
                    title="Als 'In Prüfung' markieren"
                  >
                    <AlertTriangle size={20} />
                  </button>
                  <button
                    onClick={() => updateReportStatus(report.id, 'dismissed')}
                    className="p-2 text-gray-400 hover:bg-gray-500/20 rounded-lg transition-colors"
                    title="Meldung ablehnen"
                  >
                    <XCircle size={20} />
                  </button>
                  <button
                    onClick={() => deleteContent(report.id, report.type, report.reference_id)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                    title="Inhalt löschen"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4 mb-4">
                <p className="text-gray-300 line-clamp-3">{report.content?.content}</p>
              </div>

              <div className="bg-red-500/10 rounded-lg p-4">
                <h4 className="font-medium mb-2">Grund der Meldung</h4>
                <p className="text-gray-300">{report.reason}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Report Details Modal */}
      {showReportDetails && selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-blue-900/50 backdrop-blur-lg rounded-2xl w-full max-w-3xl">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold">Meldungsdetails</h2>
              <button
                onClick={() => setShowReportDetails(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Flag size={24} className="text-red-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold">{selectedReport.type === 'thread' ? 'Thread gemeldet' : 'Kommentar gemeldet'}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedReport.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      selectedReport.status === 'reviewed' ? 'bg-blue-500/20 text-blue-400' :
                      selectedReport.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {selectedReport.status}
                    </span>
                  </div>
                  <p className="text-gray-400">
                    Gemeldet von {selectedReport.reporter?.username} am {new Date(selectedReport.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-6 mb-6">
                <div className="flex items-center mb-4">
                  <h4 className="font-semibold text-lg">Gemeldeter Inhalt</h4>
                  {selectedReport.content?.title && (
                    <span className="ml-2 text-gray-400">- {selectedReport.content.title}</span>
                  )}
                </div>
                <p className="text-gray-300 whitespace-pre-line mb-4">{selectedReport.content?.content}</p>
                <p className="text-sm text-gray-400">
                  Von {selectedReport.content?.author?.username || 'Unbekannt'}
                </p>
              </div>
              
              <div className="bg-red-500/10 rounded-lg p-6 mb-6">
                <h4 className="font-semibold mb-2">Grund der Meldung</h4>
                <p className="text-gray-300">{selectedReport.reason}</p>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    updateReportStatus(selectedReport.id, 'dismissed');
                    setShowReportDetails(false);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  Meldung ablehnen
                </button>
                <button
                  onClick={() => {
                    deleteContent(selectedReport.id, selectedReport.type, selectedReport.reference_id);
                    setShowReportDetails(false);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                >
                  Inhalt löschen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentModeration;