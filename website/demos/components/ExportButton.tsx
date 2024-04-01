import { useState } from 'react';

type ExportButtonProps = {
  onExport: () => Promise<unknown>;
  children: React.ReactChild;
};

export function ExportButton({ onExport, children }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  return (
    <button
      type="button"
      disabled={exporting}
      onClick={async () => {
        setExporting(true);
        await onExport();
        setExporting(false);
      }}
    >
      {exporting ? 'Exporting' : children}
    </button>
  );
}
