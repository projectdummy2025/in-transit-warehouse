import React, { useState, useEffect } from "react";
import { Barcode, MapPin, CheckCircle, AlertCircle, RotateCcw } from "lucide-react";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { audioFeedback } from "@/utils/audioFeedback";

interface FormProps {
  onSuccess: (lpnCode: string, destinationLocation: string) => void;
  onCancel: () => void;
}

// 2-Phase hardware scanner form for pallet relocation (LPN Scan -> Bay Scan)
export function MutationForm({ onSuccess, onCancel }: FormProps) {
  const [scanStep, setScanStep] = useState<1 | 2>(1);
  const [lpnCode, setLpnCode] = useState<string>("");
  const [destinationLocation, setDestinationLocation] = useState<string>("");
  const [feedbackMessage, setFeedbackMessage] = useState<string>("Ready: Scan LPN barcode or enter identifier");
  const [isError, setIsError] = useState<boolean>(false);

  const resetFormState = () => {
    setScanStep(1);
    setLpnCode("");
    setDestinationLocation("");
    setIsError(false);
    setFeedbackMessage("Ready: Scan LPN barcode or enter identifier");
  };

  // Keyboard shortcut listener for ESC key reset
  useEffect(() => {
    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === "Escape") {
        keyboardEvent.preventDefault();
        resetFormState();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLpnSubmit = (inputLpn: string) => {
    const trimmed = inputLpn.trim();
    if (!trimmed) {
      setIsError(true);
      setFeedbackMessage("Invalid LPN barcode scan");
      audioFeedback.playErrorTone();
      return;
    }
    setLpnCode(trimmed);
    setScanStep(2);
    setIsError(false);
    setFeedbackMessage(`LPN ${trimmed} verified. Now scan destination bay location.`);
    audioFeedback.playSuccessTone();
  };

  const handleDestinationSubmit = (inputDest: string) => {
    const trimmed = inputDest.trim();
    if (!trimmed) {
      setIsError(true);
      setFeedbackMessage("Invalid destination location scan");
      audioFeedback.playErrorTone();
      return;
    }
    audioFeedback.playSuccessTone();
    onSuccess(lpnCode, trimmed);
  };

  useBarcodeScanner({
    scanAction: (scannedValue) => {
      if (scanStep === 1) {
        handleLpnSubmit(scannedValue);
      } else {
        handleDestinationSubmit(scannedValue);
      }
    },
  });

  return (
    <div className="w-full space-y-6">
      {/* Top Header with right-aligned single Back action */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
            Pallet Location Transfer Form
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Phase 1: Scan Source LPN &bull; Phase 2: Scan Destination Bay Location
          </p>
        </div>
        <button
          onClick={onCancel}
          className="px-4 py-1.5 rounded-lg border border-zinc-800 bg-[#18191d] text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm"
        >
          Kembali
        </button>
      </div>

      {/* Step Indicator Progress Bar */}
      <div className="grid grid-cols-2 gap-3 text-xs font-mono select-none">
        <div
          className={`p-3 rounded-lg border flex items-center gap-3 transition-colors ${
            scanStep === 1
              ? "bg-[#25262c] text-zinc-100 border-zinc-700 font-bold"
              : "bg-[#18191d] text-zinc-400 border-zinc-800"
          }`}
        >
          <span className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-[11px] font-bold text-zinc-300 border border-zinc-700">
            01
          </span>
          <div className="truncate">
            <span className="text-[10px] text-zinc-400 block uppercase">Phase 1</span>
            <span>{lpnCode ? lpnCode : "Scan LPN Barcode"}</span>
          </div>
        </div>

        <div
          className={`p-3 rounded-lg border flex items-center gap-3 transition-colors ${
            scanStep === 2
              ? "bg-[#25262c] text-zinc-100 border-zinc-700 font-bold"
              : "bg-[#18191d] text-zinc-400 border-zinc-800"
          }`}
        >
          <span className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-[11px] font-bold text-zinc-300 border border-zinc-700">
            02
          </span>
          <div className="truncate">
            <span className="text-[10px] text-zinc-400 block uppercase">Phase 2</span>
            <span>{destinationLocation ? destinationLocation : "Scan Target Location"}</span>
          </div>
        </div>
      </div>

      {/* Main scanning input form */}
      <div className="w-full bg-[#18191d] border border-zinc-800/90 rounded-xl p-6 space-y-5 shadow-sm">
        {scanStep === 1 ? (
          <form
            onSubmit={(eventForm) => {
              eventForm.preventDefault();
              handleLpnSubmit(lpnCode);
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Barcode className="w-4 h-4 text-zinc-400" strokeWidth={1.75} />
                <span>Phase 1: Source LPN Barcode</span>
              </label>
              <input
                type="text"
                value={lpnCode}
                onChange={(inputEvent) => setLpnCode(inputEvent.target.value)}
                placeholder="Scan LPN barcode or enter LPN identifier..."
                className="w-full px-4 py-3 bg-[#121316] border border-zinc-700/80 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 font-mono focus:outline-none focus:border-zinc-400 transition-colors"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-3 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs uppercase tracking-wider transition-all"
              >
                Confirm LPN Scan [ENTER]
              </button>
            </div>
          </form>
        ) : (
          <form
            onSubmit={(eventForm) => {
              eventForm.preventDefault();
              handleDestinationSubmit(destinationLocation);
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-zinc-400" strokeWidth={1.75} />
                <span>Phase 2: Destination Bay Location</span>
              </label>
              <input
                type="text"
                value={destinationLocation}
                onChange={(inputEvent) => setDestinationLocation(inputEvent.target.value)}
                placeholder="Scan location barcode (e.g. STAGING-A1, RACK-02)..."
                className="w-full px-4 py-3 bg-[#121316] border border-zinc-700/80 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 font-mono focus:outline-none focus:border-zinc-400 transition-colors"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-3 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs uppercase tracking-wider transition-all"
              >
                Confirm Location Transfer [ENTER]
              </button>
              <button
                type="button"
                onClick={resetFormState}
                className="px-4 py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-2"
                title="Reset scan sequence (ESC)"
              >
                <RotateCcw className="w-4 h-4" strokeWidth={1.75} />
                <span>Reset</span>
              </button>
            </div>
          </form>
        )}

        {/* Feedback Bar */}
        {feedbackMessage && (
          <div
            className={`p-3.5 rounded-lg text-xs font-medium border flex items-center justify-between ${
              isError
                ? "bg-rose-950/40 border-rose-800/80 text-rose-300"
                : "bg-zinc-900/60 border-zinc-800 text-zinc-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {isError ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" strokeWidth={1.75} />
              ) : (
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" strokeWidth={1.75} />
              )}
              <span>{feedbackMessage}</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase">[ESC] Reset</span>
          </div>
        )}
      </div>
    </div>
  );
}
