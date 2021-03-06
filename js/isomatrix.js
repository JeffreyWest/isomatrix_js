function setupTriangle(vi,type) {
	
	// just delete old triangles:
	d3.selectAll('svg').remove();
	d3.selectAll('.to_remove').remove();
	d3.selectAll('.downloadButton').remove();
	
	var width =document.getElementById("game-div").offsetWidth;	
	var marginTop = 10,
        marginLeft = 10;    

    var div = d3.select(".board")
        .append("div")
        .attr("class","to_remove")
        .style("top", marginTop + "px")
        .style("left", marginLeft + "px")
        .style("width", width + "px")
        .style("height", width + "px");

    var svg = div.append("svg")
         .attr("width", width + "px")
         .attr("height", width + "px");
		
	isomatrix_background_and_quiver(vi,type);
	drawTriangle();
		
	d3.select("#game-div").append("button")
        .attr("type","button")
        .attr("class", "downloadButton btn btn-success btn-lg")
        .text("Download SVG")
        .style("margin-top","30px")
        .on("click", function() {
            // download the svg
            downloadSVG();
        });
}


function isomatrix_background_and_quiver(vi,type) {
	setTimeout(function () {
		setTimeout(function () {
			isomatrix_fixedpoint();					
	  	}, 0);
	  	isomatrix_quiver();	  	
	}, 0);	
	isomatrix_background(vi,type);
}    


// See https://en.wikipedia.org/wiki/Test_functions_for_optimization
function isomatrix_background(vi,type) {
	
	var A = getPayoff();
	var n = 240, m = 240;
	var mar = 0.1; // fractional margin
	var Hp = (0.5-mar)* Math.tan(Math.PI/3);
	var y0 = (1 - Hp)/2;
	
	// (x,y) each \in [0,1]
	var values = new Array(n * m);
	for (var j = 0.5, k = 0; j < m; ++j) {
	  for (var i = 0.5; i < n; ++i, ++k) {
		  
		var x = i / n; // in [0,1]
		var y = 1 - (j / m); // in [0,1]
		
		// add in margins:
		var xP = (x - mar)/(1-(2*mar));
		var P = (y-y0)/(Hp);
		
		// P, Q is from the coordinate transformation (x1,x2,x3) -> (P,Q,1-P-Q)	
		Q = P * (Math.sin(Math.PI/3) / Math.tan(Math.PI/3)) + 1 - P - xP;
		
		var f1 = (A[0] - A[2] )*P + (A[1] - A[2])*Q + A[2];
		var f2 = (A[0+3] - A[2+3] )*P + (A[1+3] - A[2+3])*Q + A[2+3];
		var f3 = (A[0+6] - A[2+6] )*P + (A[1+6] - A[2+6])*Q + A[2+6];
		var phi = P*f1 + Q*f2 + (1 - P - Q)*f3;
		
		if (type == "velocity") {
			var Z1 = P*(f1-phi);
			var Z2 = Q*(f2-phi);
			var Z3 = (1 - P - Q)*(f3-phi);    
			var Z = Math.sqrt(Z1*Z1 + Z2*Z2 + Z3*Z3);
			var Zfocal = Z;
			
			// choose which:
			if (vi == 1) {
				Zfocal=Z1;
			} else if (vi == 2){
				Zfocal=Z2;
			} else if (vi == 3){
				Zfocal=Z3;
			}
			
			// don't draw if outside of circle
			Z = ((P<0) || (P>1)) ? NaN : Z;
			Z = ((Q<0) || (Q>1)) ? NaN : Z;
			Z = (P + Q > 1) ? NaN : Z;
			
			values[k] = isNaN(Z) ? 0 : Zfocal;
// 			values[k] = Zfocal;
		} else if (type == "fitness") {
			
			var Zfocal = phi;
			
			// choose which:
			if (vi == 1) {
				Zfocal=f1;
			} else if (vi == 2){
				Zfocal=f2;
			} else if (vi == 3){
				Zfocal=f3;
			}
			
			// don't draw if outside of triangle
			Zfocal = ((P<0) || (P>1)) ? NaN : Zfocal;
			Zfocal = ((Q<0) || (Q>1)) ? NaN : Zfocal;
			Zfocal = (P + Q > 1) ? NaN : Zfocal;
			
			values[k] = isNaN(Zfocal) ? 0 : Zfocal;
// 			values[k] = Zfocal;
			
			
		} // end fitness
		
	  }
	}
	
	//////////////////////////////////////////////////
	// draw the contours:
	BINS = 8;
	var thresholds = determineThresholds(values,vi,BINS);
	var contours = d3.contours()
	    .size([n, m])
	    .thresholds(thresholds);
	    

		// interpolateYlGnBu or, interpolateSpectral
	var color = d3.scaleLinear().domain(d3.extent(thresholds)).interpolate(function() { return d3.interpolateYlGnBu; });

	if (vi>0) {
		var myDomain = [thresholds[0],thresholds[(thresholds.length-1)/2-1],thresholds[(thresholds.length-1)/2],thresholds[thresholds.length-1]];
		color = d3.scaleLinear().domain(myDomain).range(['#008dde','#fffdfb','#fffdfb','#de0006']);
	}
		
	
	var svg = d3.select("svg");
	var width =document.getElementById("game-div").offsetWidth;
	
	// add the nullclines:
	var null_thresholds = determineThresholds(values,vi,2);
	var null_contours = d3.contours()
	    .size([n, m])
	    .thresholds(null_thresholds);
	
	d3.select("svg").selectAll(".contours")
	  .data(contours(values))
	  .enter()
	  .append("path")
	  	.attr("class","contours")
	    .attr("d", d3.geoPath(d3.geoIdentity().scale(width / n)))
	    .attr("fill", function(d) { 
		    return color(d.value); });
	
	d3.select("svg").selectAll(".nullclines")
	  .data(null_contours(values))
	  .enter()
	  .append("path")
	  	.attr("class","nullclines")
	    .attr("d", d3.geoPath(d3.geoIdentity().scale(width / n)))
		.attr("fill", "none")
	    .attr("stroke",(vi>0) ? "black" : "none" )
	    .attr("fill","none")
	    .style("stroke-dasharray", ("3, 3"))
	    .attr("stroke-width",4);
}



// draw fixed points on the edge of triangle   
function isomatrix_fixedpoint() {
	
	var svg = d3.select("svg");
	svg.selectAll("circle").remove(); // remove all fixed points
	var width =document.getElementById("game-div").offsetWidth;
	
	//only need to add definitions once:
	defineFixedPointTypes(svg);
	
	drawTriangle(); // redraw base triangle, bc we just deleted it
	
	
	var A = getPayoff();
	
	// some parameters for describing corners:
	var b1 = 0.05*width;
	var b2 = b1*Math.tan(Math.PI/6);
	var x1 = UVW_to_XY([1,0,0]);
	var x2 = UVW_to_XY([0,1,0]);
	var x3 = UVW_to_XY([0,0,1]);  	
	
	for (var i = 1; i <= 2; i++) { // in [1,2]
		for (var d = 1; d <= 2; d++) { // in [1,2]
			var j = ((i-1 + d) % 3) + 1;
			if (i < j) {
				
				// line up the points on the (i,j)th line
				var delta = [-b1,-b2];				
				var myLine = [addArray(x1,delta), addArray(x2,delta)];
				
				if ((i==1) && (j==3)) { //1-3
					delta = [b1,-b2];
					myLine = [addArray(x1,delta), addArray(x3,delta)];
				} else if ((i==2) && (j==3)) { //2-3
					delta = [0,b1];
					myLine = [addArray(x2,delta), addArray(x3,delta)];
				}
				
				Ap = getSubgame(A,i,j);
				
				// equal competition:
				if ((Ap[0] == Ap[2]) && (Ap[1] == Ap[3])) {
					addLine(myLine,"neutral");
					// no interior fixed points
										
				} else if ((Ap[0]-Ap[2])*(Ap[1]-Ap[3]) < 0) {
					addLine(myLine); // solid line
					
					// there is an interior point:
					var x_star = (Ap[3] - Ap[1])/ (Ap[0] - Ap[1] - Ap[2] + Ap[3] );
					
					var x = [0,0,0];
					x[i-1]=x_star;
					x[j-1]=1-x_star;					
					

					if ((Ap[0] < Ap[2]) && (Ap[1] > Ap[3])) {
						// this interior point is stable:
						addFixedPoint(addArray(UVW_to_XY(x),delta),"sink");
						addFixedPoint(UVW_to_XY(x), DetermineFixedPointType(x,A));
						
						// either end is unstable:
						var vec = [i,j];
						for (var ki = 0; ki < vec.length; ki++) {
							var k = vec[ki];
							var x = [0,0,0];
							x[k-1]=1;
							addFixedPoint(addArray(UVW_to_XY(x),delta),"source");
						}
					} else {
						// this interior point is unstable:
						addFixedPoint(addArray(UVW_to_XY(x),delta),"source");
						addFixedPoint(UVW_to_XY(x), DetermineFixedPointType(x,A));
						
						// either end is unstable:
						var vec = [i,j];
						for (var ki = 0; ki < vec.length; ki++) {
							var k = vec[ki];
							var x = [0,0,0];
							x[k-1]=1;
							addFixedPoint(addArray(UVW_to_XY(x),delta),"sink");
						}
					}
				} else {
					// i dominates j, or j dominates i:
					addLine(myLine); // solid line
					
					// conditional logic:
					var i_stable = ((Ap[0] >= Ap[2]) && (Ap[1] >= Ap[3]));					
					
					// is stable
					var x = [0,0,0];
					x[i-1]=1;
					addFixedPoint(addArray(UVW_to_XY(x),delta),(i_stable ? "sink" : "source"));
					
					
					// j is unstable
					var x = [0,0,0];
					x[j-1]=1;
					addFixedPoint(addArray(UVW_to_XY(x),delta),(i_stable ? "source" : "sink"));
						
					
				}
			}
		}
	}
	
	
	// internal equilibriums: solve Ax = b for internal equil:    
    aa = A[0]-A[2]-A[6]+A[8];
    bb = A[1] - A[2] - A[7] + A[8];
    cc = A[3]-A[5]-A[6]+A[8];
    dd = A[4]-A[5]-A[7]+A[8];
    
    B1 = A[8] - A[2];
    B2 = A[8] - A[5];	
	
	var det = aa*dd-bb*cc; //determinant: ad - bc
	var Ainv = [dd/det,-bb/det,-cc/det,aa/det];

    var p_star = Ainv[0]*B1 + Ainv[1]*B2;
    var q_star = Ainv[2]*B1 + Ainv[3]*B2;
        
    if ((p_star > 0) && (q_star > 0) ) {
	    if ((p_star < 1) && (q_star < 1) ) {
		    if (p_star + q_star < 1) {
			    var x_equil = [p_star,q_star,1-p_star-q_star];			    			    
			    addFixedPoint(UVW_to_XY(x_equil), DetermineFixedPointType(x_equil,A));
		    }
	    }
    }
    
    // 3 corners:
    addFixedPoint(UVW_to_XY([1,0,0]), DetermineFixedPointType([1,0,0],A));
    addFixedPoint(UVW_to_XY([0,1,0]), DetermineFixedPointType([0,1,0],A));
    addFixedPoint(UVW_to_XY([0,0,1]), DetermineFixedPointType([0,0,1],A));
}

function DetermineFixedPointType(x,A) {
	var type = "neutral";

	var L = hessian(x,A);
    var lambda1 = L[0];//real(lambda(1,1));
    var lambda2 = L[1];//real(lambda(2,2));
        
    // fix numerical error for 0 eigenvalues
    var eps = 0.000000001;    
    lambda1 = (Math.abs(lambda1) < eps) ? 0 : lambda1;
    lambda2 = (Math.abs(lambda2) < eps) ? 0 : lambda2;            
    
    if ((lambda1== 0) && (lambda2==0)) {
	    type = "stable"; //  this is stable, but not asymptotically stable??? not sure TK
    } else if (((lambda1== 0) && (lambda2>0)) || ((lambda1>0) && (lambda2==0)) ) {
	    // one zero, one positive == UNSTABLE
	    type = "semi-source";
    } else if (((lambda1== 0) && (lambda2<0)) || ((lambda1< 0) && (lambda2==0)) ) {
	    // one zero, one negative
        type = "semi-sink";
    } else if (lambda1*lambda2<0) {
        type = "saddle";
    } else if ((lambda1> 0) && (lambda2>0)) {
        type = "source";
    } else {
        type = "sink";
    }
    
	return type;
}

function isomatrix_quiver() {
	// get svg:
	var svg = d3.select("svg");
	var width =document.getElementById("game-div").offsetWidth;
	
	var x1 = UVW_to_XY([0.5,0.4,0.1]);
	var x2 = UVW_to_XY([0.1,0.4,0.5]);
	
	// only need to add arrow defintion once:
	svg.append("svg:defs").append("svg:marker")
	    .attr("id", "triangle")
	    .attr("refX", 2)
	    .attr("refY", 2)
	    .attr("markerWidth", 30)
	    .attr("markerHeight", 30)
	    .attr("orient", "auto")
	    .append("path")
	    .attr("d", "M 0 0 4 2 0 4 1.33 2")
	    .style("fill", "#4a4a4a");
	
	
    var step = 1/15;
    var step0 =step/2;
    var SCALAR = 10; // length of arrows
    
    var R = ReplicatorEquation();
    
	for (var P = 0; P < (1+step); P=P+step) {
		for (var Q = 0; Q < (1+step); Q=Q+step) {			
			if ((P < step0) || (Q < step0)) {
				// outside of simplex:
				
			} else {
				if ((P+Q) > (1-step0)) {
					// outside of simplex:
				} else {
					
					// from replicator dynamics:
					var xdot = R(0,[P,Q,1-P-Q]);
										
					// vector in simplex-space:
					var V = -xdot[0];
	                var U = (xdot[2]-xdot[1])*Math.cos(Math.PI/3); 
	                var mag = Math.sqrt(V*V + U*U);
					
					if (mag > 0){
						// convert to x-y plot coordinates:
						var x1 = UVW_to_XY([P,Q,1-P-Q]);
						var x2 = [x1[0] + (SCALAR*U/mag), x1[1] + (SCALAR*V/mag)];
											
						addArrow(svg,x1,x2);
					} else {
						// add a dot (TK)
					}
					
					
				}
			}
		}
	}
}

function hessian(x,A) {
	
	var D = [0,0,0,0];
	for (var i = 0; i < 2; i++) {
		for (var j = 0; j < 2; j++) {
			if (i == j) {
				var s1 = A[i*3+0]*x[0] + A[i*3+1]*x[1] + A[i*3+2]*x[2]; 
				var t = [0,0,0];
				
				for (var k = 0; k < 3; k++) {
					t[k]=x[0]*A[0*3+k] + x[1]*A[1*3+k] + x[2]*A[2*3+k];
				}
				
				var s2 = -t[0]*x[0] -t[1]*x[1] -t[2]*x[2];				
				var s3 = A[i*3 + 0]*x[0] + A[i*3 + 1]*x[1] + A[i*3 + 2]*x[2];
				var s4 = A[0*3 + i]*x[0] + A[1*3 + i]*x[1] + A[2*3 + i]*x[2];
				
				D[i*2+j] = s1+s2 + ( A[i*3+i] - s3 - s4 )*x[i];
								
				// second part:		
				s1 = A[2*3 + 0]*x[0] + A[2*3 + 1]*x[1] + A[2*3 + 2]*x[2];
				s2 = A[0*3 + 2]*x[0] + A[1*3 + 2]*x[1] + A[2*3 + 2]*x[2];				
				
				D[i*2+j] = D[i*2+j] - (A[i*3+2] - s1 - s2)*x[i];				
				
			} else {

				var s1 = A[j*3 + 0]*x[0] + A[j*3 + 1]*x[1] + A[j*3 + 2]*x[2];
				var s2 = A[0*3 + j]*x[0] + A[1*3 + j]*x[1] + A[2*3 + j]*x[2];
				
				D[i*2+j]=( A[i*3+j] -   s1 -     s2   ) * x[i];
				
				var s3 = A[2*3 + 0]*x[0] + A[2*3 + 1]*x[1] + A[2*3 + 2]*x[2];
				var s4 = A[0*3 + 2]*x[0] + A[1*3 + 2]*x[1] + A[2*3 + 2]*x[2];
				D[i*2+j]=D[i*2+j] - (  A[i*3+2] -  s3  -   s4 )*x[i];				
				
			}		
		}
	}
	
	// load up math.js
	const { eigs, multiply, column, transpose } = math
	
	var vals_and_vecs = eigs([[D[0],D[1]],[D[2],D[3]]]);
	return vals_and_vecs.values;
}








