import React, { useState } from 'react';
import html2pdf from 'html2pdf.js';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Dog, Download, Share } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface CertificateGeneratorProps {
  userName: string;
  courseName: string;
  completionDate: Date;
  courseId: string;
  dogName?: string;
  onComplete?: (fileUrl: string) => void;
}

const CertificateGenerator: React.FC<CertificateGeneratorProps> = ({
  userName,
  courseName,
  completionDate,
  courseId,
  dogName,
  onComplete
}) => {
  const { session } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);

  const generateCertificate = async () => {
    if (!session) return;
    
    try {
      setGenerating(true);
      
      // Create certificate content
      const certificate = document.createElement('div');
      certificate.innerHTML = `
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
            <span style="font-size: 30px; color: #7C3AED;">${userName}</span>
            <br><br>
            <span style="font-size: 25px;">
              für den erfolgreichen Abschluss von
            </span>
            <br><br>
            <span style="font-size: 30px; color: #7C3AED;">${courseName}</span>
            ${dogName ? `
            <br><br>
            <span style="font-size: 20px;">
              mit ${dogName}
            </span>
            ` : ''}
            <br><br>
            <span style="font-size: 20px;">
              Ausgestellt am ${format(completionDate, 'dd. MMMM yyyy', { locale: de })}
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
              ID: ${courseId.slice(0, 8)}
            </div>
          </div>
        </div>
      `;

      // Generate PDF
      const options = {
        margin: 0,
        filename: `${courseName.toLowerCase().replace(/\s+/g, '-')}-zertifikat.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };

      const pdfBlob = await html2pdf().set(options).from(certificate).output('blob');
      
      // Upload to Supabase Storage
      const fileExt = 'pdf';
      const filePath = `${session.user.id}/${courseId}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(filePath, pdfBlob, { contentType: 'application/pdf' });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('certificates')
        .getPublicUrl(filePath);
        
      const publicUrl = urlData.publicUrl;
      setCertificateUrl(publicUrl);

      // Call onComplete callback with file path
      if (onComplete) {
        onComplete(filePath);
      }
      
      setSuccess(true);

      // Create a download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${courseName.toLowerCase().replace(/\s+/g, '-')}-zertifikat.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating certificate:', error);
    } finally {
      setGenerating(false);
    }
  };

  const shareCertificate = async () => {
    if (!certificateUrl) return;
    
    try {
      await navigator.share({
        title: `${courseName} Zertifikat`,
        text: `Ich habe das Zertifikat "${courseName}" auf Dogmania erhalten!`,
        url: certificateUrl
      });
    } catch (error) {
      console.error('Error sharing certificate:', error);
    }
  };

  return (
    <div className="space-y-4">
      {!success ? (
        <button
          onClick={generateCertificate}
          disabled={generating}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors flex items-center justify-center w-full"
        >
          {generating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
              Zertifikat wird erstellt...
            </>
          ) : (
            <>
              <Dog className="mr-2" size={20} />
              Zertifikat erstellen
            </>
          )}
        </button>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg">
            Dein Zertifikat wurde erfolgreich erstellt!
          </div>
          
          <div className="flex gap-4">
            <a
              href={certificateUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-500 transition-colors flex items-center justify-center flex-1"
            >
              <Download className="mr-2" size={20} />
              Herunterladen
            </a>
            
            {navigator.share && (
              <button
                onClick={shareCertificate}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-500 transition-colors flex items-center justify-center flex-1"
              >
                <Share className="mr-2" size={20} />
                Teilen
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateGenerator;