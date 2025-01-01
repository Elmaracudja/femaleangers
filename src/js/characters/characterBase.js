import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { Sound } from '@pixi/sound';

export class CharacterBase {
    constructor(textures, options = {}) {
        this.id = options.id || crypto.randomUUID();
        this.name = options.name || 'Unknown Fighter';
        
        // Character stats
        this.health = 100;
        this.maxHealth = 100;
        this.specialMeter = 0;
        this.maxSpecialMeter = 100;
        this.speed = options.speed || 5;
        this.jumpForce = options.jumpForce || -15;
        this.weight = options.weight || 1;
        
        // State management
        this.state = 'idle';
        this.isGrounded = false;
        this.isBlocking = false;
        this.isAttacking = false;
        this.isInvulnerable = false;
        this.direction = 1; // 1 for right, -1 for left
        this.comboCount = 0;
        this.lastAttackTime = 0;
        
        // Movement
        this.position = new PIXI.Point(0, 0);
        this.velocity = new PIXI.Point(0, 0);
        
        // Graphics
        this.setupSprites(textures);
        this.setupAnimations();
        
        // Combat
        this.attacks = this.setupAttacks();
        this.currentHitbox = null;
        this.hurtbox = new PIXI.Rectangle();
        
        // Special moves
        this.specialMoves = this.setupSpecialMoves();
        this.inputBuffer = [];
        this.inputBufferTimer = 0;
        
        // Sound effects
        this.setupSounds();
    }

    setupSprites(textures) {
        // Create sprite containers
        this.container = new PIXI.Container();
        
        // Setup character sprites
        this.sprites = {
            idle: new PIXI.AnimatedSprite(textures.idle),
            walk: new PIXI.AnimatedSprite(textures.walk),
            jump: new PIXI.AnimatedSprite(textures.jump),
            attack: new PIXI.AnimatedSprite(textures.attack),
            special: new PIXI.AnimatedSprite(textures.special),
            hurt: new PIXI.AnimatedSprite(textures.hurt),
            victory: new PIXI.AnimatedSprite(textures.victory),
            defeat: new PIXI.AnimatedSprite(textures.defeat)
        };

        // Set default properties for all sprites
        Object.values(this.sprites).forEach(sprite => {
            sprite.anchor.set(0.5);
            sprite.visible = false;
            this.container.addChild(sprite);
        });

        // Show idle animation by default
        this.sprites.idle.visible = true;
        this.currentSprite = this.sprites.idle;
    }

    setupAnimations() {
        // Animation speeds
        const animationSpeeds = {
            idle: 0.1,
            walk: 0.15,
            jump: 0.1,
            attack: 0.05,
            special: 0.05,
            hurt: 0.1,
            victory: 0.1,
            defeat: 0.1
        };

        // Set animation speeds
        Object.entries(this.sprites).forEach(([key, sprite]) => {
            sprite.animationSpeed = animationSpeeds[key];
            sprite.loop = key !== 'attack' && key !== 'special' && key !== 'hurt';
        });
    }

    setupAttacks() {
        // Define basic attacks
        return {
            lightPunch: {
                damage: 5,
                startup: 3,
                active: 2,
                recovery: 5,
                hitbox: new PIXI.Rectangle(-30, -50, 60, 40),
                knockback: 5
            },
            heavyPunch: {
                damage: 10,
                startup: 5,
                active: 3,
                recovery: 8,
                hitbox: new PIXI.Rectangle(-40, -60, 80, 50),
                knockback: 8
            },
            lightKick: {
                damage: 7,
                startup: 4,
                active: 3,
                recovery: 6,
                hitbox: new PIXI.Rectangle(-35, -30, 70, 60),
                knockback: 6
            },
            heavyKick: {
                damage: 12,
                startup: 6,
                active: 4,
                recovery: 10,
                hitbox: new PIXI.Rectangle(-45, -40, 90, 80),
                knockback: 10
            }
        };
    }

    setupSpecialMoves() {
        // Override in character-specific classes
        return {};
    }

    setupSounds() {
        this.sounds = {
            attack: Sound.from('attack'),
            special: Sound.from('special'),
            hit: Sound.from('hit'),
            jump: Sound.from('jump'),
            land: Sound.from('land'),
            victory: Sound.from('victory'),
            defeat: Sound.from('defeat')
        };
    }

    update(deltaTime) {
        // Update input buffer
        this.updateInputBuffer(deltaTime);
        
        // Update animation
        this.currentSprite.update(deltaTime);
        
        // Update hitboxes
        this.updateHitboxes();
        
        // Update state
        this.updateState(deltaTime);
    }

    updateInputBuffer(deltaTime) {
        this.inputBufferTimer += deltaTime;
        if (this.inputBufferTimer > 10) { // Clear buffer after 10 frames
            this.inputBuffer = [];
            this.inputBufferTimer = 0;
        }
    }

    updateHitboxes() {
        // Update hurtbox position
        this.hurtbox.x = this.position.x - 30;
        this.hurtbox.y = this.position.y - 60;
        this.hurtbox.width = 60;
        this.hurtbox.height = 120;

        // Update current attack hitbox if attacking
        if (this.isAttacking && this.currentHitbox) {
            this.currentHitbox.x = this.position.x + (this.direction * this.currentHitbox.width/2);
            this.currentHitbox.y = this.position.y - this.currentHitbox.height/2;
        }
    }

    updateState(deltaTime) {
        // Handle state-specific updates
        switch(this.state) {
            case 'attacking':
                this.updateAttackState(deltaTime);
                break;
            case 'hurt':
                this.updateHurtState(deltaTime);
                break;
            case 'special':
                this.updateSpecialState(deltaTime);
                break;
        }
    }

    move(direction) {
        if (this.state === 'attacking' || this.state === 'hurt') return;
        
        this.velocity.x = this.speed * direction;
        this.direction = Math.sign(direction);
        
        // Flip sprite based on direction
        this.container.scale.x = this.direction;
        
        this.changeState('walk');
    }

    jump() {
        if (!this.isGrounded) return;
        
        this.velocity.y = this.jumpForce;
        this.isGrounded = false;
        this.sounds.jump.play();
        this.changeState('jump');
    }

    attack(type) {
        if (this.state === 'attacking' || this.state === 'hurt') return;
        
        const attack = this.attacks[type];
        if (!attack) return;
        
        this.isAttacking = true;
        this.currentHitbox = attack.hitbox;
        this.sounds.attack.play();
        
        this.changeState('attacking');
        
        // Schedule attack phases
        setTimeout(() => {
            if (this.state === 'attacking') {
                this.isAttacking = false;
                this.currentHitbox = null;
                this.changeState('idle');
            }
        }, (attack.startup + attack.active + attack.recovery) * 16.67); // Convert frames to ms
    }

    takeDamage(amount) {
        if (this.isBlocking) amount *= 0.2;
        
        this.health = Math.max(0, this.health - amount);
        this.isInvulnerable = true;
        this.sounds.hit.play();
        
        this.changeState('hurt');
        
        // Invulnerability frames
        setTimeout(() => {
            this.isInvulnerable = false;
        }, 1000);
        
        if (this.health <= 0) {
            this.defeat();
        }
    }

    changeState(newState) {
        if (this.state === newState) return;
        
        // Hide current sprite
        this.currentSprite.visible = false;
        this.currentSprite.gotoAndStop(0);
        
        // Show new sprite
        this.state = newState;
        this.currentSprite = this.sprites[newState];
        this.currentSprite.visible = true;
        this.currentSprite.play();
    }

    defeat() {
        this.changeState('defeat');
        this.sounds.defeat.play();
    }

    victory() {
        this.changeState('victory');
        this.sounds.victory.play();
    }

    reset() {
        this.health = this.maxHealth;
        this.specialMeter = 0;
        this.position.set(0, 0);
        this.velocity.set(0, 0);
        this.isGrounded = false;
        this.isBlocking = false;
        this.isAttacking = false;
        this.isInvulnerable = false;
        this.comboCount = 0;
        this.changeState('idle');
    }
}

export default CharacterBase;
