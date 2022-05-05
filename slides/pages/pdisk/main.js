
let viewer;
let dot1, dot2, dot3, dot4;
let sdot1;
let pos = {x:0, y:0}
let hLine1, hLine2;
let hPolygon;


const slide = {
    name: 'Poincaré disk'
};


function setup() {


    let scenes = [
        new Scene1(),
        new Scene2(),
        new Scene3(),
        new Scene4(),
        new Scene5(),
        new Scene6(),
        new Scene7(),
                
    ];

    viewer = new DiskViewer({ scenes } );
}

function cleanup() {
    viewer.stop();
    viewer = null;
}

/*

function drawDot(p) {
    let material = sdot1.material;
    let oldMatrix = material.uniforms.modelMatrix;
    material.uniforms.modelMatrix = twgl.m4.translation([p[0],p[1],0.0]);
    sdot1.draw();
    material.uniforms.modelMatrix = oldMatrix;
}
function init(gl, viewer) {


    sdot1 = new Disk(gl, 0.01, 10);

    dot1 = viewer.createDraggableDot(0,0);
    dot2 = viewer.createDraggableDot(0.5,0.2);
    dot3 = viewer.createDraggableDot(0.6,0.1);
    dot4 = viewer.createDraggableDot(-0.3,0.6);
    hLine1 = new HLineMesh(gl, 50);
    hLine2 = new HLineMesh(gl, 50);
    
    hLine1.setByPoints(dot1.pos, dot2.pos);
    hLine2.setByPoints(dot1.pos, dot3.pos);

    hPolygon = new HRegularPolygon(gl, 8, 0.7);
    // hSegment = new HSegmentMesh(gl, 50, dot3.pos, dot4.pos);
    
}

function render(gl, viewer) {

    let t = performance.now()*0.001;

    hLine1.setByPoints(dot1.pos, dot2.pos);
    hLine2.setByPoints(dot1.pos, dot3.pos);
    // hSegment.setEnds(dot3.pos, dot4.pos);

    hLine1.material.setColor([1,1,1,1]);
    hLine1.draw(); 
    hLine2.material.setColor([1,0,1,1]);
    hLine2.draw(); 

    //hSegment.material.setColor([0,1,0,1]);
    // hSegment.draw();

    //hSegment.material.uniforms.hModelMatrix = hTranslation(0.4,0.4);
    //hSegment.draw();
    //hSegment.material.uniforms.hModelMatrix = twgl.m4.identity();

    hPolygon.setFirstVertex(dot2.pos);
    hPolygon.draw();
    hPolygon.matrix = hPolygon.getEdgeMatrix(0); //  hTranslation(0.3,0.4);
    hPolygon.draw();
    hPolygon.matrix = hPolygon.getEdgeMatrix(-1); //  hTranslation(0.3,0.4);
    hPolygon.draw();

    //hPolygon.matrix = hTranslation(0.6,0.0);
    //hPolygon.draw();
    
    hPolygon.matrix = m4.identity();


    let p = pMidPoint(hPolygon.edge.hSegment.p0, hPolygon.edge.hSegment.p1);
    sdot1.material.setColor([1,0,0,1]);
    drawDot(p);

    dot1.draw();
    dot2.draw();
    dot3.draw();
    dot4.draw();
}


let disk;
let textureCanvas, textureCtx;

function init2(gl, viewer) {


    textureCanvas = new OffscreenCanvas(1024,1024);
    textureCtx = textureCanvas.getContext('2d');
    textureCtx.fillStyle='transparent';
    textureCtx.fillRect(0,0,1024,1024);

    disk = new Disk(gl, 0.9999, 100);
    disk.material = new HyperbolicInvertedTexturedMaterial(gl);
    disk.material.uniforms.texture = twgl.createTexture(gl, {src: textureCanvas});
    
}


function render2(gl, viewer) {

    let t = performance.now()*0.001;
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

  
function uff(color) {
    textureCtx.fillStyle=color;
    textureCtx.fillRect(0,0,512,512);
    disk.material.updateTexture(disk.material.uniforms.texture, textureCanvas);
    
}

*/