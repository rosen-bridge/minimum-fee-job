import { Select } from '@mui/material';

type SelectFieldProps = {
  options: string[];
  value?: string;
  label: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export const SelectField = ({
  options,
  value = options.at(-1) ?? '',
  label,
  onChange,
  disabled,
}: SelectFieldProps) => (
  <Select
    native
    disabled={disabled}
    value={value}
    onChange={(event) => onChange(event.target.value)}
    inputProps={{ 'aria-label': label }}
  >
    {options.map((option) => (
      <option key={option} value={option}>
        {option}
      </option>
    ))}
  </Select>
);
