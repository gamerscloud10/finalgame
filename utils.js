export const utils = {
    // Distance calculation
    getDistance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },

    // Angle calculations
    getAngle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },

    getAngleDifference(angle1, angle2) {
        let diff = angle2 - angle1;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        return diff;
    },

    // Normalize angle to [-PI, PI]
    normalizeAngle(angle) {
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        return angle;
    },

    // Linear interpolation
    lerp(start, end, factor) {
        return start + (end - start) * factor;
    },

    // Clamp value between min and max
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    // Random number generation
    randomBetween(min, max) {
        return Math.random() * (max - min) + min;
    },

    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // Array utilities
    randomFromArray(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    // Timing utilities
    formatTime(milliseconds) {
        return (milliseconds / 1000).toFixed(1);
    },

    // Color utilities
    hexToRgba(hex, alpha = 1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },

    // Collision detection
    isPointInRect(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    },

    // Smooth step function for animations
    smoothStep(edge0, edge1, x) {
        const t = this.clamp((x - edge0) / (edge1 - edge0), 0, 1);
        return t * t * (3 - 2 * t);
    },

    // Bezier curve point calculation
    getBezierPoint(t, p0, p1, p2, p3) {
        const cx = 3 * (p1.x - p0.x);
        const bx = 3 * (p2.x - p1.x) - cx;
        const ax = p3.x - p0.x - cx - bx;

        const cy = 3 * (p1.y - p0.y);
        const by = 3 * (p2.y - p1.y) - cy;
        const ay = p3.y - p0.y - cy - by;

        const tSquared = t * t;
        const tCubed = tSquared * t;

        return {
            x: ax * tCubed + bx * tSquared + cx * t + p0.x,
            y: ay * tCubed + by * tSquared + cy * t + p0.y
        };
    },

    // Generate arc path for turns
    generateTurnPath(config) {
        const { from, to, lane, center, radius, steps = 30 } = config;
        const path = [];
        
        // Calculate start and end angles based on directions
        const startAngle = this.getDirectionAngle(from);
        const endAngle = this.getDirectionAngle(to);
        
        // Determine if it's a left or right turn
        const turnDirection = this.getTurnDirection(from, to);
        
        if (turnDirection === 'straight') {
            // For straight paths, just return start and end points
            const startPoint = this.getDirectionPoint(from, center, radius);
            const endPoint = this.getDirectionPoint(to, center, radius);
            return [startPoint, endPoint];
        }
        
        // Calculate the actual arc
        let angleStep;
        if (turnDirection === 'right') {
            angleStep = (Math.PI / 2) / steps; // 90 degrees clockwise
        } else { // left turn
            angleStep = -(Math.PI / 2) / steps; // 90 degrees counter-clockwise
        }
        
        // Generate arc points
        for (let i = 0; i <= steps; i++) {
            const currentAngle = startAngle + (angleStep * i);
            const x = center.x + radius * Math.cos(currentAngle);
            const y = center.y + radius * Math.sin(currentAngle);
            path.push({ x, y });
        }
        
        return path;
    },

    // Get angle for direction (0 = east, PI/2 = south, PI = west, 3PI/2 = north)
    getDirectionAngle(direction) {
        switch (direction) {
            case 'north': return -Math.PI / 2;
            case 'east': return 0;
            case 'south': return Math.PI / 2;
            case 'west': return Math.PI;
            default: return 0;
        }
    },

    // Get point on intersection edge for direction
    getDirectionPoint(direction, center, radius) {
        const angle = this.getDirectionAngle(direction);
        return {
            x: center.x + radius * Math.cos(angle),
            y: center.y + radius * Math.sin(angle)
        };
    },

    // Determine turn direction
    getTurnDirection(from, to) {
        const dirs = ['north', 'east', 'south', 'west'];
        const fromIdx = dirs.indexOf(from);
        const toIdx = dirs.indexOf(to);
        
        if (fromIdx === -1 || toIdx === -1) return 'straight';
        
        const diff = (toIdx - fromIdx + 4) % 4;
        if (diff === 1) return 'right';
        if (diff === 3) return 'left';
        return 'straight';
    }
};