import { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

type PdfPageImage = {
  pageNum: number;
  src: string;
  width: number;
  height: number;
};

type PdfDocumentPreviewProps = {
  blob: Blob | null;
  className?: string;
};

/** Renders every PDF page in a vertically scrollable stack (works on mobile). */
export function PdfDocumentPreview({ blob, className = '' }: PdfDocumentPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<PdfPageImage[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setPages([]);
      setPageCount(0);
      setError(null);
      return;
    }

    let cancelled = false;

    const renderPdf = async () => {
      setLoading(true);
      setError(null);
      setPages([]);

      try {
        const data = await blob.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data }).promise;
        if (cancelled) return;

        setPageCount(pdf.numPages);
        const containerWidth =
          containerRef.current?.clientWidth ||
          Math.min(window.innerWidth - 32, 1100);
        const rendered: PdfPageImage[] = [];

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
          if (cancelled) return;

          const page = await pdf.getPage(pageNum);
          const baseViewport = page.getViewport({ scale: 1 });
          const scale = Math.max(containerWidth / baseViewport.width, 0.5);
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const context = canvas.getContext('2d');
          if (!context) {
            throw new Error('Could not create canvas context');
          }

          await page.render({ canvasContext: context, viewport }).promise;

          rendered.push({
            pageNum,
            src: canvas.toDataURL('image/jpeg', 0.9),
            width: viewport.width,
            height: viewport.height,
          });

          if (!cancelled) {
            setPages([...rendered]);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not render PDF preview');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void renderPdf();

    return () => {
      cancelled = true;
    };
  }, [blob]);

  return (
    <div
      ref={containerRef}
      className={`h-full overflow-y-auto overscroll-contain rounded-md border bg-muted/20 [-webkit-overflow-scrolling:touch] ${className}`}
    >
      {loading && pages.length === 0 && (
        <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-muted-foreground">
          Loading preview…
        </div>
      )}

      {error && (
        <div className="flex h-full min-h-[240px] items-center justify-center p-4 text-center text-sm text-destructive">
          {error}
        </div>
      )}

      {!error && pages.length > 0 && (
        <div className="flex flex-col items-center gap-3 p-2 sm:p-3">
          {pages.map((page) => (
            <figure key={page.pageNum} className="w-full max-w-full">
              <img
                src={page.src}
                alt={`Page ${page.pageNum}${pageCount ? ` of ${pageCount}` : ''}`}
                width={page.width}
                height={page.height}
                className="mx-auto block h-auto w-full max-w-full rounded-sm bg-white shadow-sm"
                loading="lazy"
                decoding="async"
              />
              {pageCount > 1 && (
                <figcaption className="mt-1 text-center text-xs text-muted-foreground">
                  Page {page.pageNum} of {pageCount}
                </figcaption>
              )}
            </figure>
          ))}
          {loading && pageCount > pages.length && (
            <p className="pb-2 text-center text-xs text-muted-foreground">
              Loading page {pages.length + 1} of {pageCount}…
            </p>
          )}
        </div>
      )}
    </div>
  );
}
