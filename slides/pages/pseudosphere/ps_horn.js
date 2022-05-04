



class PsHorn {
    constructor(scene) {
        let nu = this.nu = 50;
        let nv = this.nv = 50;
        let deltah = this.deltah = 0.0;
        this.nu = nu;
        this.nv = nv;
        let vd = new BABYLON.VertexData();
        vd.positions = [];
        vd.normals = [];
        vd.indices = [];
        vd.uvs = [];
        for(let i=0;i<nu;i++) {
            let u = i/(nu-1);
            for(let j=0;j<nv;j++) {
                let v = j/(nv-1);
                let f = (u,v) => psHornFn(u,v,deltah);
                let p = f(u,v);
                let nrm = this.computeNormal(f,u,v);
                vd.positions.push(p.x,p.y,p.z);
                vd.normals.push(nrm.x,nrm.y,nrm.z);
                vd.uvs.push(u,v);
            }
        }
        for(let i=0;i+1<nu;i++) {
            for(let j=0;j+1<nv;j++) {
                let k = i*nv+j;
                vd.indices.push(k,k+1,k+1+nv, k,k+1+nv,k+nv);
            }
        }
        let mesh = this.mesh = new BABYLON.Mesh('surface', scene);
        vd.applyToMesh(mesh, true);
    }

    computeNormal(f,u,v) {
        const h = 0.0001;
        let dfdu=f(u+h,v).subtract(f(u-h,v));
        let dfdv=f(u,v+h).subtract(f(u,v-h));
        return BABYLON.Vector3.Cross(dfdu,dfdv).normalize();
    }

    update() {
        let positions = this.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        let normals = this.mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
        const nu = this.nu;
        const nv = this.nv;
        const deltah = this.deltah;
        const f = (u,v) => psHornFn(u,v,deltah);
        let k = 0;
        for(let i=0;i<nu;i++) {
            let u = i/(nu-1);
            for(let j=0;j<nv;j++) {
                let v = j/(nv-1);
                let p = f(u,v);
                let nrm = this.computeNormal(f,u,v);
                positions[k]=p.x; 
                positions[k+1]=p.y; 
                positions[k+2]=p.z; 
                normals[k]=nrm.x; 
                normals[k+1]=nrm.y; 
                normals[k+2]=nrm.z; 
                k += 3;
            }
        }
        this.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
        this.mesh.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals);
    }
}


function psHornFn(u,v,deltah)  {
    let phi = 2 * Math.PI * u , 
        csPhi = Math.cos(phi), 
        snPhi = Math.sin(phi);

    // v = v * m_maxV * 10;
    let vv = v * 10;
    /*

    if(vv < 1.0) {
        let t = 1.0-vv;
        let r = 1.0 + t;
        let sech_v = 1/Math.cosh(vv);
        let x = csPhi*r;
        let y = snPhi*r ;
        let z = Math.sin(phi*7) * t * t * 0.5 + Math.sin(phi*21) * Math.pow(Math.max(0.0, t-0.5),2) * 0.7 ;
        let sc = 3;
        return new BABYLON.Vector3(x*sc, -z*sc - deltah * param1 * phi, y*sc);
    
    } else {
        vv -= 1.0;
        */
        let sech_v = 1/Math.cosh(vv);
        let x = csPhi*sech_v;
        let y = snPhi*sech_v ;
        let z = vv - Math.tanh(vv) ;
        let sc = globalScale;
        return new BABYLON.Vector3(x*sc, -z*sc - deltah * param1 * phi ,y*sc,);    
    // }
}


