"use client";

import { useRef } from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import Autocomplete from "@mui/material/Autocomplete";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Icon } from "@/components/icons/Icon";

const filterTheme = createTheme({
  palette: {
    primary: { main: "#3f3422" },
  },
  typography: {
    fontFamily: "var(--font-manrope), ui-sans-serif, system-ui, sans-serif",
  },
  shape: { borderRadius: 12 },
  components: {
    MuiTextField: {
      defaultProps: { size: "small" },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#fff",
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--accent)",
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          "&.Mui-focused": { color: "var(--brand)" },
        },
      },
    },
  },
});

const fixed = { flexShrink: 0, flexGrow: 0 } as const;

const compactField = {
  "& .MuiInputBase-root": {
    height: 32,
    fontSize: "0.8125rem",
  },
  "& .MuiInputBase-input": {
    padding: "4px 10px",
  },
  "& .MuiInputLabel-root": {
    fontSize: "0.8125rem",
  },
  "& .MuiAutocomplete-inputRoot": {
    paddingTop: "0 !important",
    paddingBottom: "0 !important",
  },
} as const;

export function MaterialScope({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={filterTheme}>{children}</ThemeProvider>
    </AppRouterCacheProvider>
  );
}

export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <MaterialScope>
      <div className="flex flex-nowrap items-center gap-2 overflow-x-auto rounded-2xl border border-stone-200 bg-white p-2 shadow-sm shadow-stone-900/5 [scrollbar-width:thin]">
        {children}
      </div>
    </MaterialScope>
  );
}

export function FilterSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <TextField
      label="Search"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="shrink-0"
      sx={{ width: "14rem", ...fixed, ...compactField }}
    />
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  width = "8.25rem",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  width?: string;
}) {
  return (
    <TextField
      select
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="shrink-0"
      sx={{ width, ...fixed, ...compactField }}
    >
      {options.map((option) => (
        <MenuItem key={option.value || "all"} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}

export function FilterAutocomplete({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <Autocomplete
      freeSolo
      options={options}
      inputValue={value}
      onInputChange={(_, next, reason) => {
        if (reason === "reset") return;
        onChange(next);
      }}
      className="shrink-0"
      sx={{ width: "9.5rem", ...fixed, ...compactField }}
      slotProps={{
        listbox: { sx: { fontSize: "0.8125rem", maxHeight: 220 } },
      }}
      renderInput={(params) => <TextField {...params} label={label} placeholder={placeholder === label ? undefined : placeholder} />}
    />
  );
}

export function FilterDate({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const picker = useRef<HTMLInputElement>(null);

  return (
    <>
      <TextField
        label={label}
        value={value}
        placeholder="dd-mm-yyyy"
        onChange={(event) => onChange(event.target.value)}
        className="shrink-0"
        sx={{ width: "9.25rem", ...fixed, ...compactField }}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  sx={{ p: 0.25 }}
                  aria-label={`Choose ${label} date`}
                  onClick={() => {
                    const input = picker.current;
                    if (!input) return;
                    if (typeof input.showPicker === "function") input.showPicker();
                    else input.click();
                  }}
                >
                  <Icon name="calendar" className="h-3.5 w-3.5" />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
      <input
        ref={picker}
        type="date"
        tabIndex={-1}
        value={isoFromDmy(value)}
        onChange={(event) => onChange(dmyFromIso(event.target.value))}
        className="sr-only"
      />
    </>
  );
}

function isDmy(value: string) {
  if (!/^\d{2}-\d{2}-\d{4}$/.test(value)) return false;
  const [day, month, year] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

function isoFromDmy(value: string) {
  if (!isDmy(value)) return "";
  const [day, month, year] = value.split("-");
  return `${year}-${month}-${day}`;
}

function dmyFromIso(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return "";
  return `${match[3]}-${match[2]}-${match[1]}`;
}
