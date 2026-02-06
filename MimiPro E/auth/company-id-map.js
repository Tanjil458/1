// Company ID mapping configuration
// Maps short 8-character company IDs to full Firebase UIDs

const COMPANY_ID_MAP = {
    // Add your company short ID mappings here
    // Format: 'shortID': 'fullFirebaseUID'
    '5ti4r7Rz': '5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2'
    // Add more mappings as needed:
    // 'ABC12345': 'ABC12345XYZ...',
};

// Helper function to expand short company ID to full ID
function expandCompanyId(companyId) {
    // If it's already long enough, return as is
    if (companyId.length > 8) {
        return companyId;
    }
    
    // Look up in mapping
    if (COMPANY_ID_MAP[companyId]) {
        console.log(`✅ Expanded short ID ${companyId} to full ID`);
        return COMPANY_ID_MAP[companyId];
    }
    
    // If no mapping found, return as is and let Firebase handle validation
    console.warn(`⚠️ No mapping found for short ID: ${companyId}`);
    return companyId;
}
