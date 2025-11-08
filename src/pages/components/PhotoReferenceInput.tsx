// src/pages/components/PhotoReferenceInput.tsx

import { useRef } from 'react';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

/**
 * NEW: Define the shape of the metadata we will save
 */
export interface IPhotoReference {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

interface PhotoReferenceInputProps {
  label: string;
  // 1. VALUE is now an object or null
  value: IPhotoReference | null;
  onChange: (newValue: IPhotoReference | null) => void;
}

export const PhotoReferenceInput = ({
  label,
  value,
  onChange,
}: PhotoReferenceInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 2. CREATE the metadata object
      const metadata: IPhotoReference = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      };
      onChange(metadata);
    } else {
      onChange(null);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleIconClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />
      
      <TextField
        fullWidth
        margin="normal"
        label={label}
        // 3. DISPLAY the name from the object
        value={value?.name || ''}
        InputProps={{
          readOnly: true,
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="select photo"
                onClick={handleIconClick}
                edge="end"
              >
                <PhotoCameraIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
    </>
  );
};