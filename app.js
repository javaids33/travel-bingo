// Travel Bingo App
class TravelBingo {
    constructor() {
        this.currentLocation = '';
        this.bingoData = [];
        this.completedCells = new Set();
        // Delay before cleaning up download object URLs (in milliseconds)
        // Provides sufficient time for browsers to initiate the download
        this.DOWNLOAD_CLEANUP_DELAY_MS = 1000;
        this.init();
    }

    init() {
        // Event listeners
        document.getElementById('generateBingo').addEventListener('click', () => this.generateBingoCard());
        document.getElementById('useMyLocation').addEventListener('click', () => this.useGeolocation());
        document.getElementById('resetBingo').addEventListener('click', () => this.reset());
        document.getElementById('downloadBingo').addEventListener('click', () => this.downloadBingoCard());

        // Enter key support
        document.getElementById('locationInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.generateBingoCard();
            }
        });
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast show ' + type;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    async downloadBingoCard() {
        const bingoCard = document.getElementById('bingoCard');
        const btn = document.getElementById('downloadBingo');
        const originalText = btn.textContent;

        try {
            btn.disabled = true;
            btn.textContent = '📸 Capturing...';

            // Use html2canvas to create image
            const canvas = await html2canvas(bingoCard, {
                backgroundColor: '#ffffff',
                scale: 2 // Higher quality
            });

            // Convert canvas to blob
            const blob = await new Promise((resolve, reject) => {
                canvas.toBlob((resultBlob) => {
                    if (resultBlob) {
                        resolve(resultBlob);
                    } else {
                        reject(new Error('Failed to convert canvas to blob'));
                    }
                }, 'image/png');
            });
            
            const sanitizedLocation = this.currentLocation.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            const fileName = `travel-bingo-${sanitizedLocation}.png`;

            // Check if Web Share API is supported
            if (navigator.share && navigator.canShare) {
                // Create File object from blob
                const file = new File([blob], fileName, { type: 'image/png' });
                
                // Check if we can share files
                if (navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: 'Travel Bingo Card',
                            text: `My Travel Bingo Card for ${this.currentLocation}`
                        });
                        this.showToast('Bingo card shared successfully!', 'success');
                        return;
                    } catch (shareError) {
                        // User cancelled share or share failed
                        if (shareError.name === 'AbortError') {
                            this.showToast('Share cancelled', 'info');
                            return;
                        }
                        console.log('Share failed, falling back to download:', shareError);
                    }
                }
            }

            // Fallback to traditional download for browsers without Web Share API
            // Reuse the blob by converting to object URL
            const link = document.createElement('a');
            link.download = fileName;
            link.href = URL.createObjectURL(blob);
            link.click();
            
            // Clean up the object URL after a short delay to ensure download initiated
            setTimeout(() => URL.revokeObjectURL(link.href), this.DOWNLOAD_CLEANUP_DELAY_MS);

            this.showToast('Bingo card saved to your device!', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            this.showToast('Failed to save bingo card. Please try taking a screenshot.', 'error');
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    }

    async useGeolocation() {
        if (!navigator.geolocation) {
            this.showToast('Geolocation is not supported by your browser', 'error');
            return;
        }

        const btn = document.getElementById('useMyLocation');
        btn.disabled = true;
        btn.textContent = '📍 Getting location...';

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            const { latitude, longitude } = position.coords;

            // Reverse geocode to get location name
            const locationName = await this.reverseGeocode(latitude, longitude);
            document.getElementById('locationInput').value = locationName;

            btn.textContent = '📍 Location detected!';
            this.showToast('Location detected successfully!', 'success');
            setTimeout(() => {
                btn.textContent = '📍 Use My Location';
                btn.disabled = false;
            }, 2000);
        } catch (error) {
            this.showToast('Unable to get your location. Please enter it manually.', 'error');
            btn.textContent = '📍 Use My Location';
            btn.disabled = false;
        }
    }

    async reverseGeocode(lat, lon) {
        try {
            // Using OpenStreetMap Nominatim API for reverse geocoding
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
                {
                    headers: {
                        'User-Agent': 'TravelBingo/1.0 (github.com/javaids33/travel-bingo)'
                    }
                }
            );
            const data = await response.json();

            // Extract meaningful location name with null checks
            if (!data || !data.address) {
                return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
            }

            const address = data.address;
            const parts = [];

            if (address.tourism || address.attraction) {
                parts.push(address.tourism || address.attraction);
            }
            if (address.suburb || address.neighbourhood) {
                parts.push(address.suburb || address.neighbourhood);
            }
            if (address.city || address.town || address.village) {
                parts.push(address.city || address.town || address.village);
            }
            if (address.country) {
                parts.push(address.country);
            }

            return parts.length > 0 ? parts.join(', ') : `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        } catch (error) {
            return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        }
    }

    async generateBingoCard() {
        const location = document.getElementById('locationInput').value.trim();
        const difficulty = document.getElementById('difficultySelect').value;

        if (!location) {
            this.showToast('Please enter a location or use your current location', 'error');
            return;
        }

        this.currentLocation = location;

        // Show loading
        document.getElementById('loadingIndicator').style.display = 'block';
        document.getElementById('generateBingo').disabled = true;

        try {
            // Generate bingo challenges
            const challenges = await this.generateChallenges(location, difficulty);
            this.bingoData = challenges;
            this.completedCells.clear();

            // Display bingo card
            this.displayBingoCard();

            // Show bingo section
            document.getElementById('bingoSection').style.display = 'block';
            document.getElementById('currentLocation').textContent = `📍 ${location} (${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)})`;

            // Scroll to bingo card
            document.getElementById('bingoSection').scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Error generating bingo card:', error);
            this.showToast('Failed to generate bingo card. Please try again.', 'error');
        } finally {
            document.getElementById('loadingIndicator').style.display = 'none';
            document.getElementById('generateBingo').disabled = false;
        }
    }

    async generateChallenges(location, difficulty) {
        // Use Google Gemini API
        const API_KEY = '__GEMINI_API_KEY__';
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

        try {
            return await this.generateChallengesWithAI(location, difficulty, API_URL);
        } catch (error) {
            console.log('AI generation failed, using fallback:', error);
            if (error.message.includes('429')) {
                this.showToast('AI is busy (Rate Limit). Using fallback challenges.', 'warning');
            }
            return this.generateFallbackChallenges(location, difficulty);
        }
    }

    async generateChallengesWithAI(location, difficulty, apiUrl) {
        // Sanitize location input
        const sanitizedLocation = location.replace(/[^\w\s,.-]/g, '').substring(0, 100);
        const cacheKey = `travel_bingo_${sanitizedLocation.toLowerCase()}_${difficulty}`;

        // 1. Check Cache
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const parsedCache = JSON.parse(cached);
                console.log('Using cached challenges for:', sanitizedLocation);
                return parsedCache;
            } catch (e) {
                localStorage.removeItem(cacheKey);
            }
        }

        let difficultyInstruction = '';
        if (difficulty === 'easy') {
            difficultyInstruction = 'Focus on popular, easily accessible landmarks and simple activities (e.g., "Visit Central Park", "Eat a pizza").';
        } else if (difficulty === 'hard') {
            difficultyInstruction = 'Focus on obscure hidden gems, specific challenges, or physically demanding tasks (e.g., "Walk across George Washington Bridge", "Visit 3 different boroughs").';
        } else {
            difficultyInstruction = 'Mix popular spots with some specific activities (e.g., "Walk across 2 bridges", "Find a hidden speakeasy").';
        }

        const prompt = `Generate exactly 24 unique, fun, and interesting exploration challenges for someone visiting ${sanitizedLocation}. 
        Difficulty Level: ${difficulty.toUpperCase()}.
        ${difficultyInstruction}
        
        These should be specific to the location and help them discover local culture, food, landmarks, nature, and hidden gems. 
        Make them quantifiable where possible (e.g., "Visit 2 museums" instead of "Visit museums").
        Each challenge should be 3-10 words long. Return STRICTLY a JSON array of strings. Do not include markdown formatting like \`\`\`json.

        Example format: ["Try local street food", "Visit a historic temple", "Take a photo at sunset"]`;

        // Call Gemini API
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('AI API Error:', response.status, errorText);
            throw new Error(`AI Request failed: ${response.status}`);
        }

        const data = await response.json();

        // Parse Gemini Response
        // Structure: candidates[0].content.parts[0].text
        let content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        content = content.trim();

        // Remove markdown code blocks if present
        if (content.startsWith('```json')) {
            content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (content.startsWith('```')) {
            content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        // Parse JSON response with error handling
        let challenges;
        try {
            challenges = JSON.parse(content);
        } catch (parseError) {
            console.error('Failed to parse AI response:', parseError, 'Content:', content);
            throw new Error('Invalid JSON from AI');
        }

        // Ensure we have 24 challenges
        if (!Array.isArray(challenges) || challenges.length < 24) {
            // If we got some checks but not enough, maybe we can use them?
            // But simpler to just fail to fallback or pad. Let's pad.
            if (!Array.isArray(challenges)) throw new Error('AI response was not an array');
        }

        // Take only first 24
        challenges = challenges.slice(0, 24);

        // Insert FREE space in the middle (position 12)
        if (challenges.length >= 12) {
            challenges.splice(12, 0, 'FREE SPACE');
        } else {
            while (challenges.length < 12) challenges.push("Explore!");
            challenges.push('FREE SPACE');
            while (challenges.length < 25) challenges.push("Explore!");
        }

        // Pad if still short (rare case)
        while (challenges.length < 25) {
            challenges.push("Discover local gem");
        }

        // 2. Set Cache
        localStorage.setItem(cacheKey, JSON.stringify(challenges));

        return challenges;
    }

    generateFallbackChallenges(location, difficulty) {
        // Generic challenges that work for most locations
        let genericChallenges = [];

        if (difficulty === 'easy') {
            genericChallenges = [
                "Visit a local park", "Try a local snack", "Take a photo of a statue",
                "Find a street musician", "Visit a market", "Spot a red car",
                "Find a building older than 50 years", "Buy a souvenir", "Walk 5,000 steps",
                "Visit a library", "Find a fountain", "Eat an ice cream",
                "Take a selfie with a view", "Spot a cat", "Find a blue door",
                "Visit a coffee shop", "Find a flag", "Hear church bells",
                "Spot a bicycle", "Find a post office", "See a bus",
                "Find a flower shop", "Walk down a narrow street", "Find a bakery"
            ];
        } else if (difficulty === 'hard') {
            genericChallenges = [
                'Walk 20,000 steps', 'Find a hidden bar', 'Visit 3 different neighborhoods', 'Eat something spicy',
                'Climb to the highest point', 'Wake up for sunrise', 'Use 3 modes of transport', 'Find a secret garden',
                'Eat at a "locals only" spot', 'Visit a museum off-peak', 'Find a specific street art', 'Negotiate a price',
                'Learn 5 local phrases', 'Visit a place built before 1900', 'Find a local craftsperson', 'Walk across a bridge twice',
                'Visit a library', 'Find a building with no windows', 'Spot rare wildlife', 'Eat food you cannot pronounce',
                'Visit a cemetery', 'Find a place with no tourists', 'Take a photo from a rooftop', 'Run in a park'
            ];
        } else {
            // Medium
            genericChallenges = [
                'Try local street food', 'Visit a historic landmark', 'Take a scenic photo', 'Talk to a local',
                'Find a hidden gem', 'Visit a local market', 'Try traditional cuisine', 'Explore a park or garden',
                'Visit a museum', 'Find street art', 'Try a local beverage', 'Visit a viewpoint',
                'Explore on foot', 'Visit a place of worship', 'Find a bookstore or library', 'Try local dessert',
                'Watch sunset or sunrise', 'Visit waterfront area', 'Find local crafts', 'Take public transport',
                'Visit a cafe', 'Explore a neighborhood', 'Find a local festival', 'Take a nature walk'
            ];
        }

        // Fill if needed
        while (genericChallenges.length < 24) {
            genericChallenges.push('Explore somewhere new');
        }

        return this.finalizeBoard(genericChallenges);
    }



    finalizeBoard(challenges) {
        // Shuffle
        const shuffled = this.shuffleArray([...challenges]);
        const finalChallenges = shuffled.slice(0, 24);

        // Fix: Ensure we always have 25 items by padding if needed
        while (finalChallenges.length < 24) {
            finalChallenges.push('Explore!');
        }

        finalChallenges.splice(12, 0, 'FREE SPACE');
        return finalChallenges;
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    displayBingoCard() {
        const bingoCard = document.getElementById('bingoCard');
        bingoCard.innerHTML = '';

        this.bingoData.forEach((challenge, index) => {
            const cell = document.createElement('div');
            cell.className = 'bingo-cell';
            cell.textContent = challenge;
            cell.dataset.index = index;

            if (challenge === 'FREE SPACE') {
                cell.classList.add('free', 'completed');
                this.completedCells.add(index);
            } else {
                cell.addEventListener('click', () => this.toggleCell(index));
            }

            bingoCard.appendChild(cell);
        });

        this.updateStats();
    }

    toggleCell(index) {
        const cell = document.querySelector(`[data-index="${index}"]`);

        if (this.completedCells.has(index)) {
            this.completedCells.delete(index);
            cell.classList.remove('completed');
        } else {
            this.completedCells.add(index);
            cell.classList.add('completed');
        }

        this.updateStats();
        this.checkForBingo();
    }

    updateStats() {
        document.getElementById('completedCount').textContent = this.completedCells.size;
    }

    checkForBingo() {
        const winningLines = [
            // Rows
            [0, 1, 2, 3, 4],
            [5, 6, 7, 8, 9],
            [10, 11, 12, 13, 14],
            [15, 16, 17, 18, 19],
            [20, 21, 22, 23, 24],
            // Columns
            [0, 5, 10, 15, 20],
            [1, 6, 11, 16, 21],
            [2, 7, 12, 17, 22],
            [3, 8, 13, 18, 23],
            [4, 9, 14, 19, 24],
            // Diagonals
            [0, 6, 12, 18, 24],
            [4, 8, 12, 16, 20]
        ];

        for (const line of winningLines) {
            if (line.every(index => this.completedCells.has(index))) {
                this.celebrateBingo();
                return;
            }
        }

        // Clear bingo message if no bingo
        document.getElementById('bingoMessage').textContent = '';
    }

    celebrateBingo() {
        const message = document.getElementById('bingoMessage');
        message.textContent = '🎉 BINGO! You completed a line! 🎉';

        // Optional: Add confetti or more celebration effects
        this.createConfetti();
    }

    createConfetti() {
        // Simple confetti effect using emoji
        const confettiChars = ['🎉', '🎊', '✨', '🌟', '⭐'];
        const container = document.querySelector('.bingo-stats');

        for (let i = 0; i < 10; i++) {
            const confetti = document.createElement('span');
            confetti.textContent = confettiChars[Math.floor(Math.random() * confettiChars.length)];
            confetti.style.position = 'fixed';
            confetti.style.left = Math.random() * window.innerWidth + 'px';
            confetti.style.top = '-50px';
            confetti.style.fontSize = '2rem';
            confetti.style.zIndex = '1000';
            confetti.style.pointerEvents = 'none';

            document.body.appendChild(confetti);

            // Animate falling
            const duration = 2000 + Math.random() * 2000;
            const animation = confetti.animate([
                { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
                { transform: `translateY(${window.innerHeight + 100}px) rotate(360deg)`, opacity: 0 }
            ], {
                duration: duration,
                easing: 'ease-in'
            });

            animation.onfinish = () => confetti.remove();
        }
    }

    reset() {
        document.getElementById('bingoSection').style.display = 'none';
        document.getElementById('locationInput').value = '';
        this.currentLocation = '';
        this.bingoData = [];
        this.completedCells.clear();

        // Scroll back to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TravelBingo();
});
