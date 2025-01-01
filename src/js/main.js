import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { Howl } from 'howler';
import io from 'socket.io-client';

// Game Configuration
const CONFIG = {
    width: 1280,
    height: 720,
    backgroundColor: 0x000000,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
};

// Game States
const GameState = {
    LOADING: 'loading',
    MENU: 'menu',
    CHARACTER_SELECT: 'characterSelect',
    FIGHTING: 'fighting',
    PAUSE: 'pause',
    GAME_OVER: 'gameOver'
};

class Game {
    constructor() {
        this.app = new PIXI.Application({
            width: CONFIG.width,
            height: CONFIG.height,
            backgroundColor: CONFIG.backgroundColor,
            antialias: CONFIG.antialias,
            resolution: CONFIG.resolution,
        });

        this.currentState = GameState.LOADING;
        this.resources = {};
        this.sounds = {};
        this.characters = {};
        this.currentScene = null;
        this.socket = null;

        // Initialize game
        this.init();
    }

    async init() {
        // Add canvas to DOM
        document.getElementById('gameCanvas').appendChild(this.app.view);

        // Load assets
        await this.loadAssets();

        // Initialize systems
        this.initializeSystems();

        // Setup event listeners
        this.setupEventListeners();

        // Start with loading screen
        this.showLoadingScreen();
    }

    async loadAssets() {
        // Characters
        PIXI.Assets.add('mia', '/assets/characters/mia/spritesheet.json');
        PIXI.Assets.add('sakura', '/assets/characters/sakura/spritesheet.json');
        PIXI.Assets.add('elektra', '/assets/characters/elektra/spritesheet.json');
        PIXI.Assets.add('zara', '/assets/characters/zara/spritesheet.json');

        // Stages
        PIXI.Assets.add('beach', '/assets/stages/beach/background.json');
        PIXI.Assets.add('dojo', '/assets/stages/dojo/background.json');
        PIXI.Assets.add('street', '/assets/stages/street/background.json');

        // UI Elements
        PIXI.Assets.add('ui', '/assets/ui/ui.json');

        // Load all assets
        try {
            this.resources = await PIXI.Assets.load([
                'mia', 'sakura', 'elektra', 'zara',
                'beach', 'dojo', 'street',
                'ui'
            ]);

            // Load sounds
            this.sounds = {
                bgm: new Howl({
                    src: ['/assets/audio/bgm/main-theme.mp3'],
                    loop: true,
                    volume: 0.5
                }),
                sfx: {
                    hit: new Howl({ src: ['/assets/audio/sfx/hit.wav'] }),
                    special: new Howl({ src: ['/assets/audio/sfx/special.wav'] }),
                    select: new Howl({ src: ['/assets/audio/sfx/select.wav'] })
                }
            };

            this.onAssetsLoaded();
        } catch (error) {
            console.error('Error loading assets:', error);
            this.showErrorScreen('Failed to load game assets');
        }
    }

    initializeSystems() {
        // Initialize game systems
        this.initNetworking();
        this.initInputHandler();
        this.initPhysicsSystem();
        this.initParticleSystem();
        this.initSoundSystem();
    }

    initNetworking() {
        // Initialize Socket.IO for multiplayer
        this.socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:3000');
        
        this.socket.on('connect', () => {
            console.log('Connected to game server');
        });

        this.socket.on('gameState', (state) => {
            this.updateGameState(state);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from game server');
        });
    }

    setupEventListeners() {
        // Menu navigation
        document.getElementById('story-mode').addEventListener('click', () => this.startStoryMode());
        document.getElementById('versus-mode').addEventListener('click', () => this.startVersusMode());
        document.getElementById('online-mode').addEventListener('click', () => this.startOnlineMode());
        document.getElementById('training-mode').addEventListener('click', () => this.startTrainingMode());
        document.getElementById('options').addEventListener('click', () => this.showOptions());

        // Game state handlers
        window.addEventListener('resize', () => this.onResize());
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    showLoadingScreen() {
        document.getElementById('loading-screen').classList.remove('hidden');
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('character-select').classList.add('hidden');
        document.getElementById('game-screen').classList.add('hidden');
    }

    onAssetsLoaded() {
        // Hide loading screen
        document.getElementById('loading-screen').classList.add('hidden');
        
        // Show main menu
        document.getElementById('main-menu').classList.remove('hidden');
        
        // Start background music
        this.sounds.bgm.play();
        
        this.currentState = GameState.MENU;
    }

    startGame(mode) {
        this.currentState = GameState.CHARACTER_SELECT;
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('character-select').classList.remove('hidden');
    }

    // Game mode starters
    startStoryMode() {
        this.startGame('story');
    }

    startVersusMode() {
        this.startGame('versus');
    }

    startOnlineMode() {
        this.startGame('online');
    }

    startTrainingMode() {
        this.startGame('training');
    }

    showOptions() {
        // Implement options menu
    }

    handleKeyPress(event) {
        // Implement key press handling
    }

    onResize() {
        // Implement resize handling
    }

    showErrorScreen(message) {
        console.error(message);
        // Implement error screen
    }

    updateGameState(state) {
        // Update game state based on network updates
    }
}

// Start the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});

// Export game instance for debugging
export default Game;
