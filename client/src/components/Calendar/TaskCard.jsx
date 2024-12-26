import React from 'react';
import { Draggable } from 'react-beautiful-dnd';

const TaskCard = ({ task, index }) => {
    return (
        <Draggable draggableId={task.id} index={index}>
            {(provided) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="bg-slate-700 p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                    <h4 className="text-white font-medium mb-1">{task.title}</h4>
                    {task.description && (
                        <p className="text-sm text-slate-300 line-clamp-2">{task.description}</p>
                    )}
                </div>
            )}
        </Draggable>
    );
};

export default TaskCard; 