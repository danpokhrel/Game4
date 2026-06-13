class Pathfinder {
    constructor(scene, collisionObjects, worldX, worldY, worldWidth, worldHeight, cellSize) {
        this.scene = scene;
        this.cellSize = cellSize;
        this.offsetX = worldX;
        this.offsetY = worldY;
        this.cols = Math.ceil(worldWidth / cellSize);
        this.rows = Math.ceil(worldHeight / cellSize);
        this.grid = [];
        this.gridGraphics = null;
        this.pathGraphics = null;

        this.padding = 22;
        this.generateGrid(collisionObjects);
    }

    generateGrid(collisionObjects) {
        for (let row = 0; row < this.rows; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.cols; col++) {
                let cx = col * this.cellSize + this.cellSize / 2 + this.offsetX;
                let cy = row * this.cellSize + this.cellSize / 2 + this.offsetY;
                this.grid[row][col] = this.isCellBlocked(cx, cy, collisionObjects);
            }
        }
    }

    isCellBlocked(x, y, objects) {
        for (let i = 0; i < objects.length; i++) {
            let obj = objects[i];
            if (obj.ellipse) {
                let ecx = obj.x + obj.width / 2;
                let ecy = obj.y + obj.height / 2;
                let rx = obj.width / 2 + this.padding;
                let ry = obj.height / 2 + this.padding;
                let dx = (x - ecx) / rx;
                let dy = (y - ecy) / ry;
                if (dx * dx + dy * dy <= 1) return true;
            } else if (obj.polygon) {
                let verts = obj.polygon.map(function(v) { return { x: obj.x + v.x, y: obj.y + v.y }; });
                if (this.pointInExpandedPolygon(x, y, verts)) return true;
            } else if (!obj.point) {
                if (x >= obj.x - this.padding && x <= obj.x + obj.width + this.padding &&
                    y >= obj.y - this.padding && y <= obj.y + obj.height + this.padding) {
                    return true;
                }
            }
        }
        return false;
    }

    pointInExpandedPolygon(px, py, verts) {
        let expanded = [];
        for (let i = 0; i < verts.length; i++) {
            let prev = verts[(i - 1 + verts.length) % verts.length];
            let curr = verts[i];
            let next = verts[(i + 1) % verts.length];
            let dx1 = curr.x - prev.x;
            let dy1 = curr.y - prev.y;
            let dx2 = next.x - curr.x;
            let dy2 = next.y - curr.y;
            let len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) || 1;
            let len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;
            let nx = -dy1 / len1 + -dy2 / len2;
            let ny = dx1 / len1 + dx2 / len2;
            let nlen = Math.sqrt(nx * nx + ny * ny) || 1;
            nx /= nlen;
            ny /= nlen;
            expanded.push({
                x: curr.x + nx * this.padding,
                y: curr.y + ny * this.padding
            });
        }
        return this.pointInPolygon(px, py, expanded);
    }

    pointInPolygon(px, py, verts) {
        let inside = false;
        for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
            let xi = verts[i].x, yi = verts[i].y;
            let xj = verts[j].x, yj = verts[j].y;
            if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        return inside;
    }

    worldToGrid(x, y) {
        return {
            col: Math.floor((x - this.offsetX) / this.cellSize),
            row: Math.floor((y - this.offsetY) / this.cellSize)
        };
    }

    gridToWorld(col, row) {
        return {
            x: col * this.cellSize + this.cellSize / 2 + this.offsetX,
            y: row * this.cellSize + this.cellSize / 2 + this.offsetY
        };
    }

    isWalkable(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
        return !this.grid[row][col];
    }

    findPath(fromX, fromY, toX, toY) {
        let start = this.worldToGrid(fromX, fromY);
        let end = this.worldToGrid(toX, toY);

        if (!this.isWalkable(start.col, start.row)) {
            start = this.findNearestWalkable(fromX, fromY);
            if (!start) return null;
        }
        if (!this.isWalkable(end.col, end.row)) {
            end = this.findNearestWalkable(toX, toY);
            if (!end) return null;
        }

        if (start.col === end.col && start.row === end.row) return [];

        let key = function(col, row) { return col + ',' + row; };
        let openSet = [];
        let gScore = {};
        let fScore = {};
        let cameFrom = {};
        let closedSet = {};

        let startKey = key(start.col, start.row);
        gScore[startKey] = 0;
        fScore[startKey] = this.heuristic(start.col, start.row, end.col, end.row);
        openSet.push({ col: start.col, row: start.row, f: fScore[startKey] });

        let dirs = [
            { dc: -1, dr: 0, cost: 1 },
            { dc: 1, dr: 0, cost: 1 },
            { dc: 0, dr: -1, cost: 1 },
            { dc: 0, dr: 1, cost: 1 },
            { dc: -1, dr: -1, cost: Math.SQRT2 },
            { dc: -1, dr: 1, cost: Math.SQRT2 },
            { dc: 1, dr: -1, cost: Math.SQRT2 },
            { dc: 1, dr: 1, cost: Math.SQRT2 }
        ];

        let maxIterations = this.cols * this.rows;
        let iterations = 0;

        while (openSet.length > 0 && iterations < maxIterations) {
            iterations++;

            let lowestIdx = 0;
            for (let i = 1; i < openSet.length; i++) {
                if (openSet[i].f < openSet[lowestIdx].f) lowestIdx = i;
            }
            let current = openSet[lowestIdx];
            let currentKey = key(current.col, current.row);

            if (current.col === end.col && current.row === end.row) {
                return this.reconstructPath(cameFrom, currentKey, end);
            }

            openSet.splice(lowestIdx, 1);
            closedSet[currentKey] = true;

            for (let d = 0; d < dirs.length; d++) {
                let nc = current.col + dirs[d].dc;
                let nr = current.row + dirs[d].dr;

                if (!this.isWalkable(nc, nr)) continue;

                let nKey = key(nc, nr);
                if (closedSet[nKey]) continue;

                if (dirs[d].dc !== 0 && dirs[d].dr !== 0) {
                    if (!this.isWalkable(current.col + dirs[d].dc, current.row) ||
                        !this.isWalkable(current.col, current.row + dirs[d].dr)) continue;
                }

                let tentativeG = gScore[currentKey] + dirs[d].cost;

                if (gScore[nKey] === undefined || tentativeG < gScore[nKey]) {
                    cameFrom[nKey] = currentKey;
                    gScore[nKey] = tentativeG;
                    fScore[nKey] = tentativeG + this.heuristic(nc, nr, end.col, end.row);

                    let inOpen = false;
                    for (let i = 0; i < openSet.length; i++) {
                        if (openSet[i].col === nc && openSet[i].row === nr) {
                            openSet[i].f = fScore[nKey];
                            inOpen = true;
                            break;
                        }
                    }
                    if (!inOpen) {
                        openSet.push({ col: nc, row: nr, f: fScore[nKey] });
                    }
                }
            }
        }

        return null;
    }

    findNearestWalkable(x, y) {
        let cell = this.worldToGrid(x, y);
        let maxRadius = 10;
        for (let r = 1; r <= maxRadius; r++) {
            for (let dr = -r; dr <= r; dr++) {
                for (let dc = -r; dc <= r; dc++) {
                    if (Math.abs(dc) !== r && Math.abs(dr) !== r) continue;
                    let nc = cell.col + dc;
                    let nr = cell.row + dr;
                    if (this.isWalkable(nc, nr)) return { col: nc, row: nr };
                }
            }
        }
        return null;
    }

    reconstructPath(cameFrom, endKey, end) {
        let path = [];
        let wp = this.gridToWorld(end.col, end.row);
        path.unshift(wp);

        let current = endKey;
        while (cameFrom[current] !== undefined) {
            let parts = cameFrom[current].split(',');
            let col = parseInt(parts[0], 10);
            let row = parseInt(parts[1], 10);
            wp = this.gridToWorld(col, row);
            path.unshift(wp);
            current = cameFrom[current];
        }

        return this.simplifyPath(path);
    }

    simplifyPath(path) {
        if (path.length <= 2) return path;
        let result = [path[0]];
        for (let i = 1; i < path.length - 1; i++) {
            let prev = result[result.length - 1];
            let curr = path[i];
            let next = path[i + 1];
            let dx1 = curr.x - prev.x;
            let dy1 = curr.y - prev.y;
            let dx2 = next.x - curr.x;
            let dy2 = next.y - curr.y;
            if (Math.abs(dx1) > 0.01 || Math.abs(dy1) > 0.01) {
                let cross = dx1 * dy2 - dy1 * dx2;
                if (Math.abs(cross) > 0.01) {
                    result.push(curr);
                }
            }
        }
        result.push(path[path.length - 1]);
        return result;
    }

    hasLineOfSight(fromX, fromY, toX, toY) {
        let start = this.worldToGrid(fromX, fromY);
        let end = this.worldToGrid(toX, toY);

        let x0 = start.col, y0 = start.row;
        let x1 = end.col, y1 = end.row;

        let dx = Math.abs(x1 - x0);
        let dy = Math.abs(y1 - y0);
        let sx = x0 < x1 ? 1 : -1;
        let sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        while (true) {
            if (x0 === x1 && y0 === y1) return true;
            if (!this.isWalkable(x0, y0)) return false;
            let e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x0 += sx; }
            if (e2 < dx) { err += dx; y0 += sy; }
        }
    }

    heuristic(col1, row1, col2, row2) {
        let dx = Math.abs(col2 - col1);
        let dy = Math.abs(row2 - row1);
        if (dx > dy) {
            return dy * Math.SQRT2 + (dx - dy);
        } else {
            return dx * Math.SQRT2 + (dy - dx);
        }
    }

    setDebug(enabled) {
        if (enabled) {
            if (!this.gridGraphics) {
                this.gridGraphics = this.scene.add.graphics();
                this.gridGraphics.setDepth(5);
                this.drawDebugGrid();
            }
            if (!this.pathGraphics) {
                this.pathGraphics = this.scene.add.graphics();
                this.pathGraphics.setDepth(6);
            }
        } else {
            if (this.gridGraphics) {
                this.gridGraphics.destroy();
                this.gridGraphics = null;
            }
            if (this.pathGraphics) {
                this.pathGraphics.destroy();
                this.pathGraphics = null;
            }
        }
    }

    drawDebugGrid() {
        if (!this.gridGraphics) return;
        let g = this.gridGraphics;
        g.clear();

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.grid[row][col]) {
                    g.fillStyle(0xff0000, 0.3);
                } else {
                    g.fillStyle(0x00ff00, 0.08);
                }
                g.fillRect(
                    col * this.cellSize + this.offsetX,
                    row * this.cellSize + this.offsetY,
                    this.cellSize,
                    this.cellSize
                );
            }
        }
    }

    clearPaths() {
        if (this.pathGraphics) {
            this.pathGraphics.clear();
        }
    }

    drawPath(path, color) {
        if (!this.pathGraphics || !path || path.length < 2) return;
        let g = this.pathGraphics;
        g.lineStyle(3, color, 0.9);
        g.beginPath();
        g.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            g.lineTo(path[i].x, path[i].y);
        }
        g.strokePath();

        for (let i = 0; i < path.length; i++) {
            g.fillStyle(color, 0.9);
            g.fillCircle(path[i].x, path[i].y, 4);
        }
    }
}
