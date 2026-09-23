import { useEffect, useRef } from "react";

// Maximum millisecond interval between keystrokes from hardware scanner
const MAXIMUM_INTERVAL = 50;

// Minimum character length for valid scanned barcode payload
const MINIMUM_LENGTH = 3;

interface ScannerOptions {
  scanAction: (scannedValue: string) => void;
  isEnabled?: boolean;
}

// Custom hook to capture rapid keystrokes from barcode scanner hardware
export function useBarcodeScanner({ scanAction, isEnabled = true }: ScannerOptions) {
  const bufferRef = useRef<string>("");
  const timestampRef = useRef<number>(0);

  useEffect(() => {
    // Early return if scanner listener disabled
    if (!isEnabled) {
      return;
    }

    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      const currentTime = Date.now();
      const timeDifference = currentTime - timestampRef.current;
      timestampRef.current = currentTime;

      // Handle scanner completion on enter key
      if (keyboardEvent.key === "Enter") {
        const bufferedValue = bufferRef.current.trim();
        bufferRef.current = "";

        // Trigger scan action when minimum length requirement met
        if (bufferedValue.length >= MINIMUM_LENGTH) {
          scanAction(bufferedValue);
        }
        return;
      }

      // Skip modifier and function keys
      if (keyboardEvent.key.length > 1) {
        return;
      }

      // Clear buffer if keystrokes are too slow for barcode scanner
      if (timeDifference > MAXIMUM_INTERVAL && bufferRef.current.length > 0) {
        bufferRef.current = "";
      }

      // Append printable key to scan buffer
      bufferRef.current += keyboardEvent.key;
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [scanAction, isEnabled]);
}
