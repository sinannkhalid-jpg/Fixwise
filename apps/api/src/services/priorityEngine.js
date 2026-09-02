/**
 * DETERMINISTIC PRIORITY ENGINE FOR FIXWISE
 * Total Score = 0 to 100
 * 
 * Formula:
 * - Severity Score:            0 - 30
 * - Safety Risk Score:         0 - 20
 * - Linked Reports Count Score:0 - 20
 * - Location Importance Score: 0 - 10
 * - Complaint Age Score:       0 - 10
 * - Public Impact Score:       0 - 10
 */

export function calculatePriorityScore({
  severity = 'MEDIUM',     // 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  safetyRisk = 0.5,        // 0.0 to 1.0 (from Member 3 AI service)
  linkedReportsCount = 1,  // Number of citizens reporting same issue
  isNearSchoolOrHospital = false,
  createdHoursAgo = 0,
  publicImpactFactor = 0.5 // 0.0 to 1.0
}) {
  // 1. Severity Score (0-30)
  let severityScore = 15;
  if (severity === 'CRITICAL') severityScore = 30;
  else if (severity === 'HIGH') severityScore = 24;
  else if (severity === 'MEDIUM') severityScore = 15;
  else if (severity === 'LOW') severityScore = 8;

  // 2. Safety Risk Score (0-20)
  const safetyRiskScore = Math.min(20, Math.round(safetyRisk * 20));

  // 3. Linked Reports Count Score (0-20)
  // 1 report = 4 pts, 5+ reports = 20 pts
  const reportsCountScore = Math.min(20, linkedReportsCount * 4);

  // 4. Location Importance Score (0-10)
  const locationImportanceScore = isNearSchoolOrHospital ? 10 : 5;

  // 5. Complaint Age Score (0-10)
  // Max score after 48 hours without resolution
  const complaintAgeScore = Math.min(10, Math.floor(createdHoursAgo / 4.8));

  // 6. Public Impact Score (0-10)
  const publicImpactScore = Math.min(10, Math.round(publicImpactFactor * 10));

  // Calculate Total Score
  const totalScore = Math.min(
    100,
    severityScore +
    safetyRiskScore +
    reportsCountScore +
    locationImportanceScore +
    complaintAgeScore +
    publicImpactScore
  );

  // Map to Priority Level
  let priorityLevel = 'MEDIUM';
  if (totalScore >= 80) priorityLevel = 'CRITICAL';
  else if (totalScore >= 60) priorityLevel = 'HIGH';
  else if (totalScore >= 40) priorityLevel = 'MEDIUM';
  else priorityLevel = 'LOW';

  return {
    totalScore,
    priorityLevel,
    breakdown: {
      severityScore,
      safetyRiskScore,
      reportsCountScore,
      locationImportanceScore,
      complaintAgeScore,
      publicImpactScore
    }
  };
}
