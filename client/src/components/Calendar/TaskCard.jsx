import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { FiCheckCircle, FiClock } from 'react-icons/fi';

const TaskCard = ({ task, index }) => {
    const priorityColors = {
        low: 'border-primary/50',
        medium: 'border-warning/50',
        high: 'border-destructive/50'
    };

    const statusColors = {
        TODO: 'bg-background/50',
        IN_PROGRESS: 'bg-primary/10',
        COMPLETED: 'bg-success/10'
    };

    return (
        <Draggable draggableId={String(task.id)} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={provided.draggableProps.style}
                    className={`
                        group relative mb-2 p-4 border border-border rounded-lg shadow-sm 
                        hover:shadow-md transition-all cursor-grab active:cursor-grabbing
                        ${statusColors[task.status]} ${priorityColors[task.priority]}
                        ${snapshot.isDragging ? 'shadow-lg scale-105 ring-2 ring-primary/20' : ''}
                    `}
                >
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-foreground/90 line-clamp-1">{task.title}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary/90 font-medium`}>
                                {task.priority}
                            </span>
                        </div>
                        {task.description && (
                            <p className="text-xs text-foreground/70 line-clamp-2">{task.description}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-foreground/60">
                            <div className="flex items-center gap-2">
                                {task.dueDate && (
                                    <div className="flex items-center gap-1">
                                        <FiClock className="w-3 h-3" />
                                        <span>{task.dueDate}</span>
                                    </div>
                                )}
                            </div>
                            {task.assignedTo && (
                                <div className="flex items-center gap-1">
                                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span className="text-xs text-primary/90 font-medium">
                                            {task.assignedTo.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
};

export default TaskCard; 