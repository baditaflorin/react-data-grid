import type React from 'react';
import { createPortal } from 'react-dom';

// The types for Row and onRowChange might need to be imported or defined here if they're not globally available
import type { Row } from '../../types';
// Assuming dialogContainerStyleString is moved to a common styles file or defined here if it's only used for this component
import { dialogContainerStyleString } from '../../styles';

interface EditProgressCellProps {
  row: Row;
  onRowChange: (row: Row) => void;
  onClose: () => void;
  direction: 'rtl' | 'ltr'; // Assuming direction is either 'rtl' or 'ltr'
}

export const EditProgressCell: React.FC<EditProgressCellProps> = ({
  row,
  onRowChange,
  onClose,
  direction
}) => {
  return createPortal(
    <div
      dir={direction}
      className={dialogContainerStyleString}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          onClose();
        }
      }}
    >
      <dialog open>
        <input
          autoFocus
          type="range"
          min="0"
          max="100"
          value={row.progress}
          onChange={(e) => onRowChange({ ...row, progress: e.target.valueAsNumber })}
        />
        <menu>
          <button type="button" onClick={() => onClose()}>
            Cancel
          </button>
          <button type="button" onClick={() => onClose(true)}>
            Save
          </button>
        </menu>
      </dialog>
    </div>,
    document.body
  );
};
