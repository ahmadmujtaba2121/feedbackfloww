import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { FiDownload, FiDollarSign, FiPlus, FiClock, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { generateInvoiceNumber } from '../../utils/timeTracking';
import { cn } from '../../utils/cn';

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

const InvoiceGenerator = ({ projectId }) => {
  const [timeEntries, setTimeEntries] = useState([]);
  const [projectData, setProjectData] = useState(null);
  const [selectedEntries, setSelectedEntries] = useState(new Set());
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [paymentDetails, setPaymentDetails] = useState({
    method: 'bank', // 'bank', 'paypal', 'payoneer', 'other'
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
  const [clientDetails, setClientDetails] = useState({
    name: '',
    email: '',
    address: '',
    company: ''
  });
  const [selectedTemplate, setSelectedTemplate] = useState('default');
  const [invoiceStatus, setInvoiceStatus] = useState('draft');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [amountPaid, setAmountPaid] = useState(0);
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    const loadProjectData = async () => {
      try {
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);
        if (projectDoc.exists()) {
          const data = projectDoc.data();
          data.tasks = Array.isArray(data.tasks) ? data.tasks : [];
          setProjectData(data);
          setTimeEntries(data.timeEntries || []);
          console.log('Loaded time entries:', data.timeEntries); // Debug log
          // Load saved client details if available
          if (data.clientDetails) {
            setClientDetails(data.clientDetails);
          }
          // Load saved payment details if available
          if (data.paymentDetails) {
            setPaymentDetails(data.paymentDetails);
          }
          setInvoiceNumber(generateInvoiceNumber());
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
      .filter(entry => selectedEntries.has(entry.timestamp))
      .reduce((total, entry) => {
        const hours = entry.duration / 3600; // Convert seconds to hours
        const rate = entry.hourlyRate || 0;
        return total + (hours * rate);
      }, 0);
  };

  const generateInvoice = async () => {
    const selectedTimeEntries = timeEntries.filter(entry =>
      selectedEntries.has(entry.timestamp)
    );

    if (selectedTimeEntries.length === 0) {
      toast.error('Please select time entries to include in the invoice');
      return;
    }

    if (!clientDetails.name || !clientDetails.email) {
      toast.error('Please fill in client name and email');
      return;
    }

    // Group entries by task
    const entriesByTask = selectedTimeEntries.reduce((acc, entry) => {
      if (!acc[entry.taskId]) {
        acc[entry.taskId] = [];
      }
      acc[entry.taskId].push(entry);
      return acc;
    }, {});

    // Generate payment instructions based on selected method
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
        paymentInstructions = `
          PayPal Payment:
          Send payment to: ${paymentDetails.paypalEmail}
        `;
        break;
      case 'payoneer':
        paymentInstructions = `
          Payoneer Payment:
          Send payment to: ${paymentDetails.payoneerEmail}
        `;
        break;
      case 'other':
        paymentInstructions = paymentDetails.otherInstructions;
        break;
    }

    const template = INVOICE_TEMPLATES[selectedTemplate];

    // Generate invoice HTML with selected template
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            ${template.style}
          </style>
        </head>
        <body>
          <div class="invoice-header">
            <h1>Invoice</h1>
            <div>
              <p>Invoice Number: ${invoiceNumber}</p>
              <p>Date: ${new Date().toLocaleDateString()}</p>
              <p>Due Date: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
              <p>Status: ${invoiceStatus.toUpperCase()}</p>
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
                <th>Description</th>
                <th>Hours</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(entriesByTask).map(([taskId, entries]) => {
      const task = findTask(taskId);
      const totalHours = entries.reduce((sum, e) => sum + (e.duration / 3600), 0);
      const amount = entries[0].hourlyRate * totalHours;
      const taskDescription = task?.description || entries[0].description || entries[0].taskDescription || 'Untitled Task';
      return `
                  <tr>
                    <td>${taskDescription}</td>
                    <td>${totalHours.toFixed(2)}</td>
                    <td>$${entries[0].hourlyRate}/hr</td>
                    <td>$${amount.toFixed(2)}</td>
                  </tr>
                `;
    }).join('')}
            </tbody>
          </table>

          <div class="total">
            <h3>Total Amount: $${calculateTotal().toFixed(2)}</h3>
            ${amountPaid > 0 ? `
              <p>Amount Paid: $${amountPaid.toFixed(2)}</p>
              <p>Balance Due: $${(calculateTotal() - amountPaid).toFixed(2)}</p>
            ` : ''}
          </div>

          <div class="payment-instructions">
            <h3>Payment Instructions</h3>
            <pre>${paymentInstructions}</pre>
            <p>Please include invoice number ${invoiceNumber} in your payment reference.</p>
          </div>

          <div class="footer">
            <p>Payment is due within 30 days. Thank you for your business!</p>
            ${paymentStatus !== 'pending' ? `
              <p>Payment Status: ${paymentStatus.toUpperCase()}</p>
              <p>Last Payment Date: ${new Date().toLocaleDateString()}</p>
            ` : ''}
          </div>
        </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([invoiceHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoiceNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Save invoice to project with enhanced tracking
    await saveInvoice(selectedTimeEntries, calculateTotal());

    toast.success('Invoice generated successfully');
  };

  const saveInvoice = async (selectedEntries, total) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const invoice = {
        id: `inv-${Date.now()}`,
        number: invoiceNumber,
        createdAt: new Date().toISOString(),
        timeEntries: selectedEntries.map(entry => entry.id),
        totalAmount: total,
        amountPaid: amountPaid,
        clientDetails,
        paymentDetails,
        status: invoiceStatus,
        paymentStatus: paymentStatus,
        template: selectedTemplate,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        reminders: [],
        metadata: {
          lastModified: new Date().toISOString(),
          lastModifiedBy: projectData?.owner || 'unknown',
          version: '1.0'
        }
      };

      await updateDoc(projectRef, {
        invoices: [...(projectData.invoices || []), invoice],
        clientDetails,
        paymentDetails
      });

      // Update project data
      setProjectData(prev => ({
        ...prev,
        invoices: [...(prev.invoices || []), invoice]
      }));

    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('Failed to save invoice details');
    }
  };

  const findTask = (taskId) => {
    if (!Array.isArray(projectData?.tasks)) return null;
    // First try to find in tasks array
    const task = projectData.tasks.find(t => t.id === taskId);
    if (task) return task;

    // If not found in tasks, look in reviews that were converted to tasks
    const convertedReview = projectData.reviews?.find(r => r.convertedTaskId === taskId);
    if (convertedReview) {
      return {
        description: convertedReview.comment,
        id: taskId
      };
    }

    return null;
  };

  const renderTimeEntry = (entry) => {
    const task = findTask(entry.taskId);
    const hours = entry.duration / 3600;
    const rate = entry.hourlyRate || 0;
    const amount = hours * rate;

    return (
      <div
        key={entry.id || entry.timestamp}
        className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700/70 transition-colors"
      >
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={selectedEntries.has(entry.timestamp)}
            onChange={() => {
              const newSelected = new Set(selectedEntries);
              if (newSelected.has(entry.timestamp)) {
                newSelected.delete(entry.timestamp);
              } else {
                newSelected.add(entry.timestamp);
              }
              setSelectedEntries(newSelected);
            }}
            className="w-4 h-4 rounded border-slate-600 text-violet-500 focus:ring-violet-500 mr-3"
          />
          <div>
            <div className="text-white font-medium">
              {task?.description || entry.description || entry.taskDescription || 'Untitled Task'}
            </div>
            <div className="text-sm text-slate-400">
              Date: {new Date(entry.timestamp).toLocaleDateString()}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-white font-medium">
            ${amount.toFixed(2)}
          </div>
          <div className="text-sm text-slate-400">
            {hours.toFixed(2)} hrs @ ${rate}/hr
          </div>
        </div>
      </div>
    );
  };

  // Add template selection UI
  const renderTemplateSelector = () => (
    <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
      <h3 className="text-white font-medium mb-4">Invoice Template</h3>
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(INVOICE_TEMPLATES).map(([key, template]) => (
          <button
            key={key}
            onClick={() => setSelectedTemplate(key)}
            className={`p-4 rounded-lg border-2 transition-colors ${selectedTemplate === key
              ? 'border-violet-500 bg-violet-500/20'
              : 'border-slate-600 hover:border-violet-500/50'
              }`}
          >
            <span className="text-white">{template.name}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // Add invoice status UI
  const renderInvoiceStatus = () => (
    <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
      <h3 className="text-white font-medium mb-4">Invoice Status</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Invoice Status
          </label>
          <select
            value={invoiceStatus}
            onChange={(e) => setInvoiceStatus(e.target.value)}
            className="w-full bg-slate-600 text-white rounded px-3 py-2"
          >
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Payment Status
          </label>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="w-full bg-slate-600 text-white rounded px-3 py-2"
          >
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="completed">Completed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
        {paymentStatus === 'partial' && (
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Amount Paid
            </label>
            <input
              type="number"
              value={amountPaid}
              onChange={(e) => setAmountPaid(Number(e.target.value))}
              className="w-full bg-slate-600 text-white rounded px-3 py-2"
              min="0"
              step="0.01"
            />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-background/95 p-6 rounded-lg border border-border/40">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-primary-foreground">Invoicing</h2>
          <p className="text-sm text-muted-foreground/80">Create and manage your invoices</p>
        </div>
        <button
          onClick={generateInvoice}
          disabled={selectedEntries.size === 0}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg",
            "bg-primary/90 text-primary-foreground",
            "hover:bg-primary transition-colors",
            "disabled:opacity-50 disabled:pointer-events-none"
          )}
        >
          <FiDownload className="w-4 h-4" />
          Generate Invoice
        </button>
      </div>

      {/* Invoice Template Selection */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-primary-foreground">Invoice Template</h3>
          <span className="text-sm text-muted-foreground/80">Choose your preferred layout</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(INVOICE_TEMPLATES).map(([key, template]) => (
            <button
              key={key}
              onClick={() => setSelectedTemplate(key)}
              className={cn(
                "group relative p-4 rounded-lg border transition-colors text-left",
                selectedTemplate === key
                  ? "bg-accent/30 border-primary/40"
                  : "bg-card/30 border-border/40 hover:bg-accent/20"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                {selectedTemplate === key && (
                  <div className="absolute right-2 top-2">
                    <FiCheck className="w-4 h-4 text-primary" />
                  </div>
                )}
                <span className="font-medium text-primary-foreground">
                  {template.name}
                </span>
              </div>
              <p className="text-sm text-muted-foreground/80">
                {template.name === 'Default' && 'Clean and simple layout for professional invoices'}
                {template.name === 'Professional' && 'Modern design with enhanced visual hierarchy'}
                {template.name === 'Minimal' && 'Streamlined format focusing on essential details'}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Client Details */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-primary-foreground mb-4">Client Details</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-primary-foreground/90 mb-1">
              Client Name
            </label>
            <input
              type="text"
              placeholder="Enter client name"
              value={clientDetails.name}
              onChange={(e) => setClientDetails(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-card/30 text-primary-foreground rounded-lg border border-border/40 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-foreground/90 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter client email"
              value={clientDetails.email}
              onChange={(e) => setClientDetails(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 bg-card/30 text-primary-foreground rounded-lg border border-border/40 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-foreground/90 mb-1">
              Company
            </label>
            <input
              type="text"
              placeholder="Enter company name"
              value={clientDetails.company}
              onChange={(e) => setClientDetails(prev => ({ ...prev, company: e.target.value }))}
              className="w-full px-3 py-2 bg-card/30 text-primary-foreground rounded-lg border border-border/40 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-primary-foreground/90 mb-1">
              Address
            </label>
            <input
              type="text"
              placeholder="Enter address"
              value={clientDetails.address}
              onChange={(e) => setClientDetails(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-3 py-2 bg-card/30 text-primary-foreground rounded-lg border border-border/40 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-primary-foreground mb-4">Payment Details</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-primary-foreground/90 mb-1">
              Payment Method
            </label>
            <select
              value={paymentDetails.method}
              onChange={(e) => setPaymentDetails(prev => ({ ...prev, method: e.target.value }))}
              className="w-full px-3 py-2 bg-card/30 text-primary-foreground rounded-lg border border-border/40 focus:outline-none focus:ring-1 focus:ring-primary/40"
            >
              <option value="bank">Bank Transfer</option>
              <option value="paypal">PayPal</option>
              <option value="payoneer">Payoneer</option>
              <option value="other">Other</option>
            </select>
          </div>

          {paymentDetails.method === 'bank' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-primary-foreground/90 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  placeholder="Enter bank name"
                  value={paymentDetails.bankDetails.bankName}
                  onChange={(e) => setPaymentDetails(prev => ({
                    ...prev,
                    bankDetails: { ...prev.bankDetails, bankName: e.target.value }
                  }))}
                  className="w-full px-3 py-2 bg-card/30 text-primary-foreground rounded-lg border border-border/40 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-foreground/90 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  placeholder="Enter account name"
                  value={paymentDetails.bankDetails.accountName}
                  onChange={(e) => setPaymentDetails(prev => ({
                    ...prev,
                    bankDetails: { ...prev.bankDetails, accountName: e.target.value }
                  }))}
                  className="w-full px-3 py-2 bg-card/30 text-primary-foreground rounded-lg border border-border/40 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-foreground/90 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  placeholder="Enter account number"
                  value={paymentDetails.bankDetails.accountNumber}
                  onChange={(e) => setPaymentDetails(prev => ({
                    ...prev,
                    bankDetails: { ...prev.bankDetails, accountNumber: e.target.value }
                  }))}
                  className="w-full px-3 py-2 bg-card/30 text-primary-foreground rounded-lg border border-border/40 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-foreground/90 mb-1">
                  SWIFT Code
                </label>
                <input
                  type="text"
                  placeholder="Enter SWIFT code"
                  value={paymentDetails.bankDetails.swiftCode}
                  onChange={(e) => setPaymentDetails(prev => ({
                    ...prev,
                    bankDetails: { ...prev.bankDetails, swiftCode: e.target.value }
                  }))}
                  className="w-full px-3 py-2 bg-card/30 text-primary-foreground rounded-lg border border-border/40 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              </div>
            </div>
          )}

          {paymentDetails.method === 'paypal' && (
            <div>
              <label className="block text-sm font-medium text-primary-foreground/90 mb-1">
                PayPal Email
              </label>
              <input
                type="email"
                placeholder="Enter PayPal email"
                value={paymentDetails.paypalEmail}
                onChange={(e) => setPaymentDetails(prev => ({ ...prev, paypalEmail: e.target.value }))}
                className="w-full px-3 py-2 bg-card/30 text-primary-foreground rounded-lg border border-border/40 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
          )}

          {paymentDetails.method === 'payoneer' && (
            <div>
              <label className="block text-sm font-medium text-primary-foreground/90 mb-1">
                Payoneer Email
              </label>
              <input
                type="email"
                placeholder="Enter Payoneer email"
                value={paymentDetails.payoneerEmail}
                onChange={(e) => setPaymentDetails(prev => ({ ...prev, payoneerEmail: e.target.value }))}
                className="w-full px-3 py-2 bg-card/30 text-primary-foreground rounded-lg border border-border/40 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
          )}

          {paymentDetails.method === 'other' && (
            <div>
              <label className="block text-sm font-medium text-primary-foreground/90 mb-1">
                Payment Instructions
              </label>
              <textarea
                placeholder="Enter payment instructions"
                value={paymentDetails.otherInstructions}
                onChange={(e) => setPaymentDetails(prev => ({ ...prev, otherInstructions: e.target.value }))}
                className="w-full px-3 py-2 bg-card/30 text-primary-foreground rounded-lg border border-border/40 placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
                rows={4}
              />
            </div>
          )}
        </div>
      </div>

      {/* Time Entries */}
      <div>
        <h3 className="text-lg font-semibold text-primary-foreground mb-4">Time Entries</h3>
        <div className="space-y-3">
          {timeEntries.length > 0 ? (
            timeEntries.map(entry => (
              <label
                key={entry.id || entry.timestamp}
                className="flex items-center gap-3 p-3 bg-card/30 hover:bg-accent/20 rounded-lg border border-border/40 transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedEntries.has(entry.timestamp)}
                  onChange={() => {
                    const newSelected = new Set(selectedEntries);
                    if (newSelected.has(entry.timestamp)) {
                      newSelected.delete(entry.timestamp);
                    } else {
                      newSelected.add(entry.timestamp);
                    }
                    setSelectedEntries(newSelected);
                  }}
                  className="rounded border-border/40 text-primary focus:ring-1 focus:ring-primary/40"
                />
                <div className="flex-1">
                  <div className="font-medium text-primary-foreground">
                    {entry.description || 'Untitled Entry'}
                  </div>
                  <div className="text-sm text-muted-foreground/80">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-primary-foreground">
                    ${(entry.duration / 3600 * (entry.hourlyRate || 0)).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground/80">
                    {(entry.duration / 3600).toFixed(2)} hrs @ ${entry.hourlyRate || 0}/hr
                  </div>
                </div>
              </label>
            ))
          ) : (
            <div className="text-center py-8 bg-card/30 rounded-lg border border-border/40">
              <div className="text-muted-foreground/90">No time entries found</div>
              <div className="text-sm text-muted-foreground/70">
                Start tracking time on your tasks to generate invoices
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Total Amount */}
      {timeEntries.length > 0 && selectedEntries.size > 0 && (
        <div className="mt-6 pt-4 border-t border-border/40">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-primary-foreground">Total Amount:</span>
            <span className="text-2xl font-bold text-primary-foreground">${calculateTotal().toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceGenerator; 