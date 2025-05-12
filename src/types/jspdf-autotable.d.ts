declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';

  interface AutoTableColumn {
    header?: string;
    dataKey?: string | number;
    title?: string;
    key?: string;
    width?: number;
    x?: number;
    y?: number;
  }

  interface AutoTableSettings {
    head?: any[][];
    body?: any[][];
    foot?: any[][];
    columns?: AutoTableColumn[];
    startY?: number;
    margin?: { top?: number; right?: number; bottom?: number; left?: number };
    pageBreak?: 'auto' | 'avoid' | 'always';
    rowPageBreak?: 'auto' | 'avoid';
    showHead?: 'everyPage' | 'firstPage' | 'never';
    showFoot?: 'everyPage' | 'lastPage' | 'never';
    tableWidth?: 'auto' | 'wrap' | number;
    theme?: 'striped' | 'grid' | 'plain';
    styles?: any;
    headStyles?: any;
    bodyStyles?: any;
    footStyles?: any;
    alternateRowStyles?: any;
    columnStyles?: { [key: string]: any };
    didParseCell?: (data: any) => void;
    willDrawCell?: (data: any) => void;
    didDrawCell?: (data: any) => void;
    didDrawPage?: (data: any) => void;
  }

  interface UserOptions {
    autoTable?: (options: AutoTableSettings) => void;
  }

  interface jsPDFWithAutoTable extends jsPDF {
    autoTable: (options: AutoTableSettings) => void;
  }

  function autoTable(doc: jsPDF, options: AutoTableSettings): void;
  export default autoTable;
}