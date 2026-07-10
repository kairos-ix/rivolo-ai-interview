export const getClientFingerprint = () => {
    if (typeof window === 'undefined') return '';

    try {
        const nav = window.navigator as any;
        const screen = window.screen;
        
        let realOs = "Unknown";
        
        // 1. Client Hints API (Highest fidelity, bypasses basic UA spoofing)
        if (nav.userAgentData && nav.userAgentData.platform) {
            realOs = nav.userAgentData.platform;
        } else if (nav.platform) {
            // Fallbacks for older browsers
            realOs = nav.platform;
        }
        
        // 2. Hardware characteristics (harder to spoof perfectly)
        const touchPoints = nav.maxTouchPoints || 0;
        
        const fingerprint = JSON.stringify({
            realOs,
            touchPoints,
        });
        
        // Return base64 encoded to easily pass in header
        return btoa(fingerprint);
    } catch (e) {
        return '';
    }
};
