import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { FiCheckCircle, FiClock, FiCalendar } from 'react-icons/fi';
import { format } from 'date-fns';

const formatTaskDate = (date) => {
    if (!date) return '';
    const taskDate = new Date(date);
    return format(taskDate, 'MMM d, h:mm a');
};

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

    const priorityTextColors = {
        low: 'text-primary',
        medium: 'text-warning',
        high: 'text-destructive'
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
                        group relative mb-1 sm:mb-2 p-1.5 sm:p-3 border border-border rounded-lg shadow-sm 
                        hover:shadow-md transition-all cursor-grab active:cursor-grabbing
                        ${statusColors[task.status]} ${priorityColors[task.priority]}
                        ${snapshot.isDragging ? 'shadow-lg scale-105 ring-2 ring-primary/20' : ''}
                        ${task.isUnscheduled ? 'border-dashed' : ''}
                    `}
                >
                    <div className="flex flex-col gap-1 sm:gap-1.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 sm:gap-2">
                                {task.status === 'COMPLETED' && (
                                    <FiCheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-success" />
                                )}
                                <h4 className="text-xs sm:text-sm font-medium text-foreground/90 line-clamp-1">{task.title}</h4>
                            </div>
                            <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-background/50 ${priorityTextColors[task.priority]} font-medium`}>
                                {task.priority}
                            </span>
                        </div>
                        {task.description && (
                            <p className="text-[10px] sm:text-xs text-foreground/70 line-clamp-2 hidden sm:block">{task.description}</p>
                        )}
                        <div className="flex items-center justify-between text-[10px] sm:text-xs text-foreground/60">
                            <div className="flex items-center gap-1 sm:gap-2">
                                {task.isUnscheduled ? (
                                    <div className="flex items-center gap-1 text-primary/70">
                                        <FiCalendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                        <span className="hidden sm:inline">Unscheduled</span>
                                        <span className="sm:hidden">Un.</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1 text-foreground/60">
                                        <FiClock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                        <span>{formatTaskDate(task.dueDate)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
};

export default TaskCard; 