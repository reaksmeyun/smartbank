import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to simulate interest accrual in real-time
 * @param {string|number} principal - The base balance
 * @param {number} lastInteraction - Unix timestamp of last contract interaction
 * @param {boolean} active - Whether the simulation should run
 */
export const useInterestSimulation = (principal, lastInteraction, active = true) => {
    const [simulatedNetInterest, setSimulatedNetInterest] = useState(0);
    const [simulatedPrincipal, setSimulatedPrincipal] = useState(0);
    const timerRef = useRef(null);

    useEffect(() => {
        const principalNum = Number(principal || 0);
        setSimulatedPrincipal(principalNum);

        if (!active || !principal || !lastInteraction) {
            setSimulatedNetInterest(0);
            return;
        }

        const calculate = () => {
            const currentTime = Math.floor(Date.now() / 1000);
            const timePassed = currentTime - Number(lastInteraction);

            if (timePassed < 0) return;

            // Logic mirrored from SmartBank.sol
            // interest = (principal * 500 * timePassed) / (10000 * 31536000)
            const interestRateBP = 500; // 5%
            const baseRateFactor = 10000;
            const secondsInYear = 31536000;

            const rawInterest = (Number(principal) * interestRateBP * timePassed) /
                (baseRateFactor * secondsInYear);

            // performanceFee = 10%
            const performanceFeeBP = 1000;
            const bankCut = (rawInterest * performanceFeeBP) / baseRateFactor;
            const userShare = rawInterest - bankCut;

            setSimulatedNetInterest(userShare);
        };

        // Initial calculation
        calculate();

        // Update every second
        timerRef.current = setInterval(calculate, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [principal, lastInteraction, active]);

    return {
        pendingYield: simulatedNetInterest,
        projectedTotal: simulatedPrincipal + simulatedNetInterest,
        timePassedSeconds: Math.floor(Date.now() / 1000) - Number(lastInteraction)
    };
};

export default useInterestSimulation;
