import * as PIXI from 'pixi.js';
import { ParticleContainer } from '@pixi/particle-container';
import { ParticleEmitter } from '@pixi/particle-emitter';

export class ParticleSystem {
    constructor(stage) {
        this.stage = stage;
        this.emitters = new Map();
        
        // Create particle container with specific properties
        this.particleContainer = new ParticleContainer(10000, {
            scale: true,
            position: true,
            rotation: true,
            uvs: true,
            alpha: true
        });
        
        this.stage.addChild(this.particleContainer);
        
        // Preset particle configurations
        this.presets = this.createPresets();
    }

    createPresets() {
        return {
            hit: {
                lifetime: {
                    min: 0.1,
                    max: 0.3
                },
                frequency: 0.001,
                emitterLifetime: 0.1,
                maxParticles: 20,
                addAtBack: false,
                behaviors: [
                    {
                        type: 'alpha',
                        config: {
                            alpha: {
                                list: [
                                    { time: 0, value: 1 },
                                    { time: 1, value: 0 }
                                ]
                            }
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
                                    { time: 0, value: "ff0000" },
                                    { time: 1, value: "ffff00" }
                                ]
                            }
                        }
                    },
                    {
                        type: 'moveSpeed',
                        config: {
                            speed: {
                                list: [
                                    { time: 0, value: 200 },
                                    { time: 1, value: 100 }
                                ]
                            }
                        }
                    }
                ]
            },
            water: {
                lifetime: {
                    min: 0.5,
                    max: 1
                },
                frequency: 0.01,
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
                    }
                ]
            },
            cherry: {
                lifetime: {
                    min: 1,
                    max: 2
                },
                frequency: 0.1,
                emitterLifetime: 0.5,
                maxParticles: 50,
                addAtBack: true,
                behaviors: [
                    {
                        type: 'alpha',
                        config: {
                            alpha: {
                                list: [
                                    { time: 0, value: 1 },
                                    { time: 0.5, value: 0.8 },
                                    { time: 1, value: 0 }
                                ]
                            }
                        }
                    },
                    {
                        type: 'scale',
                        config: {
                            scale: {
                                list: [
                                    { time: 0, value: 0.5 },
                                    { time: 1, value: 0.1 }
                                ]
                            }
                        }
                    },
                    {
                        type: 'color',
                        config: {
                            color: {
                                list: [
                                    { time: 0, value: "ff69b4" },
                                    { time: 1, value: "ffc0cb" }
                                ]
                            }
                        }
                    },
                    {
                        type: 'rotation',
                        config: {
                            accel: 0,
                            minSpeed: 50,
                            maxSpeed: 100,
                            minStart: 0,
                            maxStart: 360
                        }
                    }
                ]
            },
            electric: {
                lifetime: {
                    min: 0.2,
                    max: 0.4
                },
                frequency: 0.005,
                emitterLifetime: 0.2,
                maxParticles: 30,
                addAtBack: false,
                behaviors: [
                    {
                        type: 'alpha',
                        config: {
                            alpha: {
                                list: [
                                    { time: 0, value: 1 },
                                    { time: 1, value: 0 }
                                ]
                            }
                        }
                    },
                    {
                        type: 'scale',
                        config: {
                            scale: {
                                list: [
                                    { time: 0, value: 1 },
                                    { time: 1, value: 0.5 }
                                ]
                            }
                        }
                    },
                    {
                        type: 'color',
                        config: {
                            color: {
                                list: [
                                    { time: 0, value: "ffff00" },
                                    { time: 0.5, value: "00ffff" },
                                    { time: 1, value: "ffffff" }
                                ]
                            }
                        }
                    },
                    {
                        type: 'moveSpeed',
                        config: {
                            speed: {
                                list: [
                                    { time: 0, value: 300 },
                                    { time: 1, value: 100 }
                                ]
                            }
                        }
                    }
                ]
            }
        };
    }

    createEmitter(type, position, customConfig = {}) {
        const preset = this.presets[type];
        if (!preset) {
            console.error(`Particle preset '${type}' not found`);
            return null;
        }

        // Merge preset with custom configuration
        const config = {
            ...preset,
            ...customConfig,
            behaviors: [...preset.behaviors]
        };

        const emitter = new ParticleEmitter(
            this.particleContainer,
            config
        );

        // Set initial position
        emitter.updateOwnerPos(position.x, position.y);

        // Store emitter with unique ID
        const emitterId = crypto.randomUUID();
        this.emitters.set(emitterId, emitter);

        return emitterId;
    }

    startEmitter(emitterId, duration = null) {
        const emitter = this.emitters.get(emitterId);
        if (!emitter) return;

        emitter.emit = true;

        if (duration !== null) {
            setTimeout(() => {
                this.stopEmitter(emitterId);
            }, duration);
        }
    }

    stopEmitter(emitterId) {
        const emitter = this.emitters.get(emitterId);
        if (!emitter) return;

        emitter.emit = false;
    }

    updateEmitterPosition(emitterId, position) {
        const emitter = this.emitters.get(emitterId);
        if (!emitter) return;

        emitter.updateOwnerPos(position.x, position.y);
    }

    removeEmitter(emitterId) {
        const emitter = this.emitters.get(emitterId);
        if (!emitter) return;

        emitter.destroy();
        this.emitters.delete(emitterId);
    }

    createHitEffect(position) {
        const emitterId = this.createEmitter('hit', position);
        this.startEmitter(emitterId, 100); // Run for 100ms
        return emitterId;
    }

    createWaterEffect(position, duration = 300) {
        const emitterId = this.createEmitter('water', position);
        this.startEmitter(emitterId, duration);
        return emitterId;
    }

    createCherryEffect(position, duration = 500) {
        const emitterId = this.createEmitter('cherry', position);
        this.startEmitter(emitterId, duration);
        return emitterId;
    }

    createElectricEffect(position, duration = 200) {
        const emitterId = this.createEmitter('electric', position);
        this.startEmitter(emitterId, duration);
        return emitterId;
    }

    update(deltaTime) {
        // Update all active emitters
        for (const emitter of this.emitters.values()) {
            emitter.update(deltaTime * 0.001); // Convert to seconds
        }

        // Clean up completed emitters
        for (const [id, emitter] of this.emitters.entries()) {
            if (!emitter.emit && emitter.particleCount === 0) {
                this.removeEmitter(id);
            }
        }
    }

    clear() {
        // Remove all emitters
        for (const [id, emitter] of this.emitters.entries()) {
            this.removeEmitter(id);
        }
        
        // Clear the particle container
        this.particleContainer.removeChildren();
    }
}

export default ParticleSystem;
