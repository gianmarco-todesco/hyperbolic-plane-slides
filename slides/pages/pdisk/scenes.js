


class Scene1 {

    init() {
        const {gl, viewer} = this;
        this.sdot1 = new Disk(gl, 0.01, 10);

        this.dot1 = viewer.createDraggableDot(0,0);
        this.dot2 = viewer.createDraggableDot(0.5,0.2);
        this.dot3 = viewer.createDraggableDot(0.6,0.1);
        this.dot4 = viewer.createDraggableDot(-0.3,0.6);
        this.dot5 = viewer.createDraggableDot(-0.4,0.5);
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

class Scene2 {
    init() {
        const {gl, viewer} = this;
        this.dot1 = viewer.createDraggableDot(0.2,0.1);
        this.hPolygon = new HRegularPolygon(gl, 8, 0.5);
    }

    render() {
        const {gl, viewer, dot1, hPolygon} = this;

        hPolygon.setFirstVertex(dot1.pos);

        hPolygon.matrix = m4.identity();
        hPolygon.draw();

        hPolygon.matrix = hPolygon.getEdgeMatrix(0); //  hTranslation(0.3,0.4);
        hPolygon.draw();
        hPolygon.matrix = hPolygon.getEdgeMatrix(-1); //  hTranslation(0.3,0.4);
        hPolygon.draw();
        hPolygon.matrix = m4.identity();

        dot1.draw();
    }
}

class Scene3 {
    init() {
        const {gl, viewer} = this;
        let textureCanvas = this.textureCanvas = new OffscreenCanvas(1024,1024);
        this.textureCtx = textureCanvas.getContext('2d');
        this.textureCtx.fillStyle='transparent';
        this.textureCtx.fillRect(0,0,1024,1024);
    

        let disk = this.disk = new Disk(gl, 0.9999, 100);
        disk.material = new HyperbolicInvertedTexturedMaterial(gl);
        disk.material.uniforms.texture = twgl.createTexture(gl, {src: textureCanvas});
    }

    render() {
        const {gl, viewer, disk} = this;
        disk.draw();
        let matrix = hTranslation(-0.5,0.0);
        disk.material.uniforms.hModelMatrix = 
            m4.multiply(matrix, m4.multiply(m4.scaling([-1,1,1]), m4.inverse(matrix)));
        disk.draw();
        disk.material.uniforms.hModelMatrix = m4.identity();


        for(let i=1; i<10; i++) {
            disk.material.uniforms.hModelMatrix = m4.multiply(hTranslation(-0.3,0.0), disk.material.uniforms.hModelMatrix);
            disk.draw();

        }
        disk.material.uniforms.hModelMatrix = m4.identity();
    }

    onPointerDrag(e) {
        console.log(e);
        let x = 1024 * (0.5 + e.x * 0.5);
        let y = 1024 * (0.5 + e.y * 0.5);
        this.textureCtx.fillStyle='black';
        this.textureCtx.fillRect(x - 5, y - 5, 10, 10);
        this.disk.material.updateTexture(this.disk.material.uniforms.texture, this.textureCanvas);
    }
}


class Scene4 {
    init() {
        const {gl, viewer, disk} = this;
        let tess = this.tess = new GenericTessellation(8,3);
        tess.addFirstShell();
        for(let i=0;i<1;i++) tess.addShell();
        this.hPolygon = new HRegularPolygonOutlineMesh(gl, 8, tess.R, 60);
        this.hMatrix = m4.identity();
        

    }

    render() {
        this.hPolygon.material.uniforms.hViewMatrix = this.hMatrix;
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
}


class Scene5 {
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


class Scene6 {
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
        ctx.fillStyle = '#0000FF';
        ctx.fill();
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#000088';
        ctx.stroke();


        for(let i=0; i<4; i++) {
            let hSegment = new HSegment(vv[i*2], vv[(i*2+2)%n]);
            ctx.beginPath();
            let p = cv(vv[i*2]);
            ctx.moveTo(p[0],p[1]);
            for(let j = 1; j<=m; j++) {
                p = cv(hSegment.getPoint(j/m, 0.02));
                ctx.lineTo(p[0],p[1]);
            }
            for(let j = 1; j<m; j++) {
                p = cv(hSegment.getPoint(1-j/m, -0.02));
                ctx.lineTo(p[0],p[1]);
            }
            ctx.closePath();
            ctx.fillStyle = i%2 == 0 ? '#FF0000' : '#00FF00';
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




class Scene7 {
    init() {
        const {gl, viewer, disk} = this;

        let tess = this.tess = new Tessellation();
        tess.addFirstShell();
        //for(let i=0;i<4;i++) tess.addShell();

        // let textureCanvas = this._createTexture();


        this.hPolygon = new HRegularPolygonMesh(gl, 8, tess.R * 1.25, 60);
        this.hPolygon.material = new HyperbolicPalettedTexturedMaterial(gl);
        this.hPolygon.material.uniforms.texture = twgl.createTexture(gl, {src:'./images/texture2.png', mag: gl.LINEAR, min: gl.LINEAR });
        this.hMatrix = m4.identity();


        let palette = this.palette = [
            [0.53,0.52,0.28,1],
            [0.73,0.53,0.16,1],
            [0.50,0.21,0.13,1],
            [0.17,0.32,0.35,1]        
        ]; // .map(v => v.map(x => x*3.0));
    
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


    onPointerDrag(e) {


        // this.tess.adjustMatrix(
        this.hMatrix = m4.multiply(hTranslation(e.dx, e.dy), this.hMatrix);
        this.hMatrix = normalizeHMatrix(this.hMatrix);
        // this.hMatrix = m4.multiply(hTranslation(e.dx, e.dy), this.hMatrix);
    }
}
