// src/pages/components/ObservationListItem.tsx

import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
} from '@mui/material';
import PlaceIcon from '@mui/icons-material/Place';
import DeleteIcon from '@mui/icons-material/Delete';
import type { IObservation } from '../../db';

interface ObservationListItemProps {
  observation: IObservation;
  onDelete: (id: number) => void;
  onEdit: () => void; // 1. ADD onEdit prop
}

export const ObservationListItem = ({
  observation,
  onDelete,
  onEdit, // 2. ACCEPT prop
}: ObservationListItemProps) => {
  const { id, coreFields, createdAt } = observation;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop click from bubbling to the ListItemButton
    if (id) {
      onDelete(id);
    }
  };

  return (
    <ListItem
      disablePadding
      secondaryAction={
        <IconButton
          edge="end"
          aria-label="delete"
          onClick={handleDeleteClick}
        >
          <DeleteIcon />
        </IconButton>
      }
    >
      {/* 3. MAKE button clickable */}
      <ListItemButton onClick={onEdit}>
        <ListItemIcon>
          <PlaceIcon />
        </ListItemIcon>
        <ListItemText
          primary={coreFields.name}
          secondary={createdAt.toLocaleString()}
        />
      </ListItemButton>
    </ListItem>
  );
};