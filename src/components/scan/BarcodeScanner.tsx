import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { ScanBarcode, X, Loader2 } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    const scannerId = "barcode-reader";
    const scanner = new Html5Qrcode(scannerId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          scanner.stop().then(() => {
            onScan(decodedText);
          });
        },
        () => {}
      )
      .then(() => setStarting(false))
      .catch(() => {
        setError("Could not access camera for barcode scanning.");
        setStarting(false);
      });

    return () => {
      scanner.stop().catch(() => {});
    };
  }, [onScan]);

  return (
    <div className="glass-card rounded-3xl p-4 space-y-4 animate-scale-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScanBarcode className="w-5 h-5 text-primary" />
          <h3 className="font-display font-bold text-lg">Scan Barcode</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl">
          <X className="w-5 h-5" />
        </Button>
      </div>

      {starting && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive text-center py-4">{error}</p>
      )}

      <div
        id="barcode-reader"
        ref={containerRef}
        className="rounded-2xl overflow-hidden"
      />

      <p className="text-xs text-muted-foreground text-center">
        Point camera at the barcode on the item's packaging
      </p>
    </div>
  );
}
