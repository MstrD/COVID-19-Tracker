var els = [];
var country = "Portugal";

var chartExists = false;
var chartData = [];

d3.json("https://pomber.github.io/covid19/timeseries.json", function(error, data) {
    if (error)
        throw error;

    var listbox = document.getElementById("countries");
    
    Object.entries(data).forEach(el => {
        els.push({
            country: el[0],
            data: el[1]
        });
        let opt = document.createElement("option");
        opt.text = el[0];
        listbox.add(opt);
    });
    sortSelectOptions("#countries");
    buildLineChart(els.filter(d => d.country === country)[0].data);
});

function changeCountry() {
    country = document.getElementById("countries").value;
    document.getElementById("country").innerText = country;
    buildLineChart(els.filter(d => d.country === country)[0].data);
}

function sortSelectOptions(selectElement) {
	var options = $(selectElement + " option");
	options.sort(function(a,b) {
		if (a.text.toUpperCase() > b.text.toUpperCase()) return 1;
		else if (a.text.toUpperCase() < b.text.toUpperCase()) return -1;
		else return 0;
	});
    $(selectElement).empty().append( options );
    $(selectElement).val(country);
}

function buildLineChart(data) {
    var margin = {top: 50, right: 50, bottom: 50, left: 50},
        width = window.innerWidth - margin.left - margin.right, // Use the window's width 
        height = 550 - margin.top - margin.bottom; // Use the window's height

    //data = data.filter(d => d.confirmed !== 0);
    document.getElementById("country").innerText = country;

    var parseDate = d3.timeParse("%Y-%m-%d");

    var labelsUsed = [];
    data.forEach(d => {
        if (!labelsUsed.includes(d.confirmed) && d.confirmed !== 0)
            labelsUsed.push(d.confirmed);
    })

    // 5. X scale will use the index of our data
    var xScale = d3.scaleTime()
        .domain([parseDate(data[0].date), parseDate(data[data.length - 1].date)]) // input
        .range([0, width]); // output

    // 6. Y scale will use the randomly generate number 
    var yScale = d3.scaleLinear()
        .domain([0, (d3.max(data, (d) => d.confirmed))+20]) // input 
        .range([height, 0]); // output 

    // 7. d3's line generator
    var line = d3.line()
        .x(d => xScale(parseDate(d.date))) // set the x values for the line generator
        .y(d => yScale(d.confirmed)) // set the y values for the line generator 
        .curve(d3.curveMonotoneX); // apply smoothing to the line
    
    // 1. Add the SVG to the page and employ #2
    if (!chartExists)
        var svg = d3.select("body").select("#line").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    else
        var svg = d3.select("body").select("#line").select("svg");

    // 3. Call the x axis in a group tag
    if (!chartExists) {
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(xScale)); // Create an axis component with d3.axisBottom

        // 4. Call the y axis in a group tag
        svg.append("g")
            .attr("class", "y axis")
            .call(d3.axisLeft(yScale))
            .append("text")
            .attr("class", "axis-title")
            .attr("transform", "rotate(-90) translate(-60, 15)")
            .text("Infected");

        svg.append("g")			
            .attr("class", "grid")
            .call(d3.axisLeft(yScale)
                .tickSize(-width)
              .tickFormat("")
              .ticks(10)
            );
    }
    else {
        svg.selectAll(".x.axis")
            .transition()
            .duration(1000)
            .call(d3.axisBottom(xScale));

        svg.selectAll(".y.axis")
            .transition()
            .duration(1000)
            .call(d3.axisLeft(yScale));
    }

    function transition(path) {
        path.transition()
            .duration(2000)
            .attrTween("stroke-dasharray", tweenDash);
    }
    function tweenDash() {
        var l = this.getTotalLength(),
            i = d3.interpolateString("0," + l, l + "," + l);
        return function (t) { return i(t); };
    }

    // 9. Append the path, bind the data, and call the line generator
    if (!chartExists) 
        svg.selectAll(".line")
            .data([data]) // 10. Binds data to the line
            .enter().append("path")
            .attr("class", "line") // Assign a class for styling 
            .attr("d", line) // 11. Calls the line generator
            .style("fill", "none")
            .style("stroke", "orange")
            .style("stroke-width", 3)
            .call(transition);
    else
        svg.selectAll(".line")
            .enter()
            .merge(svg.selectAll(".line").data([data]))
                .transition()
                .duration(1000)
                .attr("d", line);

    // 12. Appends a circle for each datapoint 
    svg.selectAll(".dot")
        .data(chartExists ? chartData : data)
    .enter().append("circle") // Uses the enter().append() method
        .attr("class", "dot") // Assign a class for styling
        .style("fill", "orange")
        .merge(svg.selectAll(".dot").data(data))
            .transition()
            .duration(1000)
            .attr("class", "dot") // Assign a class for styling
            .attr("cx", (d) => xScale(parseDate(d.date)))
            .attr("cy", (d) => yScale(d.confirmed))
            .attr("r", (d) => d.confirmed !== 0 ? 5 : 0)
            .style("fill", "orange");

    svg.selectAll(".label")
        .data(chartExists ? chartData : data)
    .enter().append("text")
        .attr("class", "label")
        .style("font-size", "9pt")
        .merge(svg.selectAll(".label").data(data))
        .transition()
        .duration(1000)
        .delay((d, i) => i * 2)
        .attr("x", (d) => xScale(parseDate(d.date)))
        .attr("y", (d) => yScale(d.confirmed) - 20)
        .text((d) => {
            if (labelsUsed.includes(d.confirmed)) {
                labelsUsed.shift();
                return d.confirmed;
            }
        });

    if (!chartExists) {
        var threshold = svg.append("g")
            .attr("class", "threshold");

        threshold.append("line")
            .attr("x1", 0)
            .attr("x2", 0)
            .attr("y1", yScale(d3.max(data, (d) => d.confirmed)))
            .attr("y2", yScale(d3.max(data, (d) => d.confirmed)))
            .style("stroke", "#89868e")
            .style("stroke-dasharray", "8,8")
            .style("stroke-width", "3px")
            .transition()
            .duration(1000)
            .attr("x2", width + margin.right);
        
        threshold.append("text")
            .attr("class", "threshold-text")
            .attr("x", -250)
            .attr("y", yScale(d3.max(data, (d) => d.confirmed)) - 5)
            .text("Threshold: " + d3.max(data, (d) => d.confirmed))
            .style("font-weight", "bold")
            .style("text-transform", "uppercase")
            .style("fill", "#89868e")
            .transition()
            .duration(1000)
            .attr("x", 20);
    }
    else {
        svg.selectAll(".threshold").selectAll("line")
            .transition()
            .duration(1000)
            .attr("y1", yScale(d3.max(data, (d) => d.confirmed)))
            .attr("y2", yScale(d3.max(data, (d) => d.confirmed)));
        
        svg.selectAll(".threshold").selectAll("text")
            .transition()
            .duration(1000)
            .tween("text", function() {
                var self = this;
                var newText = String(d3.max(data, (d) => d.confirmed));
                var textLength = newText.length;
                return function(t) {
                    self.textContent = "Threshold: " + newText.slice(0, Math.round(t * textLength));
                };
            })
            .attr("y", yScale(d3.max(data, (d) => d.confirmed)) - 5)
    }

    chartData = data;
    chartExists = true;
}