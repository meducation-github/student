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
  AlertCircle,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { supabase } from "../../config/env";
import { InstituteContext, SessionContext } from "../../context/contexts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

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

  const totalFees = studentFees.reduce(
    (sum, fee) => sum + parseFloat(fee.total_fee),
    0
  );
  const paidFees = studentFees.reduce(
    (sum, fee) => sum + parseFloat(fee.paid_fee),
    0
  );
  const pendingFees = totalFees - paidFees;
  const paymentProgress = totalFees > 0 ? (paidFees / totalFees) * 100 : 0;

  const getStatusVariant = (status) => {
    switch (status) {
      case "paid":
        return "success";
      case "submitted":
        return "info";
      case "partial":
        return "warning";
      default:
        return "destructive";
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-white/80 p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Fees
        </p>
        <h1 className="mt-1 text-3xl font-bold text-foreground">
          Track and pay your institute fees
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Stay on top of every billing cycle, upload payment proofs, and follow the status of submissions.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription>Total fees</CardDescription>
              <CardTitle className="text-2xl">{formatCurrency(totalFees)}</CardTitle>
            </div>
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Across {studentFees.length} billing cycles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription>Paid so far</CardDescription>
              <CardTitle className="text-2xl text-green-600">
                {formatCurrency(paidFees)}
              </CardTitle>
            </div>
            <div className="rounded-full bg-green-100 p-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${paymentProgress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {paymentProgress.toFixed(0)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription>Pending amount</CardDescription>
              <CardTitle className="text-2xl text-red-600">
                {formatCurrency(pendingFees)}
              </CardTitle>
            </div>
            <div className="rounded-full bg-red-100 p-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {pendingFees > 0 ? "Payment required" : "All clear"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription>Fee cycles</CardDescription>
              <CardTitle className="text-2xl">{studentFees.length}</CardTitle>
            </div>
            <div className="rounded-full bg-purple-100 p-2 text-purple-600">
              <FileText className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {studentFees.filter((f) => f.is_current_cycle).length} cycle(s) in progress
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fee History</CardTitle>
          <CardDescription>
            View and manage all your fee payment cycles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cycle</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Total Fee</TableHead>
                <TableHead>Paid Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentFees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-zinc-500">
                      <FileText className="h-8 w-8" />
                      <p>No fees found for this student</p>
                    </div>
                  </TableCell>
                </TableRow>
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
                    <TableRow key={fee.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {fee.fee_cycle.charAt(0).toUpperCase() +
                              fee.fee_cycle.slice(1)}
                          </span>
                          {fee.is_current_cycle && (
                            <Badge variant="info">Current</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-zinc-600">
                          <Calendar className="h-3 w-3" />
                          {startDate} - {endDate}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(fee.total_fee)}
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {formatCurrency(fee.paid_fee)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(fee.payment_status)}>
                          {fee.payment_status.charAt(0).toUpperCase() +
                            fee.payment_status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {fee.payment_status === "paid" ||
                        fee.payment_status === "submitted" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(fee.receipt_url, "_blank")}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Receipt
                          </Button>
                        ) : (
                          fee.payment_status !== "paid" &&
                          pendingAmount > 0 && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedFee(fee);
                                setPaymentAmount(pendingAmount);
                                setIsPaymentModalOpen(true);
                              }}
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Pay Now
                            </Button>
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <Dialog
        open={isPaymentModalOpen && selectedFee}
        onOpenChange={(open) => {
          if (!open) {
            setIsPaymentModalOpen(false);
            setSelectedFee(null);
            setPaymentAmount(0);
            setReceiptFile(null);
            setShowPaymentInstructions(false);
          }
        }}
      >
        <DialogContent
          className="max-w-2xl"
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedFee(null);
            setPaymentAmount(0);
            setReceiptFile(null);
            setShowPaymentInstructions(false);
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Submit Fee Payment
            </DialogTitle>
            {selectedFee && (
              <DialogDescription>
                {selectedFee.fee_cycle.charAt(0).toUpperCase() +
                  selectedFee.fee_cycle.slice(1)}{" "}
                ({new Date(selectedFee.cycle_start_date).toLocaleDateString()} -{" "}
                {new Date(selectedFee.cycle_end_date).toLocaleDateString()})
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="flex justify-center mb-4">
            {showPaymentInstructions ? (
              <Button
                variant="ghost"
                onClick={() => setShowPaymentInstructions(false)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Payment Form
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={() => setShowPaymentInstructions(true)}
              >
                View Payment Instructions
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>

          {!showPaymentInstructions ? (
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="payment_amount"
                  className="text-sm font-medium leading-none"
                >
                  Payment Amount
                </label>
                <Input
                  type="number"
                  id="payment_amount"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  min="0"
                  max={
                    parseFloat(selectedFee?.total_fee || 0) -
                    parseFloat(selectedFee?.paid_fee || 0)
                  }
                  step="0.01"
                  required
                />
                <p className="text-xs text-zinc-500">
                  Maximum:{" "}
                  {formatCurrency(
                    parseFloat(selectedFee?.total_fee || 0) -
                      parseFloat(selectedFee?.paid_fee || 0)
                  )}
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="receipt"
                  className="text-sm font-medium leading-none"
                >
                  Upload Receipt
                </label>
                <label className="w-full flex flex-col items-center px-4 py-8 bg-zinc-50 border-2 border-dashed border-zinc-300 rounded-lg cursor-pointer hover:bg-zinc-100 transition-colors">
                  <Upload className="h-10 w-10 text-zinc-400" />
                  <span className="mt-2 text-sm text-zinc-600">
                    {receiptFile ? receiptFile.name : "Click to select a file"}
                  </span>
                  <span className="mt-1 text-xs text-zinc-400">
                    PNG, JPG or PDF (MAX. 10MB)
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

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsPaymentModalOpen(false);
                    setSelectedFee(null);
                    setPaymentAmount(0);
                    setReceiptFile(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Submit Payment
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="space-y-4">
              <Tabs defaultValue="easypaisa">
                <TabsList className="grid w-full grid-cols-4">
                  {paymentMethods.map((method) => (
                    <TabsTrigger key={method.id} value={method.id}>
                      {method.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="easypaisa" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Smartphone className="h-5 w-5 text-green-600" />
                        EasyPaisa Payment Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            Account Number:
                          </span>
                          <span className="text-sm font-mono">
                            0312-3456789
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText("0312-3456789");
                            setCopied("easypaisa");
                            setTimeout(() => setCopied(null), 2000);
                          }}
                        >
                          {copied === "easypaisa" ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Steps to Pay:</h4>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-600">
                          <li>Open your EasyPaisa app</li>
                          <li>Go to "Send Money"</li>
                          <li>Enter the account number above</li>
                          <li>Enter the payment amount</li>
                          <li>Add reference: "Fee Payment"</li>
                          <li>Complete the transaction</li>
                        </ol>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="jazzcash" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Smartphone className="h-5 w-5 text-red-600" />
                        JazzCash Payment Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            Account Number:
                          </span>
                          <span className="text-sm font-mono">
                            0300-1234567
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText("0300-1234567");
                            setCopied("jazzcash");
                            setTimeout(() => setCopied(null), 2000);
                          }}
                        >
                          {copied === "jazzcash" ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Steps to Pay:</h4>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-600">
                          <li>Open your JazzCash app</li>
                          <li>Select "Send Money"</li>
                          <li>Enter the account number above</li>
                          <li>Enter the payment amount</li>
                          <li>Add reference: "Fee Payment"</li>
                          <li>Complete the transaction</li>
                        </ol>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="nayapay" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Smartphone className="h-5 w-5 text-blue-600" />
                        NayaPay Payment Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            Account Number:
                          </span>
                          <span className="text-sm font-mono">
                            0333-9876543
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText("0333-9876543");
                            setCopied("nayapay");
                            setTimeout(() => setCopied(null), 2000);
                          }}
                        >
                          {copied === "nayapay" ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Steps to Pay:</h4>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-600">
                          <li>Open your NayaPay app</li>
                          <li>Tap on "Send Money"</li>
                          <li>Enter the account number above</li>
                          <li>Enter the payment amount</li>
                          <li>Add reference: "Fee Payment"</li>
                          <li>Complete the transaction</li>
                        </ol>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="bank" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-purple-600" />
                        Bank Transfer Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 p-3 bg-zinc-50 rounded-lg">
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-600">Bank Name:</span>
                          <span className="font-medium">HBL</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-600">Account Title:</span>
                          <span className="font-medium">School Name</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-600">IBAN:</span>
                          <span className="font-mono text-xs">
                            PK36HABB0001234567890123
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-zinc-600">Raast ID:</span>
                          <span className="font-medium">123456789</span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            "PK36HABB0001234567890123"
                          );
                          setCopied("bank");
                          setTimeout(() => setCopied(null), 2000);
                        }}
                      >
                        {copied === "bank" ? (
                          <>
                            <Check className="h-4 w-4 mr-2 text-green-600" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy IBAN
                          </>
                        )}
                      </Button>

                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Steps to Pay:</h4>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-zinc-600">
                          <li>Visit bank branch or use online banking</li>
                          <li>Use the bank details provided above</li>
                          <li>Enter the payment amount</li>
                          <li>Add reference: "Fee Payment"</li>
                          <li>Complete the transaction</li>
                          <li>Keep the receipt for submission</li>
                        </ol>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
