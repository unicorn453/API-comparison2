import { useState } from 'react';

export const useDisplayStats = () => {
    const [stats, setStats] = useState({ totalEndpoints: 0, comparisonRate: 0, missingCount: 0, missingEndpoints: [] });

    const displayStats = (totalEndpoints, missingEndpoints) => {
        const comparisonRate = ((totalEndpoints - missingEndpoints.length) / totalEndpoints) * 100;
        let rateColor;
        if (comparisonRate >= 90) {
            rateColor = 'green';
        } else if (comparisonRate >= 60) {
            rateColor = 'orange';
        } else {
            rateColor = 'red';
        }

        setStats({
            totalEndpoints,
            comparisonRate: comparisonRate.toFixed(2),
            missingCount: missingEndpoints.length,
            missingEndpoints
        });
    };

    return [stats, displayStats];
};