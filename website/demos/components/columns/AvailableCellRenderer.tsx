import type React from 'react';
import { SelectCellFormatter } from '../../../../src'; // Adjust the import path as necessary

// Assuming Row and onRowChange type definitions are available globally or imported from a types file
interface Row {
  id: number;
  title: string;
  client: string;
  linkedin: string;
  country: string;
  contact: string;
  progress: number;
  available: boolean;
}

interface AvailableCellRendererProps {
  row: Row;
  onRowChange: (row: Row) => void;
  tabIndex: number;
}

const AvailableCellRenderer: React.FC<AvailableCellRendererProps> = ({
  row,
  onRowChange,
  tabIndex
}) => {
  return (
    <SelectCellFormatter
      value={row.available}
      onChange={() => onRowChange({ ...row, available: !row.available })}
      tabIndex={tabIndex}
    />
  );
};

export default AvailableCellRenderer;
