
// -----------------------------
// Mesh
// -----------------------------
class Mesh {
    constructor(gl, verb, material) {
        this.gl = gl;
        this.verb = verb;
        this.material = material;
    }

    createBufferInfo(attributes) {
        this.bufferInfo = twgl.createBufferInfoFromArrays(this.gl, attributes);
    }

    draw() {
        this.material.bind();
        twgl.setBuffersAndAttributes(this.gl, this.material.programInfo, this.bufferInfo);
        twgl.drawBufferInfo(this.gl, this.bufferInfo, this.verb);   
    }
};



class Circle extends Mesh {
    constructor(gl, r, thickness, m) {
        super(gl, gl.TRIANGLE_STRIP, getSimpleMaterial(gl));
        const attributes = { position: { data: [], numComponents: 2 } };    
        let r0 = r-thickness;
        let r1 = r+thickness;
        for(let i=0;i<m;i++) {
            let phi = 2*Math.PI*i/(m-1);
            let cs = Math.cos(phi), sn = Math.sin(phi);
            attributes.position.data.push(cs*r1,sn*r1,cs*r0,sn*r0);
        }
        this.createBufferInfo(attributes);
    }      
};


class Disk extends Mesh {
    constructor(gl,r, m) {
        super(gl, gl.TRIANGLE_FAN, getSimpleMaterial(gl));
        const attributes = { position: { data: [], numComponents: 2 } };    
        attributes.position.data.push(0.0, 0.0);
        for(let i=0;i<m;i++) {
            let phi = 2*Math.PI*i/(m-1);
            let cs = Math.cos(phi), sn = Math.sin(phi);
            attributes.position.data.push(cs*r,sn*r);
        }
        this.createBufferInfo(attributes);
    }  
};


class HLineMesh extends Mesh {
    constructor(gl, m) {
        super(gl, gl.TRIANGLE_STRIP, getSimpleMaterial(gl));
        this.m = m;
        this.hline = new HLine(0,1,0);
        const attributes = this.attributes = { position: { data: new Array(m*2), numComponents: 2 } };    
        this._computePts(this.hline);
        this.createBufferInfo(attributes);
    }  

    _computePts(hline) {
        const m = this.m;
        const buffer = this.attributes.position.data;
        for(let i=0;i<m;i++) {
            let w = i==0 || i==m-1 ? 0.0 : (-1 + 2*(i%2))*0.01;
            let p = hline.getPoint(i/(m-1),w);
            buffer[i*2] = p[0];
            buffer[i*2+1] = p[1];            
        }
    }
    setByPoints(p0, p1) {
        this.hline.setByPoints(p0,p1);
        this._computePts(this.hline);
        twgl.setAttribInfoBufferFromArray(this.gl, this.bufferInfo.attribs.position, this.attributes.position);
    }
}


class HSegmentMesh extends Mesh {
    constructor(gl, m, p0, p1) {
        super(gl, gl.TRIANGLE_STRIP, getSimpleHyperbolicMaterial(gl));
        this.m = m;
        this.hSegment = new HSegment(p0,p1);
        const attributes = this.attributes = { position: { data: new Array(m*2), numComponents: 2 } };    
        this._computePts();
        this.createBufferInfo(attributes);
    }  

    _computePts() {
        const m = this.m;
        const buffer = this.attributes.position.data;
        for(let i=0;i<m;i++) {
            let w = i==0 || i==m-1 ? 0.0 : (-1 + 2*(i%2))*0.01;
            let p = this.hSegment.getPoint(i/(m-1),w);
            buffer[i*2] = p[0];
            buffer[i*2+1] = p[1];            
        }
    }
    setEnds(p0, p1) {
        this.hSegment.setEnds(p0,p1);
        this._computePts();
        twgl.setAttribInfoBufferFromArray(this.gl, this.bufferInfo.attribs.position, this.attributes.position);
    }
}

class HRegularPolygonOutlineMesh extends Mesh {
    constructor(gl, vCount, radius, m) {
        super(gl, gl.LINE_STRIP, getSimpleHyperbolicMaterial(gl));
        this.vCount = vCount;
        this.radius = radius;
        this.m = m;
        const attributes = this.attributes = { position: { data: new Array(m*2*vCount), numComponents: 2 } };    
        this._computePts();
        this.createBufferInfo(attributes);
    }  

    _computePts() {
        const m = this.m;
        const buffer = this.attributes.position.data;
        let pts = [];
        for(let side=0; side<this.vCount; side++) {
            let phi = 2*Math.PI*side/this.vCount;
            pts.push([this.radius*Math.cos(phi),this.radius*Math.sin(phi)]);
        }
        for(let side=0; side<this.vCount; side++) {
            let hSegment = new HSegment(pts[side], pts[(side+1)%this.vCount]);
            for(let i=0; i<m; i++) {
                let p = hSegment.getPoint(i/m);
                let k = side*m+i;
                buffer[2*k] = p[0];
                buffer[2*k+1] = p[1];                
            }
        }
    }
}


class HRegularPolygonMesh extends Mesh {
    constructor(gl, vCount, radius, m) {
        super(gl, gl.TRIANGLE_FAN, getSimpleHyperbolicMaterial(gl));
        this.vCount = vCount;
        this.radius = radius;
        this.m = m;
        const attributes = this.attributes = { position: { data: [] /* new Array(2+(m+1)*2*vCount) */, numComponents: 2 } };    
        //attributes.position.data[0] = 0.0;
        //attributes.position.data[1] = 0.0;
        attributes.position.data.push(0,0);

        this._computePts();
        this.createBufferInfo(attributes);
    }  

    _computePts() {
        const m = this.m;
        const buffer = this.attributes.position.data;
        let pts = [];
        for(let side=0; side<this.vCount; side++) {
            let phi = 2*Math.PI*side/this.vCount;
            pts.push([this.radius*Math.cos(phi),this.radius*Math.sin(phi)]);
        }
        for(let side=0; side<this.vCount; side++) {
            let hSegment = new HSegment(pts[side], pts[(side+1)%this.vCount]);
            for(let i=0; i<m; i++) {
                let p = hSegment.getPoint(i/m);
                let k = side*m+i;
                //buffer[2*k] = p[0];
                //buffer[2*k+1] = p[1];   
                buffer.push(p[0], p[1])             
            }
        }
        buffer.push(buffer[2], buffer[3])
        //let t = buffer.length;
        //buffer[t-2] = buffer[2];
        //buffer[t-1] = buffer[3];
        
    }
}

class HRegularPolygon {
    constructor(gl, vCount, radius) {
        this.gl = gl;
        this.vCount = vCount;
        this.radius = radius;
        let phi = Math.PI*2/vCount;
        this.edge = new HSegmentMesh(gl, 100, [radius,0.0], [Math.cos(phi)*radius, Math.sin(phi)*radius]);
        this.matrix = m4.identity();
    }

    draw() {
        let oldMatrix = this.edge.material.uniforms.hModelMatrix;
        this.edge.material.setColor([0,1,1,1]);
        for(let i=0; i<this.vCount; i++) {
            let phi = Math.PI*2*i/this.vCount;
            this.edge.material.uniforms.hModelMatrix = m4.multiply(this.matrix, m4.rotationZ(phi));
            this.edge.draw();
        }
        this.edge.material.uniforms.hModelMatrix = oldMatrix;
    }

    setFirstVertex(p) {
        let p2 = m4.transformPoint(m4.rotationZ(2*Math.PI/this.vCount), [p[0],p[1],0]);
        this.edge.setEnds(p,p2);
    }

    // pi rotation around the i-th edge midpoint
    getEdgeMatrix(i) {
        let p = pMidPoint(this.edge.hSegment.p0, this.edge.hSegment.p1);
        p = m4.transformPoint(m4.rotationZ(2*Math.PI*i/this.vCount), [p[0],p[1],0,1]);
        let mat = hTranslation(p[0], p[1]);
        return m4.multiply(
            mat, m4.multiply(m4.rotationZ(Math.PI), m4.inverse(mat))
        );
    }
}
