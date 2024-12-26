import React, { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useTheme } from '../contexts/ThemeContext';
import { useParams } from 'react-router-dom';
import { db } from '../firebase/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const locales = {
    'en-US': enUS
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const Calendar = () => {
    const [events, setEvents] = useState([]);
    const { currentTheme } = useTheme();
    const { projectId } = useParams();

    useEffect(() => {
        if (!projectId) return;

        // Query tasks and reviews
        const tasksQuery = query(
            collection(db, 'tasks'),
            where('projectId', '==', projectId)
        );

        const reviewsQuery = query(
            collection(db, 'reviews'),
            where('projectId', '==', projectId)
        );

        // Subscribe to tasks
        const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
            const taskEvents = snapshot.docs.map(doc => {
                const task = doc.data();
                return {
                    id: doc.id,
                    title: task.title,
                    start: task.dueDate.toDate(),
                    end: task.dueDate.toDate(),
                    type: 'task',
                    status: task.status
                };
            });

            setEvents(prev => {
                const filteredPrev = prev.filter(event => event.type !== 'task');
                return [...filteredPrev, ...taskEvents];
            });
        });

        // Subscribe to reviews
        const unsubscribeReviews = onSnapshot(reviewsQuery, (snapshot) => {
            const reviewEvents = snapshot.docs.map(doc => {
                const review = doc.data();
                return {
                    id: doc.id,
                    title: `Review: ${review.title}`,
                    start: review.date.toDate(),
                    end: review.date.toDate(),
                    type: 'review',
                    status: review.status
                };
            });

            setEvents(prev => {
                const filteredPrev = prev.filter(event => event.type !== 'review');
                return [...filteredPrev, ...reviewEvents];
            });
        });

        return () => {
            unsubscribeTasks();
            unsubscribeReviews();
        };
    }, [projectId]);

    const getEventStyle = (event) => {
        const baseStyle = {
            className: '',
            style: {
                backgroundColor: currentTheme === 'light' ? '#e2e8f0' : '#1e293b',
                color: currentTheme === 'light' ? '#0f172a' : '#e2e8f0',
                border: 'none',
                borderRadius: '0.375rem',
            }
        };

        if (event.type === 'task') {
            switch (event.status) {
                case 'completed':
                    baseStyle.style.backgroundColor = '#10b981';
                    baseStyle.style.color = '#ffffff';
                    break;
                case 'in-progress':
                    baseStyle.style.backgroundColor = '#f59e0b';
                    baseStyle.style.color = '#ffffff';
                    break;
                case 'pending':
                    baseStyle.style.backgroundColor = '#ef4444';
                    baseStyle.style.color = '#ffffff';
                    break;
                default:
                    break;
            }
        } else if (event.type === 'review') {
            baseStyle.style.backgroundColor = '#8b5cf6';
            baseStyle.style.color = '#ffffff';
        }

        return baseStyle;
    };

    const handleSelectEvent = (event) => {
        console.log('Selected event:', event);
    };

    return (
        <div className="h-full p-4">
            <BigCalendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 'calc(100vh - 8rem)' }}
                eventPropGetter={getEventStyle}
                onSelectEvent={handleSelectEvent}
            />
        </div>
    );
};

export default Calendar; 