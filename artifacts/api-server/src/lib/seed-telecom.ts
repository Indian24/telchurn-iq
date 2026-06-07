import { db, customersTable } from "@workspace/db";
import { logger } from "./logger";

const STATES = [
  "Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Uttar Pradesh",
  "Gujarat", "Rajasthan", "West Bengal", "Andhra Pradesh", "Telangana",
  "Kerala", "Madhya Pradesh", "Punjab", "Haryana", "Bihar",
  "Odisha", "Jharkhand", "Assam", "Himachal Pradesh", "Uttarakhand",
];

const CITIES_BY_STATE: Record<string, string[]> = {
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad"],
  "Delhi": ["New Delhi", "Dwarka", "Rohini", "Noida", "Gurugram"],
  "Karnataka": ["Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem", "Trichy"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Allahabad"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri"],
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
  "Kerala": ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Kollam"],
  "Madhya Pradesh": ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Sonipat"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Sambalpur", "Berhampur"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh"],
  "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon"],
  "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala", "Solan", "Mandi"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rishikesh"],
};

const SUBSCRIPTION_TYPES = ["Basic", "Standard", "Premium", "Enterprise"];
const CONTRACT_TYPES = ["Month-to-Month", "One Year", "Two Year"];
const PAYMENT_METHODS = ["Credit Card", "Debit Card", "UPI", "Net Banking", "Cash"];
const GENDERS = ["Male", "Female"];

function seededRandom(seed: number): () => number {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randFloat(rng: () => number, min: number, max: number, decimals = 2): number {
  return parseFloat((rng() * (max - min) + min).toFixed(decimals));
}

function pickWeighted<T>(rng: () => number, items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function computeChurnProbability(record: {
  tenure: number;
  monthlyCharges: number;
  customerSatisfactionScore: number;
  complaintCount: number;
  networkIssues: number;
  customerSupportCalls: number;
  contractType: string;
  subscriptionType: string;
  rechargeFrequency: number;
}): number {
  let logit = -1.5;

  // Tenure reduces churn
  logit += (-0.04) * Math.min(record.tenure, 72);

  // High charges increase churn slightly
  logit += 0.008 * (record.monthlyCharges - 500);

  // Low satisfaction -> high churn
  logit += (-0.4) * record.customerSatisfactionScore;

  // Complaints strongly predict churn
  logit += 0.45 * record.complaintCount;

  // Network issues
  logit += 0.35 * record.networkIssues;

  // Support calls
  logit += 0.2 * record.customerSupportCalls;

  // Contract type
  if (record.contractType === "Month-to-Month") logit += 1.2;
  else if (record.contractType === "One Year") logit += 0.2;

  // Low recharge frequency = disengaged
  logit += (-0.1) * record.rechargeFrequency;

  // Add noise
  const prob = 1 / (1 + Math.exp(-logit));
  return parseFloat(Math.max(0.01, Math.min(0.99, prob)).toFixed(4));
}

export async function seedTelecomData(totalRecords = 50000): Promise<void> {
  const existing = await db.select().from(customersTable).limit(1);
  if (existing.length > 0) {
    logger.info("Telecom data already seeded, skipping");
    return;
  }

  logger.info({ totalRecords }, "Starting telecom data seeding");

  const rng = seededRandom(42);
  const batchSize = 500;
  let inserted = 0;

  for (let batch = 0; batch < Math.ceil(totalRecords / batchSize); batch++) {
    const records = [];
    const batchStart = batch * batchSize;
    const batchEnd = Math.min(batchStart + batchSize, totalRecords);

    for (let i = batchStart; i < batchEnd; i++) {
      const state = STATES[Math.floor(rng() * STATES.length)];
      const cities = CITIES_BY_STATE[state] || ["Unknown"];
      const city = cities[Math.floor(rng() * cities.length)];

      const tenure = randInt(rng, 1, 72);
      const subscriptionType = pickWeighted(rng, SUBSCRIPTION_TYPES, [0.35, 0.30, 0.25, 0.10]);
      const contractType = pickWeighted(rng, CONTRACT_TYPES, [0.55, 0.25, 0.20]);
      const paymentMethod = pickWeighted(rng, PAYMENT_METHODS, [0.25, 0.25, 0.30, 0.15, 0.05]);
      const gender = pickWeighted(rng, GENDERS, [0.52, 0.48]);
      const age = randInt(rng, 18, 70);

      // Monthly charges by plan
      const chargesMap: Record<string, [number, number]> = {
        "Basic": [199, 399],
        "Standard": [399, 699],
        "Premium": [699, 1199],
        "Enterprise": [1199, 2499],
      };
      const [minCharge, maxCharge] = chargesMap[subscriptionType];
      const monthlyCharges = randFloat(rng, minCharge, maxCharge);
      const totalCharges = parseFloat((monthlyCharges * tenure * (0.9 + rng() * 0.2)).toFixed(2));

      const internetUsageGb = randFloat(rng, 1, 150);
      const voiceMinutes = randFloat(rng, 10, 2000);
      const smsUsage = randFloat(rng, 0, 500);
      const rechargeFrequency = randInt(rng, 1, 12);
      const customerSupportCalls = randInt(rng, 0, 8);
      const complaintCount = randInt(rng, 0, 6);
      const networkIssues = randInt(rng, 0, 5);
      const customerSatisfactionScore = randFloat(rng, 1, 5);

      const arpu = parseFloat((monthlyCharges * (0.85 + rng() * 0.3)).toFixed(2));
      const revenue = parseFloat((arpu * Math.min(tenure, 60)).toFixed(2));

      const churnProbability = computeChurnProbability({
        tenure,
        monthlyCharges,
        customerSatisfactionScore,
        complaintCount,
        networkIssues,
        customerSupportCalls,
        contractType,
        subscriptionType,
        rechargeFrequency,
      });

      // Determine actual churn (20% overall churn rate target)
      const churn = churnProbability > 0.5 && rng() < 0.75 ? 1 :
        churnProbability > 0.35 && rng() < 0.25 ? 1 :
        churnProbability < 0.2 && rng() < 0.03 ? 1 : 0;

      const riskTier = churnProbability >= 0.7 ? "High" :
        churnProbability >= 0.4 ? "Medium" : "Low";

      // CLV = ARPU * avg_remaining_months * retention_factor
      const avgLifetimeMonths = contractType === "Two Year" ? 36 : contractType === "One Year" ? 18 : 12;
      const customerLifetimeValue = parseFloat((arpu * avgLifetimeMonths * (1 - churnProbability * 0.5)).toFixed(2));

      const customerId = `CUST${String(i + 1).padStart(6, "0")}`;

      records.push({
        customerId,
        gender,
        age,
        state,
        city,
        tenure,
        subscriptionType,
        monthlyCharges,
        totalCharges,
        internetUsageGb,
        voiceMinutes,
        smsUsage,
        rechargeFrequency,
        customerSupportCalls,
        complaintCount,
        networkIssues,
        paymentMethod,
        contractType,
        customerSatisfactionScore,
        arpu,
        revenue,
        churn,
        customerLifetimeValue,
        churnProbability,
        riskTier,
      });
    }

    await db.insert(customersTable).values(records);
    inserted += records.length;

    if (inserted % 5000 === 0) {
      logger.info({ inserted, total: totalRecords }, "Seeding progress");
    }
  }

  logger.info({ inserted }, "Telecom data seeding complete");
}
