/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  phoneCode: string;
  inviteId?: string;
  promoCode: string;
  balance: number;
  claimedWelcomeBonus: boolean;
  transactionPin?: string | null;
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
  createdAt: string;
}

export interface InvestmentPlan {
  id: string;
  name: string;
  price: number;
  dailyYield: number;
  image: string;
  description: string;
  code5?: string;
  durationDays?: number;
}

export interface UserInvestment {
  id: string;
  planId: string;
  planName: string;
  price: number;
  dailyYield: number;
  createdAt: string;
  lastCollectedAt: string;
  totalCollected: number;
  durationDays: number;
}

export interface UserTransaction {
  id: string;
  type: "deposit" | "withdrawal" | "bonus" | "purchase" | "yield";
  amount: number;
  netAmount?: number;
  status: "pending" | "completed" | "rejected";
  proofUrl?: string;
  country?: string;
  description: string;
  createdAt: string;
}
