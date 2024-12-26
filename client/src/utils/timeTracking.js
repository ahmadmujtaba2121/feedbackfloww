import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export const startTimeTracking = async (projectId, taskId, userId) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const timestamp = new Date().toISOString();
    
    await updateDoc(projectRef, {
      'timeTracking.active': {
        taskId,
        userId,
        startTime: timestamp
      }
    });

    return timestamp;
  } catch (error) {
    console.error('Error starting time tracking:', error);
    throw error;
  }
};

export const stopTimeTracking = async (projectId, taskId, userId, startTime) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const endTime = new Date();
    const startTimeDate = new Date(startTime);
    const duration = Math.floor((endTime - startTimeDate) / 1000); // duration in seconds

    // Get current project data
    const projectDoc = await getDoc(projectRef);
    const projectData = projectDoc.data();
    const task = projectData.tasks?.find(t => t.id === taskId);
    const hourlyRate = task?.hourlyRate || 0;

    // Create time entry
    const timeEntry = {
      id: `time-${Date.now()}`,
      taskId,
      userId,
      duration,
      startTime,
      endTime: endTime.toISOString(),
      hourlyRate,
      cost: (duration / 3600) * hourlyRate // Convert seconds to hours for cost calculation
    };

    // Update project document
    await updateDoc(projectRef, {
      'timeTracking.active': null,
      timeEntries: arrayUnion(timeEntry),
      [`tasks.${taskId}.timeSpent`]: (task?.timeSpent || 0) + duration
    });

    return timeEntry;
  } catch (error) {
    console.error('Error stopping time tracking:', error);
    throw error;
  }
};

export const getTaskTimeEntries = async (projectId, taskId) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);
    const projectData = projectDoc.data();

    return projectData.timeEntries?.filter(entry => entry.taskId === taskId) || [];
  } catch (error) {
    console.error('Error getting task time entries:', error);
    throw error;
  }
};

export const calculateTaskCost = (timeEntries) => {
  return timeEntries.reduce((total, entry) => {
    const hours = entry.duration / 3600; // Convert seconds to hours
    return total + (hours * entry.hourlyRate);
  }, 0);
};

export const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return {
    hours,
    minutes,
    seconds: remainingSeconds,
    formatted: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  };
};

export const generateInvoiceNumber = async (projectId, db) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);
    const projectData = projectDoc.data();
    
    // Get current year and month
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    // Get existing invoices for this month
    const existingInvoices = (projectData.invoices || [])
      .filter(inv => inv.number && inv.number.includes(`${year}${month}`))
      .map(inv => {
        const sequence = parseInt(inv.number.split('-')[2]) || 0;
        return sequence;
      });
    
    // Get the next sequence number
    const nextSequence = existingInvoices.length > 0
      ? Math.max(...existingInvoices) + 1
      : 1;
    
    // Generate invoice number with format: INV-YYMM-SEQUENCE
    const invoiceNumber = `INV-${year}${month}-${nextSequence.toString().padStart(4, '0')}`;
    
    // Update project's last invoice number
    await updateDoc(projectRef, {
      lastInvoiceNumber: invoiceNumber,
      lastInvoiceDate: date.toISOString()
    });
    
    return invoiceNumber;
  } catch (error) {
    console.error('Error generating invoice number:', error);
    // Fallback to a timestamp-based number if there's an error
    const timestamp = Date.now().toString().slice(-8);
    return `INV-${timestamp}`;
  }
};

// Add function to validate invoice numbers
export const validateInvoiceNumber = (invoiceNumber) => {
  // Check format: INV-YYMM-SEQUENCE
  const regex = /^INV-\d{4}-\d{4}$/;
  if (!regex.test(invoiceNumber)) {
    return false;
  }

  // Extract and validate parts
  const [prefix, yearMonth, sequence] = invoiceNumber.split('-');
  
  // Validate year/month
  const year = parseInt(yearMonth.slice(0, 2));
  const month = parseInt(yearMonth.slice(2));
  if (month < 1 || month > 12) {
    return false;
  }

  // Validate sequence
  const seq = parseInt(sequence);
  if (seq < 1 || seq > 9999) {
    return false;
  }

  return true;
};

// Add function to get invoice statistics
export const getInvoiceStats = async (projectId, db) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectRef);
    const projectData = projectDoc.data();
    const invoices = projectData.invoices || [];

    return {
      total: invoices.length,
      paid: invoices.filter(inv => inv.status === 'paid').length,
      overdue: invoices.filter(inv => inv.status === 'overdue').length,
      totalAmount: invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
      paidAmount: invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0),
      lastInvoice: invoices[invoices.length - 1] || null
    };
  } catch (error) {
    console.error('Error getting invoice stats:', error);
    return null;
  }
}; 