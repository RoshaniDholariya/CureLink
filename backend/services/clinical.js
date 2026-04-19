import axios from "axios";

export const fetchClinicalTrials = async (disease, location = "") => {
  try {
    const res = await axios.get(
      `https://clinicaltrials.gov/api/v2/studies?query.cond=${disease}&pageSize=50&format=json`
    );

    const mapped = res.data.studies.map((study) => ({
      title: study.protocolSection?.identificationModule?.briefTitle,
      status: study.protocolSection?.statusModule?.overallStatus,
      eligibility:
        study.protocolSection?.eligibilityModule?.eligibilityCriteria,
      location:
        study.protocolSection?.contactsLocationsModule?.locations?.[0]?.facility?.name || "N/A",
      contact: "N/A",
      source: "ClinicalTrials"
    }));

    const normalizedLocation = location.trim().toLowerCase();
    if (!normalizedLocation) return mapped;

    const locationTokens = normalizedLocation
      .split(",")
      .map((token) => token.trim())
      .filter(Boolean);

    const inLocation = mapped.filter((trial) => {
      const trialLocation = String(trial.location || "").toLowerCase();
      if (trialLocation.includes(normalizedLocation)) return true;
      return locationTokens.some((token) => trialLocation.includes(token));
    });

    return inLocation.length > 0 ? inLocation : mapped;

  } catch (err) {
    console.error("Clinical error:", err.message);
    return [];
  }
};
