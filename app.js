// Travel Bingo App
class TravelBingo {
    constructor() {
        this.currentLocation = '';
        this.bingoData = [];
        this.completedCells = new Set();
        this.init();
    }

    init() {
        // Event listeners
        document.getElementById('generateBingo').addEventListener('click', () => this.generateBingoCard());
        document.getElementById('useMyLocation').addEventListener('click', () => this.useGeolocation());
        document.getElementById('resetBingo').addEventListener('click', () => this.reset());
        
        // Enter key support
        document.getElementById('locationInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.generateBingoCard();
            }
        });
    }

    async useGeolocation() {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
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
            setTimeout(() => {
                btn.textContent = '📍 Use My Location';
                btn.disabled = false;
            }, 2000);
        } catch (error) {
            alert('Unable to get your location. Please enter it manually.');
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
                        'User-Agent': 'TravelBingo/1.0'
                    }
                }
            );
            const data = await response.json();
            
            // Extract meaningful location name
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
        
        if (!location) {
            alert('Please enter a location or use your current location');
            return;
        }

        this.currentLocation = location;
        
        // Show loading
        document.getElementById('loadingIndicator').style.display = 'block';
        document.getElementById('generateBingo').disabled = true;

        try {
            // Generate bingo challenges
            const challenges = await this.generateChallenges(location);
            this.bingoData = challenges;
            this.completedCells.clear();
            
            // Display bingo card
            this.displayBingoCard();
            
            // Show bingo section
            document.getElementById('bingoSection').style.display = 'block';
            document.getElementById('currentLocation').textContent = `📍 ${location}`;
            
            // Scroll to bingo card
            document.getElementById('bingoSection').scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Error generating bingo card:', error);
            alert('Failed to generate bingo card. Please try again.');
        } finally {
            document.getElementById('loadingIndicator').style.display = 'none';
            document.getElementById('generateBingo').disabled = false;
        }
    }

    async generateChallenges(location) {
        // Try to use AI API if available, otherwise use fallback
        const apiKey = this.getApiKey();
        
        if (apiKey) {
            try {
                return await this.generateChallengesWithAI(location, apiKey);
            } catch (error) {
                console.log('AI generation failed, using fallback:', error);
                return this.generateFallbackChallenges(location);
            }
        } else {
            return this.generateFallbackChallenges(location);
        }
    }

    getApiKey() {
        // Check for API key in various places
        // 1. Environment variable (if deployed)
        if (typeof OPENAI_API_KEY !== 'undefined') {
            return OPENAI_API_KEY;
        }
        
        // 2. LocalStorage (for development)
        const storedKey = localStorage.getItem('openai_api_key');
        if (storedKey) {
            return storedKey;
        }
        
        // 3. Prompt user to enter (optional)
        // This would be implemented in a settings panel
        
        return null;
    }

    async generateChallengesWithAI(location, apiKey) {
        const prompt = `Generate exactly 24 unique, fun, and interesting exploration challenges for someone visiting ${location}. These should be specific to the location and help them discover local culture, food, landmarks, nature, and hidden gems. Make them actionable and suitable for a bingo card game. Each challenge should be 3-8 words long. Return as a JSON array of strings.

Example format: ["Try local street food", "Visit a historic temple", "Take a photo at sunset"]`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a travel expert who creates fun exploration challenges for travelers. Always respond with valid JSON arrays.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error('API request failed');
        }

        const data = await response.json();
        const content = data.choices[0].message.content.trim();
        
        // Parse JSON response
        let challenges = JSON.parse(content);
        
        // Ensure we have 24 challenges
        if (challenges.length < 24) {
            throw new Error('Insufficient challenges generated');
        }
        
        // Take only first 24
        challenges = challenges.slice(0, 24);
        
        // Insert FREE space in the middle (position 12)
        challenges.splice(12, 0, 'FREE SPACE');
        
        return challenges;
    }

    generateFallbackChallenges(location) {
        // Generic challenges that work for most locations
        const genericChallenges = [
            'Try local street food',
            'Visit a historic landmark',
            'Take a scenic photo',
            'Talk to a local',
            'Find a hidden gem',
            'Visit a local market',
            'Try traditional cuisine',
            'Explore a park or garden',
            'Visit a museum',
            'Find street art',
            'Try a local beverage',
            'Visit a viewpoint',
            'Explore on foot',
            'Visit a place of worship',
            'Find a bookstore or library',
            'Try local dessert',
            'Watch sunset or sunrise',
            'Visit waterfront area',
            'Find local crafts',
            'Take public transport',
            'Visit a cafe',
            'Explore a neighborhood',
            'Find a local festival',
            'Take a nature walk'
        ];

        // Shuffle and add location-specific context
        const shuffled = this.shuffleArray([...genericChallenges]);
        const challenges = shuffled.slice(0, 24);
        
        // Insert FREE space in the middle
        challenges.splice(12, 0, 'FREE SPACE');
        
        return challenges;
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
