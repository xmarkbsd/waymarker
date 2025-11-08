// src/pages/components/ZipExportDialog.tsx

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import { db } from '../../db';
import type { IProject } from '../../db';
// FIX: Import IPhotoReference from its correct file
import type { IPhotoReference } from './PhotoReferenceInput';
import { generateKML } from '../../services/kmlGenerator';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface ZipExportDialogProps {
  open: boolean;
  onClose: () => void;
  project: IProject | null;
}

type FileMap = Map<string, File | null>;

export const ZipExportDialog = ({ open, project, onClose }: ZipExportDialogProps) => {
  const [kmlData, setKmlData] = useState<string | null>(null);
  const [fileMap, setFileMap] = useState<FileMap>(new Map());
  const [isZipping, setIsZipping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Generate KML and find required photos when dialog opens
  useEffect(() => {
    if (open && project) {
      // Reset state
      setKmlData(null);
      setFileMap(new Map());
      setIsZipping(false);

      const generate = async () => {
        // 1a. Generate KML
        const kml = await generateKML(project.id!);
        setKmlData(kml);

        // 1b. Find all photo references in this project
        const observations = await db.observations
          .where('projectId')
          .equals(project.id!)
          .toArray();
        
        const requiredFiles = new Map<string, null>();
        for (const obs of observations) {
          // Find all photo_reference fields for this project
          const photoFields = project.customFields.filter(
            (f) => f.type === 'photo_reference'
          );
          
          for (const field of photoFields) {
            const photoInfo = obs.customFieldValues[field.id] as IPhotoReference | null;
            if (photoInfo && photoInfo.name) {
              requiredFiles.set(photoInfo.name, null);
            }
          }
        }
        setFileMap(requiredFiles);
      };

      generate();
    }
  }, [open, project]);

  // 2. Handle user selecting photos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newMap = new Map(fileMap);
    let filesFound = 0;

    for (const file of files) {
      if (newMap.has(file.name)) {
        newMap.set(file.name, file);
        filesFound++;
      }
    }
    setFileMap(newMap);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 3. Generate the ZIP
  const handleExportZip = async () => {
    if (!project || !kmlData) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      
      zip.file(`${project.name}.kml`, kmlData);

      const photosFolder = zip.folder('photos');
      for (const [name, file] of fileMap.entries()) {
        if (file) {
          photosFolder?.file(name, file);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const timestamp = new Date().toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
      saveAs(zipBlob, `waymarker_${project.name}_${timestamp}.zip`);
      
      onClose();
    } catch (error) {
      console.error('Failed to create zip:', error);
    } finally {
      setIsZipping(false);
    }
  };

  const missingFiles = Array.from(fileMap.entries()).filter(([, file]) => file === null);
  const allFilesFound = missingFiles.length === 0;

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        style={{ display: 'none' }}
      />
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>Create Zip Export: {project?.name}</DialogTitle>
        <DialogContent>
          {!kmlData || !fileMap ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CircularProgress sx={{ mr: 2 }} />
              <Typography>Generating KML...</Typography>
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" gutterBottom>
                Photo Files
              </Typography>
              {fileMap.size === 0 ? (
                <Typography>No photo references found in this project.</Typography>
              ) : (
                <>
                  <Typography>
                    This project references {fileMap.size} photo(s). Please select the
                    missing files from your device.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => fileInputRef.current?.click()}
                    sx={{ my: 2 }}
                  >
                    Select Photos
                  </Button>
                  <List dense>
                    {Array.from(fileMap.entries()).map(([name, file]) => (
                      <ListItem key={name}>
                        <ListItemIcon>
                          {file ? (
                            <CheckCircleIcon color="success" />
                          ) : (
                            <ReportProblemIcon color="warning" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={name}
                          secondary={file ? `Found (${(file.size / 1024 / 1024).toFixed(2)} MB)` : 'Missing'}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleExportZip}
            variant="contained"
            disabled={!kmlData || isZipping || (fileMap.size > 0 && !allFilesFound)}
          >
            {isZipping ? <CircularProgress size={24} /> : 
             (allFilesFound || fileMap.size === 0 ? 'Export Zip' : 'Export KML Only')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};