import React from 'react';
import { textEditorClassname } from '../../../../src/editors/textEditor'; // Adjust the import path as necessary

// Assuming the Row type is defined in a types file
import type { Row } from '../../types';

interface EditCountryCellProps {
  row: Row;
  onRowChange: (row: Row, triggerDefault?: boolean) => void;
  countries: readonly string[];
}

const EditCountryCell: React.FC<EditCountryCellProps> = ({ row, onRowChange, countries }) => {
  return (
    <select
      autoFocus
      className={textEditorClassname}
      value={row.country}
      onChange={(e) => onRowChange({ ...row, country: e.target.value }, true)}
    >
      {countries.map((country) => (
        <option key={country} value={country}>
          {country}
        </option>
      ))}
    </select>
  );
};

export default EditCountryCell;
