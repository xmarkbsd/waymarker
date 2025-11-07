// src/pages/components/CustomFieldRenderer.tsx

import {
  TextField,
  Autocomplete,
  CircularProgress,
  Typography,
} from '@mui/material';
import { useSettings } from '../../hooks/useSettings';
// FIX: Use 'import type' for type definitions
import type { ICustomFieldValues } from '../../db';

interface CustomFieldRendererProps {
  values: ICustomFieldValues;
  onChange: (fieldId: string, value: any) => void;
}

export const CustomFieldRenderer = ({
  values,
  onChange,
}: CustomFieldRendererProps) => {
  const { customFields, loading } = useSettings();

  if (loading) {
    return <CircularProgress />;
  }

  if (customFields.length === 0) {
    return (
      <Typography variant="body2" color="textSecondary">
        No custom fields defined. Go to Settings to add some.
      </Typography>
    );
  }

  return (
    <>
      {customFields.map((field) => {
        switch (field.type) {
          case 'text':
          case 'photo_reference':
            return (
              <TextField
                key={field.id}
                fullWidth
                margin="normal"
                label={field.label}
                value={values[field.id] || ''}
                onChange={(e) => onChange(field.id, e.target.value)}
              />
            );
          case 'autocomplete':
            return (
              <Autocomplete
                key={field.id}
                fullWidth
                options={field.options || []}
                value={values[field.id] || null}
                onChange={(_event, newValue) => { // FIX: unused param
                  onChange(field.id, newValue);
                }}
                onInputChange={(_event, newInputValue) => { // FIX: unused param
                  // This allows free-text entry as well
                  onChange(field.id, newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={field.label}
                    margin="normal"
                  />
                )}
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
};