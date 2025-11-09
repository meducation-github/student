import { useState, useEffect, useContext } from "react";
import {
  DollarSign,
  CheckCircle2,
  Clock,
  FileText,
  Upload,
  X,
  Download,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  ArrowLeft,
  ArrowRight,
  QrCode,
  Copy,
  Check,
} from "lucide-react";
import { supabase } from "../../config/env";
import { InstituteContext, SessionContext } from "../../context/contexts";

const STUDENT_ID = localStorage.getItem("student_id");

export default function Fees() {
  const { instituteState } = useContext(InstituteContext);
  const { sessionState } = useContext(SessionContext);
  // State variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [student, setStudent] = useState(null);
  const [studentFees, setStudentFees] = useState([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showPaymentInstructions, setShowPaymentInstructions] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState("easypaisa");
  const [copied, setCopied] = useState(null);

  const paymentMethods = [
    { id: "easypaisa", name: "EasyPaisa" },
    { id: "jazzcash", name: "JazzCash" },
    { id: "nayapay", name: "NayaPay" },
    { id: "bank", name: "Bank Transfer" },
  ];

  // Format currency with commas
  const formatCurrency = (amount) => {
    return `Rs ${parseFloat(amount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Fetch student and their fees
  const fetchStudentAndFees = async () => {
    setLoading(true);
    try {
      // Fetch student details
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select(
          `
          *,
          grade:grades(id, name)
        `
        )
        .eq("id", STUDENT_ID)
        .single();

      if (studentError) throw studentError;

      // Fetch student's fees
      const { data: feesData, error: feesError } = await supabase
        .from("fees")
        .select("*")
        .eq("student_id", STUDENT_ID)
        .order("cycle_start_date", { ascending: false });

      if (feesError) throw feesError;

      setStudent(studentData);
      setStudentFees(feesData);
    } catch (error) {
      console.error("Error fetching student data:", error);
      setError("Failed to fetch student data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle payment submission
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!receiptFile) {
      setError("Please upload a receipt");
      return;
    }

    setUploading(true);
    try {
      // Upload receipt to storage
      const fileExt = receiptFile.name.split(".").pop();
      const fileName = `${student.id}/${
        selectedFee.id
      }/${Date.now()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from("fee-receipts")
        .upload(fileName, receiptFile);

      if (uploadError) throw uploadError;

      // Get public URL for the uploaded file
      const {
        data: { publicUrl },
      } = supabase.storage.from("fee-receipts").getPublicUrl(fileName);

      // Update fee record
      const updatedFee = {
        ...selectedFee,
        paid_fee: parseFloat(selectedFee.paid_fee) + parseFloat(paymentAmount),
        payment_status:
          parseFloat(selectedFee.paid_fee) + parseFloat(paymentAmount) >=
          parseFloat(selectedFee.total_fee)
            ? "submitted"
            : "partial",
        receipt_url: publicUrl,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("fees")
        .update(updatedFee)
        .eq("id", selectedFee.id);

      if (updateError) throw updateError;

      // Update local state
      setStudentFees((prevFees) =>
        prevFees.map((fee) => (fee.id === selectedFee.id ? updatedFee : fee))
      );

      // Close modal and reset form
      setIsPaymentModalOpen(false);
      setSelectedFee(null);
      setPaymentAmount(0);
      setReceiptFile(null);
    } catch (error) {
      console.error("Error processing payment:", error);
      setError("Failed to process payment. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptFile(file);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchStudentAndFees();
  }, []);

  return (
    <div className=" my-4 px-3">
      <div className="">
        <div className="bg-white rounded-lg ">
          {/* Fee Analytics */}
          <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-500">Total Fees</span>
              </div>
              <span className="text-xl font-semibold">
                {formatCurrency(
                  studentFees.reduce(
                    (sum, fee) => sum + parseFloat(fee.total_fee),
                    0
                  )
                )}
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-400 mr-2" />
                <span className="text-sm text-gray-500">Paid Fees</span>
              </div>
              <span className="text-xl font-semibold text-green-600">
                {formatCurrency(
                  studentFees.reduce(
                    (sum, fee) => sum + parseFloat(fee.paid_fee),
                    0
                  )
                )}
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-red-400 mr-2" />
                <span className="text-sm text-gray-500">Pending Fees</span>
              </div>
              <span className="text-xl font-semibold text-red-600">
                {formatCurrency(
                  studentFees.reduce(
                    (sum, fee) =>
                      sum +
                      (parseFloat(fee.total_fee) - parseFloat(fee.paid_fee)),
                    0
                  )
                )}
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-blue-400 mr-2" />
                <span className="text-sm text-gray-500">Total Cycles</span>
              </div>
              <span className="text-xl font-semibold text-blue-600">
                {studentFees.length}
              </span>
            </div>
          </div>

          {/* Fees table */}
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cycle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Fee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid Fee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {studentFees.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No fees found for this student
                    </td>
                  </tr>
                ) : (
                  studentFees.map((fee) => {
                    const startDate = new Date(
                      fee.cycle_start_date
                    ).toLocaleDateString();
                    const endDate = new Date(
                      fee.cycle_end_date
                    ).toLocaleDateString();
                    const pendingAmount =
                      parseFloat(fee.total_fee) - parseFloat(fee.paid_fee);

                    return (
                      <tr key={fee.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900">
                              {fee.fee_cycle.charAt(0).toUpperCase() +
                                fee.fee_cycle.slice(1)}
                            </span>
                            {fee.is_current_cycle && (
                              <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                Current
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {startDate} - {endDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(fee.total_fee)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          {formatCurrency(fee.paid_fee)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              fee.payment_status === "paid"
                                ? "bg-green-100 text-green-800"
                                : fee.payment_status === "submitted"
                                ? "bg-blue-100 text-blue-800"
                                : fee.payment_status === "partial"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {fee.payment_status.charAt(0).toUpperCase() +
                              fee.payment_status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {fee.payment_status === "paid" ||
                          fee.payment_status === "submitted" ? (
                            <button
                              onClick={() =>
                                window.open(fee.receipt_url, "_blank")
                              }
                              className="text-blue-600 hover:text-blue-900 flex items-center justify-end gap-1"
                            >
                              <Download className="h-4 w-4" />
                              <span>Download Receipt</span>
                            </button>
                          ) : (
                            fee.payment_status !== "paid" &&
                            pendingAmount > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedFee(fee);
                                  setPaymentAmount(pendingAmount);
                                  setIsPaymentModalOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Pay Now
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedFee && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-black/25"></div>
            </div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Submit Fee Payment
                        </h3>
                        {selectedFee && (
                          <p className="mt-1 text-sm text-gray-500">
                            {selectedFee.fee_cycle.charAt(0).toUpperCase() +
                              selectedFee.fee_cycle.slice(1)}{" "}
                            (
                            {new Date(
                              selectedFee.cycle_start_date
                            ).toLocaleDateString()}{" "}
                            -{" "}
                            {new Date(
                              selectedFee.cycle_end_date
                            ).toLocaleDateString()}
                            )
                          </p>
                        )}
                      </div>
                      {showPaymentInstructions ? (
                        <button
                          onClick={() => setShowPaymentInstructions(false)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          <span>Back to Payment</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowPaymentInstructions(true)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        >
                          <span>How to Pay</span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {!showPaymentInstructions ? (
                      <form onSubmit={handlePaymentSubmit}>
                        <div className="mb-4">
                          <label
                            htmlFor="payment_amount"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Payment Amount
                          </label>
                          <input
                            type="number"
                            id="payment_amount"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            min="0"
                            max={
                              parseFloat(selectedFee.total_fee) -
                              parseFloat(selectedFee.paid_fee)
                            }
                            step="0.01"
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>

                        <div className="mb-4">
                          <label
                            htmlFor="receipt"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Upload Receipt
                          </label>
                          <div className="mt-1 flex items-center">
                            <label className="w-full flex flex-col items-center px-4 py-6 bg-white text-blue rounded-lg tracking-wide border border-gray-200 cursor-pointer">
                              <Upload className="h-8 w-8" />
                              <span className="mt-2 text-sm">
                                {receiptFile
                                  ? receiptFile.name
                                  : "Select a file"}
                              </span>
                              <input
                                type="file"
                                id="receipt"
                                className="hidden"
                                accept="image/*,.pdf"
                                onChange={handleFileSelect}
                                required
                              />
                            </label>
                          </div>
                        </div>

                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                          <button
                            type="submit"
                            disabled={uploading}
                            className="w-full inline-flex justify-center rounded-md border border-transparent px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                          >
                            {uploading ? "Processing..." : "Submit Payment"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsPaymentModalOpen(false);
                              setSelectedFee(null);
                              setPaymentAmount(0);
                              setReceiptFile(null);
                            }}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="payment-instructions">
                        <div className="flex space-x-2 mb-4 border-b">
                          {paymentMethods.map((method) => (
                            <button
                              key={method.id}
                              onClick={() =>
                                setSelectedPaymentMethod(method.id)
                              }
                              className={`px-4 py-2 text-sm font-medium ${
                                selectedPaymentMethod === method.id
                                  ? "border-b-2 border-blue-500 text-blue-600"
                                  : "text-gray-500 hover:text-gray-700"
                              }`}
                            >
                              {method.name}
                            </button>
                          ))}
                        </div>

                        <div className="payment-method-content">
                          {selectedPaymentMethod === "easypaisa" && (
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 text-gray-700">
                                <Smartphone className="h-5 w-5" />
                                <span className="font-medium">
                                  EasyPaisa Account Number:
                                </span>
                                <span>0312-3456789</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      "0312-3456789"
                                    );
                                    setCopied("easypaisa");
                                    setTimeout(() => setCopied(null), 2000);
                                  }}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  {copied === "easypaisa" ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-medium mb-2">
                                  Steps to Pay:
                                </h4>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                                  <li>Open your EasyPaisa app</li>
                                  <li>Go to "Send Money"</li>
                                  <li>Enter the account number above</li>
                                  <li>Enter the payment amount</li>
                                  <li>Add a reference note: "Fee Payment"</li>
                                  <li>Confirm and complete the transaction</li>
                                </ol>
                              </div>
                            </div>
                          )}

                          {selectedPaymentMethod === "jazzcash" && (
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 text-gray-700">
                                <Smartphone className="h-5 w-5" />
                                <span className="font-medium">
                                  JazzCash Account Number:
                                </span>
                                <span>0300-1234567</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      "0300-1234567"
                                    );
                                    setCopied("jazzcash");
                                    setTimeout(() => setCopied(null), 2000);
                                  }}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  {copied === "jazzcash" ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-medium mb-2">
                                  Steps to Pay:
                                </h4>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                                  <li>Open your JazzCash app</li>
                                  <li>Select "Send Money"</li>
                                  <li>Enter the account number above</li>
                                  <li>Enter the payment amount</li>
                                  <li>Add a reference note: "Fee Payment"</li>
                                  <li>Confirm and complete the transaction</li>
                                </ol>
                              </div>
                            </div>
                          )}

                          {selectedPaymentMethod === "nayapay" && (
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 text-gray-700">
                                <Smartphone className="h-5 w-5" />
                                <span className="font-medium">
                                  NayaPay Account Number:
                                </span>
                                <span>0333-9876543</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      "0333-9876543"
                                    );
                                    setCopied("nayapay");
                                    setTimeout(() => setCopied(null), 2000);
                                  }}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  {copied === "nayapay" ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-medium mb-2">
                                  Steps to Pay:
                                </h4>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                                  <li>Open your NayaPay app</li>
                                  <li>Tap on "Send Money"</li>
                                  <li>Enter the account number above</li>
                                  <li>Enter the payment amount</li>
                                  <li>Add a reference note: "Fee Payment"</li>
                                  <li>Confirm and complete the transaction</li>
                                </ol>
                              </div>
                            </div>
                          )}

                          {selectedPaymentMethod === "bank" && (
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 text-gray-700">
                                <Building2 className="h-5 w-5" />
                                <span className="font-medium">
                                  Bank Details:
                                </span>
                              </div>
                              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                                <div>
                                  <p className="text-sm text-gray-600">
                                    Bank Name: HBL
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Account Title: School Name
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    IBAN: PK36HABB0001234567890123
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Raast ID: 123456789
                                  </p>
                                </div>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      "PK36HABB0001234567890123"
                                    );
                                    setCopied("bank");
                                    setTimeout(() => setCopied(null), 2000);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                                >
                                  {copied === "bank" ? (
                                    <>
                                      <Check className="h-4 w-4" />
                                      <span>Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-4 w-4" />
                                      <span>Copy IBAN</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-medium mb-2">
                                  Steps to Pay:
                                </h4>
                                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                                  <li>
                                    Visit your bank branch or use online banking
                                  </li>
                                  <li>Use the bank details provided above</li>
                                  <li>Enter the payment amount</li>
                                  <li>Add a reference note: "Fee Payment"</li>
                                  <li>Complete the transaction</li>
                                  <li>Keep the receipt for submission</li>
                                </ol>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
