import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { ParticleContainer } from '@pixi/particle-container';
import { Sound } from '@pixi/sound';

export class GameEngine {
    constructor(app) {
        this.app = app;
        this.stage = app.stage;
        this.renderer = app.renderer;
        
        // Game layers
        this.backgroundLayer = new PIXI.Container();
        this.gameplayLayer = new PIXI.Container();
        this.uiLayer = new PIXI.Container();
        this.particleContainer = new ParticleContainer(10000, {
            scale: true,
            position: true,
            rotation: true,
            uvs: true,
            alpha: true
        });

        // Game state
        this.players = new Map();
        this.activeEffects = new Set();
        this.currentStage = null;
        this.gameTime = 99; // Fight timer in seconds
        this.isPaused = false;

        // Physics settings
        this.gravity = 0.8;
        this.groundLevel = this.app.screen.height - 100;
        
        this.init();
    }

    init() {
        // Set up stage hierarchy
        this.stage.addChild(this.backgroundLayer);
        this.stage.addChild(this.gameplayLayer);
        this.gameplayLayer.addChild(this.particleContainer);
        this.stage.addChild(this.uiLayer);

        // Set up game loop
        this.app.ticker.add(this.update.bind(this));
    }

    loadStage(stageName) {
        // Clear current stage
        this.backgroundLayer.removeChildren();

        // Load new stage background
        const backgrounds = {
            beach: [
                { texture: 'beach-sky', parallax: 0.1 },
                { texture: 'beach-sea', parallax: 0.3 },
                { texture: 'beach-sand', parallax: 0.6 }
            ],
            dojo: [
                { texture: 'dojo-wall', parallax: 0.1 },
                { texture: 'dojo-floor', parallax: 0.5 }
            ],
            street: [
                { texture: 'street-buildings', parallax: 0.1 },
                { texture: 'street-road', parallax: 0.4 }
            ]
        };

        const stageLayers = backgrounds[stageName];
        if (!stageLayers) {
            console.error(`Stage ${stageName} not found`);
            return;
        }

        stageLayers.forEach(layer => {
            const sprite = new PIXI.Sprite(PIXI.Texture.from(layer.texture));
            sprite.parallaxFactor = layer.parallax;
            this.backgroundLayer.addChild(sprite);
        });

        this.currentStage = stageName;
    }

    addPlayer(player, position) {
        player.position.set(position.x, position.y);
        this.gameplayLayer.addChild(player.sprite);
        this.players.set(player.id, player);
    }

    removePlayer(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            this.gameplayLayer.removeChild(player.sprite);
            this.players.delete(playerId);
        }
    }

    update(deltaTime) {
        if (this.isPaused) return;

        // Update game timer
        if (this.gameTime > 0) {
            this.gameTime -= deltaTime / 60;
            if (this.gameTime <= 0) {
                this.gameTime = 0;
                this.endMatch('timeout');
            }
        }

        // Update players
        for (const player of this.players.values()) {
            this.updatePlayer(player, deltaTime);
        }

        // Update particle effects
        this.updateParticles(deltaTime);

        // Update stage parallax
        this.updateParallax();

        // Check for collisions
        this.checkCollisions();
    }

    updatePlayer(player, deltaTime) {
        // Apply gravity
        if (!player.isGrounded) {
            player.velocity.y += this.gravity * deltaTime;
        }

        // Update position
        player.position.x += player.velocity.x * deltaTime;
        player.position.y += player.velocity.y * deltaTime;

        // Ground collision
        if (player.position.y > this.groundLevel) {
            player.position.y = this.groundLevel;
            player.velocity.y = 0;
            player.isGrounded = true;
        }

        // Update player state
        player.update(deltaTime);
    }

    updateParticles(deltaTime) {
        for (const effect of this.activeEffects) {
            effect.update(deltaTime);
            if (effect.isComplete) {
                this.particleContainer.removeChild(effect.container);
                this.activeEffects.delete(effect);
            }
        }
    }

    updateParallax() {
        const center = this.app.screen.width / 2;
        this.backgroundLayer.children.forEach(layer => {
            const offset = (center - this.gameplayLayer.position.x) * layer.parallaxFactor;
            layer.position.x = offset;
        });
    }

    checkCollisions() {
        const players = Array.from(this.players.values());
        
        // Check player collisions
        for (let i = 0; i < players.length; i++) {
            for (let j = i + 1; j < players.length; j++) {
                if (this.checkPlayerCollision(players[i], players[j])) {
                    this.resolveCollision(players[i], players[j]);
                }
            }
        }

        // Check hitbox collisions
        for (const player of players) {
            if (player.isAttacking) {
                for (const other of players) {
                    if (player !== other && this.checkHitboxCollision(player, other)) {
                        this.resolveHit(player, other);
                    }
                }
            }
        }
    }

    checkPlayerCollision(player1, player2) {
        return player1.getBounds().intersects(player2.getBounds());
    }

    checkHitboxCollision(attacker, defender) {
        return attacker.currentHitbox && attacker.currentHitbox.intersects(defender.getBounds());
    }

    resolveCollision(player1, player2) {
        // Implement push-back mechanics
        const overlap = player1.getBounds().intersection(player2.getBounds());
        const pushFactor = 0.5;

        if (overlap) {
            const dx = (overlap.width * pushFactor) * Math.sign(player2.position.x - player1.position.x);
            player1.position.x -= dx;
            player2.position.x += dx;
        }
    }

    resolveHit(attacker, defender) {
        // Calculate damage and knockback
        const hit = attacker.getCurrentAttack();
        if (hit && !defender.isInvulnerable) {
            defender.takeDamage(hit.damage);
            defender.applyKnockback(hit.knockback, attacker.direction);
            
            // Spawn hit effect
            this.spawnHitEffect(defender.position);
            
            // Play hit sound
            Sound.from('hit').play();
            
            // Update combo system
            attacker.incrementCombo();
        }
    }

    spawnHitEffect(position) {
        // Create particle effect at hit position
        const effect = new HitEffect(position);
        this.particleContainer.addChild(effect.container);
        this.activeEffects.add(effect);
    }

    pauseGame() {
        this.isPaused = true;
        this.app.ticker.stop();
    }

    resumeGame() {
        this.isPaused = false;
        this.app.ticker.start();
    }

    endMatch(reason) {
        this.pauseGame();
        // Determine winner and trigger end game sequence
        const winner = this.determineWinner();
        this.triggerVictorySequence(winner);
    }

    determineWinner() {
        let highestHealth = -1;
        let winner = null;

        for (const player of this.players.values()) {
            if (player.health > highestHealth) {
                highestHealth = player.health;
                winner = player;
            }
        }

        return winner;
    }

    triggerVictorySequence(winner) {
        if (winner) {
            winner.playVictoryAnimation();
            // Trigger victory UI sequence
        }
    }

    reset() {
        this.gameTime = 99;
        this.isPaused = false;
        this.activeEffects.clear();
        this.particleContainer.removeChildren();
        
        // Reset all players
        for (const player of this.players.values()) {
            player.reset();
        }
    }
}

// Export the GameEngine class
export default GameEngine;
