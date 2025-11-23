import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';

export function SortablePlayer({ id, name, onRemove }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        touchAction: 'none', // Important for mobile
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="player-card"
        >
            <div {...attributes} {...listeners} className="drag-handle">
                <GripVertical size={16} color="#64748b" />
            </div>
            <span className="player-name">{name}</span>
            <button onClick={() => onRemove(id)} className="remove-btn">
                <X size={16} />
            </button>
        </div>
    );
}
