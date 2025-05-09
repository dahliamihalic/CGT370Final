const width = 1200;
const height = 500;
const margin = { top: 50, right: 200, bottom: 40, left: 70 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

const svg = d3.select("#graph1").append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet") //updated to be responsive
    .classed("responsive-svg", true)
    .append('g')
    .attr("transform", `translate(${margin.left}, ${margin.top})`);


/*Data structure for reference
    Date: 2022-01-01
    AOR_Key: ATLANTA FIELD
    Encounter_Count 1501.0
    Count_of_Event 12.0
    Sum_Qty_(lbs) 6383.96952658546
*/

//getting and converting the data
d3.csv("https://web.ics.purdue.edu/~omihalic/CGT%20370/Final370/merged_withoutdupes_final.csv").then(data => {
    data.forEach(d => {
        d.Date = new Date(d.Date);
        d.Encounter_Count = +d.Encounter_Count;
        d.Count_of_Event = +d.Count_of_Event;
        d.Sum_Qty_lbs = +d['Sum_Qty_(lbs)'];
    });


    //TASK LIST: Dahlia
    /*
    Grouped bar chart: Encounter vs. seizure trends for top AORs
        Compare regional activity - helps reveal which areas experience both high migrant crossings and drug seizures.
    Implement interactivity, tooltips, and animated transitions
    */

    //DAHLIA WORKSPACE
    //graph 1: Monthly Encounters By AOR


    //filter data to exclude 2025
    const AORStateMap = {
        "DETROIT SECTOR": "Michigan",
        "BLAINE SECTOR": "Washington",
        "TUCSON FIELD": "Arizona",
        "ATLANTA FIELD": "Georgia",
        "NEW YORK": "New York",
        "YUMA SECTOR": "Arizona",
        "HAVRE SECTOR": "Montana",
        "PORTLAND FIELD": "Oregon",
        "RAMEY SECTOR": "Puerto Rico",
        "BOSTON FIELD": "Massachusetts",
        "BUFFALO FIELD": "New York",
        "DETROIT FIELD": "Michigan",
        "MIAMI FIELD": "Florida",
        "LAREDO FIELD": "Texas",
        "SAN JUAN": "Puerto Rico",
        "TAMPA FIELD": "Florida",
        "SEATTLE FIELD": "Washington",
        "BIG BEND": "Texas",
        "TUCSON SECTOR": "Arizona",
        "EL CENTRO": "California",
        "BUFFALO SECTOR": "New York",
        "SAN FRANCISCO": "California",
        "LAREDO SECTOR": "Texas",
        "MIAMI SECTOR": "Florida",
        "SPOKANE SECTOR": "Washington",
        "LOS ANGELES": "California",
        "DEL RIO": "Texas",
        "CHICAGO FIELD": "Illinois",
        "NEW ORLEANS": "Louisiana",
        "PRECLEARANCE FIELD": "International",
        "EL PASO": "Texas",
        "HOUSTON FIELD": "Texas",
        "BALTIMORE FIELD": "Maryland",
        "GRAND FORKS": "North Dakota",
        "RIO GRANDE": "Texas",
        "SWANTON SECTOR": "Vermont",
        "SAN DIEGO": "California",
        "HOULTON SECTOR": "Maine"
    };

    const states = Array.from(new Set(Object.values(AORStateMap))).sort();

    //create dropdown filter for states

    // Create dropdown container
    const stateDropdown = d3.select("#g1")
        .insert("p", "div")
        .attr("class", "state-dropdown")
        .style("margin", "10px 0")
        .style("display", "flex")
        .style("align-items", "center")
        .style("gap", "10px");

    // Add label
    stateDropdown.append("label")
        .attr("for", "stateSelect")
        .style("font-weight", "bold")
        .text("Select State:");

    // Add dropdown
    const selectElement = stateDropdown.append("select")
        .attr("id", "stateSelect")
        .style("padding", "6px 12px")
        .style("font-size", "14px");

    // Populate options
    selectElement.selectAll("option")
        .data(["All", ...states])
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => d);

    // Attach change listener
    selectElement.on("change", function () {
        const selectedState = d3.select(this).property("value");
        console.log("State selected:", selectedState);
        drawGraph(selectedState);
    });


    function drawGraph(selectedState = "All") {
        svg.selectAll("*").remove();

        const filteredData = data
            .filter(d => d.Date.getFullYear() < 2025)
            .filter(d => {
                if (selectedState === "All") return true;
                return AORStateMap[d.AOR_Key] === selectedState;
            });

        const sortedData = Array.from(d3.group(filteredData, d => d.AOR_Key), ([key, values]) => {
            return {
                AOR: key,
                encounters: values.map(e => ({ Date: e.Date, Encounter_Count: e.Encounter_Count }))
            };
        });


        const xScale = d3.scaleTime()
            .domain(d3.extent(filteredData, d => d.Date))
            .range([0, innerWidth]);
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => d.Encounter_Count)])
            .range([innerHeight, 0]);

        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        svg.append("rect")
            .attr("x", xScale(new Date("2022-12-15")))
            .attr("y", 0)
            .attr("width", xScale(new Date("2023-01-01")))
            .attr("height", innerHeight)
            .attr("fill", "lightgray")
            .attr("opacity", 0.5);

        const xAxis = d3.axisBottom(xScale).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b"));
        const yAxis = d3.axisLeft(yScale).ticks(10);

        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${innerHeight})`)
            .call(xAxis);
        svg.append("g")
            .attr("class", "y-axis")
            .call(yAxis);

        svg.append("text")
            .attr("class", "x-axis-label")
            .attr("x", innerWidth / 2)
            .attr("y", innerHeight + margin.bottom)
            .attr("text-anchor", "middle")
            .text("Date");
        svg.append("text")
            .attr("class", "y-axis-label")
            .attr("x", -innerHeight / 2)
            .attr("y", -margin.left + 15)
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .text("Monthly Encounters");

        svg.append("text")
            .attr("class", "title")
            .attr("x", innerWidth / 2)
            .attr("y", -margin.top / 2)
            .attr("text-anchor", "middle")
            .style("font-size", "1.5em")
            .text(`Monthly Encounters${selectedState !== "All" ? ` in ${selectedState}` : " Across All AORs"}`);

        const lineGenerator = d3.line()
            .x(d => xScale(d.Date))
            .y(d => yScale(d.Encounter_Count));

        const lines = svg.selectAll(".line")
            .data(sortedData)
            .enter()
            .append("path")
            .attr("class", "line")
            .attr("id", d => `line-${d.AOR.replace(/\s+/g, '-')}`)
            .attr("d", d => lineGenerator(d.encounters))
            .attr("fill", "none")
            .attr("stroke", d => colorScale(d.AOR))
            .attr("stroke-width", 2)
            .style("opacity", 0.7)
            .on("mouseover", function (event, d) {
                highlightLine(d.AOR);
            })
            .on("mouseout", function () {
                resetLines();
            });

        // Create a function to highlight a specific line
        function highlightLine(aorKey) {
            const lineId = `line-${aorKey.replace(/\s+/g, '-')}`;
            svg.select(`#${lineId}`)
                .attr("stroke-width", 4)
                .style("opacity", 1)
                .style("filter", "url(#drop-shadow)");

            // Fade other lines
            svg.selectAll(".line").filter(`:not(#${lineId})`)
                .style("opacity", 0.2);
        }

        // Create a function to reset all lines
        function resetLines() {
            svg.selectAll(".line")
                .attr("stroke-width", 2)
                .style("opacity", 0.7)
                .style("filter", "none");
        }

        svg.selectAll(".dot")
            .data(filteredData)
            .enter()
            .append("circle")
            .attr("class", "dot")
            .attr("cx", d => xScale(d.Date))
            .attr("cy", d => yScale(d.Encounter_Count))
            .attr("r", 3)
            .attr("fill", d => colorScale(d.AOR_Key))
            .on("mouseover", function (event, d) {
                // Enlarge dot
                d3.select(this).attr("r", 5).attr("fill", "red");

                // Highlight corresponding line
                highlightLine(d.AOR_Key);

                const tooltip = svg.append("g")
                    .attr("class", "tooltip")
                    .attr("transform", `translate(${xScale(d.Date) + 10},${yScale(d.Encounter_Count) - 10})`);
                tooltip.append("rect")
                    .attr("width", 180)
                    .attr("height", 60)
                    .attr("fill", "white")
                    .attr("stroke", "black")
                    .attr("rx", 5)
                    .attr("ry", 5);
                tooltip.append("text")
                    .attr("x", 10)
                    .attr("y", 20)
                    .style("font-weight", "bold")
                    .style("text-wrap", "wrap")
                    .text(`AOR: ${d.AOR_Key}`);
                tooltip.append("text")
                    .attr("x", 10)
                    .attr("y", 35)
                    .text(`Date: ${d3.timeFormat("%Y-%m-%d")(d.Date)}`);
                tooltip.append("text")
                    .attr("x", 10)
                    .attr("y", 50)
                    .text(`Encounters: ${d.Encounter_Count}`);
            })
            .on("mouseout", function (d) {
                // Reset dot
                d3.select(this).attr("r", 3).attr("fill", d => colorScale(d.AOR_Key));

                // Reset lines
                resetLines();

                // Remove tooltip
                svg.selectAll(".tooltip").remove();
            });

        const monthlyAverages = d3.rollup(
            data.filter(d => d.Date.getFullYear() < 2025),
            v => d3.mean(v, d => d.Encounter_Count),
            d => d.Date.getFullYear(),  // First group by year
            d => d.Date.getMonth()      // Then by month
        );

        const averageData = [];
        monthlyAverages.forEach((yearData, year) => {
            yearData.forEach((average, month) => {
                averageData.push({
                    Date: new Date(year, month + 1, 1),
                    Average: average
                });
            });
        });

        averageData.sort((a, b) => a.Date - b.Date);

        svg.append("path")
            .datum(averageData)
            .attr("class", "average-line")
            .attr("fill", "none")
            .attr("stroke", "#333")  // Darker color for better visibility
            .attr("stroke-width", 2.5)
            .attr("stroke-dasharray", "5,5")
            .style("pointer-events", "none")
            .attr("d", d3.line()
                .x(d => xScale(d.Date))
                .y(d => yScale(d.Average))
            );

        // Add average label only if there's data points in view
        const visibleAverages = averageData.filter(d =>
            d.Date >= xScale.domain()[0] && d.Date <= xScale.domain()[1]
        );

        if (visibleAverages.length > 0) {
            svg.append("text")
                .attr("class", "average-label")
                .attr("x", innerWidth - 10)
                .attr("y", yScale(visibleAverages[visibleAverages.length - 1].Average) - 10)
                .attr("text-anchor", "end")
                .style("fill", "#333")
                .style("font-size", "12px")
                .style("font-weight", "bold")
                .style("pointer-events", "none")
                .text("Monthly Average (All AORs)"); // Updated label to clarify scope
        }
        svg.selectAll(".average-point")
            .data(averageData)
            .enter()
            .append("circle")
            .attr("class", "average-point")
            .attr("cx", d => xScale(d.Date))
            .attr("cy", d => yScale(d.Average))
            .attr("r", 3)
            .attr("fill", "steelblue");


        const legendHeight = Math.min(height, sortedData.length * 25);
        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${innerWidth + 10}, ${-50})`);
        const legendScroll = legend.append("foreignObject")
            .attr("width", 160)
            .attr("height", legendHeight)
            .append("xhtml:div")
            .style("height", `${legendHeight}px`)
            .style("overflow-y", "auto")
        const legendItems = legendScroll.selectAll(".legend-item")
            .data(sortedData)
            .enter()
            .append("div")
            .style("display", "flex")
            .style("align-items", "center")
            .style("margin-bottom", "5px");
        legendItems.append("div")
            .style("width", "18px")
            .style("height", "18px")
            .style("margin-right", "5px")
            .style("background-color", d => colorScale(d.AOR));
        legendItems.append("div")
            .text(d => d.AOR)
            .style("font-size", "12px");
    }
    drawGraph();


    //Grouped bar chart: Encounter vs. seizure trends for top AORs
    //Compare regional activity - helps reveal which areas experience both high migrant crossings and drug seizures.
    //chart 2: Encounters vs. seizures by AOR
    //going to be encounters on the bottom and seizures on top split in half with half being the number of seizures and half being the weight of the seizures


    innerWidth2 = width - margin.left - margin.right + 90;
    // Process data
    const sumData = d3.rollup(data.filter(d => d.Date.getFullYear() < 2025),
        v => ({
            Encounter_Count: d3.sum(v, d => d.Encounter_Count),
            Count_of_Event: d3.sum(v, d => d.Count_of_Event),
            Sum_Qty_lbs: d3.sum(v, d => d.Sum_Qty_lbs)
        }),
        d => d.AOR_Key
    );

    // Get top 10 AORs by encounters
    const topAORs = Array.from(sumData, ([key, value]) => ({
        AOR: key,
        ...value,
        State: AORStateMap[key] || "Unknown"
    }))
        .sort((a, b) => b.Encounter_Count - a.Encounter_Count)
        .slice(0, 10);

    // Set up chart
    const svg2 = d3.select("#graph2").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append('g')
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Create scales
    const xScale2 = d3.scaleBand()
        .domain(topAORs.map(d => d.AOR))
        .range([0, innerWidth2])
        .padding(0.2);

    const maxEncounters = d3.max(topAORs, d => d.Encounter_Count);
    const maxSeizures = d3.max(topAORs, d => d.Count_of_Event);
    const maxWeight = d3.max(topAORs, d => d.Sum_Qty_lbs);

    const yScale2 = d3.scaleLinear()
        .domain([0, maxEncounters * 1.1])
        .range([innerHeight, 0]);

    const yScale2Seizures = d3.scaleLinear()
        .domain([0, maxWeight * 1.1])
        .range([innerHeight, 0]);

    const colorScale2 = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(topAORs.map(d => d.AOR_Key));

    // Create axes
    const xAxis2 = d3.axisBottom(xScale2)
        .tickFormat(d => d.length > 12 ? d.substring(0, 10) + "..." : d);

    const yAxis2 = d3.axisLeft(yScale2).ticks(5);
    const yAxis2Seizures = d3.axisRight(yScale2Seizures).ticks(5);

    // Draw axes
    svg2.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${innerHeight})`)
        .call(xAxis2)
        .selectAll("text")
        .style("font-size", "10px")
        .style("text-anchor", "center");

    svg2.append("g")
        .attr("class", "y-axis")
        .call(yAxis2);

    svg2.append("g")
        .attr("class", "y-axis seizures-axis")
        .attr("transform", `translate(${innerWidth2}, 0)`)
        .call(yAxis2Seizures);

    // Draw bars
    const barGroups = svg2.selectAll(".bar-group")
        .data(topAORs)
        .enter()
        .append("g")
        .attr("class", "bar-group")
        .attr("transform", d => `translate(${xScale2(d.AOR)}, 0)`);

    // Encounters bar (full width)
    barGroups.append("rect")
        .attr("class", "bar-encounters")
        .attr("width", xScale2.bandwidth())
        .attr("y", d => yScale2(d.Encounter_Count))
        .attr("height", d => innerHeight - yScale2(d.Encounter_Count))
        .attr("fill", d => colorScale2(d.AOR))
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .style("opacity", 0.75)
        .on("mouseover", function (event, d) {
            const tooltip = svg2.append("g")
                .attr("class", "tooltip")
                .attr("transform", `translate(${innerWidth2 - 250},${10})`);
            tooltip.append("rect")
                .attr("width", 230)
                .attr("height", 105)
                .attr("fill", "white")
                .attr("stroke", "black")
                .attr("rx", 5)
                .attr("ry", 5);
            tooltip.append("text")
                .attr("x", 10)
                .attr("y", 20)
                .style("font-weight", "bold")
                .style("text-wrap", "wrap")
                .text(`${d.AOR}`);
            tooltip.append("text")
                .attr("x", 10)
                .attr("y", 35)
                .text(`Encounters: ${d3.format(",")(d.Encounter_Count)}`);
            tooltip.append("text")
                .attr("x", 10)
                .attr("y", 50)
                .text(`Seizures Count: ${d3.format(",")(d.Count_of_Event)}`);
            tooltip.append("text")
                .attr("x", 10)
                .attr("y", 65)
                .text(`Seizures Weight: ${d3.format(",.2f")(d.Sum_Qty_lbs)}`);
            tooltip.append("text")
                .attr("x", 10)
                .attr("y", 80)
                .text(`Seizures per Encounter: ${d.Count_of_Event > 0 ? d3.format(",.3f")(d.Count_of_Event / d.Encounter_Count) : 0}`);
            tooltip.append("text")
                .attr("x", 10)
                .attr("y", 95)
                .text(`Avg lbs per Seizure: ${d.Count_of_Event > 0 ? d3.format(",.2f")(d.Sum_Qty_lbs / d.Count_of_Event) : 0}`);
        })
        .on("mouseout", function () {
            svg2.selectAll(".tooltip").remove();
        });

    // Seizures count bar (left half)
    barGroups.append("rect")
        .attr("class", "bar-seizures-count")
        .attr("width", xScale2.bandwidth() / 2)
        .attr("y", d => yScale2(d.Count_of_Event))
        .attr("height", d => innerHeight - yScale2(d.Count_of_Event))
        .attr("fill", d => d3.color(colorScale2(d.AOR)).darker(0.5))
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .style("opacity", 0.9)
        .on("mouseover", function (event, d) {
            const tooltip = svg2.append("g")
                .attr("class", "tooltip")
                .attr("transform", `translate(${innerWidth2 - 250},${10})`);
            tooltip.append("rect")
                .attr("width", 230)
                .attr("height", 105)
                .attr("fill", "white")
                .attr("stroke", "black")
                .attr("rx", 5)
                .attr("ry", 5);
            tooltip.append("text")
                .attr("x", 10)
                .attr("y", 20)
                .style("font-weight", "bold")
                .style("text-wrap", "wrap")
                .text(`${d.AOR}`);
            tooltip.append("text")
                .attr("x", 10)
                .attr("y", 35)
                .text(`Encounters: ${d3.format(",")(d.Encounter_Count)}`);
            tooltip.append("text")
                .attr("x", 10)
                .attr("y", 50)
                .text(`Seizures Count: ${d3.format(",")(d.Count_of_Event)}`);
            tooltip.append("text")
                .attr("x", 10)
                .attr("y", 65)
                .text(`Seizures Weight: ${d3.format(",.2f")(d.Sum_Qty_lbs)}`);
            tooltip.append("text")
                .attr("x", 10)
                .attr("y", 80)
                .text(`Seizures per Encounter: ${d.Count_of_Event > 0 ? d3.format(",.3f")(d.Count_of_Event / d.Encounter_Count) : 0}`);
            tooltip.append("text")
                .attr("x", 10)
                .attr("y", 95)
                .text(`Avg lbs per Seizure: ${d.Count_of_Event > 0 ? d3.format(",.2f")(d.Sum_Qty_lbs / d.Count_of_Event) : 0}`);
        })
        .on("mouseout", function () {
            svg2.selectAll(".tooltip").remove();
        });

    // Seizures weight bar (right half)
    barGroups.append("rect")
        .attr("class", "bar-seizures-weight")
        .attr("x", xScale2.bandwidth() / 2)
        .attr("width", xScale2.bandwidth() / 2)
        .attr("y", d => yScale2Seizures(d.Sum_Qty_lbs))
        .attr("height", d => innerHeight - yScale2Seizures(d.Sum_Qty_lbs))
        .attr("fill", d => d3.color(colorScale2(d.AOR)).brighter(0.5))
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .style("opacity", 0.8)
        .on("mouseover", function (event, d) {
            const tooltip = svg2.append("g")
                .attr("class", "tooltip")
                .attr("transform", `translate(${innerWidth2 - 250},${10})`);
            tooltip.append("rect")
                .attr("width", 230)
                .attr("height", 105)
                .attr("fill", "white")
                .attr("stroke", "black")
                .attr("rx", 5)
                .attr("ry", 5);
            tooltip.append("text")
                .attr("x", 10)
                .attr("y", 20)
                .style("font-weight", "bold")
                .style("text-wrap", "wrap")
                .text(`${d.AOR}`);
            tooltip.append("text")
                .attr("x", 10)
                .attr("y", 35)
                .text(`Encounters: ${d3.format(",")(d.Encounter_Count)}`);
            tooltip.append("text")
                .attr("x", 10)
                .attr("y", 50)
                .text(`Seizures Count: ${d3.format(",")(d.Count_of_Event)}`);
            tooltip.append("text")
                .attr("x", 10)
                .attr("y", 65)
                .text(`Seizures Weight: ${d3.format(",.2f")(d.Sum_Qty_lbs)}`);
            tooltip.append("text")
                .attr("x", 10)
                .attr("y", 80)
                .text(`Seizures per Encounter: ${d.Count_of_Event > 0 ? d3.format(",.3f")(d.Count_of_Event / d.Encounter_Count) : 0}`);
            tooltip.append("text")
                .attr("x", 10)
                .attr("y", 95)
                .text(`Avg lbs per Seizure: ${d.Count_of_Event > 0 ? d3.format(",.2f")(d.Sum_Qty_lbs / d.Count_of_Event) : 0}`);
        })
        .on("mouseout", function () {
            svg2.selectAll(".tooltip").remove();
        });

    // Add value labels
    barGroups.append("text")
        .attr("class", "bar-label encounters")
        .attr("x", xScale2.bandwidth() / 2)
        .attr("y", d => yScale2(d.Encounter_Count) - 5)
        .attr("text-anchor", "middle")
        .text(d => d3.format(",")(d.Encounter_Count));

    barGroups.append("text")
        .attr("class", "bar-label seizures-count")
        .attr("x", xScale2.bandwidth() / 4)
        .attr("y", d => yScale2(d.Count_of_Event) - 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "0.8em")
        .text(d => d3.format(",")(d.Count_of_Event));

    // Add axis labels
    svg2.append("text")
        .attr("class", "axis-label")
        .attr("x", innerWidth2 / 2)
        .attr("y", innerHeight + margin.bottom)
        .attr("text-anchor", "middle")
        .text("AOR");

    svg2.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", -margin.left + 15)
        .attr("text-anchor", "middle")
        .text("Encounters & Seizure Count");

    svg2.append("text")
        .attr("class", "axis-label seizures")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", innerWidth2 + 70)
        .attr("text-anchor", "middle")
        .text("Seizure Weight (lbs)");

    // Add title
    svg2.append("text")
        .attr("class", "title")
        .attr("x", innerWidth2 / 2)
        .attr("y", -margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "1.5em")
        .text("Top 10 AORs by Encounters and Seizures");
});
