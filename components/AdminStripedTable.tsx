'use client'

// components/AdminStripedTable.tsx — shared admin table shell with toolbar,
// selection checkboxes, row actions, and pagination. Visual double-lines,
// no MUI Table: styled divs (matches Admin-Dashboard "NewStack, Tables" style).
import {
  Box,
  Button,
  Checkbox,
  IconButton,
  InputAdornment,
  OutlinedInput,
  Paper,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import {
  ChevronLeft,
  ChevronRight,
  Delete,
  DoneAll,
  Edit,
  Refresh,
  Warning,
} from '@mui/icons-material'
import type { SxProps, Theme } from '@mui/material/styles'

export interface Column<K extends string = string> {
  label: string
  key?: K
  width: string
  format?: (row: any, rowIndex: number) => React.ReactNode
  center?: boolean
}

export interface ToolbarAction<K extends string = string> {
  label: string
  icon?: React.ReactNode
  color?: 'primary' | 'error'
  disabled?: boolean
  onClick?: (selectedKeys: string[], rows: any[]) => void
  variant?: 'text' | 'contained'
  sx?: SxProps<Theme>
}

export interface RowAction<K extends string = string> {
  label: string
  icon?: React.ReactNode
  color?: 'primary' | 'error'
  tooltip?: string
  onClick?: (row: any) => void
}

interface Props<K extends string = string> {
  headers: string[]
  columns: Column<K>[]
  rows: any[]
  totalLabel?: string
  toolbarActions?: ToolbarAction<K>[]
  tableToolbarExtra?: React.ReactNode
  selectedKeys?: Set<string>
  onSelectionChange?: (keys: Set<string>) => void
  rowActions?: RowAction<K>[]
  keyField?: K | string
  emptyText?: string
  loading?: boolean
  maxHeight?: string
  interactive?: boolean
  sort?: { key: K | string; reverse: boolean; headerIndex?: number; label?: string }
  pagination?: { page: number; pageSize: number; total: number; onChange: (page: number) => void }
  headerSx?: SxProps<Theme>
}

export function stripedTableProps(theme: Theme) {
  return {
    header: {
      fontWeight: 700,
      color: theme.palette.text.secondary,
      textTransform: 'uppercase' as const,
      fontSize: '0.75rem',
      letterSpacing: '0.04em',
    },
    cell: {
      padding: '10px 12px',
      fontSize: '0.85rem',
      lineHeight: 1.4,
    },
  }
}

export function MobileTableHead(props: { headers: string[]; tableId: string }) {
  const theme = useTheme()
  const styles = stripedTableProps(theme)
  return (
    <Box
      component="div"
      sx={{
        ...styles.header,
        px: 2,
        py: 1.5,
        display: 'grid',
        gridTemplateColumns: props.headers.map((h) => 'minmax(auto, 1fr)').join(' '),
        gap: 0,
      }}
      role="table"
      aria-label={`${props.headers[0]} টেবিল`}
    >
      {props.headers.map((h, i) => (
        <Box key={i} component="span" role="row" sx={{ display: 'grid', gridColumn: 1 }}>
          <Box role="cell" sx={{ ...styles.header, padding: 0, textAlign: 'center', color: theme.palette.text.secondary, fontWeight: 700 }}>
            {h}
          </Box>
        </Box>
      ))}
    </Box>
  )
}

function AdminStripedTable<K extends string = string>({
  headers,
  columns,
  rows,
  toolbarActions,
  tableToolbarExtra,
  selectedKeys,
  onSelectionChange,
  rowActions,
  keyField = 'id',
  emptyText = 'কোনো ডেটা নেই।',
  loading,
  maxHeight = '420px',
  interactive,
  sort,
  pagination,
  headerSx,
}: Props<K>) {
  const theme = useTheme()
  const styles = stripedTableProps(theme)
  const tableId = `table-table-${keyField}`
  const visibleKeys = selectedKeys ?? new Set<string>()

  const getKey = (row: any) => String(row?.[keyField] ?? '')
  const sortedRows = sort && sort.key ? [...rows].sort((a, b) => (sort.reverse ? b[sort.key] - a[sort.key] : a[sort.key] - b[sort.key])) : rows

  const onRowToggle = (row: any, checked: boolean) => {
    const key = getKey(row)
    const next = new Set(visibleKeys)
    if (checked) next.add(key)
    else next.delete(key)
    onSelectionChange?.(next)
  }

  const onSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange?.(new Set(sortedRows.map(getKey)))
    } else {
      onSelectionChange?.(new Set())
    }
  }

  if (loading) {
    return (
      <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1, borderRadius: 2 }} aria-busy>
        <Refresh sx={{ color: 'text.secondary' }} />
        <Typography variant="body2" color="text.secondary">
          লোড হচ্ছে…
        </Typography>
      </Paper>
    )
  }

  const visibleToolbar = toolbarActions?.filter((a) => !a.disabled) ?? []

  const tableLabel = headers.filter((h) => !!h).join(', ')

  return (
    <Paper
      sx={{ p: 0, background: '#ffffff', borderRadius: 2, border: '1px solid #eae7e2', overflow: 'hidden' }}
      id={tableId}
      role="table"
      aria-label={tableLabel}
    >
      {/* Toolbar */}
          {visibleToolbar.length > 0 || tableToolbarExtra ? (
        <Box sx={{ px: 3, pt: 1.5, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {visibleToolbar.map((a) => (
            <Tooltip key={a.label} title={a.label}>
              <Button
                variant={a.variant ?? 'text'}
                color={a.color ?? 'primary'}
                disabled={a.disabled}
                size="small"
                startIcon={a.icon}
                onClick={() => a.onClick?.([...visibleKeys], sortedRows)}
                sx={a.sx}
                aria-label={a.label}
              >
                {a.label}
              </Button>
            </Tooltip>
          ))}
          {tableToolbarExtra}
        </Box>
      ) : null}

      {/* Header */}
      {headers.some((h) => !!h) ? (
        <Box
          component="div"
          sx={{
            px: 3,
            py: 1.5,
            display: 'grid',
            gridTemplateColumns: columns.map((c) => c.width).join(' '),
            gap: 0,
          }}
          role="row"
          data-row-index="0"
        >
          {onSelectionChange && (
            <span role="columnheader" aria-label="নির্বাচন">
              <Checkbox
                aria-label="সব নির্বাচন করুন"
                checked={visibleKeys.size > 0 && visibleKeys.size === sortedRows.length}
                indeterminate={visibleKeys.size > 0 && visibleKeys.size !== sortedRows.length}
                onChange={(_, checked) => onSelectAll(checked ?? false)}
              />
            </span>
          )}
          {columns.map((col, idx) =>
            col.key ? (
              <Box
                key={idx}
                component="span"
                sx={{
                  ...styles.header,
                  textAlign: col.center ? 'center' : undefined,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: col.center ? 'center' : 'flex-start',
                  fontWeight: 700,
                  color: theme.palette.text.secondary,
                }}
                role="columnheader"
                aria-label={headers[idx] || col.label}
              >
                {headers[idx] || col.label}
              </Box>
            ) : null,
          )}
          <span />
        </Box>
      ) : null}

      {/* Body */}
      <Box component="div" sx={{ maxHeight, overflow: 'auto' }}>
        {sortedRows.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, padding: 6 }}>
            <Warning sx={{ color: 'text.disabled', fontSize: 20 }} />
            <Typography variant="body2" color="text.secondary">
              {emptyText}
            </Typography>
          </Box>
        ) : (
          sortedRows.map((row: any, rowIdx) => {
            const key = getKey(row)
            const isSelected = visibleKeys.has(key)
            const lastRow = rowIdx === sortedRows.length - 1
            return (
              <Box
                key={key}
                component="div"
                sx={{
                  display: 'grid',
                  gridTemplateColumns: columns.map((c) => c.width).join(' '),
                  gap: 0,
                  borderBottom: lastRow ? '1px solid #eae7e2' : '1px solid #faf9f8',
                  borderTop: '1px solid #f1efec',
                  ...headerSx,
                }}
                role="row"
                aria-selected={interactive ? undefined : isSelected}
                data-row-index={rowIdx + 1}
              >
                {onSelectionChange && (
                  <span role="cell">
                    <Checkbox
                      size="small"
                      aria-label={`নির্বাচন: ${key}`}
                      checked={isSelected}
                      onChange={(_, checked) => onRowToggle(row, checked ?? false)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </span>
                )}
                {columns.map((col, colIdx) =>
                  col.key ? (
                    <Box key={colIdx} component="span" role="cell" aria-label={headers[colIdx] || col.label} sx={{ ...styles.cell, textAlign: col.center ? 'center' : undefined }}>
                      {col.format ? col.format(row, rowIdx) : String(row[col.key!] ?? '')}
                    </Box>
                  ) : null,
                )}
                <Box role="cell" aria-label="অপশন" sx={{ ...styles.cell, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                  {rowActions
                    ?.filter((a) => a.onClick)
                    .map((a) => (
                      <Tooltip key={a.label} title={a.tooltip ?? a.label}>
                        <IconButton
                          size="small"
                          aria-label={a.label}
                          color={a.color}
                          onClick={(e) => {
                            e.stopPropagation()
                            a.onClick?.(row)
                          }}
                        >
                          {a.icon ?? (a.label.includes('সংযুক্ষ') ? <DoneAll /> : <Edit />)}
                        </IconButton>
                      </Tooltip>
                    ))}
                </Box>
              </Box>
            )
          })
        )}
      </Box>

      {/* Pagination */}
      {pagination && pagination.total > pagination.pageSize ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, py: 2 }}>
          <IconButton
            disabled={pagination.page <= 1}
            onClick={() => pagination.onChange(Math.max(1, pagination.page - 1))}
            aria-label="আগের পেজ"
          >
            <ChevronLeft />
          </IconButton>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            পেজ {pagination.page} / {Math.ceil(pagination.total / pagination.pageSize)}
          </Typography>
          <IconButton
            disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
            onClick={() => pagination.onChange(Math.min(pagination.page + 1, Math.ceil(pagination.total / pagination.pageSize)))}
            aria-label="পরের পেজ"
          >
            <ChevronRight />
          </IconButton>
        </Box>
      ) : null}

    </Paper>
  )
}

export default AdminStripedTable
