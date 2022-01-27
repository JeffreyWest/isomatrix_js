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
	
	
	
	isomatrix_velocity(3);
	
	
	
	
	
	
	
	
	  
	drawTriangle(width);
}

// draw the black lines of the triangle:
function drawTriangle(width) {
	var svg = d3.select("svg");
	svg.selectAll("line").remove();
	
	var m = width/10;
	var H = (width/2-m)*Math.tan(Math.PI/3);
	var y0 = (width - H)/2; // center triangle in svg vertically
	var x1 = [0.5*width, width-H-y0]; // top corner
	var x2 = [m,width-y0]; // left corner
	var x3 = [(width-m),(width-y0)]; //right corner
			
	var data = [x1,x2,x3,x1,x2];
         var lineGenerator = d3.line();
         var pathString = lineGenerator(data);
         svg.append('path')
			.attr('d', pathString)
			.style("stroke","#000000")
		  	.style("stroke-width",5)
		  	.style("fill", "none");

	var y1 = [0,0];
	var y2 = [0,width];
	var y4 = [width,0];
	var y3 = [width,width];
	var data = [y1,y2,y3,y4,y1];
         var lineGenerator = d3.line();
         var pathString = lineGenerator(data);
         svg.append('path')
			.attr('d', pathString)
			.style("stroke","#000000")
		  	.style("stroke-width",5)
		  	.style("fill", "none");
}
	    
    
function determineThresholds(values,vi){
	var min = 10000;
	var max = -min;
	for (var i = 0; i < values.length; i++) {
		min = (values[i] < min) ? values[i] : min;
		max = (values[i] > max) ? values[i] : max;
	}
	var limits = [min,max];
	
	
	var BINS = 16; // should be even
	
	if (vi>0) {
		var myMax = Math.max(...[-min,max]);
		console.log(Math.max(...[-min,max]));
		limits= [-myMax*(1 + 4/BINS),myMax*(1 + 4/BINS)];
	}
	
	
	
	var thresholds = d3.range(1, BINS)
	    .map(function(p) {
		    limit = p/(BINS)*(limits[1]-limits[0]) + limits[0];	    
		    return limit; 
		});
	
	return thresholds;
}

// See https://en.wikipedia.org/wiki/Test_functions_for_optimization
function isomatrix_velocity(vi) {
	
	var n = 240, m = 240;
	
	// payoff:
	A1=[0.8147,0.9134,0.2785];
    A2=[0.9058,0.6324,0.5469];
    A3=[0.1270,0.0975,0.9575];
//     A=[A1;A2;A3];

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
		
		var f1 = (A1[0] - A1[2] )*P + (A1[1] - A1[2])*Q + A1[2];
		var f2 = (A2[0] - A2[2] )*P + (A2[1] - A2[2])*Q + A2[2];
		var f3 = (A3[0] - A3[2] )*P + (A3[1] - A3[2])*Q + A3[2];
		var phi = P*f1 + Q*f2 + (1 - P - Q)*f3;
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
	  }
	}
	
	//////////////////////////////////////////////////
	// draw the contours:
	var thresholds = determineThresholds(values,vi);	
	console.log("thresholds: " + thresholds);
		
	var contours = d3.contours()
	    .size([n, m])
	    .thresholds(thresholds);
	    

	var color = d3.scaleLinear().domain(d3.extent(thresholds)).interpolate(function() { return d3.interpolateYlGnBu; });

	if (vi>0) {
		var myDomain = [thresholds[0],thresholds[(thresholds.length-1)/2],thresholds[thresholds.length-1]];
		console.log(myDomain);
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
	
	drawTriangle(width);

}
