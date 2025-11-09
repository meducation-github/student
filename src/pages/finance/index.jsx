import { useState } from "react";
import PageHeader from "../../components/pageHeader";
import SubSidenav from "../../components/sidenav/subsidenav";
import { CreditCard, File, DollarSign } from "lucide-react";
import { Outlet } from "react-router-dom";
import Fees from "./fees";

function Finance() {
  return (
    <>
      <PageHeader
        title={"Finance"}
        subtitle={"Manage your finance information"}
      />

      <Fees />
    </>
  );
}

export default Finance;
