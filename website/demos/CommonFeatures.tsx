import { useEffect, useMemo, useState } from 'react';
import { faker } from '@faker-js/faker';

import DataGrid, {
  SelectCellFormatter,
  SelectColumn,
  textEditor,
  type Column,
  type SortColumn
} from '../../src';
import type { Direction } from '../../src/types';
import EditCountryCell from './components/columns/EditCountryCell'; // Adjust the import path according to your project structure
import { EditProgressCell } from './components/columns/EditProgressCell'; // Adjust the import path according to your project structure

import { ExportButton } from './components/ExportButton'; // Adjust the path as necessary

import { useSortedRows } from './utils/sortRows'; // Adjust the import path as necessary
import type { Props } from './types';
import { exportToCsv, exportToPdf } from './exportUtils';
import {
  cellWithButtonStyleString,
  searchButtonStyleString,
  toolbarStyleString
} from './styles.js';

async function fetchData(clientName) {
  const response = await fetch(
    `${import.meta.env.VITE_REACT_APP_SEARCH_URL}${encodeURIComponent(
      `${clientName} linkedin.com`
    )}`,
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
  progress: number;
  available: boolean;
}

function LinkedInCopyButton({ row, onRowChange, initiateSearch, className = '' }) {
  // Directly include the searchButtonStyle and any additional classes passed via props
  const buttonClass = `${searchButtonStyleString} ${className}`;

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
          <div className={cellWithButtonStyleString}>
            {row.client}
            <LinkedInCopyButton
              row={row}
              onRowChange={onRowChange}
              initiateSearch={initiateSearch}
              className={searchButtonStyleString}
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
      renderEditCell: (props) => (
        <EditCountryCell
          {...props}
          countries={countries} // Assuming countries is available in the scope
        />
      )
    },
    {
      key: 'contact',
      name: 'Contact',
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
      renderEditCell: (props) => <EditProgressCell {...props} direction={direction} />,
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
      client: faker.person.fullName(),
      linkedin: '',
      country: faker.location.country(),
      contact: faker.internet.exampleEmail(),
      progress: Math.random() * 100,
      available: Math.random() > 0.5
    });
  }

  return rows;
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

  const sortedRows = useSortedRows(rows, sortColumns); // Use the imported function

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
      <div className={toolbarStyleString}>
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
