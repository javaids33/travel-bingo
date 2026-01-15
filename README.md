# 🌍 Travel Bingo - Gamify Your Exploration

An AI-powered web app that creates personalized bingo cards to help you explore new locations. Turn your travels into an exciting game with location-specific challenges!

## 🎮 Features

- **📍 Location Detection**: Automatically detect your current location or manually enter any destination
- **🤖 AI-Powered Challenges**: Generate unique, location-specific exploration challenges using OpenAI
- **🎯 Interactive Bingo Card**: 5x5 bingo card with clickable cells to track your progress
- **✨ Gamification**: Complete challenges and try to get BINGO (5 in a row)
- **🌐 Works Everywhere**: Responsive design works on desktop and mobile devices
- **🚀 Auto-Deploy**: Built-in CI/CD with GitHub Actions for automatic deployment

## 🏗️ How It Works

1. **Enter Your Location**: Type in where you're exploring (e.g., "Kamakura Station, Japan") or use GPS
2. **Generate Card**: AI creates 25 unique challenges tailored to your location
3. **Start Exploring**: Click on challenges as you complete them
4. **Get BINGO**: Try to complete 5 in a row (horizontal, vertical, or diagonal)

## 🚀 Quick Start

### View the Live App

The app is automatically deployed to GitHub Pages when changes are pushed to the main branch.

Access it at: `https://javaids33.github.io/travel-bingo/`

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/javaids33/travel-bingo.git
   cd travel-bingo
   ```

2. Open `index.html` in your browser:
   ```bash
   open index.html  # macOS
   xdg-open index.html  # Linux
   start index.html  # Windows
   ```

   Or use a local server (recommended):
   ```bash
   python -m http.server 8000
   # Visit http://localhost:8000
   ```

## 🔑 API Configuration (Optional)

The app works with or without an OpenAI API key:

- **Without API**: Uses generic fallback challenges that work for any location
- **With API**: Generates location-specific, culturally relevant challenges

### Adding Your API Key

**Option 1: Browser Console (Development)**
```javascript
localStorage.setItem('openai_api_key', 'your-api-key-here');
```

**Option 2: Edit config.js**
```javascript
const OPENAI_API_KEY = 'your-api-key-here';
```

**Option 3: GitHub Secrets (Production)**
For production deployment, add your API key as a GitHub Secret and modify the workflow to inject it during build.

Get your API key from: https://platform.openai.com/api-keys

## 🛠️ Technology Stack

- **Frontend**: Pure HTML, CSS, JavaScript (no frameworks needed)
- **AI Integration**: OpenAI GPT-3.5-turbo API
- **Geolocation**: Browser Geolocation API + OpenStreetMap Nominatim
- **Deployment**: GitHub Pages with GitHub Actions CI/CD

## 📂 Project Structure

```
travel-bingo/
├── index.html          # Main HTML structure
├── styles.css          # Styling and responsive design
├── app.js              # Core application logic
├── config.js           # Configuration file
├── README.md           # Documentation
└── .github/
    └── workflows/
        └── deploy.yml  # CI/CD workflow
```

## 🎨 Features in Detail

### AI Challenge Generation
When an OpenAI API key is available, the app generates challenges specific to your location, including:
- Local cuisine and restaurants
- Historical landmarks and museums
- Cultural activities
- Hidden gems and local favorites
- Nature spots and viewpoints

### Fallback Mode
Without an API key, the app uses smart generic challenges that work anywhere:
- Try local street food
- Visit historic landmarks
- Find hidden gems
- Explore on foot
- And 20+ more universal challenges

### Responsive Design
- Works on all screen sizes
- Touch-friendly on mobile devices
- Optimized layout for different viewports

## 🚢 Deployment

The app automatically deploys to GitHub Pages when you push to the main branch.

### Manual Deployment

1. Enable GitHub Pages in repository settings:
   - Go to Settings → Pages
   - Source: GitHub Actions

2. Push changes to trigger deployment:
   ```bash
   git add .
   git commit -m "Update app"
   git push origin main
   ```

3. Wait for the workflow to complete (check Actions tab)

4. Access your app at: `https://[username].github.io/travel-bingo/`

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 📝 License

This project is open source and available under the MIT License.

## 🎉 Example Use Cases

- **Tourist**: Exploring Kamakura, Japan for the first time
- **Local Explorer**: Discovering hidden gems in your own city
- **Travel Group**: Compete with friends to complete challenges
- **Solo Traveler**: Structured way to explore a new destination
- **Digital Nomad**: Quick way to get acquainted with a new city

## 🔮 Future Enhancements

- [ ] Save/share bingo cards
- [ ] Multiple card templates
- [ ] Photo uploads for completed challenges
- [ ] Leaderboards and social features
- [ ] Offline support with PWA
- [ ] Multiple language support
- [ ] Custom challenge difficulty levels

## 📞 Support

If you encounter any issues or have questions:
1. Check the existing issues
2. Create a new issue with details
3. Include your browser and device info

---

Made with ❤️ for travelers and explorers worldwide!