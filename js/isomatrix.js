function setupTriangle() {
	
	
	var width =document.getElementById("game-div").offsetWidth;	
	var marginTop = 10,
        marginLeft = 10;    

    var div = d3.select(".board")
        .append("div")
        .style("top", marginTop + "px")
        .style("left", marginLeft + "px")
        .style("width", width + "px")
        .style("height", width + "px");

    var svg = div.append("svg")
         .attr("width", width + "px")
         .attr("height", width + "px");
		
	isomatrix_background([],"velocity");
	drawTriangle();
	isomatrix_fixedpoint();
	
	
	d3.select("body").append("button")
        .attr("type","button")
        .attr("class", "downloadButton")
        .text("Download SVG")
        .on("click", function() {
            // download the svg
            downloadSVG();
        });
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
			
			// don't draw if outside of circle
			Zfocal = ((P<0) || (P>1)) ? NaN : Zfocal;
			Zfocal = ((Q<0) || (Q>1)) ? NaN : Zfocal;
			Zfocal = (P + Q > 1) ? NaN : Zfocal;
			
			values[k] = isNaN(Zfocal) ? 0 : Zfocal;
		} // end fitness
		
	  }
	}
	
	//////////////////////////////////////////////////
	// draw the contours:
	var thresholds = determineThresholds(values,vi);			
	var contours = d3.contours()
	    .size([n, m])
	    .thresholds(thresholds);
	    

		// interpolateYlGnBu or, interpolateSpectral
	var color = d3.scaleLinear().domain(d3.extent(thresholds)).interpolate(function() { return d3.interpolateYlGnBu; });

	if (vi>0) {
		var myDomain = [thresholds[0],thresholds[(thresholds.length-1)/2],thresholds[thresholds.length-1]];
		color = d3.scaleLinear().domain(myDomain).range(['#008dde','#fffdfb','#de0006']);
	}
	
	
	
	var svg = d3.select("svg");
	var width =document.getElementById("game-div").offsetWidth;
		
	svg.selectAll("path").remove();
	svg.selectAll("path")
	  .data(contours(values))
	  .enter()
	  .append("path")
	    .attr("d", d3.geoPath(d3.geoIdentity().scale(width / n)))
	    .attr("fill", function(d) { return color(d.value); });
	
	// re-draw the fixedpoints (not always necessary)
	isomatrix_fixedpoint(width);

}








// draw fixed points on the edge of triangle   
function isomatrix_fixedpoint() {
	
	var svg = d3.select("svg");
	svg.selectAll("line").remove(); // remove all lines
	svg.selectAll("circle").remove(); // remove all fixed points
	var width =document.getElementById("game-div").offsetWidth;

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
						addFixedPoint(addArray(UVW_to_XY(x),delta),"stable");
						
						// either end is unstable:
						var vec = [i,j];
						for (var ki = 0; ki < vec.length; ki++) {
							var k = vec[ki];
							var x = [0,0,0];
							x[k-1]=1;
							addFixedPoint(addArray(UVW_to_XY(x),delta),"unstable");
						}
					} else {
						// this interior point is unstable:
						addFixedPoint(addArray(UVW_to_XY(x),delta),"unstable");
						
						// either end is unstable:
						var vec = [i,j];
						for (var ki = 0; ki < vec.length; ki++) {
							var k = vec[ki];
							var x = [0,0,0];
							x[k-1]=1;
							addFixedPoint(addArray(UVW_to_XY(x),delta),"stable");
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
					addFixedPoint(addArray(UVW_to_XY(x),delta),(i_stable ? "stable" : "unstable"));
					
					
					// j is unstable
					var x = [0,0,0];
					x[j-1]=1;
					addFixedPoint(addArray(UVW_to_XY(x),delta),(i_stable ? "unstable" : "stable"));
						
					
				}
			}
		}
	}	  	
}

