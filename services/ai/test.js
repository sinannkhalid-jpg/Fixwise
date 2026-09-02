/**
 * Comprehensive Validation Test Suite for Member 3 AI & Civic Intelligence Engines
 */

const assert = require('assert');

// 1. Enums
const IssueCategory = {
  POTHOLE: "pothole",
  FLOODING: "flooding",
  GARBAGE_WASTE: "garbage_waste",
  BROKEN_STREETLIGHT: "broken_streetlight",
  WATER_LEAK: "water_leak",
  DRAINAGE_PROBLEM: "drainage_problem",
  DAMAGED_ROAD: "damaged_road",
  PUBLIC_INFRASTRUCTURE: "public_infrastructure",
  TRAFFIC_SIGNAGE: "traffic_signage",
  OTHER: "other"
};

const DepartmentType = {
  ROADS: "roads",
  DRAINAGE: "drainage",
  WATER: "water",
  ELECTRICAL_TRAFFIC: "electrical_traffic",
  SANITATION: "sanitation",
  PUBLIC_WORKS: "public_works",
  GENERAL_MAINTENANCE: "general_maintenance"
};

const PriorityLevel = {
  CRITICAL: "CRITICAL",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW"
};

const RiskLevel = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  VERY_HIGH: "VERY_HIGH"
};

const ZoneType = {
  CRITICAL_FACILITY: "critical_facility",
  ARTERIAL_HIGHWAY: "arterial_highway",
  COMMERCIAL: "commercial",
  RESIDENTIAL: "residential",
  REMOTE: "remote"
};

// 2. Mathematical Utilities
function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000.0;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(deltaPhi / 2) ** 2 +
            Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function cosineSimilarity(vec1, vec2) {
  if (!vec1 || !vec2 || vec1.length !== vec2.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vec1.length; i++) {
    dot += vec1[i] * vec2[i];
    normA += vec1[i] ** 2;
    normB += vec2[i] ** 2;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function generateDeterministicEmbedding(text, dimensions = 768) {
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  const vector = new Array(dimensions).fill(0);
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = ((hash << 5) - hash) + word.charCodeAt(j);
      hash |= 0;
    }
    const posWeight = 1.0 / (1.0 + 0.1 * i);
    for (let d = 0; d < dimensions; d++) {
      const pseudoVal = Math.sin((hash + d * 31) % 1000);
      vector[d] += pseudoVal * posWeight;
    }
  }

  let norm = 0;
  for (let d = 0; d < dimensions; d++) norm += vector[d] ** 2;
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let d = 0; d < dimensions; d++) vector[d] = Number((vector[d] / norm).toFixed(6));
  }
  return vector;
}

// 3. Priority Engine (Exact 100-Point Deterministic Rubric)
function calculatePriority({ severity, safety_risk, linked_report_count = 1, zone_type = ZoneType.RESIDENTIAL, complaint_age_hours = 0, sla_target_hours = 48, public_impact_multiplier = 0.5 }) {
  const severity_pts = Math.min(30.0, severity * 30.0);
  const safety_pts = Math.min(20.0, safety_risk * 20.0);
  const report_pts = Math.min(20.0, linked_report_count * 4.0);
  
  const zoneMap = {
    [ZoneType.CRITICAL_FACILITY]: 10.0,
    [ZoneType.ARTERIAL_HIGHWAY]: 7.5,
    [ZoneType.COMMERCIAL]: 5.5,
    [ZoneType.RESIDENTIAL]: 3.5,
    [ZoneType.REMOTE]: 1.5,
  };
  const loc_pts = Math.min(10.0, zoneMap[zone_type] || 3.5);
  const age_ratio = Math.min(1.0, complaint_age_hours / Math.max(1.0, sla_target_hours));
  const age_pts = Math.min(10.0, age_ratio * 10.0);
  const impact_pts = Math.min(10.0, (public_impact_multiplier || 0.5) * 10.0);

  const total = Math.min(100.0, Math.max(0.0, severity_pts + safety_pts + report_pts + loc_pts + age_pts + impact_pts));
  const total_score = Number(total.toFixed(2));

  let level = PriorityLevel.LOW;
  let sla_hours = 168;

  if (total_score >= 80.0) {
    level = PriorityLevel.CRITICAL;
    sla_hours = 4;
  } else if (total_score >= 60.0) {
    level = PriorityLevel.HIGH;
    sla_hours = 24;
  } else if (total_score >= 40.0) {
    level = PriorityLevel.MEDIUM;
    sla_hours = 72;
  }

  return {
    total_score,
    priority_level: level,
    breakdown: {
      severity_points: Number(severity_pts.toFixed(2)),
      safety_risk_points: Number(safety_pts.toFixed(2)),
      report_count_points: Number(report_pts.toFixed(2)),
      location_importance_points: Number(loc_pts.toFixed(2)),
      complaint_age_points: Number(age_pts.toFixed(2)),
      public_impact_points: Number(impact_pts.toFixed(2))
    },
    recommended_sla_hours: sla_hours,
    escalation_flag: (level === PriorityLevel.CRITICAL) || (safety_risk >= 0.85)
  };
}

// 4. Duplicate Engine
function checkDuplicates({ new_description, new_category, new_location, new_timestamp, candidate_cases = [] }) {
  const newVec = generateDeterministicEmbedding(new_description);
  const newTime = new Date(new_timestamp).getTime();
  const maxGps = 150.0;
  const maxDays = 30;

  const matches = candidate_cases.map(cand => {
    const dist = haversineDistanceMeters(new_location.latitude, new_location.longitude, cand.location.latitude, cand.location.longitude);
    const candVec = cand.embedding || generateDeterministicEmbedding(cand.description);
    const vecSim = cosineSimilarity(newVec, candVec);
    const catMatch = (new_category === cand.category);
    const candTime = new Date(cand.timestamp).getTime();
    const deltaDays = Math.abs(newTime - candTime) / (1000 * 3600 * 24);

    const gpsScore = Math.max(0, 1 - (dist / maxGps));
    const vecScore = Math.max(0, Math.min(1, (vecSim + 1) / 2));
    const catScore = catMatch ? 1.0 : 0.0;
    const timeScore = Math.max(0, 1 - (deltaDays / maxDays));

    const composite = (0.40 * vecScore) + (0.35 * gpsScore) + (0.15 * catScore) + (0.10 * timeScore);
    const prob = Number(Math.min(1, Math.max(0, composite)).toFixed(4));

    return {
      case_id: cand.case_id,
      duplicate_probability: prob,
      vector_similarity: Number(vecSim.toFixed(4)),
      gps_distance_meters: Number(dist.toFixed(2)),
      category_match: catMatch,
      is_definite: prob >= 0.75,
      is_potential: prob >= 0.50
    };
  });

  matches.sort((a, b) => b.duplicate_probability - a.duplicate_probability);
  const topMatch = matches[0] || null;

  return {
    has_duplicate: Boolean(topMatch && topMatch.is_potential),
    recommended_action: topMatch && topMatch.is_definite ? "LINK_TO_EXISTING_CASE" : (topMatch && topMatch.is_potential ? "FLAG_FOR_MANUAL_REVIEW" : "CREATE_NEW_CASE"),
    top_match: topMatch,
    all_matches: matches
  };
}

// 5. Risk Engine
function assessRisk({ submissions_last_24h = 1, user_historical_verified_count = 0, user_historical_rejected_count = 0, image_text_consistency_score = 0.9, gps_implausible_speed_flag = false }) {
  let score = 0;
  const flags = [];

  if (submissions_last_24h >= 10) { score += 40; flags.push("high_velocity"); }
  else if (submissions_last_24h >= 5) { score += 20; flags.push("elevated_velocity"); }

  const totalHist = user_historical_verified_count + user_historical_rejected_count;
  if (totalHist >= 3 && (user_historical_rejected_count / totalHist) >= 0.5) {
    score += 35; flags.push("high_historical_rejection");
  }

  if (image_text_consistency_score < 0.35) { score += 35; flags.push("severe_image_text_mismatch"); }
  if (gps_implausible_speed_flag) { score += 30; flags.push("gps_teleportation"); }

  const finalScore = Math.min(100, Math.max(0, score));
  let level = RiskLevel.LOW;
  let is_held = false;

  if (finalScore >= 85) { level = RiskLevel.VERY_HIGH; is_held = true; }
  else if (finalScore >= 70) { level = RiskLevel.HIGH; is_held = true; }
  else if (finalScore >= 40) { level = RiskLevel.MEDIUM; }

  return { risk_score: finalScore, risk_level: level, is_held_for_review: is_held, flagged_factors: flags };
}

// ==================== TEST SUITE EXECUTION ====================
console.log("🚀 Running Member 3 AI & Civic Intelligence Verification Tests...\n");

// Test 1: Vector Embeddings & Similarity
const vecA = generateDeterministicEmbedding("Massive pothole on Main Street outside hospital");
const vecB = generateDeterministicEmbedding("Huge dangerous hole in road near hospital entrance");
const vecC = generateDeterministicEmbedding("Streetlight not working in dark park");
assert.strictEqual(vecA.length, 768, "Embedding must be 768 dimensions");
const simAB = cosineSimilarity(vecA, vecB);
const simAC = cosineSimilarity(vecA, vecC);
assert.ok(simAB > simAC, "Related reports must have higher semantic cosine similarity than unrelated ones");
console.log(`✅ [1/5] 768-Dim Embeddings & Cosine Similarity Validated (Sim AB: ${simAB.toFixed(3)}, Sim AC: ${simAC.toFixed(3)})`);

// Test 2: Priority Engine Deterministic Rubric
const criticalCase = calculatePriority({
  severity: 0.95,
  safety_risk: 0.90,
  linked_report_count: 5,
  zone_type: ZoneType.CRITICAL_FACILITY,
  complaint_age_hours: 12,
  sla_target_hours: 24,
  public_impact_multiplier: 0.9
});
assert.strictEqual(criticalCase.priority_level, PriorityLevel.CRITICAL, "Score must be CRITICAL");
assert.strictEqual(criticalCase.recommended_sla_hours, 4, "Critical SLA must be 4h");
assert.ok(criticalCase.total_score >= 80, "Total score must exceed 80");
console.log(`✅ [2/5] 100-Point Deterministic Priority Engine Validated (Score: ${criticalCase.total_score}/100, Level: ${criticalCase.priority_level})`);

// Test 3: Duplicate Incident Detection
const dupResult = checkDuplicates({
  new_description: "Dangerous pothole near 5th & Market",
  new_category: IssueCategory.POTHOLE,
  new_location: { latitude: 37.7750, longitude: -122.4195 },
  new_timestamp: "2026-09-02T10:00:00Z",
  candidate_cases: [{
    case_id: "CASE-1024",
    category: IssueCategory.POTHOLE,
    description: "Deep pothole on Market near 5th",
    location: { latitude: 37.7749, longitude: -122.4194 },
    timestamp: "2026-09-02T08:00:00Z"
  }]
});
assert.strictEqual(dupResult.has_duplicate, true, "Should identify duplicate incident");
assert.strictEqual(dupResult.recommended_action, "LINK_TO_EXISTING_CASE", "Action must be LINK_TO_EXISTING_CASE");
assert.ok(dupResult.top_match.gps_distance_meters < 30, "Distance must be under 30m");
console.log(`✅ [3/5] Hybrid Duplicate Detection Engine Validated (Prob: ${(dupResult.top_match.duplicate_probability * 100).toFixed(1)}%, Dist: ${dupResult.top_match.gps_distance_meters}m)`);

// Test 4: Fake & Spam Risk Assessor
const spamResult = assessRisk({
  submissions_last_24h: 12,
  user_historical_verified_count: 0,
  user_historical_rejected_count: 4,
  image_text_consistency_score: 0.2,
  gps_implausible_speed_flag: true
});
assert.strictEqual(spamResult.is_held_for_review, true, "Spam submission must be held for review");
assert.strictEqual(spamResult.risk_level, RiskLevel.VERY_HIGH, "Risk must be VERY_HIGH");
console.log(`✅ [4/5] Multi-Factor Fake/Spam Risk Assessor Validated (Score: ${spamResult.risk_score}/100, Level: ${spamResult.risk_level})`);

// Test 5: Geographic Distance & Proximity
const sfDist = haversineDistanceMeters(37.7793, -122.4193, 37.7955, -122.3937);
assert.ok(sfDist > 2200 && sfDist < 2900, "Haversine distance between SF landmarks must be accurate");
console.log(`✅ [5/5] Spatial Haversine Geometry Calculations Validated (${sfDist.toFixed(1)}m)`);

console.log("\n🎯 ALL MEMBER 3 AI & CIVIC INTELLIGENCE TESTS PASSED SUCCESSFULLY! 💯");
