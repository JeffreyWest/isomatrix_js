function addFixedPoint(x,type) {
	var svg = d3.select("svg");
	var grad_stable = svg.append("defs")
          .append("linearGradient").attr("id", "grad_stable")
          .attr("x1", "0%").attr("x2", "0%").attr("y1", "100%").attr("y2", "0%");
	grad_stable.append("stop").attr("offset", "50%").style("stop-color", "black");
	grad_stable.append("stop").attr("offset", "50%").style("stop-color", "white");
    
    var grad_unstable = svg.append("defs")
          .append("linearGradient").attr("id", "grad_unstable")
          .attr("x1", "0%").attr("x2", "0%").attr("y1", "100%").attr("y2", "0%");
    grad_unstable.append("stop").attr("offset", "50%").style("stop-color", "black");
	grad_unstable.append("stop").attr("offset", "50%").style("stop-color", "black");
    
    
	if (type === "unstable") {
		svg.append("circle")
         .attr("r",8)
         .attr("cx",x[0])
         .attr("cy",x[1])
         .style("stroke","black")
         .style("stroke-width",2)
         .style("fill","url(#grad_unstable)");
	} else {
		svg.append("circle")
         .attr("r",8)
         .attr("cx",x[0])
         .attr("cy",x[1])
         .style("stroke","black")
         .style("stroke-width",2)
         .style("fill","url(#grad_stable)");
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

function getSubgame(A,i,j) {
	
	var i11 = (i-1)*3 + (i-1);
	var i21 = (j-1)*3 + (i-1);
	var i12 = (i-1)*3 + (j-1);
	var i22 = (j-1)*3 + (j-1);
	
	return [A[i11],A[i12],A[i21],A[i22]];
}

// determine limits of color bar for contours (velocity, fitness bkgd coloring)  
function determineThresholds(values,vi){
	var min = 10000;
	var max = -min;
	for (var i = 0; i < values.length; i++) {
		min = (values[i] < min) ? values[i] : min;
		max = (values[i] > max) ? values[i] : max;
	}
	var limits = [min,max];	
	var BINS = 8; // should be even
	
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

/*
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
*/
}



function UVW_to_XY(x) {
	var width =document.getElementById("game-div").offsetWidth;
	
	var m = width/10;
	var H = (width/2-m)*Math.tan(Math.PI/3);
	var y0 = (width - H)/2; // center triangle in svg vertically
/*
	var x1 = [0.5*width, width-H-y0]; // top corner
	var x2 = [m,width-y0]; // left corner
	var x3 = [(width-m),(width-y0)]; //right corner
	
*/
		
	cx = (width-2*m)*(x[0]*Math.sin(Math.PI/3) / Math.tan(Math.PI/3) + (1 - x[0] - x[1]) )+m;
	cy = width-y0-H*x[0];
	
	return [cx,cy]
}




