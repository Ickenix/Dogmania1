import React, { useState } from 'react';
import { X, Download, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import html2pdf from 'html2pdf.js';

interface ExportToPdfModalProps {
  messages: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
  }[];
  onClose: () => void;
}

const ExportToPdfModal: React.FC<ExportToPdfModalProps> = ({ messages, onClose }) => {
  const [title, setTitle] = useState('Mein Hunde-Coaching');
  const [includeTimestamps, setIncludeTimestamps] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    
    try {
      // Create HTML content for PDF
      const content = document.createElement('div');
      content.style.padding = '20px';
      content.style.fontFamily = 'Arial, sans-serif';
      
      // Add title
      const titleElement = document.createElement('h1');
      titleElement.textContent = title;
      titleElement.style.textAlign = 'center';
      titleElement.style.color = '#6d28d9';
      titleElement.style.marginBottom = '20px';
      content.appendChild(titleElement);
      
      // Add date
      const dateElement = document.createElement('p');
      dateElement.textContent = `Erstellt am: ${new Date().toLocaleDateString('de-DE')}`;
      dateElement.style.textAlign = 'center';
      dateElement.style.marginBottom = '30px';
      dateElement.style.color = '#666';
      content.appendChild(dateElement);
      
      // Add messages
      messages.forEach(message => {
        const messageContainer = document.createElement('div');
        messageContainer.style.marginBottom = '15px';
        messageContainer.style.padding = '10px';
        messageContainer.style.borderRadius = '8px';
        
        if (message.role === 'user') {
          messageContainer.style.backgroundColor = '#6d28d9';
          messageContainer.style.color = 'white';
          messageContainer.style.marginLeft = '20%';
        } else {
          messageContainer.style.backgroundColor = '#f3f4f6';
          messageContainer.style.color = '#1f2937';
          messageContainer.style.marginRight = '20%';
        }
        
        const sender = document.createElement('div');
        sender.textContent = message.role === 'user' ? 'Du' : 'KI-Hundecoach';
        sender.style.fontWeight = 'bold';
        sender.style.marginBottom = '5px';
        messageContainer.appendChild(sender);
        
        const content = document.createElement('div');
        content.textContent = message.content;
        messageContainer.appendChild(content);
        
        if (includeTimestamps) {
          const timestamp = document.createElement('div');
          timestamp.textContent = new Date(message.created_at).toLocaleString('de-DE');
          timestamp.style.fontSize = '0.8em';
          timestamp.style.marginTop = '5px';
          timestamp.style.textAlign = 'right';
          timestamp.style.opacity = '0.7';
          messageContainer.appendChild(timestamp);
        }
        
        content.appendChild(messageContainer);
      });
      
      // Generate PDF
      const options = {
        margin: 10,
        filename: `${title.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().from(content).set(options).save();
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-blue-900/50 backdrop-blur-lg rounded-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold">Als PDF exportieren</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={32} className="text-green-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Export erfolgreich!</h3>
            <p className="text-gray-300">
              Dein PDF wurde erfolgreich erstellt und heruntergeladen.
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Titel des Dokuments</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="include-timestamps"
                checked={includeTimestamps}
                onChange={(e) => setIncludeTimestamps(e.target.checked)}
                className="h-4 w-4 text-purple-600 rounded border-white/20 bg-white/10 focus:ring-purple-500"
              />
              <label htmlFor="include-timestamps" className="ml-2 text-sm text-gray-300">
                Zeitstempel einbeziehen
              </label>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4 text-sm">
              <p className="text-gray-300">
                Das PDF wird alle Nachrichten aus diesem Chat enthalten und auf deinem Gerät gespeichert.
              </p>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleExport}
                disabled={loading}
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Wird erstellt...
                  </>
                ) : (
                  <>
                    <Download size={18} className="mr-2" />
                    Exportieren
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ExportToPdfModal;