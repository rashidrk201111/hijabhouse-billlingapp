import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Printer, X as XIcon, FileText, Receipt } from 'lucide-react';
import { formatINR } from '../../lib/currency';

interface InvoiceViewProps {
  invoiceId: string;
  onClose: () => void;
}

interface CompanyProfile {
  company_name: string;
  gst_number: string;
  pan_number: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  terms_conditions: string;
  logo_url: string;
}

type PrintFormat = 'full' | 'thermal';

export function InvoiceView({ invoiceId, onClose }: InvoiceViewProps) {
  const [loading, setLoading] = useState(true);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [printFormat, setPrintFormat] = useState<PrintFormat>('full');

  useEffect(() => {
    loadInvoiceData();
  }, [invoiceId]);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #invoice-content, #invoice-content * {
          visibility: visible;
        }
        #invoice-content {
          position: absolute;
          left: 0;
          top: 0;
          width: var(--print-width, 210mm);
          padding: ${printFormat === 'thermal' ? '10px' : '0'};
        }
        .print\\:hidden {
          display: none !important;
        }
        ${printFormat === 'thermal' ? `
          #invoice-content {
            font-size: 11px !important;
          }
          #invoice-content h1 {
            font-size: 16px !important;
          }
          #invoice-content h2 {
            font-size: 14px !important;
          }
          #invoice-content h3 {
            font-size: 12px !important;
          }
          @page {
            size: 80mm auto;
            margin: 5mm;
          }
        ` : `
          @page {
            size: A4;
            margin: 0;
          }
        `}
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, [printFormat]);

  const loadInvoiceData = async () => {
    try {
      const invoiceRes = await supabase
        .from('invoices')
        .select(`
          *,
          customer:customers(*),
          items:invoice_items(
            *,
            product:products(*)
          )
        `)
        .eq('id', invoiceId)
        .single();

      if (invoiceRes.error) throw invoiceRes.error;

      const profileRes = await supabase
        .from('company_profile')
        .select('*')
        .eq('user_id', invoiceRes.data.created_by)
        .maybeSingle();

      setInvoiceData(invoiceRes.data);
      setCompanyProfile(profileRes.data);
    } catch (error) {
      console.error('Error loading invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const root = document.documentElement;
    if (printFormat === 'thermal') {
      root.style.setProperty('--print-width', '80mm');
    } else {
      root.style.setProperty('--print-width', '210mm');
    }
    window.print();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <div className="text-center">Loading invoice...</div>
        </div>
      </div>
    );
  }

  if (!invoiceData) {
    return null;
  }

  const { customer, items } = invoiceData;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-8">
        <div className="p-6 border-b-4 border-blue-600 print:hidden bg-gradient-to-r from-blue-50 to-slate-50">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Invoice Preview</h2>
              <p className="text-sm text-slate-600">Choose your print format below</p>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition shadow-lg hover:shadow-xl"
            >
              <XIcon className="w-4 h-4 flex-shrink-0" />
              <span>Close</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <button
              onClick={() => setPrintFormat('full')}
              className={`relative p-4 rounded-lg border-2 transition-all ${
                printFormat === 'full'
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                  : 'bg-white border-slate-300 text-slate-700 hover:border-blue-400 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${printFormat === 'full' ? 'bg-blue-700' : 'bg-blue-100'}`}>
                  <FileText className={`w-6 h-6 ${printFormat === 'full' ? 'text-white' : 'text-blue-600'}`} />
                </div>
                <div className="text-left">
                  <div className="text-lg font-bold mb-0.5">A4 Full Page</div>
                  <div className={`text-xs ${printFormat === 'full' ? 'text-blue-100' : 'text-slate-500'}`}>
                    Professional business invoice
                  </div>
                </div>
              </div>
              {printFormat === 'full' && (
                <div className="absolute top-3 right-3 bg-white text-blue-600 rounded-full p-1">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>

            <button
              onClick={() => setPrintFormat('thermal')}
              className={`relative p-4 rounded-lg border-2 transition-all ${
                printFormat === 'thermal'
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                  : 'bg-white border-slate-300 text-slate-700 hover:border-blue-400 hover:shadow-md'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${printFormat === 'thermal' ? 'bg-blue-700' : 'bg-blue-100'}`}>
                  <Receipt className={`w-6 h-6 ${printFormat === 'thermal' ? 'text-white' : 'text-blue-600'}`} />
                </div>
                <div className="text-left">
                  <div className="text-lg font-bold mb-0.5">Thermal Receipt</div>
                  <div className={`text-xs ${printFormat === 'thermal' ? 'text-blue-100' : 'text-slate-500'}`}>
                    80mm POS receipt printer
                  </div>
                </div>
              </div>
              {printFormat === 'thermal' && (
                <div className="absolute top-3 right-3 bg-white text-blue-600 rounded-full p-1">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg transition shadow-lg hover:shadow-xl"
          >
            <Printer className="w-5 h-5" />
            Print Invoice - {printFormat === 'full' ? 'A4 Full Page' : 'Thermal 80mm'}
          </button>
        </div>

        <div className="overflow-auto max-h-[70vh] print:max-h-none print:overflow-visible">
          <div id="invoice-content" className="bg-white">
            {printFormat === 'full' ? (
              <div className="min-h-[297mm] bg-white">
                <div className="w-full">
                  <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-8 py-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h1 className="text-4xl font-bold text-white mb-2">
                          {companyProfile?.company_name || 'Your Company Name'}
                        </h1>
                        <div className="text-sm text-slate-300">
                          {companyProfile?.address_line1 && <div>{companyProfile.address_line1}</div>}
                          {companyProfile?.city && companyProfile?.postal_code && (
                            <div>{companyProfile.city}, {companyProfile.state} {companyProfile.postal_code}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-5xl font-bold text-white mb-1">INVOICE</div>
                        <div className="text-xl text-slate-300">#{invoiceData.invoice_number}</div>
                      </div>
                    </div>
                  </div>

                  <div className="px-8 py-6 bg-white">
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div>
                        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Invoice Date</div>
                        <div className="text-slate-900">
                          {new Date(invoiceData.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Due Date</div>
                        <div className="text-slate-900">
                          {new Date(invoiceData.due_date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-8">
                      <div className="bg-slate-50 rounded-2xl p-5 border-2 border-slate-200">
                        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Bill To</div>
                        <div className="text-slate-900 font-semibold text-lg mb-1">{customer?.name}</div>
                        {customer?.address && <div className="text-slate-700 text-sm">{customer.address}</div>}
                        {customer?.phone && <div className="text-slate-700 text-sm">Mobile: {customer.phone}</div>}
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-5 border-2 border-slate-200">
                        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Company Info</div>
                        <div className="text-slate-700 text-sm space-y-1">
                          {companyProfile?.email && <div>Email: {companyProfile.email}</div>}
                          {companyProfile?.phone && <div>Phone: {companyProfile.phone}</div>}
                          {companyProfile?.gst_number && <div>GST: {companyProfile.gst_number}</div>}
                        </div>
                      </div>
                    </div>

                    <div className="mb-6">
                      <table className="w-full border-collapse border-2 border-slate-800">
                        <thead>
                          <tr className="bg-slate-100 border-b-2 border-slate-800">
                            <th className="text-left py-4 px-4 text-sm font-bold text-slate-700 uppercase tracking-wide border-r-2 border-slate-800">Description</th>
                            <th className="text-center py-4 px-3 text-sm font-bold text-slate-700 uppercase tracking-wide border-r-2 border-slate-800">HSN</th>
                            <th className="text-center py-4 px-3 text-sm font-bold text-slate-700 uppercase tracking-wide border-r-2 border-slate-800">QTY</th>
                            <th className="text-right py-4 px-3 text-sm font-bold text-slate-700 uppercase tracking-wide border-r-2 border-slate-800">Rate</th>
                            <th className="text-right py-4 px-4 text-sm font-bold text-slate-700 uppercase tracking-wide">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          {items.map((item: any) => (
                            <tr key={item.id} className="border-b-2 border-slate-800">
                              <td className="py-4 px-4 text-slate-900 border-r-2 border-slate-800">{item.product?.name}</td>
                              <td className="py-4 px-3 text-slate-700 text-center text-sm border-r-2 border-slate-800">
                                {item.hsn_code || '-'}
                              </td>
                              <td className="py-4 px-3 text-slate-900 text-center border-r-2 border-slate-800">{item.quantity}</td>
                              <td className="py-4 px-3 text-slate-900 text-right border-r-2 border-slate-800">{formatINR(item.unit_price)}</td>
                              <td className="py-4 px-4 text-slate-900 text-right font-bold">{formatINR(item.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end mb-6">
                      <div className="w-96">
                        <div className="space-y-2 mb-4 text-slate-700">
                          <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span className="text-slate-900">{formatINR(invoiceData.subtotal)}</span>
                          </div>
                          {invoiceData.tax > 0 && (
                            <>
                              {invoiceData.is_interstate ? (
                                <div className="flex justify-between">
                                  <span>IGST</span>
                                  <span className="text-slate-900">{formatINR(invoiceData.igst)}</span>
                                </div>
                              ) : (
                                <>
                                  <div className="flex justify-between">
                                    <span>CGST</span>
                                    <span className="text-slate-900">{formatINR(invoiceData.cgst)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>SGST</span>
                                    <span className="text-slate-900">{formatINR(invoiceData.sgst)}</span>
                                  </div>
                                </>
                              )}
                            </>
                          )}
                        </div>
                        <div className="bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg px-6 py-5">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-white uppercase tracking-wide">Total Amount</span>
                            <span className="text-3xl font-bold text-white">{formatINR(invoiceData.total)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {companyProfile?.terms_conditions && (
                      <div className="bg-slate-50 rounded-2xl p-5 border-2 border-slate-200">
                        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                          Terms & Conditions
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                          {companyProfile.terms_conditions}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-8 py-4 text-center">
                    <p className="text-white font-medium">Thank you for your business!</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 max-w-[80mm] mx-auto">
                <div className="text-center mb-4">
                  {companyProfile?.logo_url && (
                    <div className="flex justify-center mb-2">
                      <img
                        src={companyProfile.logo_url}
                        alt="Company Logo"
                        className="h-16 w-16 object-contain"
                      />
                    </div>
                  )}
                  <h1 className="text-2xl font-bold mb-1">
                    {companyProfile?.company_name || 'Company Name'}
                  </h1>
                  {companyProfile && (
                    <div className="text-xs text-slate-600">
                      {companyProfile.address_line1 && <p>{companyProfile.address_line1}</p>}
                      {companyProfile.phone && <p>Tel: {companyProfile.phone}</p>}
                      {companyProfile.gst_number && <p>GST: {companyProfile.gst_number}</p>}
                    </div>
                  )}
                </div>

                <div className="border-t border-b border-dashed border-slate-400 py-2 mb-2">
                  <div className="text-center font-bold text-lg">INVOICE</div>
                  <div className="text-xs">
                    <p>Invoice: #{invoiceData.invoice_number}</p>
                    <p>Date: {new Date(invoiceData.created_at).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>

                <div className="text-xs mb-2">
                  <p className="font-bold mb-1">Customer:</p>
                  <p className="font-semibold">{customer?.name}</p>
                  {customer?.phone && <p>{customer.phone}</p>}
                </div>

                <table className="w-full text-xs mb-2">
                  <thead>
                    <tr className="border-b border-slate-400">
                      <th className="text-left py-1">Item</th>
                      <th className="text-center py-1">Qty</th>
                      <th className="text-right py-1">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item: any) => (
                      <tr key={item.id} className="border-b border-dashed border-slate-300">
                        <td className="py-1">{item.product?.name}</td>
                        <td className="text-center py-1">{item.quantity}</td>
                        <td className="text-right py-1">{formatINR(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="text-xs space-y-1 mb-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatINR(invoiceData.subtotal)}</span>
                  </div>
                  {invoiceData.tax > 0 && (
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>{formatINR(invoiceData.tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm border-t border-slate-400 pt-1">
                    <span>TOTAL:</span>
                    <span>{formatINR(invoiceData.total)}</span>
                  </div>
                </div>

                <div className="text-center text-xs border-t border-dashed border-slate-400 pt-2">
                  <p className="font-medium">Thank you!</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
