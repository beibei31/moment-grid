import { useRef, useState } from 'react';
import AddPhotoAlternateRoundedIcon from '@mui/icons-material/AddPhotoAlternateRounded';
import ContentPasteRoundedIcon from '@mui/icons-material/ContentPasteRounded';
import PhotoCameraRoundedIcon from '@mui/icons-material/PhotoCameraRounded';
import PhotoLibraryRoundedIcon from '@mui/icons-material/PhotoLibraryRounded';
import { Box, Button, Divider, Stack, Typography } from '@mui/material';

interface PhotoDropzoneProps {
  onFiles: (files: File[]) => void;
  busy?: boolean;
}

export function PhotoDropzone({ onFiles, busy = false }: PhotoDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <Box
      role="region"
      aria-label="照片上传区"
      aria-busy={busy}
      className={`photo-dropzone${dragging ? ' is-dragging' : ''}`}
      onDragOver={(event) => {
        event.preventDefault();
        if (busy) return;
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (busy) return;
        onFiles(Array.from(event.dataTransfer.files));
      }}
    >
      <Box className="dropzone-icon" aria-hidden="true">
        <AddPhotoAlternateRoundedIcon fontSize="large" />
      </Box>
      <Typography component="h2" variant="h6" fontWeight={700}>
        点击或拖拽上传照片
      </Typography>
      <Typography color="text.secondary" variant="body2">
        单次支持 1～50 张照片 · JPG、PNG、WebP
      </Typography>
      <input
        ref={inputRef}
        aria-label="选择照片"
        accept="image/jpeg,image/png,image/webp"
        multiple
        disabled={busy}
        hidden
        type="file"
        onChange={(event) => {
          if (busy) {
            event.target.value = '';
            return;
          }
          onFiles(Array.from(event.target.files ?? []));
          event.target.value = '';
        }}
      />
      <Button
        variant="contained"
        size="large"
        startIcon={<PhotoLibraryRoundedIcon />}
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? '正在读取…' : '选择照片'}
      </Button>
      <Stack className="upload-shortcuts" direction="row" divider={<Divider orientation="vertical" flexItem />}>
        <Button color="inherit" size="small" startIcon={<ContentPasteRoundedIcon />} disabled>
          粘贴
        </Button>
        <Button color="inherit" size="small" startIcon={<PhotoCameraRoundedIcon />} disabled>
          拍照
        </Button>
        <Button
          color="inherit"
          size="small"
          startIcon={<PhotoLibraryRoundedIcon />}
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          批量导入
        </Button>
      </Stack>
    </Box>
  );
}
