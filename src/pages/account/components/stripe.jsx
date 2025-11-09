import { useState } from "react";
import { BiCheck, BiCreditCard } from "react-icons/bi";
import { FiAlertCircle } from "react-icons/fi";

const StripePayment = () => {
  const [paymentState, setPaymentState] = useState("input"); // 'input', 'processing', 'success', 'error'
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvc: "",
    name: "",
  });
  const [savedCard, setSavedCard] = useState(null);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Basic input formatting
    let formattedValue = value;
    if (name === "number") {
      formattedValue = value
        .replace(/\s/g, "")
        .replace(/(\d{4})/g, "$1 ")
        .trim()
        .slice(0, 19);
    } else if (name === "expiry") {
      formattedValue = value
        .replace(/\D/g, "")
        .replace(/(\d{2})(\d{0,2})/, "$1/$2")
        .slice(0, 5);
    } else if (name === "cvc") {
      formattedValue = value.replace(/\D/g, "").slice(0, 3);
    }

    setCardDetails({ ...cardDetails, [name]: formattedValue });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (cardDetails.number.replace(/\s/g, "").length !== 16) {
      setError("Please enter a valid card number");
      return;
    }

    if (cardDetails.expiry.length !== 5) {
      setError("Please enter a valid expiry date (MM/YY)");
      return;
    }

    if (cardDetails.cvc.length !== 3) {
      setError("Please enter a valid CVC");
      return;
    }

    if (!cardDetails.name) {
      setError("Please enter the cardholder name");
      return;
    }

    // Mock payment processing
    setPaymentState("processing");

    // Simulate API call to Stripe
    setTimeout(() => {
      // In a real app, you would use Stripe.js here
      const success = true; // Mock success

      if (success) {
        setPaymentState("success");
        setSavedCard({
          last4: cardDetails.number.slice(-4),
          brand: "visa", // Mock brand
          exp_month: cardDetails.expiry.split("/")[0],
          exp_year: `20${cardDetails.expiry.split("/")[1]}`,
          name: cardDetails.name,
        });
      } else {
        setPaymentState("error");
        setError("Payment failed. Please try again.");
      }
    }, 1500);
  };

  const resetForm = () => {
    setPaymentState("input");
    setCardDetails({
      number: "",
      expiry: "",
      cvc: "",
      name: "",
    });
    setError("");
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6">Payment Method</h2>
      <div className="w-full max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
          <h2 className="text-xl font-bold text-white flex items-center">
            <BiCreditCard className="mr-2" size={24} />
            Payment Details
          </h2>
        </div>

        {paymentState === "input" && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Card Number
              </label>
              <input
                type="text"
                name="number"
                value={cardDetails.number}
                onChange={handleInputChange}
                placeholder="1234 5678 9012 3456"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="text"
                  name="expiry"
                  value={cardDetails.expiry}
                  onChange={handleInputChange}
                  placeholder="MM/YY"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CVC
                </label>
                <input
                  type="text"
                  name="cvc"
                  value={cardDetails.cvc}
                  onChange={handleInputChange}
                  placeholder="123"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cardholder Name
              </label>
              <input
                type="text"
                name="name"
                value={cardDetails.name}
                onChange={handleInputChange}
                placeholder="John Doe"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm flex items-center">
                <FiAlertCircle size={16} className="mr-1" />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 text-white rounded-md py-2 px-4 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add Payment Method
            </button>
          </form>
        )}

        {paymentState === "processing" && (
          <div className="p-6 flex flex-col items-center justify-center">
            <div className="animate-pulse flex space-x-2">
              <div className="h-3 w-3 bg-blue-600 rounded-full"></div>
              <div className="h-3 w-3 bg-blue-600 rounded-full"></div>
              <div className="h-3 w-3 bg-blue-600 rounded-full"></div>
            </div>
            <p className="mt-4 text-gray-600">Processing your payment...</p>
          </div>
        )}

        {paymentState === "success" && savedCard && (
          <div className="p-6 space-y-4">
            <div className="bg-green-50 p-4 rounded-md flex items-start">
              <BiCheck size={24} className="text-green-500 mr-3 mt-1" />
              <div>
                <h3 className="text-green-800 font-medium">
                  Payment Method Added
                </h3>
                <p className="text-green-700 text-sm">
                  Your card has been saved successfully.
                </p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-md p-4">
              <h3 className="text-gray-700 font-medium mb-2">Saved Card</h3>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-1 rounded mr-3">
                    <BiCreditCard size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">
                      •••• •••• •••• {savedCard.last4}
                    </p>
                    <p className="text-sm text-gray-600">
                      Expires {savedCard.exp_month}/
                      {savedCard.exp_year.slice(-2)}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded uppercase">
                  Default
                </span>
              </div>
            </div>

            <button
              onClick={resetForm}
              className="w-full bg-gray-100 text-gray-600 rounded-md py-2 px-4 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Add Another Card
            </button>
          </div>
        )}

        {paymentState === "error" && (
          <div className="p-6 space-y-4">
            <div className="bg-red-50 p-4 rounded-md flex items-start">
              <FiAlertCircle size={24} className="text-red-500 mr-3 mt-1" />
              <div>
                <h3 className="text-red-800 font-medium">Payment Failed</h3>
                <p className="text-red-700 text-sm">
                  {error ||
                    "Please try again or use a different payment method."}
                </p>
              </div>
            </div>

            <button
              onClick={resetForm}
              className="w-full bg-blue-600 text-white rounded-md py-2 px-4 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StripePayment;
