import { CharacterBase } from './characterBase';
import * as PIXI from 'pixi.js';
import { ParticleEmitter } from '@pixi/particle-emitter';

export class Mia extends CharacterBase {
    constructor(options = {}) {
        // Mia-specific default options
        const miaOptions = {
            name: 'Mia',
            speed: 6,
            jumpForce: -16,
            weight: 0.9,
            ...options
        };

        super(Mia.loadTextures(), miaOptions);
        
        // Mia-specific particle effects
        this.setupParticleEffects();
    }

    static loadTextures() {
        return {
            idle: Array.from({ length: 8 }, (_, i) => PIXI.Texture.from(`mia_idle_${i}`)),
            walk: Array.from({ length: 8 }, (_, i) => PIXI.Texture.from(`mia_walk_${i}`)),
            jump: Array.from({ length: 6 }, (_, i) => PIXI.Texture.from(`mia_jump_${i}`)),
            attack: Array.from({ length: 6 }, (_, i) => PIXI.Texture.from(`mia_attack_${i}`)),
            special: Array.from({ length: 12 }, (_, i) => PIXI.Texture.from(`mia_special_${i}`)),
            hurt: Array.from({ length: 4 }, (_, i) => PIXI.Texture.from(`mia_hurt_${i}`)),
            victory: Array.from({ length: 8 }, (_, i) => PIXI.Texture.from(`mia_victory_${i}`)),
            defeat: Array.from({ length: 6 }, (_, i) => PIXI.Texture.from(`mia_defeat_${i}`))
        };
    }

    setupParticleEffects() {
        // Water particle effect configuration
        this.waterEmitter = new ParticleEmitter(this.container, {
            lifetime: {
                min: 0.5,
                max: 1
            },
            frequency: 0.1,
            emitterLifetime: 0.3,
            maxParticles: 100,
            addAtBack: false,
            behaviors: [
                {
                    type: 'alpha',
                    config: {
                        alpha: {
                            list: [
                                { time: 0, value: 0.8 },
                                { time: 1, value: 0 }
                            ]
                        }
                    }
                },
                {
                    type: 'moveSpeedStatic',
                    config: {
                        min: 50,
                        max: 100
                    }
                },
                {
                    type: 'scale',
                    config: {
                        scale: {
                            list: [
                                { time: 0, value: 1 },
                                { time: 1, value: 0.3 }
                            ]
                        }
                    }
                },
                {
                    type: 'color',
                    config: {
                        color: {
                            list: [
                                { time: 0, value: "66ccff" },
                                { time: 1, value: "ffffff" }
                            ]
                        }
                    }
                },
                {
                    type: 'rotation',
                    config: {
                        accel: 0,
                        minSpeed: 0,
                        maxSpeed: 360,
                        minStart: 0,
                        maxStart: 360
                    }
                }
            ]
        });
    }

    setupSpecialMoves() {
        return {
            tideWave: {
                name: 'Tide Wave',
                damage: 15,
                meterCost: 25,
                startup: 8,
                active: 5,
                recovery: 12,
                hitbox: new PIXI.Rectangle(-60, -40, 120, 80),
                knockback: 12,
                input: ['down', 'downforward', 'forward', 'punch']
            },
            surferKick: {
                name: 'Surfer Kick',
                damage: 18,
                meterCost: 35,
                startup: 6,
                active: 4,
                recovery: 15,
                hitbox: new PIXI.Rectangle(-50, -60, 100, 120),
                knockback: 15,
                input: ['down', 'downback', 'back', 'kick']
            },
            waterDance: {
                name: 'Water Dance',
                damage: 30,
                meterCost: 50,
                startup: 10,
                active: 8,
                recovery: 20,
                hitbox: new PIXI.Rectangle(-100, -100, 200, 200),
                knockback: 20,
                input: ['down', 'down', 'up', 'special']
            }
        };
    }

    executeSpecialMove(moveName) {
        const move = this.specialMoves[moveName];
        if (!move || this.specialMeter < move.meterCost) return false;

        this.specialMeter -= move.meterCost;
        this.isAttacking = true;
        this.currentHitbox = move.hitbox;
        
        // Play special move animation
        this.changeState('special');
        
        // Trigger particle effects based on the move
        switch(moveName) {
            case 'tideWave':
                this.executeTideWave();
                break;
            case 'surferKick':
                this.executeSurferKick();
                break;
            case 'waterDance':
                this.executeWaterDance();
                break;
        }

        // Schedule end of special move
        setTimeout(() => {
            if (this.state === 'special') {
                this.isAttacking = false;
                this.currentHitbox = null;
                this.changeState('idle');
            }
        }, (move.startup + move.active + move.recovery) * 16.67);

        return true;
    }

    executeTideWave() {
        this.waterEmitter.resetPositionTracking();
        this.waterEmitter.updateOwnerPos(this.position.x, this.position.y);
        this.waterEmitter.emit = true;
        
        setTimeout(() => {
            this.waterEmitter.emit = false;
        }, 300);

        this.sounds.special.play();
    }

    executeSurferKick() {
        // Create water trail effect
        this.waterEmitter.resetPositionTracking();
        this.waterEmitter.updateOwnerPos(this.position.x, this.position.y);
        this.waterEmitter.emit = true;
        
        // Add forward momentum
        this.velocity.x = this.direction * 15;
        
        setTimeout(() => {
            this.waterEmitter.emit = false;
            this.velocity.x = 0;
        }, 400);

        this.sounds.special.play();
    }

    executeWaterDance() {
        // Create spiral water effect
        const duration = 1000;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed < duration) {
                const angle = (elapsed / duration) * Math.PI * 4;
                const radius = 50;
                
                const x = this.position.x + Math.cos(angle) * radius;
                const y = this.position.y + Math.sin(angle) * radius;
                
                this.waterEmitter.updateOwnerPos(x, y);
                this.waterEmitter.emit = true;
                
                requestAnimationFrame(animate);
            } else {
                this.waterEmitter.emit = false;
            }
        };
        
        animate();
        this.sounds.special.play();
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        // Update particle effects
        if (this.waterEmitter) {
            this.waterEmitter.update(deltaTime * 0.001);
        }
    }
}

export default Mia;
