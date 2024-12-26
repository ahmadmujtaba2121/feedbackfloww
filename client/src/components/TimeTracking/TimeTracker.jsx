import React, { useState, useEffect, useRef } from 'react';
import { FiPlay, FiPause, FiClock, FiDollarSign } from 'react-icons/fi';
import { doc, updateDoc, getDoc, onSnapshot, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { toast } from 'react-hot-toast';

const TimeTracker = ({
  projectId,
  taskId,
  initialRate = 0,
  isOwner = false,
  disabled = false
}) => {
  const [isTracking, setIsTracking] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [hourlyRate, setHourlyRate] = useState(initialRate);
  const [activeSession, setActiveSession] = useState(null);
  const [currentReview, setCurrentReview] = useState(null);
  const intervalRef = useRef(null);
  const reviewRef = useRef(null);
  const lastUpdateRef = useRef(0);

  // Subscribe to real-time updates for time tracking
  useEffect(() => {
    if (!projectId || !taskId) return;

    const unsubscribe = onSnapshot(
      doc(db, 'projects', projectId),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const reviews = data.reviews || [];
          const review = reviews.find(r => r.id === taskId);

          if (review) {
            reviewRef.current = review;
            setCurrentReview(review);

            // Update time spent
            const baseTimeSpent = review.timeSpent || 0;
            setTimeSpent(baseTimeSpent);

            // Update hourly rate only if it's not being edited
            if (!isTracking) {
              setHourlyRate(review.hourlyRate || initialRate);
            }

            // Check for active tracking session
            const activeTrackingSession = review.activeTrackingSession;
            if (activeTrackingSession) {
              setActiveSession(activeTrackingSession);
              if (!isTracking) {
                const startTimeDate = new Date(activeTrackingSession.startTime);
                setStartTime(startTimeDate);
                setIsTracking(true);
                startTimer(activeTrackingSession);
              }
            } else if (isTracking) {
              stopTracking();
            }
          }
        }
      },
      (error) => {
        console.error('Error in time tracking snapshot:', error);
        toast.error('Error tracking time');
        stopTracking();
      }
    );

    // Cleanup function
    return () => {
      unsubscribe();
      stopTracking();
    };
  }, [projectId, taskId]);

  const startTimer = (session) => {
    try {
      stopTimer(); // Clear any existing timer

      const sessionStart = new Date(session.startTime);
      const baseTime = session.baseTimeSpent || 0;

      // Set initial time immediately
      const elapsed = Date.now() - sessionStart.getTime();
      const newTimeSpent = baseTime + elapsed;
      setTimeSpent(newTimeSpent);
      lastUpdateRef.current = Date.now();

      // Start interval
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const currentElapsed = now - sessionStart.getTime();
        const currentTimeSpent = baseTime + currentElapsed;

        // Only update if more than 100ms has passed since last update
        if (now - lastUpdateRef.current >= 100) {
          setTimeSpent(currentTimeSpent);
          lastUpdateRef.current = now;
        }
      }, 100);
    } catch (error) {
      console.error('Error starting timer:', error);
      stopTracking();
    }
  };

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const stopTracking = () => {
    stopTimer();
    setIsTracking(false);
    setStartTime(null);
    setActiveSession(null);
  };

  const formatTime = (ms) => {
    try {
      const totalSeconds = Math.floor(ms / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return '0h 0m';
    }
  };

  const updateReviewInDatabase = async (reviewUpdate) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);

      if (!projectDoc.exists()) {
        throw new Error('Project not found');
      }

      const data = projectDoc.data();
      const reviews = [...(data.reviews || [])];
      const reviewIndex = reviews.findIndex(r => r.id === taskId);

      if (reviewIndex === -1) {
        throw new Error('Review not found');
      }

      const updatedReview = {
        ...reviews[reviewIndex],
        ...reviewUpdate,
        lastUpdated: new Date().toISOString()
      };

      reviews[reviewIndex] = updatedReview;
      await updateDoc(projectRef, { reviews });
      return updatedReview;
    } catch (error) {
      console.error('Error updating review:', error);
      throw error;
    }
  };

  const handleStartTracking = async () => {
    if (!isOwner || disabled || !reviewRef.current) return;

    try {
      const now = new Date();
      const newSession = {
        startTime: now.toISOString(),
        baseTimeSpent: timeSpent,
        hourlyRate,
        timeEntries: []
      };

      await updateReviewInDatabase({
        activeTrackingSession: newSession
      });

      setStartTime(now);
      setActiveSession(newSession);
      setIsTracking(true);
      startTimer(newSession);
      toast.success('Time tracking started');
    } catch (error) {
      console.error('Error starting time tracking:', error);
      toast.error('Failed to start time tracking');
      stopTracking();
    }
  };

  const handleStopTracking = async () => {
    if (!isOwner || disabled || !activeSession || !reviewRef.current) return;

    try {
      // Stop timer immediately to prevent further updates
      stopTimer();
      setIsTracking(false);

      const now = new Date();
      const sessionStart = new Date(activeSession.startTime);
      const duration = now.getTime() - sessionStart.getTime();
      const totalTimeSpent = (activeSession.baseTimeSpent || 0) + duration;

      // Create time entry for invoice
      const timeEntry = {
        id: `time-${Date.now()}`,
        taskId: taskId,
        description: reviewRef.current?.description || 'Untitled Task',
        duration: duration / 1000, // Convert to seconds
        timestamp: now.toISOString(),
        startTime: activeSession.startTime,
        endTime: now.toISOString(),
        hourlyRate: hourlyRate,
        taskDescription: reviewRef.current?.description || 'Untitled Task'
      };

      // Update review first
      await updateReviewInDatabase({
        timeSpent: totalTimeSpent,
        activeTrackingSession: null,
        timeEntries: [
          ...(reviewRef.current.timeEntries || []),
          timeEntry
        ]
      });

      // Then update project's timeEntries
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        timeEntries: arrayUnion(timeEntry)
      });

      // Reset state after successful update
      setStartTime(null);
      setActiveSession(null);
      setTimeSpent(totalTimeSpent);
      toast.success('Time tracking stopped');
    } catch (error) {
      console.error('Error stopping time tracking:', error);
      toast.error('Failed to stop time tracking');
      // Complete the stop tracking even if update fails
      stopTracking();
    }
  };

  const handleRateChange = async (e) => {
    if (!isOwner || !reviewRef.current) return;

    const newRate = Number(e.target.value);
    if (isNaN(newRate) || newRate < 0) return;

    try {
      await updateReviewInDatabase({
        hourlyRate: newRate
      });

      setHourlyRate(newRate);
      toast.success('Rate updated');
    } catch (error) {
      console.error('Error updating rate:', error);
      toast.error('Failed to update rate');
      // Revert to previous rate
      setHourlyRate(reviewRef.current.hourlyRate || initialRate);
    }
  };

  return (
    <div className="bg-slate-900/50 rounded-lg p-3 space-y-3">
      {/* Time Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-300">
          <FiClock className="w-4 h-4" />
          <span>{formatTime(timeSpent)}</span>
        </div>
        {isOwner && (
          <div className="flex gap-2">
            {!isTracking ? (
              <button
                onClick={handleStartTracking}
                disabled={disabled}
                className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Start tracking"
              >
                <FiPlay className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleStopTracking}
                disabled={disabled}
                className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Stop tracking"
              >
                <FiPause className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Rate Setting (only for owners) */}
      {isOwner && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-300">
            <FiDollarSign className="w-4 h-4" />
            <span>Hourly Rate</span>
          </div>
          <input
            type="number"
            value={hourlyRate}
            onChange={(e) => setHourlyRate(Number(e.target.value))}
            onBlur={handleRateChange}
            disabled={disabled}
            min="0"
            step="1"
            className="w-20 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-right text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      )}

      {/* Estimated Cost */}
      {hourlyRate > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Estimated Cost</span>
          <span className="text-slate-300">
            ${((timeSpent / 3600000) * hourlyRate).toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
};

export default TimeTracker; 