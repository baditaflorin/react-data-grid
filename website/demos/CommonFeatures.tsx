import { useEffect, useMemo, useState } from 'react';
import { faker } from '@faker-js/faker';

import DataGrid, { SelectColumn, textEditor, type Column, type SortColumn } from '../../src';
import type { Direction } from '../../src/types';
import AvailableCellRenderer from './components/columns/AvailableCellRenderer';
import EditCountryCell from './components/columns/EditCountryCell';
import { EditProgressCell } from './components/columns/EditProgressCell';
import {
  fetchCoordinates,
  fetchLatLonForAll,
  LatLonButton
} from './components/columns/LatLonButton';
import LinkedInInfoButton, {
  fetchLinkedInInfoForAll
} from './components/columns/LinkedInInfoButton';
import { ExportButton } from './components/ExportButton';
import { useSortedRows } from './utils/sortRows';
import type { Props } from './types';
import { exportToCsv, exportToPdf } from './exportUtils';
import {
  cellWithButtonStyleString,
  searchButtonStyleString,
  toolbarStyleString
} from './styles.js';

const MAX_CONCURRENT_REQUESTS = 2; // You can tweak this value based on your needs or API limits

async function semaphoreControlledFetch(rows, fetchFunction, updateRow) {
  let activeRequests = 0;
  let currentIndex = 0;

  return new Promise((resolve, reject) => {
    const executeNext = async () => {
      if (currentIndex >= rows.length) {
        if (activeRequests === 0) resolve(); // Resolve when all requests are done
        return;
      }

      const row = rows[currentIndex++];
      if (row) {
        activeRequests++;
        try {
          const result = await fetchFunction(row);
          updateRow(row.id, result);
        } catch (error) {
          console.error(`Failed to fetch for row ${row.id}:`, error);
        } finally {
          activeRequests--;
          executeNext(); // Proceed to next item regardless of success or failure
        }
      }
      if (activeRequests < MAX_CONCURRENT_REQUESTS) {
        executeNext(); // Start another request if we have not reached the limit
      }
    };

    // Start the initial set of concurrent requests
    for (let i = 0; i < Math.min(MAX_CONCURRENT_REQUESTS, rows.length); i++) {
      executeNext();
    }
  });
}

async function fetchLinkedInDataFunction(row) {
  try {
    const data = await fetchData(row.client);
    const link = extractLink(data);
    if (link) {
      return { linkedin: link };
    }
  } catch (error) {
    console.error(`Failed to search for client ${row.client}:`, error);
  }
  return null; // Return null if no data was fetched or an error occurred
}

function fetchCoordinatesFunction(row) {
  return fetchCoordinates(row.country).then((latLon) => ({
    latLon: `${latLon.latitude}, ${latLon.longitude}`
  }));
}

function GlobalActionsToolbar({ rows, updateRow }) {
  const handleFetchAllLatLon = async () => {
    await semaphoreControlledFetch(rows, fetchCoordinatesFunction, updateRow);
  };
  const handleSearchAllEntities = async () => {
    await semaphoreControlledFetch(rows, fetchLinkedInDataFunction, updateRow);
  };

  const handleFetchAllLinkedInInfo = async () => {
    await fetchLinkedInInfoForAll(rows, updateRow);
  };

  return (
    <div style={{ marginBottom: '10px' }}>
      <button onClick={handleFetchAllLatLon}>Fetch All Coordinates</button>
      <button onClick={handleSearchAllEntities}>Search All Entities</button>
      <button onClick={handleFetchAllLinkedInInfo}>Fetch All LinkedIn Info</button>
    </div>
  );
}

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

type SummaryRow = {
  id: string;
  totalCount: number;
  yesCount: number;
};

type Row = {
  id: number;
  title: string;
  client: string;
  linkedin: string;
  country: string;
  contact: string;
  progress: number;
  available: boolean;
  linkedinImageUrl?: string;
  linkedinHeadline?: string;
  companyOrSchoolLink?: string;
  companyOrSchool?: string;
  latLon?: string;
};

async function fetchLinkedInForAll(rows, updateRow) {
  const promises = rows.map(async (row) => {
    try {
      const data = await fetchData(row.client);
      const link = extractLink(data);
      if (link) {
        updateRow(row.id, { linkedin: link });
      }
    } catch (error) {
      console.error(`Failed to search for client ${row.client}:`, error);
    }
  });

  // Optionally, wait for all fetches to complete
  await Promise.all(promises);
}

function LinkedInCopyButton({ row, onRowChange, initiateSearch, className = '' }) {
  // Directly include the searchButtonStyle and any additional classes passed via props
  const buttonClass = `${searchButtonStyleString} ${className}`;

  return (
    <button onClick={() => initiateSearch(row.id)} className={buttonClass}>
      Search Entity
    </button>
  );
}

function getColumns(
  countries: readonly string[],
  direction: Direction,
  initiateSearch,
  updateRow: (rowId: number, partialRowUpdate: Partial<Row>) => void
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
      name: 'LinkedIn',
      renderCell: ({ row }) => (
        <div className={cellWithButtonStyleString}>
          {row.linkedin && (
            <>
              {/* <a href={row.linkedin} target="_blank" rel="noopener noreferrer">
                          {row.linkedin}
              </a> */}
              {/* Display LinkedInInfoButton only if there's a LinkedIn URL */}
              <LinkedInInfoButton
                linkedinUrl={row.linkedin}
                onLinkedInDataFetched={(linkedinData) => {
                  // Function to handle the detailed LinkedIn data
                  // Here, you would update the row with the detailed information
                  updateRow(row.id, {
                    // Update the row with the detailed LinkedIn data
                    linkedinImageUrl: linkedinData.imageUrl,
                    linkedinHeadline: linkedinData.headline,
                    companyOrSchool: linkedinData.companyOrSchool,
                    companyOrSchoolLink: linkedinData.companyOrSchoolLink
                  });
                }}
              />
            </>
          )}
        </div>
      )
    },
    {
      key: 'linkedinImageUrl',
      name: 'Image URL',
      renderCell: ({ row }) => (
        <img src={row.linkedinImageUrl} alt="" style={{ width: 50, height: 50 }} />
      )
    },
    {
      key: 'linkedinHeadline',
      name: 'Headline',
      renderCell: ({ row }) => row.linkedinHeadline
    },
    {
      key: 'companyOrSchool',
      name: 'Company/School',
      renderCell: ({ row }) => row.companyOrSchool
    },
    {
      key: 'companyOrSchoolLink',
      name: 'Company/School Link',
      renderCell: ({ row }) => (
        <a href={row.companyOrSchoolLink} target="_blank" rel="noreferrer">
          Link
        </a>
      )
    },
    // {
    //   key: 'country',
    //   name: 'Country',
    //   renderEditCell: (props) => (
    //     <EditCountryCell
    //       {...props}
    //       countries={countries} // Assuming countries is available in the scope
    //     />
    //   )
    // },
    {
      key: 'country',
      name: 'Country',
      headerRenderer: ({ allRows, updateRow }) => (
        <div>
          Country
          <button onClick={() => fetchLatLonForAll(allRows, updateRow)}>Fetch All Coords</button>
        </div>
      ),
      renderCell: ({ row, onRowChange }) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {row.country}
          <LatLonButton
            country={row.country}
            onUpdate={(latLon) => onRowChange({ ...row, latLon })}
          />
        </div>
      ),
      renderEditCell: (props) => <EditCountryCell {...props} countries={countries} />
    },
    {
      key: 'latLon',
      name: 'Coordinates',
      renderCell: ({ row }) => <div>{row.latLon || 'Not available'}</div>
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
      renderCell: (props) => (
        <AvailableCellRenderer
          row={props.row}
          onRowChange={props.onRowChange}
          tabIndex={props.tabIndex}
        />
      ),
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

  for (let i = 0; i < 40; i++) {
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

  // Define updateRow here to ensure it has access to setRows
  const updateRow = (rowId: number, partialRowUpdate: Partial<Row>) => {
    setRows((currentRows) =>
      currentRows.map((row) => (row.id === rowId ? { ...row, ...partialRowUpdate } : row))
    );
  };

  const initiateSearch = (rowId) => {
    setActiveSearchRowId(rowId);
  };

  const countries = useMemo((): readonly string[] => {
    return [...new Set(rows.map((r) => r.country))].sort(new Intl.Collator().compare);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Modify your getColumns function similarly to include the LinkedInCopyButton with the new initiateSearch prop
  const columns = useMemo(
    () => getColumns(countries, direction, initiateSearch, updateRow),
    [countries, direction, initiateSearch, updateRow]
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
        <GlobalActionsToolbar rows={rows} updateRow={updateRow} />
      </div>
      {gridElement}
    </>
  );
}
