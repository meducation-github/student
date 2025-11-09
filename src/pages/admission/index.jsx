import React, { useState } from "react";
import PageHeader from "../../components/pageHeader";
import Submissions from "./components/Submissions";

export default function Admission() {
  return (
    <div className="">
      <PageHeader
        title={"Admission"}
        subtitle={`See your admission detail and status`}
      />

      <main className="container mx-auto px-4 py-6">
        <Submissions />
      </main>
    </div>
  );
}
