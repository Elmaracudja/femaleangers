export class InputHandler {
    constructor() {
        // Key states
        this.keys = new Map();
        this.inputBuffer = [];
        this.bufferTimeout = 15; // frames
        this.bufferTimer = 0;
        
        // Button mappings
        this.p1Controls = {
            up: 'KeyW',
            down: 'KeyS',
            left: 'KeyA',
            right: 'KeyD',
            punch: 'KeyU',
            kick: 'KeyI',
            special: 'KeyO',
            block: 'KeyP'
        };
        
        this.p2Controls = {
            up: 'ArrowUp',
            down: 'ArrowDown',
            left: 'ArrowLeft',
            right: 'ArrowRight',
            punch: 'Numpad1',
            kick: 'Numpad2',
            special: 'Numpad3',
            block: 'Numpad4'
        };

        // Special move input sequences
        this.specialMovePatterns = {
            hadoken: ['down', 'downforward', 'forward', 'punch'],
            shoryuken: ['forward', 'down', 'downforward', 'punch'],
            tatsumaki: ['down', 'downback', 'back', 'kick'],
            superCombo: ['down', 'down', 'up', 'special']
        };

        // Initialize listeners
        this.initializeListeners();
    }

    initializeListeners() {
        // Keyboard events
        window.addEventListener('keydown', (event) => {
            event.preventDefault();
            this.handleKeyDown(event.code);
        });

        window.addEventListener('keyup', (event) => {
            event.preventDefault();
            this.handleKeyUp(event.code);
        });

        // Gamepad events
        window.addEventListener('gamepadconnected', (event) => {
            console.log(`Gamepad connected: ${event.gamepad.id}`);
            this.setupGamepad(event.gamepad);
        });

        window.addEventListener('gamepaddisconnected', (event) => {
            console.log(`Gamepad disconnected: ${event.gamepad.id}`);
        });
    }

    handleKeyDown(keyCode) {
        if (!this.keys.has(keyCode)) {
            this.keys.set(keyCode, {
                pressed: true,
                timestamp: performance.now()
            });
            
            // Add to input buffer
            const input = this.getInputFromKeyCode(keyCode);
            if (input) {
                this.addToBuffer(input);
            }
        }
    }

    handleKeyUp(keyCode) {
        this.keys.delete(keyCode);
    }

    addToBuffer(input) {
        this.inputBuffer.push({
            input,
            timestamp: performance.now()
        });
        
        // Keep buffer size manageable
        if (this.inputBuffer.length > 10) {
            this.inputBuffer.shift();
        }
    }

    getInputFromKeyCode(keyCode) {
        // Check P1 controls
        for (const [action, code] of Object.entries(this.p1Controls)) {
            if (code === keyCode) return { player: 1, action };
        }
        
        // Check P2 controls
        for (const [action, code] of Object.entries(this.p2Controls)) {
            if (code === keyCode) return { player: 2, action };
        }
        
        return null;
    }

    isPressed(player, action) {
        const controls = player === 1 ? this.p1Controls : this.p2Controls;
        const keyCode = controls[action];
        return this.keys.has(keyCode);
    }

    getDirection(player) {
        const controls = player === 1 ? this.p1Controls : this.p2Controls;
        
        let x = 0;
        let y = 0;
        
        if (this.keys.has(controls.left)) x -= 1;
        if (this.keys.has(controls.right)) x += 1;
        if (this.keys.has(controls.up)) y -= 1;
        if (this.keys.has(controls.down)) y += 1;
        
        return { x, y };
    }

    checkSpecialMove(player) {
        const recentInputs = this.inputBuffer
            .filter(input => input.player === player)
            .map(input => input.action)
            .slice(-8); // Check last 8 inputs
        
        for (const [moveName, pattern] of Object.entries(this.specialMovePatterns)) {
            if (this.matchesPattern(recentInputs, pattern)) {
                return moveName;
            }
        }
        
        return null;
    }

    matchesPattern(inputs, pattern) {
        if (inputs.length < pattern.length) return false;
        
        // Check for pattern in recent inputs
        for (let i = 0; i <= inputs.length - pattern.length; i++) {
            let matches = true;
            for (let j = 0; j < pattern.length; j++) {
                if (inputs[i + j] !== pattern[j]) {
                    matches = false;
                    break;
                }
            }
            if (matches) return true;
        }
        
        return false;
    }

    setupGamepad(gamepad) {
        // Standard gamepad mapping
        this.gamepadMapping = {
            buttons: {
                0: 'punch',    // A/Cross
                1: 'kick',     // B/Circle
                2: 'special',  // X/Square
                3: 'block',    // Y/Triangle
            },
            axes: {
                0: 'horizontal', // Left stick X
                1: 'vertical',   // Left stick Y
            }
        };
    }

    updateGamepad() {
        const gamepads = navigator.getGamepads();
        for (const gamepad of gamepads) {
            if (!gamepad) continue;

            // Process buttons
            gamepad.buttons.forEach((button, index) => {
                const action = this.gamepadMapping.buttons[index];
                if (action && button.pressed) {
                    this.handleGamepadButton(gamepad.index, action);
                }
            });

            // Process axes
            const axes = gamepad.axes;
            const deadzone = 0.2;
            
            // Horizontal movement
            if (Math.abs(axes[0]) > deadzone) {
                const direction = axes[0] > 0 ? 'right' : 'left';
                this.handleGamepadAxis(gamepad.index, direction);
            }
            
            // Vertical movement
            if (Math.abs(axes[1]) > deadzone) {
                const direction = axes[1] > 0 ? 'down' : 'up';
                this.handleGamepadAxis(gamepad.index, direction);
            }
        }
    }

    handleGamepadButton(playerIndex, action) {
        this.addToBuffer({
            player: playerIndex + 1,
            action: action
        });
    }

    handleGamepadAxis(playerIndex, direction) {
        this.addToBuffer({
            player: playerIndex + 1,
            action: direction
        });
    }

    update(deltaTime) {
        // Update input buffer timer
        this.bufferTimer += deltaTime;
        
        // Clear old inputs from buffer
        const currentTime = performance.now();
        this.inputBuffer = this.inputBuffer.filter(input => 
            currentTime - input.timestamp < this.bufferTimeout * 16.67
        );
        
        // Update gamepad states
        this.updateGamepad();
    }

    reset() {
        this.keys.clear();
        this.inputBuffer = [];
        this.bufferTimer = 0;
    }
}

export default InputHandler;
