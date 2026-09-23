import React, { useState } from "react";
import { ArrowLeft, Barcode, CheckCircle, AlertCircle } from "lucide-react";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { InboundItem } from "./inboundTypes";

interface CreateProps {
  onSuccess: (createdItem: InboundItem) => void;
  onCancel: () => void;
}

const QUANTITY_PRESETS = [1, 5, 10, 50];

// Inbound create form for scanning barcode and generating new LPN entity
export function InboundCreate({ onSuccess, onCancel }: CreateProps) {
  const [skuCode, setSkuCode] = useState<string>("");
  const [quantityNumber, setQuantityNumber] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string>("");
  const [isError, setIsError] = useState<boolean>(false);

  const executeReceive = async (targetSku: string, targetQty: number) => {
    if (!targetSku.trim()) {
      setIsError(true);
      setFeedbackMessage("SKU code or barcode scan required");
      return;
    }

    setIsSubmitting(true);
    setIsError(false);
    setFeedbackMessage("Dispatching inbound receive request...");

    try {
      const response = await fetch("/api/inbound/receive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skuCode: targetSku, quantityNumber: targetQty }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const responseData = (await response.json()) as InboundItem;
      onSuccess(responseData);
    } catch (catchError) {
      const errorMessage = catchError instanceof Error ? catchError.message : "Inbound receive failed";
      setIsError(true);
      setFeedbackMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  useBarcodeScanner({
    scanAction: (scannedValue) => {
      setSkuCode(scannedValue);
      executeReceive(scannedValue, quantityNumber);
    },
  });

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onCancel}
          className="p-2 rounded-lg bg-[#18191d] border border-zinc-800/90 text-zinc-400 hover:text-white transition-colors"
          title="Back to Index"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
            Inbound Receiving Form
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Scan hardware barcode or input SKU manually to generate licensed pallet unit
          </p>
        </div>
      </div>

      <form
        onSubmit={(eventForm) => {
          eventForm.preventDefault();
          executeReceive(skuCode, quantityNumber);
        }}
        className="w-full bg-[#18191d] border border-zinc-800/90 rounded-xl p-6 space-y-5 shadow-sm"
      >
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <Barcode className="w-4 h-4 text-zinc-400" />
            <span>SKU Barcode Input</span>
          </label>
          <input
            type="text"
            value={skuCode}
            onChange={(inputEvent) => setSkuCode(inputEvent.target.value)}
            placeholder="Scan barcode or type SKU code..."
            className="w-full px-4 py-3 bg-[#121316] border border-zinc-700/80 rounded-lg text-sm text-zinc-100 placeholder-zinc-500 font-mono focus:outline-none focus:border-zinc-400 transition-colors"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Quantity Multiplier
          </label>
          <div className="flex gap-2">
            {QUANTITY_PRESETS.map((presetNumber) => (
              <button
                key={presetNumber}
                type="button"
                onClick={() => setQuantityNumber(presetNumber)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border ${
                  quantityNumber === presetNumber
                    ? "bg-zinc-200 text-zinc-950 border-zinc-200 shadow-sm"
                    : "bg-[#121316] text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700"
                }`}
              >
                +{presetNumber}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
        >
          {isSubmitting ? "Generating LPN..." : "Confirm Inbound Receive [ENTER]"}
        </button>

        {feedbackMessage && (
          <div
            className={`p-3 rounded-lg text-xs font-medium border flex items-center gap-2 ${
              isError
                ? "bg-rose-950/40 border-rose-800/80 text-rose-300"
                : "bg-zinc-800 border-zinc-700 text-zinc-200"
            }`}
          >
            {isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
            <span>{feedbackMessage}</span>
          </div>
        )}
      </form>
    </div>
  );
}
