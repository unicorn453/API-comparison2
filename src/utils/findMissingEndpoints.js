export const findMissingEndpoints = (excelData, jsonUrls) => {
    const baseUrl = "https://api.stripe.com/v1/";
    const excelUrls = new Set(
        excelData.slice(1).map(row => {
            const endpoint = row[3];
            if (endpoint) {
                const urlWithoutQuery = endpoint.split('?')[0];
                const urlParts = urlWithoutQuery.split('/v1/');
                if (urlParts.length > 1) {
                    return urlParts[1];
                }
            }
            return null;
        }).filter(url => url !== null)
    );
    const missingEndpoints = [...excelUrls].filter(url => !jsonUrls.includes(url));
    return missingEndpoints.map(endpoint => baseUrl + endpoint);
};