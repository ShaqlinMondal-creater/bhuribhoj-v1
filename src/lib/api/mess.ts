export type FundType = "manager_only" | "mess_and_manager";

export type MessRecord = {
  id: number;
  name: string;
  code: string;
  address: string;
  district: string;
  pincode: string;
  contact_no: string;
  email: string | null;
  fund_type: FundType;
  is_active: boolean;
};
