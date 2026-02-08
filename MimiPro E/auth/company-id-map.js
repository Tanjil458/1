// Company ID mapping configuration
// Maps short 8-character company IDs to full Firebase UIDs

const COMPANY_ID_MAP = {
    // Add your company short ID mappings here
    // Format: 'shortID': 'fullFirebaseUID'
    '5ti4r7Rz': '5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2',
    // Phone number based company ID (for MD1 and other employees using phone as company ID)
    '017000000000': '5ti4r7RzNhSLJQ5Wmx0rwQ5qhJn2'
    // Add more mappings as needed:
    // 'ABC12345': 'ABC12345XYZ...',
};

// Helper function to expand short company ID to full ID
function expandCompanyId(companyId) {
    // First check if there's a mapping for this ID
    if (COMPANY_ID_MAP[companyId]) {
        console.log(`✅ Expanded company ID ${companyId} to full Firebase UID`);
        return COMPANY_ID_MAP[companyId];
    }
    
    // If it's already a long Firebase UID format (28+ chars), return as is
    // Firebase UIDs are typically 28 characters long
    if (companyId.length >= 28) {
        console.log(`✅ Using provided Firebase UID (${companyId.length} chars)`);
        return companyId;
    }
    
    // If no mapping found, return as is and let Firebase handle validation
    console.warn(`⚠️ No mapping found for company ID: ${companyId}`);
    return companyId;
}
