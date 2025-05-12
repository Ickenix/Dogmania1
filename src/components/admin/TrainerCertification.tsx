import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Award, Download, Check, X, Eye, FileText, Mail, Calendar, User, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import html2pdf from 'html2pdf.js';

interface TrainerApplication {
  id: string;
  user_id: string;
  submitted_at: string;
  status: 'pending' | 'approved' | 'rejected';
  documents: string[];
  notes: string;
  user: {
    email: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
  trainer: {
    id: string;
    bio: string;
    specialization: string[];
  };
}

const TrainerCertification = () => {
  const [applications, setApplications] = useState<TrainerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<TrainerApplication | null>(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [generatingCertificate, setGeneratingCertificate] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  async function fetchApplications() {
    try {
      let query = supabase
        .from('trainer_certifications')
        .select(`
          *,
          user:user_id(email, username, full_name, avatar_url),
          trainer:trainer_id(id, bio, specialization)
        `)
        .order('submitted_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('verification_status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching trainer applications:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateApplicationStatus(id: string, status: 'pending' | 'verified' | 'rejected', note?: string) {
    try {
      const { error } = await supabase
        .from('trainer_certifications')
        .update({
          verification_status: status,
          verified_at: status === 'verified' ? new Date().toISOString() : null,
          notes: note || null
        })
        .eq('id', id);

      if (error) throw error;

      if (status === 'verified') {
        // Update trainer verified status
        const application = applications.find(app => app.id === id);
        if (application) {
          const { error: trainerError } = await supabase
            .from('trainers')
            .update({ is_verified: true })
            .eq('id', application.trainer.id);

          if (trainerError) throw trainerError;

          // Create notification for the trainer
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
              user_id: application.user_id,
              title: 'Zertifizierung bestätigt',
              message: 'Herzlichen Glückwunsch! Deine Trainer-Zertifizierung wurde bestätigt.',
              type: 'certification',
              action_url: '/trainer'
            });

          if (notificationError) throw notificationError;

          // Send email notification (mock)
          console.log(`Email sent to ${application.user.email} about certification approval`);
        }
      } else if (status === 'rejected') {
        // Create notification for the trainer about rejection
        const application = applications.find(app => app.id === id);
        if (application) {
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
              user_id: application.user_id,
              title: 'Zertifizierung abgelehnt',
              message: 'Deine Trainer-Zertifizierung wurde leider abgelehnt. Bitte überprüfe die Anmerkungen und versuche es erneut.',
              type: 'certification',
              action_url: '/trainer'
            });

          if (notificationError) throw notificationError;
        }
      }

      fetchApplications();
      setShowRejectionModal(false);
      setRejectionNote('');
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  }

  async function generateCertificate(application: TrainerApplication) {
    setGeneratingCertificate(true);
    try {
      const certificateHtml = `
        <div style="
          width: 800px;
          height: 600px;
          padding: 40px;
          text-align: center;
          border: 10px solid #4C1D95;
          position: relative;
          font-family: 'Inter', sans-serif;
        ">
          <div style="
            width: 750px;
            height: 550px;
            padding: 20px;
            text-align: center;
            border: 5px solid #7C3AED;
            background: linear-gradient(135deg, #1E1B4B 0%, #312E81 100%);
            color: white;
          ">
            <div style="text-align: center; margin-bottom: 20px;">
              <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5"></path>
                <path d="M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5"></path>
                <path d="M8 14v.5"></path>
                <path d="M16 14v.5"></path>
                <path d="M11.25 16.25h1.5L12 17l-.75-.75Z"></path>
                <path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444c0-1.061-.162-2.2-.493-3.309m-.973-2.04A15.856 15.856 0 0 0 17.5 7.497"></path>
              </svg>
            </div>
            <span style="
              font-size: 50px;
              font-weight: bold;
              color: #7C3AED;
              font-family: 'Playfair Display', serif;
            ">Zertifikat</span>
            <br><br>
            <span style="font-size: 25px;">
              <i>Dieses Zertifikat wird verliehen an</i>
            </span>
            <br><br>
            <span style="font-size: 30px; color: #7C3AED;">${application.user.full_name || application.user.username}</span>
            <br><br>
            <span style="font-size: 25px;">
              für die erfolgreiche Zertifizierung als
            </span>
            <br><br>
            <span style="font-size: 30px; color: #7C3AED;">Hundetrainer</span>
            <br><br>
            <span style="font-size: 20px;">
              Spezialisierung: ${application.trainer.specialization?.join(', ') || 'Allgemein'}
            </span>
            <br><br>
            <span style="font-size: 20px;">
              Ausgestellt am ${format(new Date(), 'dd. MMMM yyyy', { locale: de })}
            </span>
            <br><br><br>
            <div style="
              display: flex;
              justify-content: space-between;
              margin-top: 40px;
              padding: 0 60px;
            ">
              <div style="text-align: center;">
                <div style="border-bottom: 2px solid #7C3AED; width: 150px; margin-bottom: 10px; padding-bottom: 5px;">
                  Dogmania Team
                </div>
                <div style="font-size: 14px;">
                  Zertifizierungsstelle
                </div>
              </div>
              <div style="text-align: center;">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                  <path d="m9 12 2 2 4-4"></path>
                </svg>
                <div style="font-size: 14px; color: #7C3AED;">
                  Offizielles Siegel
                </div>
              </div>
            </div>
            <div style="position: absolute; bottom: 20px; right: 20px; font-size: 12px; color: #7C3AED;">
              ID: ${application.id.slice(0, 8)}
            </div>
          </div>
        </div>
      `;

      const element = document.createElement('div');
      element.innerHTML = certificateHtml;
      document.body.appendChild(element);

      const options = {
        margin: 0,
        filename: `trainer-certificate-${application.user.username}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };

      const pdfBlob = await html2pdf().set(options).from(element).output('blob');
      document.body.removeChild(element);

      // Upload to Supabase Storage
      const fileExt = 'pdf';
      const filePath = `${application.user_id}/${application.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(filePath, pdfBlob, { contentType: 'application/pdf' });

      if (uploadError) throw uploadError;

      // Save certificate reference in database
      const { error: dbError } = await supabase
        .from('certificates')
        .insert({
          trainer_id: application.trainer.id,
          title: 'Offizielles Dogmania Trainer-Zertifikat',
          issuer: 'Dogmania Zertifizierungsstelle',
          issue_date: new Date().toISOString(),
          file_url: filePath
        });

      if (dbError) throw dbError;

      // Update application status
      await updateApplicationStatus(application.id, 'verified');

      // Create a download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `trainer-certificate-${application.user.username}.pdf`;
      link.click();
      URL.revokeObjectURL(url);

      setShowCertificateModal(false);
    } catch (error) {
      console.error('Error generating certificate:', error);
    } finally {
      setGeneratingCertificate(false);
    }
  }

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs flex items-center"><Award size={14} className="mr-1" />Offen</span>;
      case 'verified':
        return <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs flex items-center"><Check size={14} className="mr-1" />Zertifiziert</span>;
      case 'rejected':
        return <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs flex items-center"><X size={14} className="mr-1" />Abgelehnt</span>;
      default:
        return null;
    }
  };

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
        <h2 className="text-2xl font-bold">Trainer-Zertifizierung</h2>
        <div className="flex gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Suche nach Trainern..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Alle Anträge</option>
            <option value="pending">Offene Anträge</option>
            <option value="verified">Zertifizierte Trainer</option>
            <option value="rejected">Abgelehnte Anträge</option>
          </select>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-lg rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left">Trainer</th>
                <th className="px-6 py-4 text-left">Eingereicht am</th>
                <th className="px-6 py-4 text-left">Dokumente</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    Keine Anträge gefunden
                  </td>
                </tr>
              ) : (
                filteredApplications.map((application) => (
                  <tr key={application.id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                          {application.user.avatar_url ? (
                            <img
                              src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${application.user.avatar_url}`}
                              alt={application.user.username}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User size={20} className="text-purple-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold">{application.user.full_name || application.user.username}</div>
                          <div className="text-sm text-gray-400">{application.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {format(new Date(application.submitted_at), 'dd.MM.yyyy', { locale: de })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FileText size={16} className="text-purple-400 mr-2" />
                        <span>{application.documents?.length || 0} Dokumente</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(application.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedApplication(application)}
                          className="p-2 text-gray-400 hover:bg-white/10 rounded-lg transition-colors"
                          title="Details anzeigen"
                        >
                          <Eye size={18} />
                        </button>
                        {application.status === 'pending' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedApplication(application);
                                setShowCertificateModal(true);
                              }}
                              className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                              title="Zertifikat ausstellen"
                            >
                              <Award size={18} />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedApplication(application);
                                setShowRejectionModal(true);
                              }}
                              className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                              title="Antrag ablehnen"
                            >
                              <X size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Application Details Modal */}
      {selectedApplication && !showCertificateModal && !showRejectionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-blue-900/50 backdrop-blur-lg rounded-2xl w-full max-w-3xl">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold">Zertifizierungsantrag</h2>
              <button
                onClick={() => setSelectedApplication(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-6 mb-6">
                <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center">
                  {selectedApplication.user.avatar_url ? (
                    <img
                      src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${selectedApplication.user.avatar_url}`}
                      alt={selectedApplication.user.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User size={32} className="text-purple-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{selectedApplication.user.full_name || selectedApplication.user.username}</h3>
                  <div className="flex items-center text-gray-400">
                    <Mail size={16} className="mr-2" />
                    {selectedApplication.user.email}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Calendar size={18} className="mr-2 text-purple-400" />
                    Antragsdatum
                  </h4>
                  <p>{format(new Date(selectedApplication.submitted_at), 'dd. MMMM yyyy', { locale: de })}</p>
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Shield size={18} className="mr-2 text-purple-400" />
                    Status
                  </h4>
                  <div>
                    {getStatusBadge(selectedApplication.status)}
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-semibold mb-4">Über den Trainer</h4>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-gray-300">{selectedApplication.trainer.bio || 'Keine Biografie vorhanden'}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-semibold mb-4">Spezialisierungen</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedApplication.trainer.specialization?.map((spec, index) => (
                    <span key={index} className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm">
                      {spec}
                    </span>
                  )) || <span className="text-gray-400">Keine Spezialisierungen angegeben</span>}
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-semibold mb-4">Dokumente</h4>
                {selectedApplication.documents?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedApplication.documents.map((doc, index) => (
                      <div key={index} className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <FileText size={20} className="text-purple-400 mr-3" />
                          <span>Dokument {index + 1}</span>
                        </div>
                        <a
                          href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/certificates/${doc}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          <Download size={18} />
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400">Keine Dokumente vorhanden</div>
                )}
              </div>
              
              {selectedApplication.status === 'pending' && (
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setShowRejectionModal(true);
                    }}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                  >
                    <X size={18} className="inline-block mr-2" />
                    Antrag ablehnen
                  </button>
                  <button
                    onClick={() => {
                      setShowCertificateModal(true);
                    }}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 transition-colors"
                  >
                    <Award size={18} className="inline-block mr-2" />
                    Zertifikat ausstellen
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Certificate Generation Modal */}
      {selectedApplication && showCertificateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-blue-900/50 backdrop-blur-lg rounded-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold">Zertifikat ausstellen</h2>
              <button
                onClick={() => {
                  setShowCertificateModal(false);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="bg-white/5 rounded-lg p-6 mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Award size={24} className="text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Trainer-Zertifikat</h3>
                    <p className="text-gray-400">Für {selectedApplication.user.full_name || selectedApplication.user.username}</p>
                  </div>
                </div>
                
                <p className="text-gray-300 mb-6">
                  Du bist dabei, ein offizielles Dogmania Trainer-Zertifikat auszustellen. 
                  Dies bestätigt, dass der Trainer alle Anforderungen erfüllt und berechtigt ist, 
                  als verifizierter Trainer auf der Plattform zu agieren.
                </p>
                
                <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 px-4 py-3 rounded-lg mb-6">
                  Nach der Ausstellung wird der Trainer per E-Mail benachrichtigt und erhält Zugang zu allen Trainer-Funktionen.
                </div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowCertificateModal(false);
                  }}
                  className="px-6 py-3 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => generateCertificate(selectedApplication)}
                  disabled={generatingCertificate}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingCertificate ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white inline-block mr-2"></div>
                      Wird generiert...
                    </>
                  ) : (
                    <>
                      <Award size={18} className="inline-block mr-2" />
                      Zertifikat generieren
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {selectedApplication && showRejectionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-blue-900/50 backdrop-blur-lg rounded-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold">Antrag ablehnen</h2>
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Grund der Ablehnung</label>
                <textarea
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={4}
                  placeholder="Bitte gib einen Grund für die Ablehnung an..."
                />
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowRejectionModal(false);
                  }}
                  className="px-6 py-3 rounded-lg hover:bg-white/10 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => updateApplicationStatus(selectedApplication.id, 'rejected', rejectionNote)}
                  disabled={!rejectionNote.trim()}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X size={18} className="inline-block mr-2" />
                  Antrag ablehnen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainerCertification;