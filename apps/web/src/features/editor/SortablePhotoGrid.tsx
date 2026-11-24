import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box, IconButton } from '@mui/material';

import type { PhotoAsset } from '../../store/workflowStore';
import type { LayoutCount } from './gridLayout';

interface SortablePhotoGridProps {
  photos: PhotoAsset[];
  layoutCount: LayoutCount;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onMove: (activeId: string, overId: string) => void;
}

interface TileProps {
  photo: PhotoAsset;
  index: number;
  total: number;
  selected: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function SortableTile({ photo, index, total, selected, onSelect, onMoveUp, onMoveDown }: TileProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id });

  return (
    <Box
      ref={setNodeRef}
      className={`sortable-photo${selected ? ' is-selected' : ''}${isDragging ? ' is-dragging' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button
        type="button"
        className="sortable-photo-select"
        {...attributes}
        {...listeners}
        aria-label={`选择 ${photo.name}，位置 ${index + 1}`}
        aria-pressed={selected}
        onClick={onSelect}
      >
        <img src={photo.previewUrl} alt={photo.name} />
        <span className="sortable-position">{index + 1}</span>
        <DragIndicatorRoundedIcon className="sortable-drag-icon" fontSize="small" />
      </button>
      <Box className="sortable-actions">
        <IconButton size="small" aria-label={`将 ${photo.name} 上移`} disabled={index === 0} onClick={onMoveUp}>
          <ArrowUpwardRoundedIcon fontSize="inherit" />
        </IconButton>
        <IconButton size="small" aria-label={`将 ${photo.name} 下移`} disabled={index === total - 1} onClick={onMoveDown}>
          <ArrowDownwardRoundedIcon fontSize="inherit" />
        </IconButton>
      </Box>
    </Box>
  );
}

export function SortablePhotoGrid({ photos, layoutCount, selectedIndex, onSelect, onMove }: SortablePhotoGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const columns = layoutCount === 1 ? 1 : layoutCount === 4 ? 2 : 3;

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id) onMove(String(active.id), String(over.id));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={photos.map(({ id }) => id)} strategy={rectSortingStrategy}>
        <Box
          className="sortable-grid"
          sx={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          aria-label="编辑网格"
        >
          {photos.map((photo, index) => (
            <SortableTile
              key={photo.id}
              photo={photo}
              index={index}
              total={photos.length}
              selected={selectedIndex === index}
              onSelect={() => onSelect(index)}
              onMoveUp={() => index > 0 && onMove(photo.id, photos[index - 1].id)}
              onMoveDown={() => index < photos.length - 1 && onMove(photo.id, photos[index + 1].id)}
            />
          ))}
        </Box>
      </SortableContext>
    </DndContext>
  );
}
