import { AI_CONFIG } from '../config/ai.config';
import { db } from '../firebase/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

class AIService {
    constructor() {
        this.apiKey = AI_CONFIG.GEMINI_API_KEY;
        this.model = AI_CONFIG.MODEL;
        this.systemContext = `You are an AI assistant for FeedbackFlow, a project feedback and collaboration platform. 
You help users understand their projects, reviews, tasks, and team activities. 
You can provide information about project status, reviews, files, team members, and tasks.
Always be helpful, clear, and accurate in your responses.
When asked about project details:
1. Always verify the data exists before making statements
2. If you mention a number, always provide the details that make up that number
3. For follow-up questions, refer to the previous context
4. If data is not available, clearly state that
5. Never make assumptions about data you can't see
6. For general questions about all projects, check the entire projects array
7. Don't assume questions containing "project" or "projects" are looking for a specific project name`;

        console.log('AI Service initialized, API key present:', !!this.apiKey);
    }

    async generateResponse(message, context) {
        const lowerMessage = message.toLowerCase();
        const projectData = context;

        // Handle project status queries
        if (lowerMessage.includes('approved') && lowerMessage.includes('is') && !lowerMessage.includes('how')) {
            const projectName = message.split(' ').filter(word =>
                word.toLowerCase() !== 'is' &&
                word.toLowerCase() !== 'approved' &&
                word.toLowerCase() !== 'project'
            ).join(' ').trim();

            if (projectName) {
                const projects = Array.isArray(projectData.allProjects) ? projectData.allProjects : [projectData];
                const project = projects.find(p => p.name.toLowerCase() === projectName.toLowerCase());

                if (project) {
                    const isApproved = project.status?.toLowerCase() === 'approved';
                    return `Project "${project.name}" is ${isApproved ? 'APPROVED' : 'NOT APPROVED'}. Current status: ${project.status?.toUpperCase() || 'PENDING'}`;
                }
            }
        }

        // Handle general project queries
        if (lowerMessage.includes('how many project') || lowerMessage.includes('which project') || lowerMessage.includes('approved project')) {
            const projects = Array.isArray(projectData.allProjects) ? projectData.allProjects : [projectData];
            const approvedProjects = projects.filter(p => p.status?.toLowerCase() === 'approved');

            if (lowerMessage.includes('approved')) {
                const response = `There ${approvedProjects.length === 1 ? 'is' : 'are'} ${approvedProjects.length} approved project(s):\n`;
                if (approvedProjects.length > 0) {
                    return response + approvedProjects.map((p, i) => `${i + 1}. ${p.name}`).join('\n');
                }
                return response;
            }
        }

        // Prepare detailed project data
        const projectDetails = {
            name: projectData.name,
            status: projectData.status?.toUpperCase() || 'PENDING',
            owner: projectData.owner || 'Unknown',
            teamSize: projectData.reviewers?.length || 0,
            teamMembers: projectData.reviewers || [],
            reviews: {
                total: projectData.reviews?.length || 0,
                approved: projectData.reviews?.filter(r => r.status?.toLowerCase() === 'approved')?.length || 0,
                pending: projectData.reviews?.filter(r => r.status?.toLowerCase() === 'pending' || r.status?.toLowerCase() === 'in_review')?.length || 0,
                rejected: projectData.reviews?.filter(r => r.status?.toLowerCase() === 'rejected')?.length || 0,
                details: projectData.reviews?.map(review => {
                    // Extract user from the review or its history
                    const reviewUser = review.user || review.email ||
                        (review.statusHistory?.[0]?.user || review.statusHistory?.[0]?.email);

                    return {
                        content: review.description || review.content || 'No content',
                        status: review.status || 'TODO',
                        reviewer: reviewUser || 'Unknown',
                        timestamp: review.createdAt ? new Date(review.createdAt).toLocaleString() : 'Unknown',
                        statusHistory: review.statusHistory?.map(status => ({
                            status: status.status,
                            user: status.user || status.email || reviewUser || 'Unknown',
                            timestamp: status.timestamp
                        })) || [],
                        user: reviewUser || ''
                    };
                }) || []
            },
            tasks: {
                total: projectData.tasks?.length || 0,
                completed: projectData.tasks?.filter(t => t.status === 'completed')?.length || 0,
                inProgress: projectData.tasks?.filter(t => t.status === 'in_progress')?.length || 0,
                pending: projectData.tasks?.filter(t => t.status === 'pending')?.length || 0,
                details: projectData.tasks?.map(task => ({
                    title: task.title || 'Untitled',
                    status: task.status || 'pending',
                    assignedTo: task.assignedTo || 'Unassigned',
                    updatedAt: task.updatedAt ? new Date(task.updatedAt).toLocaleString() : 'Unknown'
                })) || []
            },
            files: {
                total: projectData.files?.length || 0,
                details: projectData.files?.map(file => ({
                    name: file.name || 'Unnamed File',
                    type: file.type || 'unknown type',
                    uploadedBy: file.uploadedBy || 'Unknown',
                    lastModified: file.lastModified ? new Date(file.lastModified).toLocaleString() : 'Unknown'
                })) || []
            },
            team: {
                owner: projectData.owner || 'Unknown',
                members: Array.isArray(projectData.reviewers) ? projectData.reviewers : [],
                activeUsers: Array.isArray(projectData.activeUsers) ? projectData.activeUsers.map(user => ({
                    email: user?.email || 'Unknown',
                    displayName: user?.displayName || user?.email || 'Unknown',
                    lastActive: user?.lastActive ? new Date(user.lastActive).toLocaleString() : 'Unknown'
                })) : []
            }
        };

        // Handle specific queries with detailed responses
        if (lowerMessage.includes('review')) {
            const reviews = projectDetails.reviews;
            let response = `Project "${projectDetails.name}" has ${reviews.total} review(s):\n`;
            response += `• ${reviews.approved} approved\n`;
            response += `• ${reviews.pending} in review/pending\n`;
            response += `• ${reviews.rejected} rejected\n\n`;

            if (reviews.total > 0) {
                response += "Review details:\n";
                reviews.details.forEach((review, index) => {
                    response += `${index + 1}. By: ${review.reviewer}\n`;
                    response += `   Status: ${review.status}\n`;
                    response += `   Description: ${review.content}\n`;
                    if (review.timestamp !== 'Unknown') {
                        response += `   Date: ${review.timestamp}\n`;
                    }
                    if (review.statusHistory?.length > 0) {
                        response += `   Status History:\n`;
                        review.statusHistory.forEach(status => {
                            response += `   - ${status.status} by ${status.user} (${new Date(status.timestamp).toLocaleString()})\n`;
                        });
                    }
                    response += '\n';
                });
            }
            return response;
        }

        if (lowerMessage.includes('user') || lowerMessage.includes('member') || lowerMessage.includes('team')) {
            const team = projectDetails.team;
            let response = `Project "${projectDetails.name}" team information:\n\n`;
            response += `Owner: ${team.owner}\n\n`;

            if (team.members.length > 0) {
                response += `Team Members (${team.members.length}):\n`;
                team.members.forEach((member, index) => {
                    const memberName = typeof member === 'string' ? member : member.email || member.name || 'Unknown';
                    response += `${index + 1}. ${memberName}\n`;
                });
            } else {
                response += "No team members found.\n";
            }

            if (team.activeUsers.length > 0) {
                response += `\nActive Users:\n`;
                team.activeUsers.forEach((user, index) => {
                    const userName = user.displayName || user.email || user.name || 'Unknown';
                    response += `${index + 1}. ${userName}\n`;
                    if (user.lastActive !== 'Unknown') {
                        response += `   Last active: ${user.lastActive}\n`;
                    }
                });
            }
            return response;
        }

        // Try AI response with enhanced context
        try {
            if (!this.apiKey) {
                throw new Error('API key not configured');
            }

            const aiPrompt = {
                contents: [{
                    parts: [{
                        text: `${this.systemContext}

User Question: ${message}

Detailed Project Context:
${JSON.stringify(projectDetails, null, 2)}

Previous context and data are preserved. Please provide a detailed and accurate response based on the available data.
If you mention any numbers, always provide the breakdown and details.
If you can't find specific information, clearly state that the data is not available.`
                    }]
                }]
            };

            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + this.apiKey, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(aiPrompt)
            });

            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status}`);
            }

            const result = await response.json();
            if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
                return result.candidates[0].content.parts[0].text;
            }
        } catch (aiError) {
            console.error('AI response failed:', aiError);
            return this.getTemplateResponse(lowerMessage, projectDetails);
        }

        return this.getTemplateResponse(lowerMessage, projectDetails);
    }

    getTemplateResponse(lowerMessage, projectDetails) {
        // Default to showing comprehensive project status
        return `Project "${projectDetails.name}" Status Summary:

Team:
- Owner: ${projectDetails.team.owner}
- Team Size: ${projectDetails.teamSize} members
${projectDetails.team.members.length > 0 ? '- Members:\n' + projectDetails.team.members.map((m, i) => `  ${i + 1}. ${m}`).join('\n') : ''}

Reviews (${projectDetails.reviews.total} total):
- ${projectDetails.reviews.approved} approved
- ${projectDetails.reviews.pending} pending
- ${projectDetails.reviews.rejected} rejected
${projectDetails.reviews.details.length > 0 ? '\nLatest Reviews:\n' + projectDetails.reviews.details.slice(0, 3).map((r, i) =>
            `${i + 1}. By: ${r.reviewer}
   Status: ${r.status}
   Date: ${r.timestamp}`).join('\n') : ''}

Tasks (${projectDetails.tasks.total} total):
- ${projectDetails.tasks.completed} completed
- ${projectDetails.tasks.inProgress} in progress
- ${projectDetails.tasks.pending} pending

Files: ${projectDetails.files.total} total
${projectDetails.files.details.map((f, i) => `${i + 1}. ${f.name} (${f.type})`).join('\n')}`;
    }
}

export const aiService = new AIService(); 