// src/pages/PricingPage.jsx - Enhanced version
import { useContext, useEffect, useState } from "react";
import { InstituteContext, UserContext } from "../../../context/contexts";
import { supabase } from "../../../config/env";
import {
  Users,
  UserPlus,
  GraduationCap,
  Smartphone,
  Globe,
  Shield,
  BarChart3,
  CheckCircle2,
  CreditCard,
  Banknote,
  Wallet,
  QrCode,
} from "lucide-react";

const Plans = () => {
  const { instituteState } = useContext(InstituteContext);
  const { userState } = useContext(UserContext);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = [
    {
      id: "plan_free",
      name: "Free Plan",
      price: 0,
      description: "Perfect for small educational institutions",
      features: [
        { icon: Users, text: "20 Students" },
        { icon: UserPlus, text: "20 Parents" },
        { icon: GraduationCap, text: "10 Staff Members" },
        { icon: Shield, text: "Basic Features" },
        { icon: Smartphone, text: "No Mobile App Access" },
        { icon: Globe, text: "No Parent/Student Portal" },
      ],
      color: "blue",
    },
    {
      id: "plan_basic",
      name: "Basic Plan",
      price: 5000,
      description: "Ideal for growing institutions",
      features: [
        { icon: Users, text: "100 Students" },
        { icon: UserPlus, text: "100 Parents" },
        { icon: GraduationCap, text: "30 Staff Members" },
        { icon: Smartphone, text: "Full Mobile App Access" },
        { icon: Globe, text: "Parent & Student Portals" },
        { icon: Shield, text: "Basic Support" },
        { icon: CreditCard, text: "Monthly Billing" },
      ],
      color: "zinc",
    },
    {
      id: "plan_pro",
      name: "Pro Plan",
      price: 10000,
      description: "For established educational institutions",
      features: [
        { icon: Users, text: "300 Students" },
        { icon: UserPlus, text: "300 Parents" },
        { icon: GraduationCap, text: "60 Staff Members" },
        { icon: Smartphone, text: "Full Mobile App Access" },
        { icon: Globe, text: "Parent & Student Portals" },
        { icon: Shield, text: "Priority Support" },
        { icon: CreditCard, text: "Monthly Billing" },
        { icon: BarChart3, text: "Advanced Analytics" },
      ],
      color: "purple",
    },
  ];

  useEffect(() => {
    const fetchCompanyPlan = async () => {
      if (!instituteState?.id) return;

      try {
        const { data, error } = await supabase
          .from("plans")
          .select("*")
          .eq("institute_id", instituteState.id)
          .single();

        if (error) {
          console.error("Error fetching company plan:", error);
          return;
        }

        if (data) {
          setSelectedPlan(data.plan);
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };

    fetchCompanyPlan();
  }, [instituteState?.id]);

  const handleCheckout = async (planId) => {
    try {
      // Here you would implement the payment gateway integration
      // For now, we'll just show a message
      alert(
        "Please contact our sales team to proceed with the payment through Easy Paisa, Jazz Cash, Nayapay, or Bank Transfer."
      );

      // You can implement the actual payment processing logic here
      // This would typically involve creating a payment record in your database
      const { data, error } = await supabase.from("plans").upsert({
        institute_id: instituteState.id,
        plan: planId,
        status: "pending",
        payment_method: "pending",
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error saving plan:", error);
        return;
      }

      // Redirect to a payment instructions page or show payment details
      window.location.href = "/payment-instructions";
    } catch (error) {
      console.error("Error during checkout:", error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-12">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Choose Your Educational Plan
          </h1>
          <p className="mt-3 text-base text-gray-500 max-w-2xl mx-auto">
            Select a plan that best fits your institution's needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const isPlanSelected = selectedPlan === plan.id;
            const baseColor = plan.color || "indigo";

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-xl shadow-sm border relative ${
                  isPlanSelected
                    ? "ring-2 ring-green-500 border-green-500"
                    : "border-gray-200"
                } transition-all duration-300 hover:shadow-lg`}
              >
                {isPlanSelected && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Current Plan
                    </span>
                  </div>
                )}
                <div className="p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {plan.name}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      {plan.description}
                    </p>

                    <div className="mt-4">
                      <span className="text-3xl font-bold text-gray-900">
                        {plan.price === 0 ? "Free" : `PKR ${plan.price}`}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-sm text-gray-500">/month</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm">
                        <feature.icon className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-gray-600">{feature.text}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={() => handleCheckout(plan.id)}
                      disabled={isPlanSelected}
                      className={`w-full py-2 px-4 text-sm rounded-lg text-white font-medium transition-all ${
                        isPlanSelected
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-gray-600 hover:bg-gray-700"
                      }`}
                    >
                      {isPlanSelected ? "Current Plan" : "Get Started"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm font-medium text-gray-900 mb-4">
            Payment Methods Available:
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-gray-100 text-gray-700">
              <Wallet className="h-4 w-4 mr-1.5" />
              Easy Paisa
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-gray-100 text-gray-700">
              <QrCode className="h-4 w-4 mr-1.5" />
              Jazz Cash
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-gray-100 text-gray-700">
              <Banknote className="h-4 w-4 mr-1.5" />
              Nayapay
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-gray-100 text-gray-700">
              <CreditCard className="h-4 w-4 mr-1.5" />
              Bank Transfer
            </span>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            For payment assistance, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Plans;
