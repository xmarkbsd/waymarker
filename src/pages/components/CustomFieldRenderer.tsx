// src/pages/components/CustomFieldRenderer.tsx

import {
  TextField,
  Autocomplete,
  CircularProgress,
  Typography,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useProjectCustomFields } from '../../hooks/useProjectCustomFields';
import type { ICustomFieldValues } from '../../db';
// 1. IMPORT the new component
import { PhotoReferenceInput } from './PhotoReferenceInput';
import type { IPhotoReference } from './PhotoReferenceInput'; // 1. IMPORT the type

interface CustomFieldRendererProps {
  values: ICustomFieldValues;
  onChange: (fieldId: string, value: any) => void;
}

export const CustomFieldRenderer = ({
  values,
  onChange,
}: CustomFieldRendererProps) => {
  const { customFields, loading } = useProjectCustomFields();

  if (loading) {
    return <CircularProgress />;
  }

  if (customFields.length === 0) {
    return (
      <Typography variant="body2" color="textSecondary">
        No custom fields defined for this project.
      </Typography>
    );
  }

  return (
    <>
      {customFields.map((field) => {
        const value = values[field.id];

        switch (field.type) {
          case 'text':
            return (
              <TextField
                key={field.id}
                fullWidth
                margin="normal"
                label={field.label}
                value={value || ''}
                onChange={(e) => onChange(field.id, e.target.value)}
              />
            );

          case 'photo_reference':
            return (
              <PhotoReferenceInput
                key={field.id}
                label={field.label}
                // 2. PASS the value (which is an object)
                value={value as IPhotoReference | null}
                onChange={(newValue) => onChange(field.id, newValue)}
              />
            );

          case 'number':
            return (
              <TextField
                key={field.id}
                fullWidth
                margin="normal"
                label={field.label}
                type="number"
                value={value || ''}
                onChange={(e) =>
                  onChange(field.id, parseFloat(e.target.value) || null)
                }
              />
            );
          case 'date':
            return (
              <DatePicker
                key={field.id}
                label={field.label}
                value={value ? new Date(value) : null}
                onChange={(newValue) => {
                  onChange(field.id, newValue ? newValue.toISOString() : null);
                }}
                slots={{ textField: TextField }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: 'normal',
                  },
                }}
              />
            );
          case 'boolean':
            return (
              <FormControlLabel
                key={field.id}
                control={
                  <Checkbox
                    checked={!!value}
                    onChange={(e) => onChange(field.id, e.target.checked)}
                  />
                }
                label={field.label}
                sx={{ display: 'block', mt: 1 }}
              />
            );
          case 'autocomplete':
            return (
              <Autocomplete
                key={field.id}
                fullWidth
                options={field.options || []}
                value={value || null}
                onChange={(_event, newValue) => {
                  onChange(field.id, newValue);
                }}
                onInputChange={(_event, newInputValue) => {
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