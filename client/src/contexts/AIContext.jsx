import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { aiService } from '../services/aiService';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { db } from '../firebase/firebase';
import { doc, collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, getDoc, getDocs, where, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { auth } from '../firebase/firebase';

const AIContext = createContext();

export const useAI = () => {
    const context = useContext(AIContext);
    if (!context) {
        throw new Error('useAI must be used within an AIProvider');
    }
    return context;
};

export const AIProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const [error, setError] = useState(null);
    const [projectContext, setProjectContext] = useState(null);
    const { currentUser } = useAuth();

    // Save message to Firestore with better error handling
    const saveMessage = async (message, role) => {
        try {
            const userEmail = auth.currentUser?.email;
            if (!userEmail) {
                console.error('No user email found');
                return;
            }

            const conversationRef = doc(db, 'ai_conversations', userEmail);
            const messageData = {
                content: typeof message === 'string' ? message : message.content,
                role: role || message.role,
                timestamp: new Date().toISOString(),
                projectId: projectContext?.id || null
            };

            console.log('Saving message:', messageData);

            // Get existing conversation or create new one
            const conversationDoc = await getDoc(conversationRef);
            if (!conversationDoc.exists()) {
                await setDoc(conversationRef, {
                    userId: userEmail,
                    messages: [messageData]
                });
                console.log('Created new conversation with message');
            } else {
                // Update existing conversation
                const currentData = conversationDoc.data();
                const updatedMessages = [...(currentData.messages || []), messageData];
                await updateDoc(conversationRef, {
                    messages: updatedMessages
                });
                console.log('Updated existing conversation with message');
            }
        } catch (error) {
            console.error('Error saving message:', error);
            // Don't throw the error, just log it
        }
    };

    // Load chat history from Firestore with real-time updates
    useEffect(() => {
        if (!currentUser) return;

        console.log('Setting up chat history listener');
        const conversationRef = doc(db, 'ai_conversations', currentUser.email);

        const unsubscribe = onSnapshot(conversationRef, (docSnap) => {
            try {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const messages = (data.messages || [])
                        .map(msg => ({
                            ...msg,
                            timestamp: msg.timestamp?.toDate?.() || new Date(msg.timestamp)
                        }))
                        .sort((a, b) => a.timestamp - b.timestamp);

                    console.log('Received chat history update:', messages);
                    setChatHistory(messages);
                } else {
                    console.log('No conversation document exists yet');
                    setChatHistory([]);
                }
            } catch (error) {
                console.error('Error processing chat history update:', error);
                toast.error('Failed to load chat history');
            }
        });

        return () => {
            console.log('Cleaning up chat history listener');
            unsubscribe();
        };
    }, [currentUser]);

    const sendMessage = useCallback(async (message, context) => {
        if (!message.trim()) return;

        try {
            setIsLoading(true);
            setError(null);
            const timestamp = new Date().toISOString();

            // Add user message to chat immediately
            const userMessage = {
                id: `user-${timestamp}`,
                role: 'user',
                content: message,
                timestamp
            };

            // Update chat history with user message
            setChatHistory(prev => [...prev, userMessage]);

            // Save user message to Firestore
            try {
                await saveMessage(userMessage, 'user');
                console.log('User message saved successfully');
            } catch (error) {
                console.error('Error saving user message:', error);
            }

            let response;
            console.log('Processing message:', message);

            // Check if the message is asking about a specific project
            const projectNameMatch = message.match(/(?:in|about|for|of|project\s+)["']?([^"'\s]+)["']?/i);

            if (projectNameMatch) {
                const projectName = projectNameMatch[1].trim();
                console.log('Looking for project:', projectName);

                // Query Firestore for the project
                const projectsRef = collection(db, 'projects');
                const projectsSnap = await getDocs(projectsRef);
                const projectDoc = projectsSnap.docs.find(doc =>
                    doc.data().name.toLowerCase() === projectName.toLowerCase()
                );

                if (projectDoc) {
                    const projectData = { id: projectDoc.id, ...projectDoc.data() };
                    console.log('Found project:', projectData.name);

                    // Get AI response with project context
                    response = await aiService.generateResponse(message, {
                        ...projectData,
                        userEmail: currentUser?.email
                    });
                } else {
                    response = `I couldn't find a project named "${projectName}". Please check the project name and try again.`;
                }
            } else {
                // Use current project context if available
                response = await aiService.generateResponse(message, {
                    ...projectContext,
                    userEmail: currentUser?.email
                });
            }

            if (!response) {
                throw new Error('No response received from AI service');
            }

            console.log('AI response received:', response);

            // Create AI message
            const aiMessage = {
                id: `ai-${new Date().toISOString()}`,
                role: 'assistant',
                content: response,
                timestamp: new Date().toISOString()
            };

            // Update chat history with AI response
            setChatHistory(prev => [...prev, aiMessage]);

            // Save AI message to Firestore
            try {
                await saveMessage(aiMessage, 'assistant');
                console.log('AI message saved successfully');
            } catch (error) {
                console.error('Error saving AI message:', error);
            }

        } catch (error) {
            console.error('Error in sendMessage:', error);
            setError('Failed to process message');
            toast.error('Failed to get AI response');
        } finally {
            setIsLoading(false);
        }
    }, [currentUser?.email, projectContext]);

    // Specialized handlers
    const analyzeProject = useCallback(async (projectData) => {
        setIsLoading(true);
        try {
            const analysis = await aiService.analyzeProject(projectData);
            await saveMessage({
                role: 'system',
                content: 'Project Analysis Completed',
                analysis,
                timestamp: new Date()
            });
            return analysis;
        } catch (error) {
            console.error('Project Analysis Error:', error);
            toast.error('Failed to analyze project');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const suggestDeadlines = useCallback(async (tasks) => {
        setIsLoading(true);
        try {
            const suggestions = await aiService.suggestDeadlines(tasks, projectContext);
            await saveMessage({
                role: 'system',
                content: 'Deadline Suggestions Generated',
                suggestions,
                timestamp: new Date()
            });
            return suggestions;
        } catch (error) {
            console.error('Deadline Suggestion Error:', error);
            toast.error('Failed to suggest deadlines');
        } finally {
            setIsLoading(false);
        }
    }, [projectContext]);

    const getFeatureHelp = useCallback(async (featureName) => {
        setIsLoading(true);
        try {
            const help = await aiService.getFeatureHelp(featureName);
            await saveMessage({
                role: 'system',
                content: `Feature Help: ${featureName}`,
                help,
                timestamp: new Date()
            });
            return help;
        } catch (error) {
            console.error('Feature Help Error:', error);
            toast.error('Failed to get feature help');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const suggestWorkflow = useCallback(async (projectType, teamSize) => {
        setIsLoading(true);
        try {
            const workflow = await aiService.suggestWorkflow(projectType, teamSize);
            await saveMessage({
                role: 'system',
                content: 'Workflow Suggestion Generated',
                workflow,
                timestamp: new Date()
            });
            return workflow;
        } catch (error) {
            console.error('Workflow Suggestion Error:', error);
            toast.error('Failed to suggest workflow');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const clearHistory = useCallback(() => {
        setChatHistory([]);
    }, []);

    const updateProjectContext = useCallback(async (newContext) => {
        if (!newContext?.id) return;

        try {
            // Get fresh project data
            const projectRef = doc(db, 'projects', newContext.id);
            const projectSnap = await getDoc(projectRef);

            if (projectSnap.exists()) {
                const projectData = projectSnap.data();

                // Get all collections in parallel
                const [reviewsSnap, tasksSnap, membersSnap] = await Promise.all([
                    getDocs(collection(projectRef, 'reviews')),
                    getDocs(collection(projectRef, 'tasks')),
                    getDocs(collection(projectRef, 'members'))
                ]);

                const reviews = reviewsSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    timestamp: doc.data().timestamp?.toDate()
                }));

                const tasks = tasksSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate(),
                    updatedAt: doc.data().updatedAt?.toDate()
                }));

                const members = membersSnap.docs.map(doc => ({
                    email: doc.id,
                    ...doc.data(),
                    lastActive: doc.data().lastActive?.toDate()
                }));

                setProjectContext({
                    id: newContext.id,
                    projectName: projectData.name,
                    status: projectData.status,
                    owner: projectData.owner,
                    team: projectData.team || [],
                    reviews,
                    tasks,
                    members,
                    lastModified: projectData.lastModified?.toDate()
                });
            }
        } catch (error) {
            console.error('Error updating project context:', error);
            toast.error('Failed to update project context');
        }
    }, []);

    // Add new specialized handlers
    const analyzeReviewPatterns = useCallback(async (reviews) => {
        setIsLoading(true);
        try {
            const patterns = await aiService.analyzeReviewPatterns(reviews);
            await saveMessage({
                role: 'system',
                content: 'Review Pattern Analysis',
                patterns,
                timestamp: new Date()
            });
            return patterns;
        } catch (error) {
            console.error('Review Pattern Analysis Error:', error);
            toast.error('Failed to analyze review patterns');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const analyzeTaskHistory = useCallback(async (tasks, userId) => {
        setIsLoading(true);
        try {
            const history = await aiService.analyzeTaskHistory(tasks, userId);
            await saveMessage({
                role: 'system',
                content: 'Task History Analysis',
                history,
                timestamp: new Date()
            });
            return history;
        } catch (error) {
            console.error('Task History Analysis Error:', error);
            toast.error('Failed to analyze task history');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const getReviewSummary = useCallback(async (projectId, timeframe) => {
        setIsLoading(true);
        try {
            const summary = await aiService.getReviewSummary(projectId, timeframe);
            await saveMessage({
                role: 'system',
                content: 'Review Summary Generated',
                summary,
                timestamp: new Date()
            });
            return summary;
        } catch (error) {
            console.error('Review Summary Error:', error);
            toast.error('Failed to generate review summary');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const getFeedbackInsights = useCallback(async (reviews, tasks) => {
        setIsLoading(true);
        try {
            const insights = await aiService.getFeedbackInsights(reviews, tasks);
            await saveMessage({
                role: 'system',
                content: 'Feedback Insights Generated',
                insights,
                timestamp: new Date()
            });
            return insights;
        } catch (error) {
            console.error('Feedback Insights Error:', error);
            toast.error('Failed to generate feedback insights');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createMessageTemplate = useCallback(async (context, type) => {
        setIsLoading(true);
        try {
            const template = await aiService.createMessageTemplate(context, type);
            await saveMessage({
                role: 'system',
                content: 'Message Template Created',
                template,
                timestamp: new Date()
            });
            return template;
        } catch (error) {
            console.error('Message Template Error:', error);
            toast.error('Failed to create message template');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const suggestProjectMessage = useCallback(async (context, messageType) => {
        setIsLoading(true);
        try {
            const suggestion = await aiService.suggestProjectMessage(context, messageType);
            await saveMessage({
                role: 'system',
                content: 'Project Message Suggested',
                suggestion,
                timestamp: new Date()
            });
            return suggestion;
        } catch (error) {
            console.error('Project Message Error:', error);
            toast.error('Failed to suggest project message');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const generateTemplateOptions = useCallback(async (context) => {
        setIsLoading(true);
        try {
            const options = await aiService.generateTemplateOptions(context);
            await saveMessage({
                role: 'system',
                content: 'Template Options Generated',
                options,
                timestamp: new Date()
            });
            return options;
        } catch (error) {
            console.error('Template Options Error:', error);
            toast.error('Failed to generate template options');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createChatMessage = useCallback(async (context, type, additionalContext) => {
        setIsLoading(true);
        try {
            const message = await aiService.createChatMessage(context, type, additionalContext);
            await saveMessage({
                role: 'system',
                content: 'Chat Message Created',
                message,
                timestamp: new Date()
            });
            return message;
        } catch (error) {
            console.error('Chat Message Error:', error);
            toast.error('Failed to create chat message');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const value = {
        isLoading,
        chatHistory,
        error,
        projectContext,
        sendMessage,
        analyzeProject,
        suggestDeadlines,
        getFeatureHelp,
        suggestWorkflow,
        clearHistory,
        updateProjectContext,
        analyzeReviewPatterns,
        analyzeTaskHistory,
        getReviewSummary,
        getFeedbackInsights,
        createMessageTemplate,
        suggestProjectMessage,
        generateTemplateOptions,
        createChatMessage
    };

    return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
};

export default AIContext; 