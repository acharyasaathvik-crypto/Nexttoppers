/**
 * Sanskrit Course System - API Helper
 * Provides a central way to fetch data through the backend proxy.
 */

const API = {
    // The master token for all Nexttoppers requests
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyODUwMTM4LCJhcHBfaWQiOiIxNzcwOTgxMzQ3IiwiZGV2aWNlX2lkIjoiMTU1MTE3ODctZGNiYS00NGFjLWI3NmYtZTAyYjBmYWMyYTVmIiwicGxhdGZvcm0iOiIzIiwidXNlcl90eXBlIjoxLCJpYXQiOjE3ODMzNDkwMDEsImV4cCI6MTc4NTk0MTAwMX0.Rx84CgggAFA4bcWTaR-GQadiKtWz-ikqqrWyK2N8rvE',

    /**
     * Base fetcher for GET requests to the local proxy
     * @param {string} endpoint 
     * @param {Object} data 
     * @param {string} target 
     * @returns {Promise<Object>}
     */
    async get(endpoint, data = {}, target = 'deltastudy') {
        const queryParams = new URLSearchParams({ endpoint, target, ...data });
        const url = `/course?${queryParams.toString()}`;
        
        console.log(`[API Helper] GET Requesting ${endpoint} on ${target}...`);
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Server responded with ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error(`[API Helper] GET Error:`, error.message);
            throw error;
        }
    },

    /**
     * Base fetcher that hits the local proxy (POST)
     * @param {string} endpoint - The target API endpoint (e.g., 'course-details')
     * @param {Object} data - The JSON payload to send
     * @param {string} target - The target system (deltastudy, nexttoppers-course, etc.)
     * @returns {Promise<Object>} - The JSON response
     */
    async post(endpoint, data = {}, target = 'deltastudy') {
        const url = `/course?endpoint=${endpoint}&target=${target}`;
        
        console.log(`[API Helper] Requesting ${endpoint} on ${target}...`, data);
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Server responded with ${response.status}`);
            }

            const result = await response.json();
            console.log(`[API Helper] Success:`, result);
            return result;
        } catch (error) {
            console.error(`[API Helper] Error fetching ${endpoint}:`, error.message);
            throw error;
        }
    },

    /**
     * Show a graceful error message to the user
     * @param {string} message 
     */
    showError(message) {
        console.error('Graceful Error:', message);
    }
};

// Export for use in other scripts
window.API = API;
