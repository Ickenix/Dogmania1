import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Download, FileText, Calendar, Dog, Loader2, Check, X } from 'lucide-react';
import { format, subMonths, isWithinInterval } from 'date-fns';
import { de } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';

interface DiaryEntry {
  id: string;
  dog_id: string;
  title: string;
  content: string;
  entry_date: string;
  entry_type: string;
  mood_rating: number;
  image_url: string | null;
  location: string | null;
  created_at: string;
}

interface DogDiaryExportProps {
  dogId: string;
  dogName: string;
  entries: DiaryEntry[];
}

const DogDiaryExport: React.FC<DogDiaryExportProps> = ({ 
  dogId, 
  dogName,
  entries 
}) => {
  const { session } = useAuth();
  const [startDate, setStartDate] = useState<string>(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [exportType, setExportType] = useState<'pdf' | 'csv'>('pdf');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [includeImages, setIncludeImages] = useState(false);
  const [includeLocation, setIncludeLocation] = useState(true);

  const getEntryTypeName = (type: string) => {
    switch (type) {
      case 'training':
        return 'Training';
      case 'health':
        return 'Gesundheit';
      case 'nutrition':
        return 'Ernährung';
      case 'behavior':
        return 'Verhalten';
      case 'experience':
        return 'Erlebnis';
      case 'other':
        return 'Sonstiges';
      default:
        return type;
    }
  };

  const getMoodEmoji = (rating: number) => {
    switch (rating) {
      case 1: return '😢';
      case 2: return '😕';
      case 3: return '😊';
      case 4: return '😃';
      case 5: return '🥰';
      default: return '😊';
    }
  };

  const filteredEntries = entries.filter(entry => {
    const entryDate = new Date(entry.entry_date);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return isWithinInterval(entryDate, { start, end });
  });

  const exportToPDF = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Create PDF document
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.setTextColor(128, 0, 128);
      doc.text(`Tagebuch von ${dogName}`, 105, 20, { align: 'center' });
      
      // Add date range
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Zeitraum: ${format(new Date(startDate), 'dd.MM.yyyy', { locale: de })} - ${format(new Date(endDate), 'dd.MM.yyyy', { locale: de })}`, 105, 30, { align: 'center' });
      
      // Add entries table
      if (filteredEntries.length > 0) {
        // @ts-ignore - jspdf-autotable types
        doc.autoTable({
          startY: 40,
          head: [['Datum', 'Titel', 'Kategorie', 'Stimmung', 'Inhalt', ...(includeLocation ? ['Ort'] : [])]],
          body: filteredEntries.map(entry => [
            format(new Date(entry.entry_date), 'dd.MM.yyyy'),
            entry.title,
            getEntryTypeName(entry.entry_type),
            getMoodEmoji(entry.mood_rating),
            entry.content || '',
            ...(includeLocation ? [entry.location || ''] : [])
          ]),
          styles: {
            fontSize: 10,
            cellPadding: 3,
          },
          headStyles: {
            fillColor: [128, 0, 128],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
          alternateRowStyles: {
            fillColor: [245, 245, 255],
          },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 35 },
            2: { cellWidth: 25 },
            3: { cellWidth: 15 },
            4: { cellWidth: 'auto' },
            ...(includeLocation ? { 5: { cellWidth: 30 } } : {})
          },
        });
        
        // Add images if requested
        if (includeImages) {
          let currentY = doc.lastAutoTable.finalY + 20;
          
          for (const entry of filteredEntries) {
            if (entry.image_url) {
              // Check if we need a new page
              if (currentY > 250) {
                doc.addPage();
                currentY = 20;
              }
              
              doc.setFontSize(12);
              doc.setTextColor(128, 0, 128);
              doc.text(`${entry.title} (${format(new Date(entry.entry_date), 'dd.MM.yyyy')})`, 20, currentY);
              currentY += 10;
              
              try {
                // This is a placeholder - in a real app, you'd need to handle image loading
                // For now, we'll just add a placeholder text
                doc.setFontSize(10);
                doc.setTextColor(100, 100, 100);
                doc.text(`[Bild: ${entry.image_url}]`, 20, currentY);
                currentY += 50;
              } catch (error) {
                console.error('Error adding image to PDF:', error);
              }
            }
          }
        }
      } else {
        doc.setFontSize(14);
        doc.setTextColor(100, 100, 100);
        doc.text('Keine Einträge im ausgewählten Zeitraum', 105, 60, { align: 'center' });
      }
      
      // Add footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(`Erstellt am ${format(new Date(), 'dd.MM.yyyy')} mit Dogmania`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
        doc.text(`Seite ${i} von ${pageCount}`, 195, doc.internal.pageSize.height - 10, { align: 'right' });
      }
      
      // Save PDF
      doc.save(`Hundetagebuch_${dogName}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      setError('Fehler beim Exportieren als PDF');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Prepare data for CSV
      const csvData = filteredEntries.map(entry => ({
        Datum: format(new Date(entry.entry_date), 'dd.MM.yyyy'),
        Titel: entry.title,
        Kategorie: getEntryTypeName(entry.entry_type),
        Stimmung: getMoodEmoji(entry.mood_rating),
        Inhalt: entry.content || '',
        ...(includeLocation ? { Ort: entry.location || '' } : {}),
        Erstellt: format(new Date(entry.created_at), 'dd.MM.yyyy HH:mm')
      }));
      
      // Convert to CSV
      const csv = Papa.unparse(csvData);
      
      // Create download link
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Hundetagebuch_${dogName}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      setError('Fehler beim Exportieren als CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (exportType === 'pdf') {
      exportToPDF();
    } else {
      exportToCSV();
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <FileText className="mr-2 text-purple-400" size={24} />
        Tagebuch exportieren
      </h2>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-6 flex items-center">
          <X className="mr-2" size={20} />
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg mb-6 flex items-center">
          <Check className="mr-2" size={20} />
          Export erfolgreich! Die Datei wurde heruntergeladen.
        </div>
      )}
      
      <div className="space-y-6">
        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Von</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Bis</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>
        
        {/* Export Type */}
        <div>
          <label className="block text-sm font-medium mb-2">Exportformat</label>
          <div className="flex gap-4">
            <button
              onClick={() => setExportType('pdf')}
              className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg transition-colors ${
                exportType === 'pdf'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <FileText size={20} className="mr-2" />
              PDF
            </button>
            
            <button
              onClick={() => setExportType('csv')}
              className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg transition-colors ${
                exportType === 'csv'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <FileText size={20} className="mr-2" />
              CSV
            </button>
          </div>
        </div>
        
        {/* Options */}
        <div>
          <label className="block text-sm font-medium mb-2">Optionen</label>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="include-location"
                checked={includeLocation}
                onChange={(e) => setIncludeLocation(e.target.checked)}
                className="h-4 w-4 text-purple-600 rounded border-white/20 bg-white/10 focus:ring-purple-500"
              />
              <label htmlFor="include-location" className="ml-2 text-sm text-gray-300">
                Standortinformationen einbeziehen
              </label>
            </div>
            
            {exportType === 'pdf' && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="include-images"
                  checked={includeImages}
                  onChange={(e) => setIncludeImages(e.target.checked)}
                  className="h-4 w-4 text-purple-600 rounded border-white/20 bg-white/10 focus:ring-purple-500"
                />
                <label htmlFor="include-images" className="ml-2 text-sm text-gray-300">
                  Bilder einbeziehen (erhöht die Dateigröße)
                </label>
              </div>
            )}
          </div>
        </div>
        
        {/* Summary */}
        <div className="bg-white/5 rounded-lg p-4">
          <h3 className="font-medium mb-2">Zusammenfassung</h3>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-gray-400">Hund:</span>{' '}
              {dogName}
            </p>
            <p>
              <span className="text-gray-400">Zeitraum:</span>{' '}
              {format(new Date(startDate), 'dd.MM.yyyy')} - {format(new Date(endDate), 'dd.MM.yyyy')}
            </p>
            <p>
              <span className="text-gray-400">Anzahl Einträge:</span>{' '}
              {filteredEntries.length}
            </p>
            <p>
              <span className="text-gray-400">Format:</span>{' '}
              {exportType.toUpperCase()}
            </p>
          </div>
        </div>
        
        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={loading || filteredEntries.length === 0}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold px-6 py-3 rounded-lg shadow-lg hover:shadow-purple-500/30 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center"
        >
          {loading ? (
            <>
              <Loader2 size={20} className="mr-2 animate-spin" />
              Wird exportiert...
            </>
          ) : (
            <>
              <Download size={20} className="mr-2" />
              Als {exportType.toUpperCase()} herunterladen
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DogDiaryExport;