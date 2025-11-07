// src/pages/components/LoadingModal.tsx

import {
  Modal,
  Box,
  Typography,
  CircularProgress,
  Backdrop,
} from '@mui/material';

// Define the style for the modal box
const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 300,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  alignItems: 'center',
  borderRadius: 1,
};

interface LoadingModalProps {
  open: boolean;
  message: string;
}

export const LoadingModal = ({ open, message }: LoadingModalProps) => {
  return (
    <Modal
      open={open}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
      }}
    >
      <Box sx={style}>
        <CircularProgress sx={{ mr: 2 }} />
        <Typography variant="body1">{message}</Typography>
      </Box>
    </Modal>
  );
};