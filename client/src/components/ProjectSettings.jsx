import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { toast } from 'react-hot-toast';
import { FiDollarSign, FiClock, FiSettings, FiCreditCard, FiSliders, FiSave, FiFileText } from 'react-icons/fi';

const ProjectSettings = ({ projectId }) => {
  const [settings, setSettings] = useState({
    paymentEnabled: true,
    defaultPaymentType: 'hourly',
    defaultHourlyRate: 50,
    defaultFixedPrice: 500,
    invoicingEnabled: true,
    paymentMethods: {
      bank: true,
      paypal: true,
      payoneer: true,
      other: true
    },
    defaultPaymentMethod: 'bank',
    defaultPaymentDetails: {
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
    },
    expenseTracking: {
      enabled: true,
      categories: [
        'Software & Tools',
        'Hardware',
        'Office Supplies',
        'Travel',
        'Subcontractors',
        'Other'
      ],
      expenses: []
    }
  });

  const [activeSection, setActiveSection] = useState('general');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);
        if (projectDoc.exists()) {
          const data = projectDoc.data();
          if (data.settings) {
            setSettings(prev => ({
              ...prev,
              ...data.settings
            }));
          }
        }
      } catch (error) {
        console.error('Error loading project settings:', error);
        toast.error('Failed to load project settings');
      }
    };
    loadSettings();
  }, [projectId]);

  const handleSaveSettings = async () => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        settings: settings
      });
      toast.success('Project settings saved successfully');
    } catch (error) {
      console.error('Error saving project settings:', error);
      toast.error('Failed to save project settings');
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="bg-slate-700/30 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center">
          <FiSliders className="w-5 h-5 mr-2 text-violet-400" />
          General Settings
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="flex items-center justify-between mb-2">
              <span className="text-slate-300">Enable Payment Tracking</span>
              <button
                onClick={() => setSettings(prev => ({ ...prev, paymentEnabled: !prev.paymentEnabled }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.paymentEnabled ? 'bg-violet-500' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.paymentEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          </div>

          <div>
            <label className="flex items-center justify-between mb-2">
              <span className="text-slate-300">Enable Invoicing</span>
              <button
                onClick={() => setSettings(prev => ({ ...prev, invoicingEnabled: !prev.invoicingEnabled }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.invoicingEnabled ? 'bg-violet-500' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.invoicingEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="space-y-6">
      <div className="bg-slate-700/30 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center">
          <FiDollarSign className="w-5 h-5 mr-2 text-violet-400" />
          Payment Settings
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Default Payment Type
            </label>
            <select
              value={settings.defaultPaymentType}
              onChange={(e) => setSettings(prev => ({ ...prev, defaultPaymentType: e.target.value }))}
              className="w-full bg-slate-600 border border-slate-500 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-violet-500"
            >
              <option value="hourly">Hourly Rate</option>
              <option value="fixed">Fixed Price</option>
              <option value="none">No Payment Tracking</option>
            </select>
          </div>

          {settings.defaultPaymentType === 'hourly' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Default Hourly Rate ($)
              </label>
              <input
                type="number"
                value={settings.defaultHourlyRate}
                onChange={(e) => setSettings(prev => ({ ...prev, defaultHourlyRate: Number(e.target.value) }))}
                className="w-full bg-slate-600 border border-slate-500 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-violet-500"
                min="0"
                step="5"
              />
            </div>
          )}

          {settings.defaultPaymentType === 'fixed' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Default Fixed Price ($)
              </label>
              <input
                type="number"
                value={settings.defaultFixedPrice}
                onChange={(e) => setSettings(prev => ({ ...prev, defaultFixedPrice: Number(e.target.value) }))}
                className="w-full bg-slate-600 border border-slate-500 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-violet-500"
                min="0"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPaymentMethodSettings = () => (
    <div className="space-y-6">
      <div className="bg-slate-700/30 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center">
          <FiCreditCard className="w-5 h-5 mr-2 text-violet-400" />
          Payment Methods
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Default Payment Method
            </label>
            <select
              value={settings.defaultPaymentMethod}
              onChange={(e) => setSettings(prev => ({ ...prev, defaultPaymentMethod: e.target.value }))}
              className="w-full bg-slate-600 border border-slate-500 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-violet-500"
            >
              <option value="bank">Bank Transfer</option>
              <option value="paypal">PayPal</option>
              <option value="payoneer">Payoneer</option>
              <option value="other">Other</option>
            </select>
          </div>

          {settings.defaultPaymentMethod === 'bank' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={settings.defaultPaymentDetails.bankDetails.bankName}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    defaultPaymentDetails: {
                      ...prev.defaultPaymentDetails,
                      bankDetails: {
                        ...prev.defaultPaymentDetails.bankDetails,
                        bankName: e.target.value
                      }
                    }
                  }))}
                  className="w-full bg-slate-600 border border-slate-500 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Account Name
                </label>
                <input
                  type="text"
                  value={settings.defaultPaymentDetails.bankDetails.accountName}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    defaultPaymentDetails: {
                      ...prev.defaultPaymentDetails,
                      bankDetails: {
                        ...prev.defaultPaymentDetails.bankDetails,
                        accountName: e.target.value
                      }
                    }
                  }))}
                  className="w-full bg-slate-600 border border-slate-500 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  value={settings.defaultPaymentDetails.bankDetails.accountNumber}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    defaultPaymentDetails: {
                      ...prev.defaultPaymentDetails,
                      bankDetails: {
                        ...prev.defaultPaymentDetails.bankDetails,
                        accountNumber: e.target.value
                      }
                    }
                  }))}
                  className="w-full bg-slate-600 border border-slate-500 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  SWIFT Code
                </label>
                <input
                  type="text"
                  value={settings.defaultPaymentDetails.bankDetails.swiftCode}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    defaultPaymentDetails: {
                      ...prev.defaultPaymentDetails,
                      bankDetails: {
                        ...prev.defaultPaymentDetails.bankDetails,
                        swiftCode: e.target.value
                      }
                    }
                  }))}
                  className="w-full bg-slate-600 border border-slate-500 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  IBAN
                </label>
                <input
                  type="text"
                  value={settings.defaultPaymentDetails.bankDetails.iban}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    defaultPaymentDetails: {
                      ...prev.defaultPaymentDetails,
                      bankDetails: {
                        ...prev.defaultPaymentDetails.bankDetails,
                        iban: e.target.value
                      }
                    }
                  }))}
                  className="w-full bg-slate-600 border border-slate-500 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
          )}

          {settings.defaultPaymentMethod === 'paypal' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                PayPal Email
              </label>
              <input
                type="email"
                value={settings.defaultPaymentDetails.paypalEmail}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  defaultPaymentDetails: {
                    ...prev.defaultPaymentDetails,
                    paypalEmail: e.target.value
                  }
                }))}
                className="w-full bg-slate-600 border border-slate-500 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-violet-500"
              />
            </div>
          )}

          {settings.defaultPaymentMethod === 'payoneer' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Payoneer Email
              </label>
              <input
                type="email"
                value={settings.defaultPaymentDetails.payoneerEmail}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  defaultPaymentDetails: {
                    ...prev.defaultPaymentDetails,
                    payoneerEmail: e.target.value
                  }
                }))}
                className="w-full bg-slate-600 border border-slate-500 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-violet-500"
              />
            </div>
          )}

          {settings.defaultPaymentMethod === 'other' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Payment Instructions
              </label>
              <textarea
                value={settings.defaultPaymentDetails.otherInstructions}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  defaultPaymentDetails: {
                    ...prev.defaultPaymentDetails,
                    otherInstructions: e.target.value
                  }
                }))}
                className="w-full bg-slate-600 border border-slate-500 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-violet-500"
                rows="4"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderExpenseSettings = () => (
    <div className="space-y-6">
      <div className="bg-slate-700/30 rounded-lg p-6">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center">
          <FiFileText className="w-5 h-5 mr-2 text-violet-400" />
          Expense Tracking
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="flex items-center justify-between mb-2">
              <span className="text-slate-300">Enable Expense Tracking</span>
              <button
                onClick={() => setSettings(prev => ({
                  ...prev,
                  expenseTracking: {
                    ...prev.expenseTracking,
                    enabled: !prev.expenseTracking.enabled
                  }
                }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.expenseTracking.enabled ? 'bg-violet-500' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.expenseTracking.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          </div>

          {settings.expenseTracking.enabled && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Expense Categories
                </label>
                <div className="space-y-2">
                  {settings.expenseTracking.categories.map((category, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={category}
                        onChange={(e) => {
                          const newCategories = [...settings.expenseTracking.categories];
                          newCategories[index] = e.target.value;
                          setSettings(prev => ({
                            ...prev,
                            expenseTracking: {
                              ...prev.expenseTracking,
                              categories: newCategories
                            }
                          }));
                        }}
                        className="flex-1 bg-slate-600 border border-slate-500 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-violet-500"
                      />
                      <button
                        onClick={() => {
                          const newCategories = settings.expenseTracking.categories.filter((_, i) => i !== index);
                          setSettings(prev => ({
                            ...prev,
                            expenseTracking: {
                              ...prev.expenseTracking,
                              categories: newCategories
                            }
                          }));
                        }}
                        className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setSettings(prev => ({
                      ...prev,
                      expenseTracking: {
                        ...prev.expenseTracking,
                        categories: [...prev.expenseTracking.categories, 'New Category']
                      }
                    }))}
                    className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>Add Category</span>
                    <span>+</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-600">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Tax Settings</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-400">Track Tax on Expenses</label>
                    <input
                      type="checkbox"
                      checked={settings.expenseTracking.trackTax}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        expenseTracking: {
                          ...prev.expenseTracking,
                          trackTax: e.target.checked
                        }
                      }))}
                      className="rounded border-slate-500 text-violet-500 focus:ring-violet-500"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex space-x-2 bg-slate-800/50 p-1 rounded-lg">
        <button
          onClick={() => setActiveSection('general')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeSection === 'general'
              ? 'bg-violet-500 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          General
        </button>
        <button
          onClick={() => setActiveSection('payment')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeSection === 'payment'
              ? 'bg-violet-500 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          Payment
        </button>
        <button
          onClick={() => setActiveSection('methods')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeSection === 'methods'
              ? 'bg-violet-500 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          Methods
        </button>
        <button
          onClick={() => setActiveSection('expenses')}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeSection === 'expenses'
              ? 'bg-violet-500 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          Expenses
        </button>
      </div>

      {/* Active Section Content */}
      {activeSection === 'general' && renderGeneralSettings()}
      {activeSection === 'payment' && renderPaymentSettings()}
      {activeSection === 'methods' && renderPaymentMethodSettings()}
      {activeSection === 'expenses' && renderExpenseSettings()}

      {/* Save Button */}
      <button
        onClick={handleSaveSettings}
        className="w-full px-4 py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
      >
        <FiSave className="w-5 h-5" />
        <span>Save Settings</span>
      </button>
    </div>
  );
};

export default ProjectSettings; 