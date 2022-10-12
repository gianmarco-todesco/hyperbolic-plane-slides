

// punti e rette
class PointsAndLinesScene {

    init() {
        const {gl, viewer} = this;
        // this.sdot1 = new Disk(gl, 0.01, 10);

        let dots = this.draggableDots = [];
        [[0,0],[0.5,0.2],[0.6,0.1],[-0.3,0.6],[-0.4,0.5]].forEach(([x,y]) => {
            let dot = new DraggableDot(viewer, x,y);
            this.draggableDots.push(dot);
        })

        this.dot1 = dots[0];
        this.dot2 = dots[1];
        this.dot3 = dots[2];
        this.dot4 = dots[3];
        this.dot5 = dots[4];
        
        this.hLine1 = new HLineMesh(gl, 50);
        this.hLine2 = new HLineMesh(gl, 50);
        this.hLine3 = new HLineMesh(gl, 50);
        
    }

    render() {
        const {dot1, dot2, dot3, dot4, dot5, hLine1, hLine2, hLine3} = this;
        hLine1.setByPoints(dot1.pos, dot2.pos);
        hLine2.setByPoints(dot1.pos, dot3.pos);
        hLine3.setByPoints(dot4.pos, dot5.pos);

        hLine1.material.setColor([0,0.5,1,1]);
        hLine1.draw();
        hLine2.draw();
        hLine3.material.setColor([0,0.7,0.7,1]);
        hLine3.draw();

        dot1.draw();
        dot2.draw();
        dot3.draw();
        dot4.draw();
        dot5.draw();
    }
}


//-----------------------------------------------------------------------------


// free hand drawing 
class FreeHandDrawingScene {
    init() {
        const {gl, viewer} = this;

        this.hlineCount = 0;
        let textureCanvas = this.textureCanvas = new OffscreenCanvas(1024,1024);
        this.textureCtx = textureCanvas.getContext('2d');
        this.textureCtx.fillStyle='transparent';
        this.textureCtx.fillRect(0,0,1024,1024);

        let disk = this.disk = new Disk(gl, 0.9999, 100);
        disk.material = new HyperbolicInvertedTexturedMaterial(gl);
        disk.material.uniforms.texture = twgl.createTexture(gl, {src: textureCanvas});

        let dots = this.draggableDots = [];
        [[0,-0.2],[0.0,0.2],[0.0,0.0],[0.6,0.1]].forEach(([x,y]) => {
            let dot = new DraggableDot(viewer, x,y);
            this.draggableDots.push(dot);
        })

        this.dot1 = dots[0];
        this.dot2 = dots[1];
        this.dot3 = dots[2];
        this.dot4 = dots[3];
        this.dot3.children.push(this.dot4);
        
        this.dot4.fillColor = [0,0,1,1];
        this.hLine1 = new HLineMesh(gl, 50);
        this.hLine2 = new HLineMesh(gl, 50);
        

    }

    render() {
        const {gl, viewer, disk, dot1,dot2, dot3, dot4, hLine1, hLine2} = this;

        hLine1.setByPoints(dot1.pos, dot2.pos);
        hLine2.setByPoints(dot3.pos, dot4.pos);

        // draw disk (with texture)
        disk.draw();

        if(this.hlineCount>0) {
            if(this.hlineCount == 1) {
                disk.material.uniforms.hModelMatrix =  hLine1.hline.getMirrorMatrix();
            } else  {
                disk.material.uniforms.hModelMatrix =  m4.multiply(
                    hLine1.hline.getMirrorMatrix(),
                    hLine2.hline.getMirrorMatrix());
            }
            disk.draw();
            disk.material.uniforms.hModelMatrix = m4.identity();
        }


        if(this.hlineCount>0) {
            hLine1.material.setColor([0,0.5,1,1]);
            hLine1.draw();
            if(this.hlineCount==2) {
                hLine2.draw();
            }
        }

        if(this.hlineCount>0) {
            dot1.draw();
            dot2.draw();
            if(this.hlineCount==2) {
                dot3.draw();
                dot4.draw();
            }
        }
    }

    getTexturePointFromEvent(e) {
        let x = 1024 * (0.5 + e.x * 0.5);
        let y = 1024 * (0.5 + e.y * 0.5);
        return {x,y};
    }
    onPointerDown(e) {
        let {x,y} = this.getTexturePointFromEvent(e);
        this.oldx = x;
        this.oldy = y;
        console.log("qui");

    }
    onPointerDrag(e) {
        let {x,y} = this.getTexturePointFromEvent(e);

        let ctx = this.textureCtx;
        
        /*
        if(!this.brush) {
            var size = 64;
            let buffer = new Uint8ClampedArray(size * size * 4);
            for(let iy=0;iy<size;iy++) {
                for(let ix=0;ix<size;ix++) {
                    let x = ix-size/2;
                    let y = iy-size/2;
                    let r = Math.sqrt(x*x+y*y);
                    let v = 0;
                    if(r<size/2) v = 255 - 255*r/(size/2);
                    buffer[(iy*size+ix)*4] = v;
                    buffer[(iy*size+ix)*4+1] = 0;
                    buffer[(iy*size+ix)*4+2] = v;
                    buffer[(iy*size+ix)*4+3] = v;                     
                }
            }
            this.brush = ctx.createImageData(size, size);
            this.brush.data.set(buffer);

        }

        ctx.putImageData(this.brush, x - 32, y - 32);
        */

        ctx.lineWidth = 15;
        ctx.strokeStyle = "orange";
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(this.oldx,this.oldy);
        ctx.lineTo(x,y);
        ctx.stroke();
        this.oldx = x;
        this.oldy = y;

        this.disk.material.updateTexture(this.disk.material.uniforms.texture, this.textureCanvas);
    }

    onKeyDown(e) {
        console.log(e);
        if(e.key=="0") {
            this.hlineCount = 0;
            this.draggableDots = [];
            return true;
        } else if(e.key=="1") {
            this.hlineCount = 1;
            this.draggableDots = [this.dot1, this.dot2];
            return true;
        } else if(e.key=="2") {
            this.hlineCount = 2;
            this.draggableDots = [this.dot1, this.dot2, this.dot3, this.dot4];
            return true;
        } else if(e.key=='c' || e.key=="Delete") {
            let ctx = this.textureCtx;
            ctx.clearRect(0,0,1024,1024);
            this.disk.material.updateTexture(this.disk.material.uniforms.texture, this.textureCanvas);
            return true;
        }
        else 
            return false;
        
    }
}

//-----------------------------------------------------------------------------


class OctagonsScene {
    init() {
        const {gl, viewer} = this;

        let dots = this.draggableDots = [];
        [[0.2,0.1]].forEach(([x,y]) => {
            let dot = new DraggableDot(viewer, x,y);
            this.draggableDots.push(dot);
        })
        this.dot1 = dots[0];
        this.hPolygon = new HRegularPolygon(gl, 8, 0.5);

        this.step = 1;

    }

    render() {
        const {gl, viewer, dot1, hPolygon} = this;

        hPolygon.setFirstVertex(dot1.pos);


        let matrices = [m4.identity()];
        if(this.step == 2) matrices.push(hPolygon.getEdgeMatrix(0));
        else if(this.step == 3) matrices.push(hPolygon.getEdgeMatrix(0), hPolygon.getEdgeMatrix(-1));

        // draw polygons
        matrices.forEach(matrix => {
            hPolygon.matrix = matrix;
            hPolygon.draw();    
        })

        // draw polygons vertices
        viewer.entities.dot.material.setColor([0,0,0,1]);
        matrices.forEach(matrix => {
            hPolygon.matrix = matrix;
            hPolygon.drawVertices(viewer.entities.dot);
        });

        hPolygon.matrix = m4.identity();

        dot1.draw();
    }


    onKeyDown(e) {
        console.log(e);
        if(e.key=="1") {
            this.step = 1;
        } else if(e.key=="2") {
            this.step = 2;
        } else if(e.key=="3") {
            this.step = 3;
        }
}

}


//-----------------------------------------------------------------------------


class TessellationScene {
    constructor(n1=8, n2=3, shellCount=4) {
        this.n1 = n1;
        this.n2 = n2;
        this.shellCount = shellCount
    }
    init() {
        const {gl, viewer, disk} = this;
        let tess = this.tess = new GenericTessellation(this.n1, this.n2);
        tess.addFirstShell();
        for(let i=0;i<this.shellCount;i++) tess.addShell();
        this.hPolygon = new HRegularPolygonOutlineMesh(gl, tess.n1, tess.R, 60);
        this.hPolygonFill = new HRegularPolygonMesh(gl, tess.n1, tess.R, 60);
        this.hMatrix = m4.identity();
    }

    render() {
        this.hPolygon.material.uniforms.hViewMatrix = this.hMatrix;

        // fill polygons
        this.tess.cells.forEach(cell => {
            let mat = m4.multiply(this.hMatrix, cell.mat);
            let d = getLength(pTransform(mat, [0,0]));
            let v = 1.0 - d*0.2
            this.hPolygonFill.material.uniforms.color = [v*0.8,v*0.9,v,1];
            this.hPolygonFill.material.uniforms.hModelMatrix = cell.mat;
            this.hPolygonFill.draw();
        })

        // draw outlines
        this.hPolygon.material.uniforms.color = [0,0,0,1];

        this.tess.cells.forEach(cell => {
            this.hPolygon.material.uniforms.hModelMatrix = cell.mat;
            this.hPolygon.draw();
        })
        this.hPolygon.material.uniforms.hModelMatrix = m4.identity();
        this.hPolygon.material.uniforms.hViewMatrix = m4.identity();
    }

    onPointerDrag(e) {
        this.hMatrix = this.tess.adjustMatrix(m4.multiply(hTranslation(e.dx, e.dy), this.hMatrix));
    }

    /*
    uffi() {
        let startTime = performance.now();
        let bestMatrix = null;
        let closestDistance;
        for(let i=0; i<this.tess.n1; i++) {
            for(let j=0;j<this.tess.n2-1; j++) {
                let matrix = m4.multiply(this.hMatrix, this.tess.baseMatrices[i][j]);
                let p = pTransform(matrix, [0,0]);
                let d = getLength(p);
                if(bestMatrix == null || d < closestDistance) {
                    closestDistance = d;
                    bestMatrix = matrix;
                } 
            }
        }
        console.log("time = ", performance.now() - startTime);
        this.hMatrix = normalizeHMatrix(bestMatrix);
    }
    */
}

class Tessellation83Scene extends TessellationScene { constructor() { super(8,3,4);} }
class Tessellation64Scene extends TessellationScene { constructor() { super(6,4,3);} }
class Tessellation55Scene extends TessellationScene { constructor() { super(6,6,2);} }

//-----------------------------------------------------------------------------

class CoxeterTessellation {
    init() {
        const {gl, viewer, disk} = this;
        let tess = this.tess = new GenericTessellation(6,4);
        tess.addFirstShell();
        for(let i=0;i<3;i++) tess.addShell();

        let textureCanvas = this._createTexture();


        this.hPolygon = new HRegularPolygonMesh(gl, tess.n1, tess.R, 120);
        this.hPolygon.material = new HyperbolicTexturedMaterialBis(gl);
        this.hPolygon.material.uniforms.texture = twgl.createTexture(gl, {src:textureCanvas, mag: gl.LINEAR, min: gl.LINEAR });
        this.hMatrix = m4.identity();
        
    }


    render() {
        const uniforms = this.hPolygon.material.uniforms;
        let hViewMatrix = this.hMatrix;
        this.tess.cells.forEach(cell => {
            m4.multiply(hViewMatrix, cell.mat, uniforms.hMatrix);
            m4.inverse(uniforms.hMatrix, uniforms.hInvMatrix);            
            this.hPolygon.draw();
        })
        m4.identity(uniforms.hMatrix);
        m4.identity(uniforms.hInvMatrix);
        
    }

    _createTexture() {
        const n = this.tess.n1;
        const sz = 1024;
        let textureCanvas = new OffscreenCanvas(sz,sz);
        let ctx = textureCanvas.getContext('2d');
        ctx.fillStyle='transparent';
        ctx.fillRect(0,0,sz,sz);
        const cx = sz/2, cy = sz/2, r = sz/2;
        let pts = [];
        for(let i=0;i<2*n; i++) {
            let phi = 2*Math.PI*i/(2*n);
            pts.push(cx+Math.cos(phi)*r, cy+Math.sin(phi)*r);
        }
        for(let i=0;i<n; i++) {
            let i1 = (i+1)%n;
            ctx.beginPath();
            ctx.moveTo(cx,cy);
            ctx.lineTo(pts[i*4], pts[i*4+1]);
            ctx.lineTo(pts[i*4+2], pts[i*4+3]);
            ctx.closePath(cx,cy);
            ctx.fillStyle = 'white';
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(cx,cy);
            ctx.lineTo(pts[i*4+2], pts[i*4+3]);
            ctx.lineTo(pts[i1*4+0], pts[i1*4+1]);
            ctx.closePath(cx,cy);
            ctx.fillStyle = 'black';
            ctx.fill();
        }
        return textureCanvas;
    }

    onPointerDrag(e) {
        this.hMatrix = this.tess.adjustMatrix(m4.multiply(hTranslation(e.dx, e.dy), this.hMatrix));
        // this.hMatrix = m4.multiply(hTranslation(e.dx, e.dy), this.hMatrix);
    }
}


//-----------------------------------------------------------------------------

class Scene7 {
    init() {
        const {gl, viewer, disk} = this;

        let tess = this.tess = new Tessellation();
        tess.addFirstShell();
        for(let i=0;i<4;i++) tess.addShell();

        let textureCanvas = this._createTexture();


        this.hPolygon = new HRegularPolygonMesh(gl, 8, tess.R, 60);
        this.hPolygon.material = new HyperbolicPalettedTexturedMaterial(gl);
        this.hPolygon.material.uniforms.texture = twgl.createTexture(gl, {src:textureCanvas, mag: gl.LINEAR, min: gl.LINEAR });
        this.hMatrix = m4.identity();


        let palette = this.palette = [
            [0.53,0.52,0.28,1],
            [0.73,0.53,0.16,1],
            [0.50,0.21,0.13,1],
            [0.17,0.32,0.35,1]        
        ].map(v => v.map(x => x*3.0));
    
    }

    render() {
        const {gl, viewer, disk} = this;
        const uniforms = this.hPolygon.material.uniforms;
        let hViewMatrix = this.hMatrix;
        let scramble = [0,1,2,3];
        this.tess.cells.forEach(cell => {

            uniforms.color1 = this.palette[scramble[cell.colors[0]]];
            uniforms.color2 = this.palette[scramble[cell.colors[1]]];

            m4.multiply(hViewMatrix, cell.mat, uniforms.hMatrix);
            m4.inverse(uniforms.hMatrix, uniforms.hInvMatrix);            
            this.hPolygon.draw();
        })
        m4.identity(uniforms.hMatrix);
        m4.identity(uniforms.hInvMatrix);
    }

    _createTexture() {
        const n = 8;
        const R = this.tess.R;
        const sz = 1024;
        let textureCanvas = new OffscreenCanvas(sz,sz);
        let ctx = textureCanvas.getContext('2d');
        ctx.fillStyle='transparent';
        ctx.fillRect(0,0,sz,sz);

        const cx = sz/2, cy = sz/2, r = sz/2;    
        function cv(p) { return [cx + r * p[0], cy + r * p[1]]; }    
        let vv = [];
        for(let i=0;i<n; i++) {
            let phi = 2*Math.PI*i/n;
            vv.push([R*Math.cos(phi), R*Math.sin(phi)]);
        }
        ctx.beginPath();
        const m = 20;
        for(let i=0;i<n; i++) {        
            let hSegment = new HSegment(vv[i], vv[(i+1)%n]);
            for(let j=0; j<m; j++) {
                let [x,y] = cv(hSegment.getPoint(j/m));
                if(i==0 && j==0) ctx.moveTo(x,y);
                else ctx.lineTo(x,y);
            }
        }
        ctx.closePath();
        ctx.fillStyle = '#000088';
        ctx.fill();
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#000000';
        ctx.stroke();


        for(let i=0; i<4; i++) {
            let hSegment = new HSegment(vv[i*2], vv[(i*2+2)%n]);
            ctx.beginPath();
            let p = cv(vv[i*2]);
            ctx.moveTo(p[0],p[1]);
            for(let j = 1; j<=m; j++) {
                let t = (j<5) ? j/4 : j>m-5 ? (m-j)/4 : 1;
                p = cv(hSegment.getPoint(j/m, 0.02*t));
                ctx.lineTo(p[0],p[1]);
            }
            for(let j = 1; j<m; j++) {
                let t = (j<5) ? j/4 : j>m-5 ? (m-j)/4 : 1;
                p = cv(hSegment.getPoint(1-j/m, -0.02*t));
                ctx.lineTo(p[0],p[1]);
            }
            ctx.closePath();
            ctx.fillStyle = i%2 == 0 ? '#FF0088' : '#00FF88';
            ctx.fill();

        }

        return textureCanvas;
    }

    onPointerDrag(e) {


        // this.tess.adjustMatrix(
        this.hMatrix = m4.multiply(hTranslation(e.dx, e.dy), this.hMatrix);
        this.hMatrix = normalizeHMatrix(this.hMatrix);
        // this.hMatrix = m4.multiply(hTranslation(e.dx, e.dy), this.hMatrix);
    }
}


//-----------------------------------------------------------------------------



class CircleLimitIIIScene {
    init() {
        const {gl, viewer, disk} = this;
        let tess = this.tess = new Tessellation();
        tess.addFirstShell();
        for(let i=0;i<4;i++) tess.addShell();
        this.octagonCount = 0; // tess.cells.length;
        this.showOctagons = true;
        // let textureCanvas = this._createTexture();


        this.hPolygon = new HRegularPolygonMesh(gl, 8, tess.R * 1.3, 60);
        this.hPolygon.material = new HyperbolicPalettedTexturedMaterial(gl);
        this.hPolygon.material.uniforms.texture = twgl.createTexture(gl, {src:'./images/texture4.png', mag: gl.LINEAR, min: gl.LINEAR });
        this.hMatrix = m4.identity();
        this.hPolygon.material.uniforms.textureScale = 0.512;
        this.hPolygon.material.uniforms.textureOffset = [0.4959727582292849, 0.49816231555051077]

        //this.hPolygonOutline = new HRegularPolygonThickOutlineMesh(gl, 8, tess.R, 0.015, 10);
        this.hPolygonOutline = new HRegularPolygonThickOutlineMesh(gl, 8, tess.R, 0.005, 10);

        this.uffPolygon = new HRegularPolygonMesh(gl, 8, tess.R * 1.3, 60);
        this.uffPolygon.material = new SimpleTexturedMaterial(gl);
        this.uffPolygon.material.uniforms.texture = twgl.createTexture(gl, {src:'./images/texture4.png', mag: gl.LINEAR, min: gl.LINEAR });
        

        this.palette = [
            [0.53,0.52,0.28,1],
            [0.73,0.53,0.16,1],
            [0.50,0.21,0.13,1],
            [0.17,0.32,0.35,1]        
        ].map(v => v.map(x => x*2.0));
        this.scramble = [0,1,2,3];
   
        this.running = false;
        this.runningMatrix = m4.identity();
    }

    onKeyDown(e) {
        console.log(e);

        /*
        if(e.key == 'a') this.hPolygon.material.uniforms.textureOffset[0] += 0.001;
        else if(e.key == 'd') this.hPolygon.material.uniforms.textureOffset[0] -= 0.001;
        else if(e.key == 'w') this.hPolygon.material.uniforms.textureOffset[1] += 0.001;
        else if(e.key == 's') this.hPolygon.material.uniforms.textureOffset[1] -= 0.001;
        else if(e.key == 'z') this.hPolygon.material.uniforms.textureScale  += 0.001;
        else if(e.key == 'x') this.hPolygon.material.uniforms.textureScale  -= 0.001;
        console.log(this.hPolygon.material.uniforms.textureOffset, this.hPolygon.material.uniforms.textureScale)
        */
        if(e.key == 's') this.octagonCount = Math.min(this.tess.cells.length, this.octagonCount + 1);
        else if(e.key == 'a') this.octagonCount = Math.max(0, this.octagonCount - 1);
        else if(e.key == 'd') { this.octagonCount = this.tess.cells.length; this.showOctagons = false; }
        else if(e.key == 'e') this.showOctagons = !this.showOctagons;


        else if(e.key == 't') {
            if(this.running) this.running = false;
            else {
                this.running = true;
                this.runningMatrix = hTranslation(0.007,0);
            }
        }
        else if(e.key == 'r') {
            if(this.running) this.running = false;
            else {
                this.running = true;
                let cx = 0.5, cy = 0.5;
                this.runningMatrix = [hTranslation(cx,cy), m4.rotationZ(0.005), hTranslation(-cx,-cy)]
                    .reduce((a,b)=>m4.multiply(a,b));
            }
        }
        
    }
    render() {
        const {gl, viewer, disk} = this;

        if(this.running) {
            this.hMatrix = m4.multiply(this.runningMatrix, this.hMatrix);
            this.tess.adjustMatrix2(this.hMatrix, this.scramble);
        }

        viewer.entities.disk.material.setColor([0.3,0.3,0.3,1]);
        viewer.entities.disk.draw();

        const uniforms = this.hPolygon.material.uniforms;
        let hViewMatrix = this.hMatrix;
        let scramble = this.scramble; 
        for(let i=0; i<this.octagonCount; i++) {
            let cell = this.tess.cells[i];

            uniforms.color1 = this.palette[scramble[cell.colors[0]]];
            uniforms.color2 = this.palette[scramble[cell.colors[1]]];

            m4.multiply(hViewMatrix, cell.mat, uniforms.hMatrix);
            m4.inverse(uniforms.hMatrix, uniforms.hInvMatrix);            
            this.hPolygon.draw();
        }
        m4.identity(uniforms.hMatrix);
        m4.identity(uniforms.hInvMatrix);

        //this.uffPolygon.draw();
        
        if(this.showOctagons) {
            this.hPolygonOutline.material.uniforms.color = [0.2,0.02,0.2,1.0]
            this.tess.cells.forEach(cell => {
                m4.multiply(hViewMatrix, cell.mat, this.hPolygonOutline.material.uniforms.hModelMatrix); //  = cell.mat;
                this.hPolygonOutline.draw();
            })
            this.hPolygonOutline.material.uniforms.hModelMatrix = m4.identity();
    
        }

    }


    onPointerDrag(e) {

        this.hMatrix = m4.multiply(hTranslation(e.dx, e.dy), this.hMatrix);
        this.tess.adjustMatrix2(this.hMatrix, this.scramble);
        // this.hMatrix = this.tess.adjustMatrix(m4.multiply(hTranslation(e.dx, e.dy), this.hMatrix));


        // this.tess.adjustMatrix(
        //this.hMatrix = m4.multiply(hTranslation(e.dx, e.dy), this.hMatrix);
        //this.hMatrix = normalizeHMatrix(this.hMatrix);
        // this.hMatrix = m4.multiply(hTranslation(e.dx, e.dy), this.hMatrix);
    }
}

//-----------------------------------------------------------------------------

class GearTessellation {
    init() {
        const {gl, viewer, disk} = this;
        let tess = this.tess = new GenericTessellation(6,4);
        tess.addFirstShell();
        for(let i=0;i<3;i++) tess.addShell();
        this.hPolygon = new HGearMesh(gl, 8, tess.R); // new HRegularPolygonOutlineMesh(gl, 8, tess.R, 60);
        this.hMatrix = m4.identity();
        this.hPolygonBorder = new HRegularPolygonOutlineMesh(gl, tess.n1, tess.R, 60);
        this.showEdges = false;

    }

    render() {
        let t = performance.now()*0.001*0.3;
        this.hPolygon.material.uniforms.hViewMatrix = this.hMatrix;
        this.hPolygon.material.uniforms.color = [0.2,0.2,0.3,1];
        this.tess.cells.forEach(cell => {
            let sgn = -1+2*(cell.parity&1);
            this.hPolygon.material.uniforms.hModelMatrix = 
                m4.multiply(cell.mat, m4.rotationZ(t*sgn));
            this.hPolygon.draw();
        })
        this.hPolygon.material.uniforms.hModelMatrix = m4.identity();
        if(this.showEdges) {
            this.hPolygon.material.uniforms.color = [1,0,1,1];
            this.tess.cells.forEach(cell => {
                this.hPolygon.material.uniforms.hModelMatrix = cell.mat;
                this.hPolygonBorder.draw();                
            })
    
        }
        

        this.hPolygon.material.uniforms.hViewMatrix = m4.identity();
    }

    onPointerDrag(e) {
        this.hMatrix = normalizeHMatrix(m4.multiply(hTranslation(e.dx, e.dy), this.hMatrix));

        // this.hMatrix = this.tess.adjustMatrix(m4.multiply(hTranslation(e.dx, e.dy), this.hMatrix));
    }
    onKeyDown(e) {
        if(e.key == 'e') this.showEdges = !this.showEdges;
    }
}


//-----------------------------------------------------------------------------

class PseudoSphereScene {
    init() {
        const {gl, viewer, disk} = this;
        let tess = this.tess = new GenericTessellation(8,3);
        tess.addFirstShell();
        for(let i=0;i<4;i++) tess.addShell();

        this.hPolygon = new HRegularPolygonOutlineMesh(gl, tess.n1, tess.R, 60);
        this.hPolygonFill = new HRegularPolygonMesh(gl, tess.n1, tess.R, 60);
        this.pseudoSphere = new HPseudoSphereMesh(gl);

        this.hMatrix = m4.identity();
        this.hMatrixBis = m4.identity();
        
    }

    render() {
        this.hPolygon.material.uniforms.hViewMatrix = this.hMatrix;

        // fill polygons
        this.tess.cells.forEach(cell => {
            let mat = m4.multiply(this.hMatrix, cell.mat);
            let d = getLength(pTransform(mat, [0,0]));
            let v = 1.0 - d*0.2
            this.hPolygonFill.material.uniforms.color = [v*0.8,v*0.9,v,1];
            this.hPolygonFill.material.uniforms.hModelMatrix = cell.mat;
            this.hPolygonFill.draw();
        })

        // draw outlines
        // this.hPolygon.material.uniforms.hViewMatrix = this.hMatrix;
        this.hPolygon.material.uniforms.color = [0,0,0,1];

        this.tess.cells.forEach(cell => {
            this.hPolygon.material.uniforms.hModelMatrix = cell.mat;
            this.hPolygon.draw();
        })
        this.hPolygon.material.uniforms.hModelMatrix = m4.identity();

        this.hPolygon.material.uniforms.hViewMatrix = this.hMatrixBis;
        this.pseudoSphere.material.uniforms.color = [1,0,0,1];
        this.pseudoSphere.draw();
        this.hPolygon.material.uniforms.hViewMatrix = m4.identity();
    }

    onPointerDrag(e) {
        this.hMatrixBis = normalizeHMatrix(m4.multiply(hTranslation(e.dx, e.dy), this.hMatrixBis));
        this.hMatrix = this.tess.adjustMatrix(m4.multiply(hTranslation(e.dx, e.dy), this.hMatrix));
    }
}
