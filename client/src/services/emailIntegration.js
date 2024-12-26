import { db } from '../firebase/firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';

export class EmailIntegrationService {
    constructor(projectId) {
        this.projectId = projectId;
        this.emailEndpoint = `https://api.yourapp.com/email/${projectId}`;
    }

    // Generate unique email address for project
    async generateProjectEmail() {
        const uniqueId = Math.random().toString(36).substring(7);
        return `project-${this.projectId}-${uniqueId}@yourapp.com`;
    }

    // Parse email content into task
    parseEmailToTask(email) {
        return {
            title: email.subject,
            description: email.body,
            status: 'TODO',
            priority: this.determinePriority(email),
            attachments: email.attachments,
            createdFrom: {
                type: 'email',
                sender: email.from,
                timestamp: new Date().toISOString(),
                threadId: email.threadId
            }
        };
    }

    // Determine priority based on email content and headers
    determinePriority(email) {
        const urgentKeywords = ['urgent', 'asap', 'emergency', 'priority'];
        const hasUrgentKeywords = urgentKeywords.some(keyword =>
            email.subject.toLowerCase().includes(keyword) ||
            email.body.toLowerCase().includes(keyword)
        );

        return hasUrgentKeywords ? 'high' : 'medium';
    }

    // Create task from email
    async createTaskFromEmail(email) {
        try {
            const taskData = this.parseEmailToTask(email);
            const tasksRef = collection(db, 'projects', this.projectId, 'tasks');

            // Create the task
            const taskDoc = await addDoc(tasksRef, {
                ...taskData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            // Handle attachments
            if (email.attachments?.length > 0) {
                await this.processAttachments(taskDoc.id, email.attachments);
            }

            // Create email thread reference
            await this.createEmailThread(taskDoc.id, email);

            return taskDoc.id;
        } catch (error) {
            console.error('Error creating task from email:', error);
            throw error;
        }
    }

    // Process email attachments
    async processAttachments(taskId, attachments) {
        // Implementation depends on your storage solution (Firebase Storage, S3, etc.)
        const processedAttachments = await Promise.all(
            attachments.map(async (attachment) => {
                // Process and store attachment
                // Return attachment metadata
                return {
                    name: attachment.name,
                    type: attachment.type,
                    size: attachment.size,
                    url: attachment.url
                };
            })
        );

        // Update task with attachment information
        const taskRef = doc(db, 'projects', this.projectId, 'tasks', taskId);
        await updateDoc(taskRef, {
            attachments: processedAttachments
        });
    }

    // Create email thread reference
    async createEmailThread(taskId, email) {
        const threadRef = collection(db, 'projects', this.projectId, 'emailThreads');
        await addDoc(threadRef, {
            taskId,
            threadId: email.threadId,
            subject: email.subject,
            participants: [email.from, ...email.to],
            lastUpdate: new Date().toISOString(),
            messageCount: 1
        });
    }

    // Update task from email reply
    async updateTaskFromReply(email) {
        try {
            // Find existing thread
            const threadQuery = query(
                collection(db, 'projects', this.projectId, 'emailThreads'),
                where('threadId', '==', email.threadId)
            );

            const threadSnapshot = await getDocs(threadQuery);
            if (!threadSnapshot.empty) {
                const thread = threadSnapshot.docs[0];
                const taskId = thread.data().taskId;

                // Update task with new information
                const taskRef = doc(db, 'projects', this.projectId, 'tasks', taskId);
                await updateDoc(taskRef, {
                    lastReply: {
                        from: email.from,
                        content: email.body,
                        timestamp: new Date().toISOString()
                    },
                    updatedAt: new Date().toISOString()
                });

                // Update thread
                await updateDoc(thread.ref, {
                    lastUpdate: new Date().toISOString(),
                    messageCount: increment(1)
                });
            }
        } catch (error) {
            console.error('Error updating task from email reply:', error);
            throw error;
        }
    }
}

// Email webhook handler
export const handleEmailWebhook = async (req, res) => {
    try {
        const { projectId, email } = req.body;
        const emailService = new EmailIntegrationService(projectId);

        if (email.isReply) {
            await emailService.updateTaskFromReply(email);
        } else {
            await emailService.createTaskFromEmail(email);
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error handling email webhook:', error);
        res.status(500).json({ error: error.message });
    }
}; 