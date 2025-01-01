import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';

export class UIManager {
    constructor(app) {
        this.app = app;
        this.container = new PIXI.Container();
        this.screens = new Map();
        this.currentScreen = null;
        
        // UI Elements
        this.healthBars = {};
        this.specialMeters = {};
        this.comboCounters = {};
        this.timer = null;
        
        this.init();
    }

    init() {
        this.setupScreens();
        this.setupHUD();
        this.setupAnimations();
        
        // Add UI container to stage
        this.app.stage.addChild(this.container);
    }

    setupScreens() {
        // Loading Screen
        const loadingScreen = this.createLoadingScreen();
        this.screens.set('loading', loadingScreen);
        
        // Main Menu
        const mainMenu = this.createMainMenu();
        this.screens.set('mainMenu', mainMenu);
        
        // Character Select
        const characterSelect = this.createCharacterSelect();
        this.screens.set('characterSelect', characterSelect);
        
        // Pause Menu
        const pauseMenu = this.createPauseMenu();
        this.screens.set('pause', pauseMenu);
        
        // Victory Screen
        const victoryScreen = this.createVictoryScreen();
        this.screens.set('victory', victoryScreen);
    }

    createLoadingScreen() {
        const container = new PIXI.Container();
        
        // Loading text
        const loadingText = new PIXI.Text('Loading...', {
            fontFamily: 'Arial',
            fontSize: 36,
            fill: 0xFFFFFF
        });
        loadingText.anchor.set(0.5);
        loadingText.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
        
        // Loading bar
        const barWidth = 300;
        const barHeight = 20;
        
        const loadingBar = new PIXI.Graphics();
        loadingBar.beginFill(0x333333);
        loadingBar.drawRect(0, 0, barWidth, barHeight);
        loadingBar.endFill();
        loadingBar.position.set(
            (this.app.screen.width - barWidth) / 2,
            this.app.screen.height / 2 + 50
        );
        
        const progressBar = new PIXI.Graphics();
        progressBar.beginFill(0xFF4081);
        progressBar.drawRect(0, 0, 0, barHeight);
        progressBar.endFill();
        progressBar.position = loadingBar.position;
        
        container.addChild(loadingText, loadingBar, progressBar);
        container.progressBar = progressBar;
        container.barWidth = barWidth;
        
        return container;
    }

    createMainMenu() {
        const container = new PIXI.Container();
        
        // Title
        const title = new PIXI.Text('Female Angers', {
            fontFamily: 'Arial',
            fontSize: 72,
            fill: 0xFF4081,
            stroke: 0x000000,
            strokeThickness: 4
        });
        title.anchor.set(0.5);
        title.position.set(this.app.screen.width / 2, 150);
        
        // Menu buttons
        const buttons = [
            'Story Mode',
            'VS Mode',
            'Online',
            'Training',
            'Options'
        ];
        
        const buttonContainer = new PIXI.Container();
        buttons.forEach((text, index) => {
            const button = this.createButton(text);
            button.position.set(0, index * 80);
            buttonContainer.addChild(button);
        });
        
        buttonContainer.position.set(
            (this.app.screen.width - buttonContainer.width) / 2,
            300
        );
        
        container.addChild(title, buttonContainer);
        return container;
    }

    createCharacterSelect() {
        const container = new PIXI.Container();
        
        // Title
        const title = new PIXI.Text('Select Your Fighter', {
            fontFamily: 'Arial',
            fontSize: 48,
            fill: 0xFFFFFF
        });
        title.anchor.set(0.5);
        title.position.set(this.app.screen.width / 2, 50);
        
        // Character grid
        const grid = new PIXI.Container();
        const characters = ['Mia', 'Sakura', 'Elektra', 'Zara'];
        const cols = 2;
        const padding = 20;
        
        characters.forEach((name, index) => {
            const portrait = this.createCharacterPortrait(name);
            const row = Math.floor(index / cols);
            const col = index % cols;
            portrait.position.set(
                col * (portrait.width + padding),
                row * (portrait.height + padding)
            );
            grid.addChild(portrait);
        });
        
        grid.position.set(
            (this.app.screen.width - grid.width) / 2,
            150
        );
        
        container.addChild(title, grid);
        return container;
    }

    createPauseMenu() {
        const container = new PIXI.Container();
        
        // Semi-transparent background
        const overlay = new PIXI.Graphics();
        overlay.beginFill(0x000000, 0.7);
        overlay.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
        overlay.endFill();
        
        // Pause text
        const pauseText = new PIXI.Text('PAUSED', {
            fontFamily: 'Arial',
            fontSize: 64,
            fill: 0xFFFFFF
        });
        pauseText.anchor.set(0.5);
        pauseText.position.set(this.app.screen.width / 2, 200);
        
        // Menu options
        const options = ['Resume', 'Options', 'Quit'];
        const buttonContainer = new PIXI.Container();
        
        options.forEach((text, index) => {
            const button = this.createButton(text);
            button.position.set(0, index * 80);
            buttonContainer.addChild(button);
        });
        
        buttonContainer.position.set(
            (this.app.screen.width - buttonContainer.width) / 2,
            300
        );
        
        container.addChild(overlay, pauseText, buttonContainer);
        return container;
    }

    createVictoryScreen() {
        const container = new PIXI.Container();
        
        // Victory text
        const victoryText = new PIXI.Text('VICTORY', {
            fontFamily: 'Arial',
            fontSize: 72,
            fill: 0xFFD700,
            stroke: 0x000000,
            strokeThickness: 4
        });
        victoryText.anchor.set(0.5);
        victoryText.position.set(this.app.screen.width / 2, 200);
        
        // Continue button
        const continueButton = this.createButton('Continue');
        continueButton.position.set(
            (this.app.screen.width - continueButton.width) / 2,
            400
        );
        
        container.addChild(victoryText, continueButton);
        return container;
    }

    setupHUD() {
        const hud = new PIXI.Container();
        
        // Health bars
        this.healthBars = {
            p1: this.createHealthBar(100, 20),
            p2: this.createHealthBar(this.app.screen.width - 300, 20)
        };
        
        // Special meters
        this.specialMeters = {
            p1: this.createSpecialMeter(100, 45),
            p2: this.createSpecialMeter(this.app.screen.width - 300, 45)
        };
        
        // Timer
        this.timer = this.createTimer();
        
        // Combo counters
        this.comboCounters = {
            p1: this.createComboCounter(200, 100),
            p2: this.createComboCounter(this.app.screen.width - 200, 100)
        };
        
        Object.values(this.healthBars).forEach(bar => hud.addChild(bar));
        Object.values(this.specialMeters).forEach(meter => hud.addChild(meter));
        Object.values(this.comboCounters).forEach(counter => hud.addChild(counter));
        hud.addChild(this.timer);
        
        this.container.addChild(hud);
    }

    createHealthBar(x, y) {
        const container = new PIXI.Container();
        container.position.set(x, y);
        
        // Background
        const bg = new PIXI.Graphics();
        bg.beginFill(0x333333);
        bg.drawRect(0, 0, 200, 20);
        bg.endFill();
        
        // Health fill
        const fill = new PIXI.Graphics();
        fill.beginFill(0xFF0000);
        fill.drawRect(0, 0, 200, 20);
        fill.endFill();
        
        container.addChild(bg, fill);
        container.fill = fill;
        
        return container;
    }

    createSpecialMeter(x, y) {
        const container = new PIXI.Container();
        container.position.set(x, y);
        
        // Background
        const bg = new PIXI.Graphics();
        bg.beginFill(0x333333);
        bg.drawRect(0, 0, 200, 10);
        bg.endFill();
        
        // Meter fill
        const fill = new PIXI.Graphics();
        fill.beginFill(0xFFFF00);
        fill.drawRect(0, 0, 0, 10);
        fill.endFill();
        
        container.addChild(bg, fill);
        container.fill = fill;
        
        return container;
    }

    createTimer() {
        const timer = new PIXI.Text('99', {
            fontFamily: 'Arial',
            fontSize: 48,
            fill: 0xFFFFFF,
            stroke: 0x000000,
            strokeThickness: 4
        });
        
        timer.anchor.set(0.5);
        timer.position.set(this.app.screen.width / 2, 30);
        
        return timer;
    }

    createComboCounter(x, y) {
        const container = new PIXI.Container();
        container.position.set(x, y);
        container.visible = false;
        
        const hits = new PIXI.Text('0', {
            fontFamily: 'Arial',
            fontSize: 36,
            fill: 0xFFFFFF
        });
        hits.anchor.set(0.5);
        
        const text = new PIXI.Text('HITS', {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xFFFFFF
        });
        text.anchor.set(0.5);
        text.position.set(0, 30);
        
        container.addChild(hits, text);
        container.hits = hits;
        
        return container;
    }

    createButton(text) {
        const button = new PIXI.Container();
        
        // Button background
        const bg = new PIXI.Graphics();
        bg.beginFill(0xFF4081);
        bg.drawRoundedRect(0, 0, 200, 50, 10);
        bg.endFill();
        
        // Button text
        const buttonText = new PIXI.Text(text, {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xFFFFFF
        });
        buttonText.anchor.set(0.5);
        buttonText.position.set(bg.width / 2, bg.height / 2);
        
        button.addChild(bg, buttonText);
        button.interactive = true;
        button.buttonMode = true;
        
        // Hover effects
        button.on('pointerover', () => {
            gsap.to(button.scale, { x: 1.1, y: 1.1, duration: 0.2 });
        });
        
        button.on('pointerout', () => {
            gsap.to(button.scale, { x: 1, y: 1, duration: 0.2 });
        });
        
        return button;
    }

    showScreen(screenName) {
        if (this.currentScreen) {
            this.currentScreen.visible = false;
        }
        
        const screen = this.screens.get(screenName);
        if (screen) {
            screen.visible = true;
            this.currentScreen = screen;
            
            // Animate screen entrance
            screen.alpha = 0;
            gsap.to(screen, { alpha: 1, duration: 0.3 });
        }
    }

    updateHealth(player, percentage) {
        const bar = this.healthBars[player];
        if (bar) {
            gsap.to(bar.fill.scale, { x: percentage / 100, duration: 0.3 });
        }
    }

    updateSpecialMeter(player, percentage) {
        const meter = this.specialMeters[player];
        if (meter) {
            gsap.to(meter.fill.scale, { x: percentage / 100, duration: 0.3 });
        }
    }

    updateTimer(time) {
        this.timer.text = Math.ceil(time).toString().padStart(2, '0');
    }

    showCombo(player, hits) {
        const counter = this.comboCounters[player];
        if (counter) {
            counter.visible = true;
            counter.hits.text = hits.toString();
            
            // Animate combo counter
            gsap.from(counter.scale, {
                x: 2,
                y: 2,
                duration: 0.2,
                ease: 'back.out'
            });
        }
    }

    hideCombo(player) {
        const counter = this.comboCounters[player];
        if (counter) {
            gsap.to(counter, {
                alpha: 0,
                duration: 0.2,
                onComplete: () => {
                    counter.visible = false;
                    counter.alpha = 1;
                }
            });
        }
    }

    showMessage(text, duration = 2000) {
        const message = new PIXI.Text(text, {
            fontFamily: 'Arial',
            fontSize: 48,
            fill: 0xFFFFFF,
            stroke: 0x000000,
            strokeThickness: 4
        });
        
        message.anchor.set(0.5);
        message.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
        
        this.container.addChild(message);
        
        gsap.from(message.scale, { x: 0, y: 0, duration: 0.3, ease: 'back.out' });
        gsap.to(message, {
            alpha: 0,
            duration: 0.3,
            delay: duration / 1000 - 0.3,
            onComplete: () => {
                this.container.removeChild(message);
            }
        });
    }

    update(deltaTime) {
        // Update any animated UI elements
    }
}

export default UIManager;
