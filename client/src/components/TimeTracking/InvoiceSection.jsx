import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiDollarSign, FiDownload, FiPlus, FiClock, FiCheck, FiAlertCircle, FiUser, FiCalendar, FiFileText } from 'react-icons/fi';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const INVOICE_TEMPLATES = {
    default: {
        name: 'Default',
        style: `
      body { font-family: Arial, sans-serif; margin: 0; padding: 40px; color: #333; }
      .invoice-header { margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
      .client-details { margin-bottom: 30px; }
      .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
      .table th, .table td { padding: 12px; border: 1px solid #ddd; text-align: left; }
      .table th { background-color: #f8f9fa; }
      .total { margin-top: 30px; text-align: right; font-size: 1.2em; }
      .payment-instructions { margin-top: 40px; padding: 20px; background-color: #f8f9fa; border-radius: 4px; }
      .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #eee; font-size: 0.9em; color: #666; }
    `
    },
    professional: {
        name: 'Professional',
        style: `
      body { font-family: 'Helvetica Neue', sans-serif; margin: 0; padding: 40px; color: var(--secondary-foreground); background: var(--background); }
      .invoice-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
      .client-details { background: var(--foreground); padding: 25px; border-radius: 8px; margin-bottom: 40px; }
      .table { width: 100%; border-collapse: separate; border-spacing: 0 8px; }
      .table th { background: var(--primary); color: var(--primary-foreground); padding: 15px; }
      .table td { background: var(--foreground); padding: 15px; }
      .total { background: var(--primary); color: var(--primary-foreground); padding: 20px; border-radius: 8px; text-align: right; }
      .payment-instructions { margin-top: 40px; background: var(--foreground); padding: 25px; border-radius: 8px; }
      .footer { margin-top: 40px; padding: 20px; border-top: 1px solid var(--border); }
    `
    },
    minimal: {
        name: 'Minimal',
        style: `
      body { font-family: -apple-system, system-ui, sans-serif; margin: 0; padding: 40px; color: var(--secondary-foreground); background: var(--background); }
      .invoice-header { margin-bottom: 40px; }
      .client-details { margin-bottom: 40px; }
      .table { width: 100%; margin-bottom: 40px; }
      .table th, .table td { padding: 12px 0; border-bottom: 1px solid var(--border); }
      .table th { font-weight: 500; }
      .total { margin-top: 20px; text-align: right; }
      .payment-instructions { margin-top: 40px; }
      .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid var(--border); }
    `
    }
};

const InvoiceSection = ({ projectId }) => {
    const { currentUser } = useAuth();
    const [timeEntries, setTimeEntries] = useState([]);
    const [selectedEntries, setSelectedEntries] = useState(new Set());
    const [clientDetails, setClientDetails] = useState({
        name: '',
        email: '',
        company: '',
        address: ''
    });
    const [paymentDetails, setPaymentDetails] = useState({
        method: 'bank',
        bankDetails: {
            bankName: '',
            accountName: '',
            accountNumber: '',
            swiftCode: '',
            iban: ''
        },
        paypalEmail: '',
        payoneerEmail: '',
        otherInstructions: ''
    });
    const [selectedTemplate, setSelectedTemplate] = useState('default');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [hourlyRates, setHourlyRates] = useState({});
    const [projectData, setProjectData] = useState(null);

    useEffect(() => {
        const loadProjectData = async () => {
            try {
                const projectRef = doc(db, 'projects', projectId);
                const projectDoc = await getDoc(projectRef);

                if (projectDoc.exists()) {
                    const data = projectDoc.data();
                    setProjectData(data);
                    setTimeEntries(data.timeEntries || []);

                    if (data.clientDetails) {
                        setClientDetails(data.clientDetails);
                    }
                    if (data.paymentDetails) {
                        setPaymentDetails(data.paymentDetails);
                    }

                    // Generate invoice number
                    const timestamp = new Date().getTime();
                    const random = Math.floor(Math.random() * 1000);
                    setInvoiceNumber(`INV-${timestamp}-${random}`);
                }
            } catch (error) {
                console.error('Error loading project data:', error);
                toast.error('Failed to load project data');
            }
        };

        loadProjectData();
    }, [projectId]);

    const calculateTotal = () => {
        return timeEntries
            .filter(entry => selectedEntries.has(entry.id))
            .reduce((total, entry) => {
                const hours = entry.duration / 3600; // Convert seconds to hours
                const rate = hourlyRates[entry.taskId] || 0;
                return total + (hours * rate);
            }, 0);
    };

    const handleGenerateInvoice = async () => {
        if (selectedEntries.size === 0) {
            toast.error('Please select time entries to include in the invoice');
            return;
        }

        if (!clientDetails.name || !clientDetails.email) {
            toast.error('Please fill in client name and email');
            return;
        }

        try {
            const selectedTimeEntries = timeEntries.filter(entry => selectedEntries.has(entry.id));
            const template = INVOICE_TEMPLATES[selectedTemplate];
            const total = calculateTotal();

            // Group entries by task
            const entriesByTask = selectedTimeEntries.reduce((acc, entry) => {
                if (!acc[entry.taskId]) {
                    acc[entry.taskId] = [];
                }
                acc[entry.taskId].push(entry);
                return acc;
            }, {});

            // Generate payment instructions
            let paymentInstructions = '';
            switch (paymentDetails.method) {
                case 'bank':
                    paymentInstructions = `
            Bank Transfer Details:
            Bank Name: ${paymentDetails.bankDetails.bankName}
            Account Name: ${paymentDetails.bankDetails.accountName}
            Account Number: ${paymentDetails.bankDetails.accountNumber}
            SWIFT Code: ${paymentDetails.bankDetails.swiftCode}
            IBAN: ${paymentDetails.bankDetails.iban}
          `;
                    break;
                case 'paypal':
                    paymentInstructions = `PayPal Payment: Send payment to ${paymentDetails.paypalEmail}`;
                    break;
                case 'payoneer':
                    paymentInstructions = `Payoneer Payment: Send payment to ${paymentDetails.payoneerEmail}`;
                    break;
                default:
                    paymentInstructions = paymentDetails.otherInstructions;
            }

            // Generate invoice HTML
            const invoiceHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>${template.style}</style>
          </head>
          <body>
            <div class="invoice-header">
              <h1>Invoice</h1>
              <div>
                <p>Invoice Number: ${invoiceNumber}</p>
                <p>Date: ${new Date().toLocaleDateString()}</p>
                <p>Due Date: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
              </div>
            </div>

            <div class="client-details">
              <h2>Bill To:</h2>
              <p>${clientDetails.name}</p>
              <p>${clientDetails.company}</p>
              <p>${clientDetails.address}</p>
              <p>${clientDetails.email}</p>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Hours</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(entriesByTask).map(([taskId, entries]) => {
                const totalHours = entries.reduce((sum, e) => sum + (e.duration / 3600), 0);
                const rate = hourlyRates[taskId] || 0;
                const amount = rate * totalHours;
                return `
                    <tr>
                      <td>${entries[0].taskDescription}</td>
                      <td>${totalHours.toFixed(2)}</td>
                      <td>$${rate}/hr</td>
                      <td>$${amount.toFixed(2)}</td>
                    </tr>
                  `;
            }).join('')}
              </tbody>
            </table>

            <div class="total">
              <h3>Total Amount: $${total.toFixed(2)}</h3>
            </div>

            <div class="payment-instructions">
              <h3>Payment Instructions</h3>
              <pre>${paymentInstructions}</pre>
              <p>Please include invoice number ${invoiceNumber} in your payment reference.</p>
            </div>

            <div class="footer">
              <p>Payment is due within 30 days. Thank you for your business!</p>
            </div>
          </body>
        </html>
      `;

            // Create and download invoice
            const blob = new Blob([invoiceHTML], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${invoiceNumber}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Save invoice to project
            const projectRef = doc(db, 'projects', projectId);
            await updateDoc(projectRef, {
                invoices: arrayUnion({
                    id: invoiceNumber,
                    createdAt: new Date().toISOString(),
                    timeEntries: selectedTimeEntries.map(e => e.id),
                    total,
                    clientDetails,
                    paymentDetails,
                    template: selectedTemplate
                }),
                clientDetails,
                paymentDetails
            });

            toast.success('Invoice generated successfully');
        } catch (error) {
            console.error('Error generating invoice:', error);
            toast.error('Failed to generate invoice');
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Invoicing</h2>
                <button
                    onClick={handleGenerateInvoice}
                    disabled={selectedEntries.size === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FiDownload className="w-4 h-4" />
                    Generate Invoice
                </button>
            </div>

            {/* Template Selection */}
            <div className="bg-card rounded-lg border border-border p-4">
                <h3 className="text-lg font-medium text-foreground mb-4">Invoice Template</h3>
                <div className="grid grid-cols-3 gap-4">
                    {Object.entries(INVOICE_TEMPLATES).map(([key, template]) => (
                        <button
                            key={key}
                            onClick={() => setSelectedTemplate(key)}
                            className={`p-4 rounded-lg border-2 transition-colors ${selectedTemplate === key
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-primary/50'
                                }`}
                        >
                            <span className="text-foreground">{template.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Client Details */}
            <div className="bg-card rounded-lg border border-border p-4">
                <h3 className="text-lg font-medium text-foreground mb-4">Client Details</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                            Client Name
                        </label>
                        <input
                            type="text"
                            value={clientDetails.name}
                            onChange={(e) => setClientDetails(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 bg-input text-foreground rounded-md border border-input"
                            placeholder="Enter client name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={clientDetails.email}
                            onChange={(e) => setClientDetails(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-3 py-2 bg-input text-foreground rounded-md border border-input"
                            placeholder="Enter client email"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                            Company
                        </label>
                        <input
                            type="text"
                            value={clientDetails.company}
                            onChange={(e) => setClientDetails(prev => ({ ...prev, company: e.target.value }))}
                            className="w-full px-3 py-2 bg-input text-foreground rounded-md border border-input"
                            placeholder="Enter company name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                            Address
                        </label>
                        <input
                            type="text"
                            value={clientDetails.address}
                            onChange={(e) => setClientDetails(prev => ({ ...prev, address: e.target.value }))}
                            className="w-full px-3 py-2 bg-input text-foreground rounded-md border border-input"
                            placeholder="Enter address"
                        />
                    </div>
                </div>
            </div>

            {/* Payment Details */}
            <div className="bg-card rounded-lg border border-border p-4">
                <h3 className="text-lg font-medium text-foreground mb-4">Payment Details</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                            Payment Method
                        </label>
                        <select
                            value={paymentDetails.method}
                            onChange={(e) => setPaymentDetails(prev => ({ ...prev, method: e.target.value }))}
                            className="w-full px-3 py-2 bg-input text-foreground rounded-md border border-input"
                        >
                            <option value="bank">Bank Transfer</option>
                            <option value="paypal">PayPal</option>
                            <option value="payoneer">Payoneer</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    {paymentDetails.method === 'bank' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">
                                    Bank Name
                                </label>
                                <input
                                    type="text"
                                    value={paymentDetails.bankDetails.bankName}
                                    onChange={(e) => setPaymentDetails(prev => ({
                                        ...prev,
                                        bankDetails: { ...prev.bankDetails, bankName: e.target.value }
                                    }))}
                                    className="w-full px-3 py-2 bg-input text-foreground rounded-md border border-input"
                                    placeholder="Enter bank name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">
                                    Account Name
                                </label>
                                <input
                                    type="text"
                                    value={paymentDetails.bankDetails.accountName}
                                    onChange={(e) => setPaymentDetails(prev => ({
                                        ...prev,
                                        bankDetails: { ...prev.bankDetails, accountName: e.target.value }
                                    }))}
                                    className="w-full px-3 py-2 bg-input text-foreground rounded-md border border-input"
                                    placeholder="Enter account name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">
                                    Account Number
                                </label>
                                <input
                                    type="text"
                                    value={paymentDetails.bankDetails.accountNumber}
                                    onChange={(e) => setPaymentDetails(prev => ({
                                        ...prev,
                                        bankDetails: { ...prev.bankDetails, accountNumber: e.target.value }
                                    }))}
                                    className="w-full px-3 py-2 bg-input text-foreground rounded-md border border-input"
                                    placeholder="Enter account number"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">
                                    SWIFT Code
                                </label>
                                <input
                                    type="text"
                                    value={paymentDetails.bankDetails.swiftCode}
                                    onChange={(e) => setPaymentDetails(prev => ({
                                        ...prev,
                                        bankDetails: { ...prev.bankDetails, swiftCode: e.target.value }
                                    }))}
                                    className="w-full px-3 py-2 bg-input text-foreground rounded-md border border-input"
                                    placeholder="Enter SWIFT code"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-muted-foreground mb-1">
                                    IBAN
                                </label>
                                <input
                                    type="text"
                                    value={paymentDetails.bankDetails.iban}
                                    onChange={(e) => setPaymentDetails(prev => ({
                                        ...prev,
                                        bankDetails: { ...prev.bankDetails, iban: e.target.value }
                                    }))}
                                    className="w-full px-3 py-2 bg-input text-foreground rounded-md border border-input"
                                    placeholder="Enter IBAN"
                                />
                            </div>
                        </div>
                    )}

                    {paymentDetails.method === 'paypal' && (
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">
                                PayPal Email
                            </label>
                            <input
                                type="email"
                                value={paymentDetails.paypalEmail}
                                onChange={(e) => setPaymentDetails(prev => ({ ...prev, paypalEmail: e.target.value }))}
                                className="w-full px-3 py-2 bg-input text-foreground rounded-md border border-input"
                                placeholder="Enter PayPal email"
                            />
                        </div>
                    )}

                    {paymentDetails.method === 'payoneer' && (
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">
                                Payoneer Email
                            </label>
                            <input
                                type="email"
                                value={paymentDetails.payoneerEmail}
                                onChange={(e) => setPaymentDetails(prev => ({ ...prev, payoneerEmail: e.target.value }))}
                                className="w-full px-3 py-2 bg-input text-foreground rounded-md border border-input"
                                placeholder="Enter Payoneer email"
                            />
                        </div>
                    )}

                    {paymentDetails.method === 'other' && (
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">
                                Payment Instructions
                            </label>
                            <textarea
                                value={paymentDetails.otherInstructions}
                                onChange={(e) => setPaymentDetails(prev => ({ ...prev, otherInstructions: e.target.value }))}
                                className="w-full px-3 py-2 bg-input text-foreground rounded-md border border-input"
                                placeholder="Enter payment instructions"
                                rows={4}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Time Entries */}
            <div className="bg-card rounded-lg border border-border p-4">
                <h3 className="text-lg font-medium text-foreground mb-4">Time Entries</h3>
                <div className="space-y-4">
                    {timeEntries.length > 0 ? (
                        timeEntries.map(entry => (
                            <div
                                key={entry.id}
                                className="flex items-center justify-between p-4 bg-muted rounded-lg"
                            >
                                <div className="flex items-center gap-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedEntries.has(entry.id)}
                                        onChange={() => {
                                            const newSelected = new Set(selectedEntries);
                                            if (newSelected.has(entry.id)) {
                                                newSelected.delete(entry.id);
                                            } else {
                                                newSelected.add(entry.id);
                                            }
                                            setSelectedEntries(newSelected);
                                        }}
                                        className="w-4 h-4 rounded border-input"
                                    />
                                    <div>
                                        <div className="font-medium text-foreground">
                                            {entry.taskDescription}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {new Date(entry.startTime).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="font-medium text-foreground">
                                            {(entry.duration / 3600).toFixed(2)} hours
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-sm text-muted-foreground">Rate:</label>
                                            <input
                                                type="number"
                                                value={hourlyRates[entry.taskId] || ''}
                                                onChange={(e) => setHourlyRates(prev => ({
                                                    ...prev,
                                                    [entry.taskId]: Number(e.target.value)
                                                }))}
                                                className="w-20 px-2 py-1 bg-input text-foreground rounded border border-input text-right"
                                                placeholder="$/hr"
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            No time entries available
                        </div>
                    )}
                </div>

                {selectedEntries.size > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-medium text-foreground">Total Amount</span>
                            <span className="text-2xl font-bold text-foreground">
                                ${calculateTotal().toFixed(2)}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InvoiceSection; 