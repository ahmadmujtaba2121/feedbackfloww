import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiDollarSign, FiDownload, FiMail, FiPrinter, FiClock, FiCalendar, FiUser } from 'react-icons/fi';
import { useTask } from '../../contexts/TaskContext';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const InvoiceSection = ({ projectId }) => {
    const { tasks } = useTask();
    const { currentUser } = useAuth();
    const [invoices, setInvoices] = useState([]);
    const [showNewInvoice, setShowNewInvoice] = useState(false);
    const [selectedTasks, setSelectedTasks] = useState([]);
    const [invoiceDetails, setInvoiceDetails] = useState({
        rate: 0,
        currency: 'USD',
        client: '',
        dueDate: '',
        notes: ''
    });

    // Calculate billable time for tasks
    const taskTimeDetails = useMemo(() => {
        return tasks.map(task => ({
            id: task.id,
            title: task.title,
            assignedTo: task.assignedTo,
            totalTime: task.totalTime || 0,
            timeLogs: task.timeLogs || [],
            billableAmount: ((task.totalTime || 0) / 3600) * invoiceDetails.rate
        }));
    }, [tasks, invoiceDetails.rate]);

    // Group time by user
    const timeByUser = useMemo(() => {
        const userTime = {};
        tasks.forEach(task => {
            if (task.timeLogs) {
                task.timeLogs.forEach(log => {
                    if (!userTime[log.userId]) {
                        userTime[log.userId] = {
                            totalTime: 0,
                            tasks: new Set()
                        };
                    }
                    userTime[log.userId].totalTime += log.duration;
                    userTime[log.userId].tasks.add(task.id);
                });
            }
        });
        return userTime;
    }, [tasks]);

    const handleCreateInvoice = async () => {
        try {
            const invoiceData = {
                id: `invoice-${Date.now()}`,
                projectId,
                tasks: selectedTasks.map(taskId => {
                    const task = taskTimeDetails.find(t => t.id === taskId);
                    return {
                        taskId,
                        title: task.title,
                        time: task.totalTime,
                        amount: task.billableAmount
                    };
                }),
                rate: invoiceDetails.rate,
                currency: invoiceDetails.currency,
                client: invoiceDetails.client,
                dueDate: invoiceDetails.dueDate,
                notes: invoiceDetails.notes,
                totalAmount: selectedTasks.reduce((sum, taskId) => {
                    const task = taskTimeDetails.find(t => t.id === taskId);
                    return sum + task.billableAmount;
                }, 0),
                createdAt: new Date().toISOString(),
                createdBy: currentUser?.email,
                status: 'draft'
            };

            // Save invoice to Firestore
            // await addInvoice(invoiceData);

            setShowNewInvoice(false);
            toast.success('Invoice created successfully');
        } catch (error) {
            console.error('Error creating invoice:', error);
            toast.error('Failed to create invoice');
        }
    };

    const formatDuration = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: invoiceDetails.currency
        }).format(amount);
    };

    return (
        <div className="bg-background p-6 rounded-lg border border-border">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-foreground">Invoicing</h2>
                <button
                    onClick={() => setShowNewInvoice(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <FiDollarSign className="w-4 h-4" />
                    New Invoice
                </button>
            </div>

            {/* Time Summary by User */}
            <div className="mb-6">
                <h3 className="text-lg font-medium text-foreground mb-4">Time Summary by User</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(timeByUser).map(([userId, data]) => (
                        <div key={userId} className="p-4 bg-card rounded-lg border border-border">
                            <div className="flex items-center gap-2 mb-2">
                                <FiUser className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{userId}</span>
                            </div>
                            <div className="text-2xl font-bold text-foreground mb-1">
                                {formatDuration(data.totalTime)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {data.tasks.size} tasks worked on
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Task Time Details */}
            <div className="mb-6">
                <h3 className="text-lg font-medium text-foreground mb-4">Task Time Details</h3>
                <div className="space-y-4">
                    {taskTimeDetails.map(task => (
                        <div key={task.id} className="p-4 bg-card rounded-lg border border-border">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-medium text-foreground">{task.title}</h4>
                                    <div className="text-sm text-muted-foreground">
                                        Assigned to: {task.assignedTo || 'Unassigned'}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-foreground">
                                        {formatDuration(task.totalTime)}
                                    </div>
                                    {invoiceDetails.rate > 0 && (
                                        <div className="text-sm text-primary">
                                            {formatCurrency(task.billableAmount)}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Time Log Details */}
                            <div className="mt-4 space-y-2">
                                {task.timeLogs.map((log, index) => (
                                    <div key={index} className="text-sm text-muted-foreground flex justify-between">
                                        <span>{new Date(log.startTime).toLocaleDateString()}</span>
                                        <span>{formatDuration(log.duration)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Invoice Creation Modal */}
            {showNewInvoice && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
                >
                    <div className="bg-card p-6 rounded-lg border border-border w-full max-w-2xl">
                        <h3 className="text-lg font-medium text-foreground mb-4">Create New Invoice</h3>
                        {/* Invoice creation form */}
                        <div className="space-y-4">
                            {/* Rate and Currency */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                                        Hourly Rate
                                    </label>
                                    <input
                                        type="number"
                                        value={invoiceDetails.rate}
                                        onChange={(e) => setInvoiceDetails(prev => ({ ...prev, rate: parseFloat(e.target.value) }))}
                                        className="w-full px-3 py-2 bg-input text-foreground rounded-md border border-input"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                                        Currency
                                    </label>
                                    <select
                                        value={invoiceDetails.currency}
                                        onChange={(e) => setInvoiceDetails(prev => ({ ...prev, currency: e.target.value }))}
                                        className="w-full px-3 py-2 bg-input text-foreground rounded-md border border-input"
                                    >
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="GBP">GBP</option>
                                    </select>
                                </div>
                            </div>

                            {/* Task Selection */}
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">
                                    Select Tasks to Invoice
                                </label>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {taskTimeDetails.map(task => (
                                        <label key={task.id} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={selectedTasks.includes(task.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedTasks(prev => [...prev, task.id]);
                                                    } else {
                                                        setSelectedTasks(prev => prev.filter(id => id !== task.id));
                                                    }
                                                }}
                                                className="rounded border-input"
                                            />
                                            <span className="text-sm text-foreground">{task.title}</span>
                                            <span className="text-sm text-muted-foreground ml-auto">
                                                {formatDuration(task.totalTime)}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowNewInvoice(false)}
                                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateInvoice}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                                >
                                    Create Invoice
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default InvoiceSection; 