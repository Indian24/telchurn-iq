import {
  pgTable,
  text,
  integer,
  real,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const customersTable = pgTable("customers", {
  id: serial("id").primaryKey(),
  customerId: text("customer_id").notNull().unique(),
  gender: text("gender").notNull(),
  age: integer("age").notNull(),
  state: text("state").notNull(),
  city: text("city").notNull(),
  tenure: integer("tenure").notNull(),
  subscriptionType: text("subscription_type").notNull(),
  monthlyCharges: real("monthly_charges").notNull(),
  totalCharges: real("total_charges").notNull(),
  internetUsageGb: real("internet_usage_gb").notNull(),
  voiceMinutes: real("voice_minutes").notNull(),
  smsUsage: real("sms_usage").notNull(),
  rechargeFrequency: integer("recharge_frequency").notNull(),
  customerSupportCalls: integer("customer_support_calls").notNull(),
  complaintCount: integer("complaint_count").notNull(),
  networkIssues: integer("network_issues").notNull(),
  paymentMethod: text("payment_method").notNull(),
  contractType: text("contract_type").notNull(),
  customerSatisfactionScore: real("customer_satisfaction_score").notNull(),
  arpu: real("arpu").notNull(),
  revenue: real("revenue").notNull(),
  churn: integer("churn").notNull().default(0),
  customerLifetimeValue: real("customer_lifetime_value").notNull(),
  churnProbability: real("churn_probability").notNull().default(0),
  riskTier: text("risk_tier").notNull().default("Low"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customersTable).omit({
  id: true,
  createdAt: true,
});
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customersTable.$inferSelect;
