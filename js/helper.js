function ReplicatorEquation() {
		
	var RepEqn = function(t,pt) {
		var A = getPayoff();
		
		var P = pt[0];
		var Q = pt[1];
		
		var f1 = (A[0] - A[2] )*P + (A[1] - A[2])*Q + A[2];
		var f2 = (A[0+3] - A[2+3] )*P + (A[1+3] - A[2+3])*Q + A[2+3];
		var f3 = (A[0+6] - A[2+6] )*P + (A[1+6] - A[2+6])*Q + A[2+6];
		var phi = P*f1 + Q*f2 + (1 - P - Q)*f3;
		
		var xdot = [];
		xdot[0] = pt[0] * (f1 - phi);
		xdot[1] = pt[1] * (f2 - phi)
		xdot[2] = pt[2] * (f3 - phi)
		return xdot;
	}
	return RepEqn;
}

function addArrow(svg,x1,x2) {
	//line              
	svg.append("line")
	  .attr("x1", x1[0])
	  .attr("y1", x1[1])
	  .attr("x2", x2[0])
	  .attr("y2", x2[1])          
	  .attr("stroke-width", 3)
	  .attr("stroke", "#4a4a4a")
	  .attr("marker-end", "url(#triangle)");
}

function addFixedPoint(x,type) {
	var svg = d3.select("svg");
	    
	if (type === "sink") {
		svg.append("circle")
         .attr("r",8)
         .attr("cx",x[0])
         .attr("cy",x[1])
         .style("stroke","black")
         .style("stroke-width",2)
         .style("fill","black");
	}  else if (type === "semi-sink") {
		svg.append("circle")
         .attr("r",8)
         .attr("cx",x[0])
         .attr("cy",x[1])
         .style("stroke","black")
         .style("stroke-width",2)
         .style("fill","url(#grad_semi_sink)");
	}  else if (type === "neutral") {
		svg.append("circle")
         .attr("r",8)
         .attr("cx",x[0])
         .attr("cy",x[1])
         .style("stroke","black")
         .style("stroke-width",2)
         .style("fill","#8b8b8b");
	}  else if (type === "saddle") {
		svg.append("circle")
         .attr("r",8)
         .attr("cx",x[0])
         .attr("cy",x[1])
         .style("stroke","black")
         .style("stroke-width",2)
         .style("fill","url(#grad_saddle)");
	}  else if (type === "semi-source") {
		svg.append("circle")
         .attr("r",8)
         .attr("cx",x[0])
         .attr("cy",x[1])
         .style("stroke","black")
         .style("stroke-width",2)
         .style("fill","url(#grad_semi_source)");
	} else if (type === "source") {
		svg.append("circle")
         .attr("r",8)
         .attr("cx",x[0])
         .attr("cy",x[1])
         .style("stroke","black")
         .style("stroke-width",2)
         .style("fill","white");
	}
}

// add two arrays (is there really no way to do this in javascript???)
function addArray(x1,x2){
	var x3=[];
	for (var i = 0; i < x1.length; i++) {
		x3.push(x1[i]+x2[i]);	
	}
	return x3;
}

// default: A=[.8,.9,.3;.9,.6,.5;.1,0,1];
function getPayoff(randomize) {
	var myArr = document.forms.inputField;
	var myControls = myArr;
	var A = [];
	for (var i = 0; i < myControls.length; i++) {
	  var aControl = myControls[i];
	  
	  if (randomize) {
		  var Aij = (Math.random(1)).toFixed(1);
		  A.push(isNaN(Aij) ? 0 : Aij);		  
		  document.getElementById(aControl.id).value = Aij;
	  } else {
		  // don't print the button value
		  if (aControl.type != "button") {
		    var Aij = parseFloat(aControl.value);
		    A.push(isNaN(Aij) ? 0 : Aij);
		  }
	  }
	}
	
	return (randomize) ? setupTriangle([],"velocity") : A;
}

// get the i vs j subgame (2-player subgame)
function getSubgame(A,i,j) {
	
	var i11 = (i-1)*3 + (i-1);
	var i21 = (j-1)*3 + (i-1);
	var i12 = (i-1)*3 + (j-1);
	var i22 = (j-1)*3 + (j-1);
	
	return [A[i11],A[i12],A[i21],A[i22]];
}

// determine limits of color bar for contours (velocity, fitness bkgd coloring)  
function determineThresholds(values,vi,BINS){
	var min = 10000;
	var max = -min;
	for (var i = 0; i < values.length; i++) {
		min = (values[i] < min) ? values[i] : min;
		max = (values[i] > max) ? values[i] : max;
	}
	var limits = [min,max];	
// 	var BINS = 2; // should be even
	
	if (vi>0) {
		BINS = BINS*2;
		var myMax = Math.max(...[-min,max]);
		limits= [-myMax*(1 + 4/BINS),myMax*(1 + 4/BINS)];
	}
	var thresholds = d3.range(1, BINS)
	    .map(function(p) {
		    limit = p/(BINS)*(limits[1]-limits[0]) + limits[0];	    
		    return limit; 
		});
	
	return thresholds;
}

function addLine(myLine, type) {
	var svg = d3.select("svg");
	var lineGenerator = d3.line();
    var pathString = lineGenerator(myLine);
    
	if (type == "neutral") {
		svg.append('path')
		.attr('d', pathString)
		.style("stroke","#000000")
	  	.style("stroke-width",5)
	  	.style("fill", "none")
		.style("stroke-dasharray", ("3, 3"));
	} else {
		svg.append('path')
		.attr('d', pathString)
		.style("stroke","#000000")
	  	.style("stroke-width",5)
	  	.style("fill", "none");
	}
}

// draw the black lines of the triangle:
function drawTriangle() {
	var svg = d3.select("svg");
	var width =document.getElementById("game-div").offsetWidth;

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
}


// convert [x1,x2,x3] coordinates to plot coordinates (X,Y)
function UVW_to_XY(x) {
	var width =document.getElementById("game-div").offsetWidth;
	var m = width/10;
	var H = (width/2-m)*Math.tan(Math.PI/3);
	var y0 = (width - H)/2; // center triangle in svg vertically		
	cx = (width-2*m)*(x[0]*Math.sin(Math.PI/3) / Math.tan(Math.PI/3) + (1 - x[0] - x[1]) )+m;
	cy = width-y0-H*x[0];
	
	return [cx,cy]
}

// define the circle diagram CSS definitions based on fixed point type
function defineFixedPointTypes(svg) {
    var grad_semi_sink = svg.append("defs")
		.append("linearGradient").attr("id", "grad_semi_sink")
		.attr("x1", "0%").attr("x2", "0%").attr("y1", "100%").attr("y2", "0%");
		grad_semi_sink.append("stop").attr("offset", "50%").style("stop-color", "#8b8b8b");
		grad_semi_sink.append("stop").attr("offset", "50%").style("stop-color", "black");
				
	var grad_saddle = svg.append("defs")
		.append("linearGradient").attr("id", "grad_saddle")
		.attr("x1", "0%").attr("x2", "0%").attr("y1", "100%").attr("y2", "0%");
		grad_saddle.append("stop").attr("offset", "50%").style("stop-color", "white");
		grad_saddle.append("stop").attr("offset", "50%").style("stop-color", "black");
		
	var grad_semi_source = svg.append("defs")
		.append("linearGradient").attr("id", "grad_semi_source")
		.attr("x1", "0%").attr("x2", "0%").attr("y1", "100%").attr("y2", "0%");
		grad_semi_source.append("stop").attr("offset", "50%").style("stop-color", "#8b8b8b");
		grad_semi_source.append("stop").attr("offset", "50%").style("stop-color", "white");
}




