import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// 🔥 Fix worker (quan trọng nhất)
pdfjs.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function PDFPreview({ file }) {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  return (
    <div className="flex gap-4 h-[500px]">
      {/* 🧭 Sidebar (preview từng trang nhỏ) */}
      <div className="w-24 overflow-y-auto border border-border rounded-lg bg-card">
        {numPages &&
          Array.from({ length: numPages }, (_, index) => (
            <div
              key={index}
              onClick={() => setCurrentPage(index + 1)}
              className={`cursor-pointer p-1 border-b border-border hover:bg-muted/10 transition ${
                currentPage === index + 1 ? 'bg-primary/20' : ''
              }`}
            >
              <Page
                pageNumber={index + 1}
                width={80}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </div>
          ))}
      </div>

      {/* 📄 Main PDF */}
      <div className="flex-1 overflow-auto border border-border rounded-lg flex justify-center items-start bg-muted/5 p-2">
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<p className="text-muted">Loading PDF...</p>}
          error={<p className="text-error">Error loading PDF</p>}
        >
          <Page
            pageNumber={currentPage}
            width={600}
          />
        </Document>
      </div>
    </div>
  );
}