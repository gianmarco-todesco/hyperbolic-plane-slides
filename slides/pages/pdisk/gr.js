

// obsoleto?
class HyperbolicMaterial extends Material {
    constructor(gl) {
        super(gl, {
            vs : `
            precision mediump float;
            attribute vec2 position;
            uniform mat4 hViewMatrix;
            uniform mat4 hMatrix;
            uniform mat4 viewMatrix;
            

            // poincaré to hyperboloid
            vec4 p2h(vec2 p) { 
                float t = 2.0/(1.0-(p.x*p.x+p.y*p.y)); 
                return vec4(t*p.x,t*p.y,t-1.0,1.0); 
            }
            // hyperboloid to poincaré
            vec2 h2p(vec4 p) {
                float d = 1.0/(p.w + p.z);
                return vec2(p.x*d, p.y*d);
            }

            void main(void) { 
                vec4 p = p2h(position);
                vec2 q = h2p(hViewMatrix * hMatrix * p);
                gl_Position = viewMatrix * vec4(q, 0.0, 1.0); 
            }
            `,
            fs:`
            precision mediump float;            
            uniform vec4 color;            
            void main() { gl_FragColor = color; }
            `,
            uniforms: {
                color: [0.0,0.0,0.0,1.0],
                viewMatrix: viewMatrix,
                hMatrix: twgl.m4.identity(),
                hViewMatrix: twgl.m4.identity()
            }
        });
    }

};


class HyperbolicMaterial2 extends Material {
    constructor(gl) {
        super(gl, {
            vs : `
            precision mediump float;
            attribute vec2 position;
            attribute vec2 texcoord;

            uniform mat4 hViewMatrix;
            uniform mat4 hmatrix;
            uniform mat4 viewMatrix;
            varying vec2 v_texcoord;
            

            // poincaré to hyperboloid
            vec4 p2h(vec2 p) { 
                float t = 2.0/(1.0-(p.x*p.x+p.y*p.y)); 
                return vec4(t*p.x,t*p.y,t-1.0,1.0); 
            }
            // hyperboloid to poincaré
            vec2 h2p(vec4 p) {
                float d = 1.0/(p.w + p.z);
                return vec2(p.x*d, p.y*d);
            }

            void main(void) { 
                vec4 p = p2h(position);
                vec2 q = h2p(hViewMatrix * hmatrix * p);
                v_texcoord = texcoord; 
                gl_Position = viewMatrix * vec4(q, 0.0, 1.0); 
            }
            `,
            fs:`
            precision mediump float;
            
            varying vec2 v_texcoord;
            // uniform sampler2D texture;
            uniform vec4 color;
            uniform vec4 color1;
            uniform vec4 color2;
            
            void main() {
                if(v_texcoord.x > 0.0) {
                    if(v_texcoord.y > 0.0)
                        gl_FragColor = color1;
                    else
                        gl_FragColor = color2;

                }
                else
                    gl_FragColor = color; 
            } 
            `,
            uniforms: {
                color: [0.0,0.0,0.0,1.0],
                viewMatrix: viewMatrix,
                hmatrix: twgl.m4.identity(),
                hViewMatrix: twgl.m4.identity(),
                color1: [1.0,1.0,1.0,1.0],
                color2: [1.0,1.0,1.0,1.0],                
            }
        });
    }

};


class HyperbolicTexturedMaterial2 extends Material {
    constructor(gl) {
        super(gl, {
            vs : `
            precision mediump float;
            attribute vec2 position;
            attribute vec2 texcoord;

            uniform mat4 hViewMatrix;
            uniform mat4 hmatrix;
            uniform mat4 viewMatrix;
            varying vec2 v_texcoord;
            

            // poincaré to hyperboloid
            vec4 p2h(vec2 p) { 
                float t = 2.0/(1.0-(p.x*p.x+p.y*p.y)); 
                return vec4(t*p.x,t*p.y,t-1.0,1.0); 
            }
            // hyperboloid to poincaré
            vec2 h2p(vec4 p) {
                float d = 1.0/(p.w + p.z);
                return vec2(p.x*d, p.y*d);
            }

            void main(void) { 
                vec4 p = p2h(position);
                vec2 q = h2p(hViewMatrix * hmatrix * p);
                v_texcoord = position; 
                gl_Position = viewMatrix * vec4(q, 0.0, 1.0); 
            }
            `,
            fs:`
            precision mediump float;
            
            varying vec2 v_texcoord;
            uniform sampler2D texture;
            uniform vec4 color;
            uniform vec4 color1;
            uniform vec4 color2;
            
            void main() {     
                float factor = 1.24;   
                vec2 p = v_texcoord;
                vec4 pix2 = texture2D(texture, p * factor + vec2(0.5,0.5));  
                //vec2 uff = p * factor + vec2(0.5,0.5);  
                //if(uff.x<0.0 || uff.x>1.0 || uff.y<0.0 || uff.y>1.0) {pix2.a = 0.0;}       
                p = vec2(-v_texcoord.y, v_texcoord.x);
                vec4 pix1 = texture2D(texture, p * factor + vec2(0.5,0.5));
                //uff = p * factor + vec2(0.5,0.5);  
                //if(uff.x<0.0 || uff.x>1.0 || uff.y<0.0 || uff.y>1.0) {pix1.a = 0.0;}       

                
                pix1 = vec4(pix1.g * (color1.rgb * pix1.a * (1.0 - pix1.r) + vec3(1.0,1.0,1.0)  * pix1.r), pix1.a);
                pix2 = vec4(pix2.g * (color2.rgb * pix2.a * (1.0 - pix2.r) + vec3(1.0,1.0,1.0) * pix2.r), pix2.a);

                // pix2 = pix2 * (color2);

                gl_FragColor = pix1 * pix1.a + pix2 * pix2.a; 
            } 
            `,
            uniforms: {
                color: [0.0,0.0,0.0,1.0],
                viewMatrix: viewMatrix,
                hmatrix: twgl.m4.identity(),
                hViewMatrix: twgl.m4.identity(),
                color1: [1.0,1.0,1.0,1.0],
                color2: [1.0,1.0,1.0,1.0],                
            }
        });
    }
};

class Updatable extends Mesh {
    constructor(gl, m) {
        super(gl, gl.LINE_STRIP, getSimpleMaterial(gl));
        this.m = m;
        
        const attributes = this.attributes = { position: { data: [], numComponents: 2 } };    
        for(let i=1;i<m;i++) {
            let t = i/m;
            let phi = Math.PI*2*i/m;
            attributes.position.data.push(0.5*Math.cos(phi), 1*Math.sin(phi));
        }
        this.createBufferInfo(attributes);
    }  

    update(r) {
        const attributes = this.attributes;
        const v = attributes.position.data;
        for(let i=1;i<this.m;i++) {
            let phi = Math.PI*2*i/this.m;
            v[i*2] = r*0.5*Math.cos(phi);
            v[i*2+1] = r*Math.sin(phi);
        }        
        twgl.setAttribInfoBufferFromArray(this.gl, this.bufferInfo.attribs.position, this.attributes.position);
    }
}




//-----------------------------------------------------
// Hyperbolic Shapes
//-----------------------------------------------------

class HLineMesh2 extends Mesh {
    constructor(gl,thickness, m) {
        super(gl, gl.TRIANGLE_STRIP, new HyperbolicSimpleMaterial(gl));
        const attributes = { position: { data: [], numComponents: 2 } };    
        let r = 40.0; // .0/thickness;
        let d = Math.sqrt(r*r-1);
        attributes.position.data.push(-1,0);
        for(let i=1;i<m;i++) {
            let t = i/m;
            let dx = -1 + 2*t;
            let factor = r/Math.sqrt(dx*dx + d*d);
            let x = dx * factor;
            let y = -d + d * factor;
            attributes.position.data.push(x,y,x,-y);
        }
        attributes.position.data.push(1,0);
        this.createBufferInfo(attributes);
    }  

    setByPoints(p0, p1) {
        const m4 = twgl.m4;
        let tr = hTranslation(-p0[0], -p0[1]);
        /*
        let tr_i = twgl.m4.inverse(tr);
        let p = pTransform(tr_i, p1);
        let phi = Math.atan2(p[1], p[0]);
        twgl.m4.multiply(tr, twgl.m4.rotationZ(phi), this.material.uniforms.hModelMatrix);
        */
        m4.copy(tr, this.material.uniforms.hModelMatrix);
        
    }
} 


class Dot extends Mesh {
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


class MultiPolygon extends Mesh {
    constructor(gl,r, m) {
        super(gl, gl.LINE_STRIP, new HyperbolicMaterial(gl));
        const attributes = { 
            position: { data: [], numComponents: 2 }
         };
        for(let j=0;j<=m;j++) {
            let phi = -2*Math.PI*j/m;
            let cs = Math.cos(phi), sn = Math.sin(phi);
            attributes.position.data.push(cs*r,sn*r);
        }
        let r1 = r * 0.8;
        let phi = -2*Math.PI*(m-0.5)/m;
        let cs = Math.cos(phi), sn = Math.sin(phi);
        attributes.position.data.push(cs*r1,sn*r1);

        this.createBufferInfo(attributes);
    }  
};

class CellMesh extends Mesh {
    constructor(gl,r) {
        super(gl, gl.LINES, new HyperbolicMaterial(gl));
        const m = 8;
        const attributes = { 
            position: { data: [], numComponents: 2 },
            texcoord: { data: [], numComponents: 2 }
        };
        let coords = [];
        for(let j=0;j<m;j++) {
            let phi = -2*Math.PI*j/m;
            coords.push(r*Math.cos(phi), r*Math.sin(phi));
        }
        function addPoint(j, u, v) {
            attributes.position.data.push(coords[j*2], coords[j*2+1]);
            attributes.texcoord.data.push(u,v);
        }
        //for(let j=0;j<m;j++) { 
        //    addPoint(j%m, 0,0); 
        //    addPoint((j+1)%m, 0,0); 
        //}

        /*
        addPoint(0,1,0);
        addPoint(2,1,0);
        addPoint(4,1,0);
        addPoint(6,1,0);
        */

        /*
        addPoint(2,1,1);
        addPoint(4,1,1);
        addPoint(6,1,1);
        addPoint(0,1,1);
        */

        const n = 20;
        for(let i=0; i<m; i++) {
            let i1 = (i+1)%m;
            let pts = [];
            let kp0 = p2k([coords[i*2],coords[i*2+1]]);
            let kp1 = p2k([coords[i1*2],coords[i1*2+1]]);
            for(let j=0; j<=n; j++) {
                let t = j/n;
                pts.push(k2p([kp0[0]*(1-t)+kp1[0]*t, kp0[1]*(1-t)+kp1[1]*t]));            
            }
            for(let j=0; j<n; j++) {
                attributes.position.data.push(pts[j][0], pts[j][1], pts[j+1][0], pts[j+1][1]);
                attributes.texcoord.data.push(0,0,0,0);
            }    
        }

        const g = Math.sin(2*Math.PI/3) / Math.sin(Math.PI/12);
        for(let i=0; i<4; i++) {
            let v = i%2;
            let i1 = i*2, i2 = (i1 + 1)%8, i3 = (i2 + 1)%8;
            let pts = [];
            let p0 = [coords[2*i1], coords[2*i1+1]];
            let p2 = [coords[2*i3], coords[2*i3+1]];
            let c = [coords[2*i2]*g, coords[2*i2+1]*g];
            let rr = Math.sqrt(Math.pow(c[0]-p0[0], 2) + Math.pow(c[1]-p0[1], 2) );
            for(let j=0; j<=n; j++) {
                let t = j/n;
    
                let x = p0[0] * (1-t) + p2[0] * t - c[0];
                let y = p0[1] * (1-t) + p2[1] * t - c[1];
                let factor = rr / Math.sqrt(x*x+y*y);
                x = c[0] + x * factor;
                y = c[1] + y * factor;            
                pts.push([x,y]); 
            }
            for(let j=0; j<n; j++) {
                attributes.position.data.push(pts[j][0], pts[j][1], pts[j+1][0], pts[j+1][1]);
                attributes.texcoord.data.push(1,v,1,v);
            } 
    
        }
        //attributes.position.data.push(coords[0], coords[1], coords[4], coords[5]);
        //attributes.texcoord.data.push(0,0,0,0);

        this.createBufferInfo(attributes);
    }  
};



class HyperbolicPolygonOutline extends Mesh {
    constructor(gl, m, r) {
        super(gl, gl.LINES, new HyperbolicSimpleMaterial(gl));
        const attributes = { 
            position: { data: [], numComponents: 2 }
        };
        let coords = [];
        for(let j=0;j<m;j++) {
            let phi = -2*Math.PI*j/m;
            coords.push(r*Math.cos(phi), r*Math.sin(phi));
        }
        const n = 20;
        for(let i=0; i<m; i++) {
            let i1 = (i+1)%m;
            let pts = [];
            let kp0 = p2k([coords[i*2],coords[i*2+1]]);
            let kp1 = p2k([coords[i1*2],coords[i1*2+1]]);
            for(let j=0; j<=n; j++) {
                let t = j/n;
                pts.push(k2p([kp0[0]*(1-t)+kp1[0]*t, kp0[1]*(1-t)+kp1[1]*t]));            
            }
            for(let j=0; j<n; j++) {
                attributes.position.data.push(pts[j][0], pts[j][1], pts[j+1][0], pts[j+1][1]);
            }    
        }
        this.createBufferInfo(attributes);
    }  
};


class T83ColorLinesMesh extends Mesh {
    constructor(gl,r) {
        super(gl, gl.TRIANGLES, new HyperbolicMaterial(gl));
        const m = 8;
        const attributes = { 
            position: { data: [], numComponents: 2 },
            texcoord: { data: [], numComponents: 2 },
            indices: { data: [], numComponents: 3 }
        };
        let coords = [];
        for(let j=0;j<m;j++) {
            let phi = -2*Math.PI*j/m;
            coords.push(r*Math.cos(phi), r*Math.sin(phi));
        }
        

        const n = 20;

        /*
        for(let i=0; i<m; i++) {
            let i1 = (i+1)%m;
            let pts = [];
            let kp0 = p2k([coords[i*2],coords[i*2+1]]);
            let kp1 = p2k([coords[i1*2],coords[i1*2+1]]);
            for(let j=0; j<=n; j++) {
                let t = j/n;
                pts.push(k2p([kp0[0]*(1-t)+kp1[0]*t, kp0[1]*(1-t)+kp1[1]*t]));            
            }
            for(let j=0; j<n; j++) {
                attributes.position.data.push(pts[j][0], pts[j][1], pts[j+1][0], pts[j+1][1]);
                attributes.texcoord.data.push(0,0,0,0);
            }    
        }
        */

        const g = Math.sin(2*Math.PI/3) / Math.sin(Math.PI/12);
        let k = 0;
        for(let i=0; i<4; i++) {
            let v = i%2;
            let i1 = i*2, i2 = (i1 + 1)%8, i3 = (i2 + 1)%8;
            let p0 = [coords[2*i1], coords[2*i1+1]];
            let p2 = [coords[2*i3], coords[2*i3+1]];
            let c = [coords[2*i2]*g, coords[2*i2+1]*g];
            let rr = Math.sqrt(Math.pow(c[0]-p0[0], 2) + Math.pow(c[1]-p0[1], 2) );
            
            for(let j=0; j<=n; j++) {
                let t = j/n;
    
                let x = p0[0] * (1-t) + p2[0] * t - c[0];
                let y = p0[1] * (1-t) + p2[1] * t - c[1];
                let factor = 1.0 / Math.sqrt(x*x+y*y);
                let ux = x * factor;
                let uy = y * factor;
                let x0 = c[0] + ux * rr;
                let y0 = c[1] + uy * rr;
                let w = 0.005 * 1.0/(1.0 - x0*x0 - y0*y0);
                if(t<0.1) w *= t/0.1;
                else if(t>0.9) w *= (1-t)/0.1;

                attributes.position.data.push(
                    x0 - ux*w, y0 - uy*w,
                    x0 + ux*w, y0 + uy*w);
                attributes.texcoord.data.push(1,v,1,v);
            }
            for(let j=0; j<n; j++) {
                attributes.indices.data.push(
                    k+2*j,k+2*j+1,k+2*j+3, 
                    k+2*j, k+2*j+3, k+2*j+2 );
            }
            k += (n+1)*2;
            
    
        }
        //attributes.position.data.push(coords[0], coords[1], coords[4], coords[5]);
        //attributes.texcoord.data.push(0,0,0,0);

        this.createBufferInfo(attributes);
    }  
};


class Cell2Mesh extends Mesh {
    constructor(gl,r) {
        super(gl, gl.TRIANGLE_FAN, new HyperbolicMaterial(gl));
        const m = 8;
        const attributes = { 
            position: { data: [], numComponents: 2 },
            texcoord: { data: [], numComponents: 2 }
        };
        attributes.position.data.push(0,0);
        attributes.texcoord.data.push(0,0);
        
        let coords = [];
        let rr = r*0.98;
        for(let j=0;j<m;j++) {
            let phi = -2*Math.PI*j/m;
            coords.push(rr*Math.cos(phi), rr*Math.sin(phi));
        }
        const n = 20;
        for(let i=0; i<m; i++) {
            let i1 = (i+1)%m;
            let pts = [];
            let kp0 = p2k([coords[i*2],coords[i*2+1]]);
            let kp1 = p2k([coords[i1*2],coords[i1*2+1]]);
            for(let j=0; j<=n; j++) {
                let t = j/n;
                pts.push(k2p([kp0[0]*(1-t)+kp1[0]*t, kp0[1]*(1-t)+kp1[1]*t]));            
            }
            for(let j=0; j<n; j++) {
                attributes.position.data.push(pts[j][0], pts[j][1], pts[j+1][0], pts[j+1][1]);
                attributes.texcoord.data.push(1,0,1,0);
            }    
        }

        this.createBufferInfo(attributes);
    }  
};



class CellBgMesh extends Mesh {
    constructor(gl,r) {
        const m = 8;
        super(gl, gl.TRIANGLES, new HyperbolicTexturedMaterial(gl));
        const attributes = { 
            position: { data: [], numComponents: 2 },
        };
        const textures = twgl.createTextures(gl, {
            texture1: { src: "images/texture3.png", wrap: gl.CLAMP_TO_EDGE }});
        this.material.uniforms.texture1 = textures.texture1;

        let n = 10;

        for(let j=0;j<=m;j++) {
            let phi1 = -2*Math.PI*(j)/m;
            let phi2 = -2*Math.PI*(j+1)/m;
            let cs1 = Math.cos(phi1), sn1 = Math.sin(phi1);
            let cs2 = Math.cos(phi2), sn2 = Math.sin(phi2);
            let ux = r*cs1/n, uy = r*sn1/n;
            let vx = r*(cs2-cs1)/n, vy = r*(sn2-sn1)/n;
            for(let i=0;i<n;i++) {
                for(let i1=0;i1<=i;i1++) {
                    attributes.position.data.push(
                        ux*i+vx*i1, uy*i+vy*i1,
                        ux*(i+1)+vx*i1, uy*(i+1)+vy*i1,
                        ux*(i+1)+vx*(i1+1), uy*(i+1)+vy*(i1+1));
                        
                }
            }
            for(let i=1;i<n;i++) {
                for(let i1=0;i1<=i;i1++) {
                    attributes.position.data.push(
                        ux*i+vx*i1, uy*i+vy*i1,
                        ux*i+vx*(i1+1), uy*i+vy*(i1+1),
                        ux*(i+1)+vx*(i1+1), uy*(i+1)+vy*(i1+1));
                        
                }
            }
            // attributes.position.data.push(r*Math.cos(phi), r*Math.sin(phi));
        }

        this.createBufferInfo(attributes);
    }  
};

class CellBg2Mesh extends Mesh {
    constructor(gl,r) {
        super(gl, gl.TRIANGLE_FAN, new HyperbolicMaterial());
        const m = 8;
        const attributes = { 
            position: { data: [], numComponents: 2 },
        };
        attributes.position.data.push(0,0);
        let n = 10;
        
        let coords = [];
        for(let j=0;j<m;j++) {
            let phi = -2*Math.PI*j/m;
            coords.push(r*Math.cos(phi), r*Math.sin(phi));
        }
        function addPoint(j, u, v) {
            attributes.position.data.push(coords[j*2], coords[j*2+1]);
            attributes.texcoord.data.push(u,v);
        }
        for(let j=0;j<m;j++) { 
            addPoint(j%m, 0,0); 
            addPoint((j+1)%m, 0,0); 
        }
        addPoint(0,1,0);
        addPoint(2,1,0);
        addPoint(4,1,0);
        addPoint(6,1,0);
        
        addPoint(2,1,1);
        addPoint(4,1,1);
        addPoint(6,1,1);
        addPoint(0,1,1);
        


        this.createBufferInfo(attributes);
    }  
};

