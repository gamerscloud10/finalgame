import { CONFIG } from "./config.js";
import { utils } from './utils.js';

export class Intersection {
    constructor(centerX, centerY) {
        this.centerX = centerX;
        this.centerY = centerY;
        this.size = CONFIG.INTERSECTION_SIZE || 120;
        this.roadWidth = CONFIG.ROAD_WIDTH || 80;
        this.laneWidth = CONFIG.LANE_WIDTH || 20;
        
        // Initialize positions and trajectories
        this.calculatePositions();
        this.precomputeTrajectories();
        
        // Reference to car manager for car-to-car communication
        this.carManager = null;
    }

    calculatePositions() {
        const halfSize = this.size / 2;
        const halfRoad = this.roadWidth / 2;
        
        // Spawn points (where cars enter from)
        this.spawnPoints = {
            [CONFIG.DIRECTIONS.NORTH]: { x: this.centerX, y: this.centerY - halfSize - 100 },
            [CONFIG.DIRECTIONS.EAST]: { x: this.centerX + halfSize + 100, y: this.centerY },
            [CONFIG.DIRECTIONS.SOUTH]: { x: this.centerX, y: this.centerY + halfSize + 100 },
            [CONFIG.DIRECTIONS.WEST]: { x: this.centerX - halfSize - 100, y: this.centerY }
        };

        // Exit points (where cars leave to)
        this.exitPoints = {
            [CONFIG.DIRECTIONS.NORTH]: { x: this.centerX, y: this.centerY - halfSize - 100 },
            [CONFIG.DIRECTIONS.EAST]: { x: this.centerX + halfSize + 100, y: this.centerY },
            [CONFIG.DIRECTIONS.SOUTH]: { x: this.centerX, y: this.centerY + halfSize + 100 },
            [CONFIG.DIRECTIONS.WEST]: { x: this.centerX - halfSize - 100, y: this.centerY }
        };

        // Stop lines
        this.stopLines = {
            [CONFIG.DIRECTIONS.NORTH]: { 
                x1: this.centerX - halfRoad, 
                y1: this.centerY - halfSize, 
                x2: this.centerX + halfRoad, 
                y2: this.centerY - halfSize 
            },
            [CONFIG.DIRECTIONS.EAST]: { 
                x1: this.centerX + halfSize, 
                y1: this.centerY - halfRoad, 
                x2: this.centerX + halfSize, 
                y2: this.centerY + halfRoad 
            },
            [CONFIG.DIRECTIONS.SOUTH]: { 
                x1: this.centerX - halfRoad, 
                y1: this.centerY + halfSize, 
                x2: this.centerX + halfRoad, 
                y2: this.centerY + halfSize 
            },
            [CONFIG.DIRECTIONS.WEST]: { 
                x1: this.centerX - halfSize, 
                y1: this.centerY - halfRoad, 
                x2: this.centerX - halfSize, 
                y2: this.centerY + halfRoad 
            }
        };

        // Traffic light positions
        this.lightPositions = {
            [CONFIG.DIRECTIONS.NORTH]: { x: this.centerX - halfSize - 20, y: this.centerY - halfSize - 20 },
            [CONFIG.DIRECTIONS.EAST]: { x: this.centerX + halfSize + 20, y: this.centerY - halfSize - 20 },
            [CONFIG.DIRECTIONS.SOUTH]: { x: this.centerX + halfSize + 20, y: this.centerY + halfSize + 20 },
            [CONFIG.DIRECTIONS.WEST]: { x: this.centerX - halfSize - 20, y: this.centerY + halfSize + 20 }
        };
    }

    precomputeTrajectories() {
        this.trajectories = {};
        const directions = [CONFIG.DIRECTIONS.NORTH, CONFIG.DIRECTIONS.EAST, CONFIG.DIRECTIONS.SOUTH, CONFIG.DIRECTIONS.WEST];
        
        directions.forEach(from => {
            directions.forEach(to => {
                if (from !== to) {
                    this.trajectories[`${from}-${to}`] = this.generateTrajectory(from, to);
                }
            });
        });
    }

    generateTrajectory(fromDirection, toDirection) {
        const entry = this.getPathEntryPoint(fromDirection);
        const exit = this.exitPoints[toDirection];
        const turnType = this.getTurnType(fromDirection, toDirection);
        
        if (turnType === 'straight') {
            return [entry, exit];
        }
        
        // Generate curved path for turns
        const points = [];
        const numPoints = 20;
        
        for (let i = 0; i <= numPoints; i++) {
            const t = i / numPoints;
            let point;
            
            if (turnType === 'left') {
                // Left turn trajectory
                const controlX = this.centerX - 30;
                const controlY = this.centerY - 30;
                point = utils.getBezierPoint(t, entry, 
                    { x: controlX, y: entry.y }, 
                    { x: exit.x, y: controlY }, 
                    exit);
            } else {
                // Right turn trajectory
                const controlX = this.centerX + 30;
                const controlY = this.centerY + 30;
                point = utils.getBezierPoint(t, entry, 
                    { x: controlX, y: entry.y }, 
                    { x: exit.x, y: controlY }, 
                    exit);
            }
            
            points.push(point);
        }
        
        return points;
    }

    render(ctx) {
        this.drawRoads(ctx);
        this.drawIntersection(ctx);
        this.drawLaneMarkings(ctx);
        this.drawStopLines(ctx);
    }

    drawRoads(ctx) {
        const halfRoad = this.roadWidth / 2;
        
        ctx.fillStyle = '#333333';
        
        // Vertical road
        ctx.fillRect(this.centerX - halfRoad, 0, this.roadWidth, CONFIG.CANVAS_HEIGHT);
        
        // Horizontal road
        ctx.fillRect(0, this.centerY - halfRoad, CONFIG.CANVAS_WIDTH, this.roadWidth);
    }

    drawIntersection(ctx) {
        const halfSize = this.size / 2;
        
        ctx.fillStyle = '#333333';
        ctx.fillRect(this.centerX - halfSize, this.centerY - halfSize, this.size, this.size);
    }

    drawLaneMarkings(ctx) {
        const halfRoad = this.roadWidth / 2;
        const halfSize = this.size / 2;
        
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);
        
        // Vertical lane markings
        ctx.beginPath();
        ctx.moveTo(this.centerX, 0);
        ctx.lineTo(this.centerX, this.centerY - halfSize);
        ctx.moveTo(this.centerX, this.centerY + halfSize);
        ctx.lineTo(this.centerX, CONFIG.CANVAS_HEIGHT);
        ctx.stroke();
        
        // Horizontal lane markings
        ctx.beginPath();
        ctx.moveTo(0, this.centerY);
        ctx.lineTo(this.centerX - halfSize, this.centerY);
        ctx.moveTo(this.centerX + halfSize, this.centerY);
        ctx.lineTo(CONFIG.CANVAS_WIDTH, this.centerY);
        ctx.stroke();
        
        ctx.setLineDash([]);
    }

    drawStopLines(ctx) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        
        Object.values(this.stopLines).forEach(line => {
            ctx.beginPath();
            ctx.moveTo(line.x1, line.y1);
            ctx.lineTo(line.x2, line.y2);
            ctx.stroke();
        });
    }

    getStopLinePosition(direction) {
        return this.stopLines[direction];
    }

    getLightPosition(direction) {
        return this.lightPositions[direction];
    }

    isInIntersection(x, y) {
        const halfSize = this.size / 2;
        return x >= this.centerX - halfSize && 
               x <= this.centerX + halfSize && 
               y >= this.centerY - halfSize && 
               y <= this.centerY + halfSize;
    }

    getTrajectory(fromDirection, toDirection) {
        return this.trajectories[`${fromDirection}-${toDirection}`] || [];
    }

    getPathEntryPoint(direction) {
        const halfSize = this.size / 2;
        
        switch (direction) {
            case CONFIG.DIRECTIONS.NORTH:
                return { x: this.centerX, y: this.centerY - halfSize };
            case CONFIG.DIRECTIONS.EAST:
                return { x: this.centerX + halfSize, y: this.centerY };
            case CONFIG.DIRECTIONS.SOUTH:
                return { x: this.centerX, y: this.centerY + halfSize };
            case CONFIG.DIRECTIONS.WEST:
                return { x: this.centerX - halfSize, y: this.centerY };
            default:
                return { x: this.centerX, y: this.centerY };
        }
    }

    getExitPoint(direction) {
        return this.exitPoints[direction];
    }

    getTurnType(from, to) {
        const dirs = ['north', 'east', 'south', 'west'];
        const fromIdx = dirs.indexOf(from);
        const toIdx = dirs.indexOf(to);
        
        if (fromIdx === -1 || toIdx === -1) return 'straight';
        
        const diff = (toIdx - fromIdx + 4) % 4;
        if (diff === 1) return 'right';
        if (diff === 3) return 'left';
        return 'straight';
    }

    setCarManager(carManager) {
        this.carManager = carManager;
    }
}