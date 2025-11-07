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
// FIX: Use 'import type' for the type definition
import type { IObservation } from '../../db';

interface ObservationListItemProps {
  observation: IObservation;
  onDelete: (id: number) => void;
}

export const ObservationListItem = ({
  observation,
  onDelete,
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
      <ListItemButton>
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