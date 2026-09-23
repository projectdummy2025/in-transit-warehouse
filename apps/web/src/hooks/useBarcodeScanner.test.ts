import { test, expect, mock } from "bun:test";

// Pure barcode scanner keystroke processor for test execution
export function processKeystrokes(
  keystrokeList: { key: string; time: number }[],
  scanAction: (scannedValue: string) => void
) {
  const MAXIMUM_INTERVAL = 50;
  const MINIMUM_LENGTH = 3;

  let scanBuffer = "";
  let lastTimestamp = 0;

  for (const item of keystrokeList) {
    const timeDifference = item.time - lastTimestamp;
    lastTimestamp = item.time;

    if (item.key === "Enter") {
      const trimmedValue = scanBuffer.trim();
      scanBuffer = "";
      if (trimmedValue.length >= MINIMUM_LENGTH) {
        scanAction(trimmedValue);
      }
      continue;
    }

    if (item.key.length > 1) {
      continue;
    }

    if (timeDifference > MAXIMUM_INTERVAL && scanBuffer.length > 0) {
      scanBuffer = "";
    }

    scanBuffer += item.key;
  }
}

test("detects rapid keystrokes as valid barcode scan", () => {
  const scanAction = mock();

  // Rapid hardware barcode keystrokes (< 50ms interval)
  const keystrokeList = [
    { key: "L", time: 100 },
    { key: "P", time: 110 },
    { key: "N", time: 120 },
    { key: "-", time: 130 },
    { key: "0", time: 140 },
    { key: "1", time: 150 },
    { key: "Enter", time: 160 },
  ];

  processKeystrokes(keystrokeList, scanAction);

  expect(scanAction).toHaveBeenCalledWith("LPN-01");
});

test("ignores slow manual keystrokes exceeding maximum interval", () => {
  const scanAction = mock();

  // Slow manual typing (> 50ms interval)
  const keystrokeList = [
    { key: "L", time: 100 },
    { key: "P", time: 200 },
    { key: "N", time: 300 },
    { key: "Enter", time: 400 },
  ];

  processKeystrokes(keystrokeList, scanAction);

  expect(scanAction).not.toHaveBeenCalled();
});

test("ignores scanned barcode payload shorter than minimum length", () => {
  const scanAction = mock();

  // Rapid keystrokes resulting in short payload (< 3 chars)
  const keystrokeList = [
    { key: "A", time: 100 },
    { key: "1", time: 110 },
    { key: "Enter", time: 120 },
  ];

  processKeystrokes(keystrokeList, scanAction);

  expect(scanAction).not.toHaveBeenCalled();
});
