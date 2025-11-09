import React, { useState, useEffect } from "react";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../../../config/env";

const STUDENT_ID = localStorage.getItem("student_id");

export default function Submissions() {
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [formStructure, setFormStructure] = useState(null);

  // Status configuration
  const statusConfig = {
    pending: {
      label: "Pending",
      icon: Clock,
      color: "yellow",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-800",
      borderColor: "border-yellow-200",
    },
    reviewing: {
      label: "In Review",
      icon: AlertCircle,
      color: "blue",
      bgColor: "bg-blue-50",
      textColor: "text-blue-800",
      borderColor: "border-blue-200",
    },
    approved: {
      label: "Approved",
      icon: CheckCircle2,
      color: "green",
      bgColor: "bg-green-50",
      textColor: "text-green-800",
      borderColor: "border-green-200",
    },
    rejected: {
      label: "Rejected",
      icon: XCircle,
      color: "red",
      bgColor: "bg-red-50",
      textColor: "text-red-800",
      borderColor: "border-red-200",
    },
  };

  // Fetch form structure on mount
  useEffect(() => {
    const fetchFormStructure = async () => {
      try {
        // get institute_id from students table based on STUDENT_ID
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .select("institute_id")
          .eq("id", STUDENT_ID)
          .single();

        if (studentError) throw studentError;

        const { data, error } = await supabase
          .from("admissions_form")
          .select("form_data")
          .eq("institute_id", studentData?.institute_id)
          .single();

        if (error) throw error;
        if (data) {
          setFormStructure(data.form_data);
        }

        // Get paginated data
        const { data: submissionsData, error: submissionsError } =
          await supabase
            .from("admissions")
            .select("*")
            .eq("student_id", STUDENT_ID)
            .limit(1);

        if (submissionsError) throw submissionsError;
        setSelectedSubmission(submissionsData[0]);
      } catch (error) {
        console.error("Error fetching form structure:", error);
      }
    };

    fetchFormStructure();
  }, []);

  // Helper function to check if file is an image
  const isImageFile = (url) => {
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    return imageExtensions.some((ext) => url.toLowerCase().endsWith(ext));
  };

  // Render submission details
  const renderSubmissionDetails = (submission) => {
    if (!formStructure) return null;

    return (
      <>
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-lg font-medium">Current Status</h4>
            </div>
            <div className="">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  statusConfig[submission?.status]?.bgColor || "bg-gray-50"
                } ${
                  statusConfig[submission?.status]?.textColor || "text-gray-800"
                }`}
              >
                {React.createElement(
                  statusConfig[submission?.status]?.icon || Clock,
                  {
                    className: "w-4 h-4 mr-2",
                  }
                )}
                {statusConfig[submission?.status]?.label || "Unknown Status"}
              </span>
            </div>
          </div>
          {submission?.reviewed_at && (
            <div className="text-sm text-gray-500">
              Last updated: {new Date(submission?.reviewed_at).toLocaleString()}
            </div>
          )}
        </div>

        {formStructure?.sections?.map((section) => {
          const sectionData = submission?.form_data[section?.id];
          if (!sectionData) return null;

          return (
            <div key={section.id} className="mb-6">
              <h4 className="text-lg font-medium mb-3">{section.title}</h4>
              <div className="space-y-4">
                {section?.inputs?.map((input) => {
                  const value = sectionData[input?.id];
                  if (value === undefined || value === "") return null;

                  return (
                    <div
                      key={input.id}
                      className="border-b border-gray-100 pb-3"
                    >
                      <div className="font-medium text-gray-700 mb-1">
                        {input.label}
                      </div>
                      <div className="text-gray-600">
                        {input.type === "checkbox" ? (
                          <div className="space-y-1">
                            {Object.entries(value).map(
                              ([option, isChecked]) =>
                                isChecked && (
                                  <div
                                    key={option}
                                    className="flex items-center"
                                  >
                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                    {option}
                                  </div>
                                )
                            )}
                          </div>
                        ) : input.type === "date" ? (
                          new Date(value).toLocaleDateString()
                        ) : input.type === "file" ? (
                          <div className="mt-2">
                            {isImageFile(value) ? (
                              <div className="max-w-md">
                                <img
                                  src={value}
                                  alt="Uploaded file"
                                  className="rounded-lg shadow-sm"
                                />
                                <a
                                  href={value}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                                >
                                  Open in new tab
                                </a>
                              </div>
                            ) : (
                              <a
                                href={value}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                Download File
                              </a>
                            )}
                          </div>
                        ) : (
                          value
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div className="bg-white">
      <div className="bg-white  border border-gray-200 rounded-lg max-w-2xl mx-auto ">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium">Submission Details</h3>
        </div>
        <div className="p-4">{renderSubmissionDetails(selectedSubmission)}</div>
      </div>
    </div>
  );
}
