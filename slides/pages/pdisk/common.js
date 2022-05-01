const m4 = twgl.m4;



function invertPoint(p) {
    const [x,y] = p;
    let factor = 1.0/(x*x+y*y);
    return [x*factor, y*factor]
}

function getDistance(pa,pb) {
    return Math.sqrt(Math.pow(pb[0]-pa[0],2) + Math.pow(pb[1]-pa[1],2));
}

function getLength(p) {
    return Math.sqrt(p[0]*p[0] + p[1]*p[1]);
}
