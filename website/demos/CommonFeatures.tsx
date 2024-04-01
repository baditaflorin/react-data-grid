import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { faker } from '@faker-js/faker';
import { css } from '@linaria/core';

import DataGrid, {
  SelectCellFormatter,
  SelectColumn,
  textEditor,
  type Column,
  type SortColumn
} from '../../src';
import { textEditorClassname } from '../../src/editors/textEditor';
import type { Direction } from '../../src/types';
import type { Props } from './types';
import { exportToCsv, exportToPdf } from './exportUtils';

async function fetchData(clientName) {
  const response = await fetch(
    `${import.meta.env.VITE_REACT_APP_SEARCH_URL}${encodeURIComponent(`${clientName} linkedin.com`)}`,
    {
      mode: 'cors' // This is the default if not specified
    }
  );
  return response.json();
}

function extractLink(data) {
  // Assuming data is an array and we need to extract the link of the first result
  return data?.data?.[0]?.link || '';
}

function useSearchAndUpdate(rows, activeSearchRowId, setRows, setActiveSearchRowId) {
  useEffect(() => {
    const searchClient = async () => {
      if (activeSearchRowId !== null) {
        const row = rows.find((r) => r.id === activeSearchRowId);
        if (row) {
          const data = await fetchData(row.client);
          const link = extractLink(data);
          const updatedRow = { ...row, linkedin: link };
          setRows((currentRows) =>
            currentRows.map((r) => (r.id === activeSearchRowId ? updatedRow : r))
          );
        }
        setActiveSearchRowId(null); // Reset the active search ID
      }
    };

    searchClient();
  }, [activeSearchRowId, rows]);
}

// console.log(import.meta.env);

const toolbarClassname = css`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-block-end: 8px;
`;

const dialogContainerClassname = css`
  position: absolute;
  inset: 0;
  display: flex;
  place-items: center;
  background: rgba(0, 0, 0, 0.1);

  > dialog {
    width: 300px;
    > input {
      width: 100%;
    }

    > menu {
      text-align: end;
    }
  }
`;

const searchButtonStyle = css`
  opacity: 0;
  transition: opacity 0.3s ease;
  margin-left: 8px;
`;

const cellWithButtonStyle = css`
  &:hover .${searchButtonStyle} {
    opacity: 1;
  }
`;

interface SummaryRow {
  id: string;
  totalCount: number;
  yesCount: number;
}

interface Row {
  id: number;
  title: string;
  client: string;
  linkedin: string;
  country: string;
  contact: string;
  assignee: string;
  progress: number;
  available: boolean;
}

function LinkedInCopyButton({ row, initiateSearch, className = '' }) {
  // Directly include the searchButtonStyle and any additional classes passed via props
  const buttonClass = `${searchButtonStyle} ${className}`;

  return (
    <button onClick={() => initiateSearch(row.id)} className={buttonClass}>
      Search Client
    </button>
  );
}

function getColumns(
  countries: readonly string[],
  direction: Direction,
  initiateSearch
): readonly Column<Row, SummaryRow>[] {
  return [
    SelectColumn,
    {
      key: 'id',
      name: 'ID',
      frozen: true,
      resizable: true,
      renderSummaryCell() {
        return <strong>Total</strong>;
      }
    },
    {
      key: 'title',
      name: 'Task',
      frozen: true,
      renderEditCell: textEditor,
      renderSummaryCell({ row }) {
        return `${row.totalCount} records`;
      }
    },
    {
      key: 'client',
      name: 'Client',
      width: 'max-content',
      draggable: true,
      renderEditCell: textEditor,
      renderCell({ row, onRowChange }) {
        return (
          <div className={cellWithButtonStyle}>
            {row.client}
            <LinkedInCopyButton
              row={row}
              onRowChange={onRowChange}
              initiateSearch={initiateSearch}
              className={searchButtonStyle}
            />
          </div>
        );
      }
    },
    {
      key: 'linkedin',
      name: 'Linkedin',
      draggable: true,
      renderEditCell: textEditor
    },
    {
      key: 'country',
      name: 'Country',
      renderEditCell: (p) => (
        <select
          autoFocus
          className={textEditorClassname}
          value={p.row.country}
          onChange={(e) => p.onRowChange({ ...p.row, country: e.target.value }, true)}
        >
          {countries.map((country) => (
            <option key={country}>{country}</option>
          ))}
        </select>
      )
    },
    {
      key: 'contact',
      name: 'Contact',
      renderEditCell: textEditor
    },
    {
      key: 'assignee',
      name: 'Assignee',
      renderEditCell: textEditor
    },
    {
      key: 'progress',
      name: 'Completion',
      renderCell(props) {
        const value = props.row.progress;
        return (
          <>
            <progress max={100} value={value} style={{ inlineSize: 50 }} /> {Math.round(value)}%
          </>
        );
      },
      renderEditCell({ row, onRowChange, onClose }) {
        return createPortal(
          <div
            dir={direction}
            className={dialogContainerClassname}
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
      },
      editorOptions: {
        displayCellContent: true
      }
    },
    {
      key: 'version',
      name: 'Version',
      renderEditCell: textEditor
    },
    {
      key: 'available',
      name: 'Available',
      renderCell({ row, onRowChange, tabIndex }) {
        return (
          <SelectCellFormatter
            value={row.available}
            onChange={() => {
              onRowChange({ ...row, available: !row.available });
            }}
            tabIndex={tabIndex}
          />
        );
      },
      renderSummaryCell({ row: { yesCount, totalCount } }) {
        return `${Math.floor((100 * yesCount) / totalCount)}% ✔️`;
      }
    }
  ];
}

function rowKeyGetter(row: Row) {
  return row.id;
}

function createRows(): readonly Row[] {
  const now = Date.now();
  const rows: Row[] = [];

  for (let i = 0; i < 4; i++) {
    rows.push({
      id: i,
      title: `Task #${i + 1}`,
      client: faker.company.name(),
      linkedin: '',
      country: faker.location.country(),
      contact: faker.internet.exampleEmail(),
      assignee: faker.person.fullName(),
      progress: Math.random() * 100,
      available: Math.random() > 0.5
    });
  }

  return rows;
}

type Comparator = (a: Row, b: Row) => number;

function getComparator(sortColumn: string): Comparator {
  switch (sortColumn) {
    case 'assignee':
    case 'title':
    case 'client':
    case 'linkedin':
    case 'country':
    case 'contact':
      return (a, b) => {
        return a[sortColumn].localeCompare(b[sortColumn]);
      };
    case 'available':
      return (a, b) => {
        return a[sortColumn] === b[sortColumn] ? 0 : a[sortColumn] ? 1 : -1;
      };
    case 'id':
    case 'progress':
      return (a, b) => {
        return a[sortColumn] - b[sortColumn];
      };
    default:
      throw new Error(`unsupported sortColumn: "${sortColumn}"`);
  }
}

export default function CommonFeatures({ direction }: Props) {
  const [rows, setRows] = useState(createRows);
  const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([]);
  const [selectedRows, setSelectedRows] = useState((): ReadonlySet<number> => new Set());
  // New state to track the ID of the row being searched
  const [activeSearchRowId, setActiveSearchRowId] = useState(null);

  // Use the custom hook here
  useSearchAndUpdate(rows, activeSearchRowId, setRows, setActiveSearchRowId);

  const initiateSearch = (rowId) => {
    setActiveSearchRowId(rowId);
  };

  const countries = useMemo((): readonly string[] => {
    return [...new Set(rows.map((r) => r.country))].sort(new Intl.Collator().compare);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Modify your getColumns function similarly to include the LinkedInCopyButton with the new initiateSearch prop
  const columns = useMemo(
    () => getColumns(countries, direction, initiateSearch), // Ensure initiateSearch is passed here
    [countries, direction, initiateSearch] // Add initiateSearch as a dependency
  );

  const summaryRows = useMemo((): readonly SummaryRow[] => {
    return [
      {
        id: 'total_0',
        totalCount: rows.length,
        yesCount: rows.filter((r) => r.available).length
      }
    ];
  }, [rows]);

  const sortedRows = useMemo((): readonly Row[] => {
    if (sortColumns.length === 0) return rows;

    return [...rows].sort((a, b) => {
      for (const sort of sortColumns) {
        const comparator = getComparator(sort.columnKey);
        const compResult = comparator(a, b);
        if (compResult !== 0) {
          return sort.direction === 'ASC' ? compResult : -compResult;
        }
      }
      return 0;
    });
  }, [rows, sortColumns]);

  const gridElement = (
    <DataGrid
      rowKeyGetter={rowKeyGetter}
      columns={columns}
      rows={sortedRows}
      defaultColumnOptions={{
        sortable: true,
        resizable: true,
        draggable: true
      }}
      selectedRows={selectedRows}
      onSelectedRowsChange={setSelectedRows}
      onRowsChange={setRows}
      sortColumns={sortColumns}
      onSortColumnsChange={setSortColumns}
      topSummaryRows={summaryRows}
      bottomSummaryRows={summaryRows}
      className="fill-grid"
      direction={direction}
    />
  );

  return (
    <>
      <div className={toolbarClassname}>
        <ExportButton onExport={() => exportToCsv(gridElement, 'CommonFeatures.csv')}>
          Export to CSV
        </ExportButton>
        <ExportButton onExport={() => exportToPdf(gridElement, 'CommonFeatures.pdf')}>
          Export to PDF
        </ExportButton>
      </div>
      {gridElement}
    </>
  );
}

function ExportButton({
  onExport,
  children
}: {
  onExport: () => Promise<unknown>;
  children: React.ReactChild;
}) {
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
