// Project Schema
const projectSchema = {
  id: 'string', // Auto-generated Firebase ID
  name: 'string',
  description: 'string',
  createdAt: 'timestamp',
  lastModified: 'timestamp',
  ownerId: 'string', // User ID who created the project
  collaborators: ['string'], // Array of user IDs
  layers: [], // Array of layer objects
  versions: [
    {
      id: 'string',
      timestamp: 'timestamp',
      description: 'string',
      layers: [], // Snapshot of layers at this version
      thumbnail: 'string' // Optional URL to canvas thumbnail
    }
  ]
};

// Firebase Schema for Time Tracking and Billing

/*
Project Document Structure:
{
  id: string,
  name: string,
  description: string,
  owner: string (email),
  format: string,
  status: string,
  createdAt: timestamp,
  lastModified: timestamp,
  lastModifiedBy: string (email),
  
  // New fields for time tracking and billing
  tasks: [
    {
      id: string,
      description: string,
      status: string,
      createdAt: timestamp,
      createdBy: string (email),
      assignedTo: string (email),
      hourlyRate: number,
      timeSpent: number (seconds),
      category: string,
      priority: string
    }
  ],
  
  timeEntries: [
    {
      id: string,
      taskId: string,
      userId: string,
      duration: number (seconds),
      timestamp: string (ISO date),
      hourlyRate: number
    }
  ],
  
  invoices: [
    {
      id: string,
      number: string,
      createdAt: timestamp,
      createdBy: string (email),
      status: string ('draft', 'sent', 'paid'),
      dueDate: timestamp,
      timeEntries: [string] (array of timeEntry IDs),
      totalAmount: number,
      clientDetails: {
        name: string,
        email: string,
        address: string
      },
      notes: string
    }
  ],
  
  // Existing fields
  files: [...],
  activeUsers: [...],
  activityLog: [...]
}
*/

// Updated Task Schema
export const createNewTask = {
  id: `task-${Date.now()}`,
  description: 'Task description',
  status: 'TODO', // New default status
  statusHistory: [
    {
      status: 'TODO',
      timestamp: new Date().toISOString(),
      updatedBy: 'user@example.com',
      comment: 'Task created'
    }
  ],
  createdAt: new Date().toISOString(),
  createdBy: 'user@example.com',
  assignedTo: 'user@example.com',
  hourlyRate: 50,
  timeSpent: 0,
  category: 'development',
  priority: 'high',
  dueDate: null,
  completedAt: null,
  completedBy: null,
  lastStatusUpdate: new Date().toISOString(),
  lastUpdatedBy: 'user@example.com',
  notifications: {
    enabled: true,
    recipients: ['user@example.com'],
    lastNotification: null
  },
  reminders: [
    {
      type: 'DUE_DATE',
      timestamp: null,
      sent: false
    },
    {
      type: 'STATUS_CHANGE',
      timestamp: null,
      sent: false
    }
  ],
  metadata: {
    clientVisible: true,
    billable: true,
    estimatedHours: 0,
    tags: []
  }
};

export const createTimeEntry = {
  id: `time-${Date.now()}`,
  taskId: 'task-123',
  userId: 'user-123',
  duration: 3600, // 1 hour in seconds
  timestamp: new Date().toISOString(),
  hourlyRate: 50
};

export const createInvoice = {
  id: `inv-${Date.now()}`,
  number: 'INV-001',
  createdAt: new Date().toISOString(),
  createdBy: 'user@example.com',
  status: 'draft',
  paymentStatus: 'pending',
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  timeEntries: ['time-123', 'time-124'],
  totalAmount: 150,
  amountPaid: 0,
  lastPaymentDate: null,
  paymentHistory: [],
  clientDetails: {
    name: 'Client Name',
    email: 'client@example.com',
    address: '123 Client Street'
  },
  notes: 'Payment due within 30 days',
  reminders: [],
  template: 'default',
  metadata: {
    lastModified: new Date().toISOString(),
    lastModifiedBy: 'user@example.com',
    version: '1.0'
  }
};

export const subscriptionSchema = {
  subscriptionId: String,
  userId: String,
  planId: String,
  status: String, // 'ACTIVE', 'CANCELLED', 'EXPIRED', 'TRIAL'
  startDate: Date,
  trialEndDate: Date,
  cancelledAt: Date,
  features: {
    unlimitedTeamMembers: Boolean,
    unlimitedProjects: Boolean,
    advancedCollaboration: Boolean,
    premiumSupport: Boolean,
    customBranding: Boolean,
    advancedAnalytics: Boolean,
    apiAccess: Boolean,
    priorityUpdates: Boolean
  },
  createdAt: Date,
  updatedAt: Date
};

export { projectSchema }; 