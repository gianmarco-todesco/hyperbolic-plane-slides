
let viewer;
let dot1, dot2, dot3, dot4;
let sdot1;
let pos = {x:0, y:0}
let hLine1, hLine2;
let hPolygon;


const slide = {
    name: 'PoincarĂ© disk'
};


function setup() {


    let scenes = [
        new PseudoSphereScene(),
        /*
        new Tessellation83Scene(),
        new Tessellation64Scene(),
        new Tessellation55Scene(),
        new GearTessellation(),


        new PointsAndLinesScene(),
        new FreeHandDrawingScene(),
        new OctagonsScene(),
        new CoxeterTessellation(),
        new Scene7(),
        new CircleLimitIIIScene(),
        */
                
    ];

    viewer = new DiskViewer({ scenes } );
    // viewer.setCurrentScene(scenes[6]);

}

function cleanup() {
    viewer.stop();
    viewer = null;
}
