// src/pages/components/CustomFieldListItem.tsx

import {
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
} from '@mui/material';
import LabelIcon from '@mui/icons-material/Label';
import DeleteIcon from '@mui/icons-material/Delete';
import type { ISettingsCustomField } from '../../db';

interface CustomFieldListItemProps {
  field: ISettingsCustomField;
  onDelete: (field: ISettingsCustomField) => void;
}

export const CustomFieldListItem = ({
  field,
  onDelete,
}: CustomFieldListItemProps) => {
  return (
    <ListItem
      secondaryAction={
        <IconButton
          edge="end"
          aria-label="delete"
          onClick={() => onDelete(field)}
        >
          <DeleteIcon />
        </IconButton>
      }
    >
      <ListItemIcon>
        <LabelIcon />
      </ListItemIcon>
      <ListItemText primary={field.label} secondary={field.type} />
    </ListItem>
  );
};