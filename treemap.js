const aorStateMap = {
  "ATLANTA FIELD OFFICE": "GEORGIA", 
  "BALTIMORE FIELD OFFICE": "MARYLAND",
  "BIG BEND SECTOR": "TEXAS", 
  "BLAINE SECTOR": "WASHINGTON",
  "BOSTON FIELD OFFICE": "MASSACHUSETTS", 
  "BUFFALO FIELD OFFICE": "NEW YORK",
  "BUFFALO SECTOR": "NEW YORK", 
  "CHICAGO FIELD OFFICE": "ILLINOIS",
  "DEL RIO SECTOR": "TEXAS", 
  "DETROIT FIELD OFFICE": "MICHIGAN",
  "DETROIT SECTOR": "MICHIGAN", 
  "EL CENTRO SECTOR": "CALIFORNIA",
  "EL PASO FIELD OFFICE": "TEXAS", 
  "EL PASO SECTOR": "TEXAS",
  "GRAND FORKS SECTOR": "NORTH DAKOTA",
   "HAVRE SECTOR": "MONTANA",
  "HOULTON SECTOR": "MAINE", 
  "HOUSTON FIELD OFFICE": "TEXAS",
  "LAREDO FIELD OFFICE": "TEXAS", 
  "LAREDO SECTOR": "TEXAS",
  "LOS ANGELES FIELD OFFICE": "CALIFORNIA",
   "MIAMI FIELD OFFICE": "FLORIDA",
  "MIAMI SECTOR": "FLORIDA", 
  "NEW ORLEANS FIELD OFFICE": "LOUISIANA",
  "NEW ORLEANS SECTOR": "LOUISIANA", 
  "NEW YORK FIELD OFFICE": "NEW YORK",
  "PORTLAND FIELD OFFICE": "OREGON", 
  "RAMEY SECTOR": "PUERTO RICO",
  "RIO GRANDE VALLEY SECTOR": "TEXAS",
   "SAN DIEGO FIELD OFFICE": "CALIFORNIA",
  "SAN DIEGO SECTOR": "CALIFORNIA", 
  "SAN FRANCISCO FIELD OFFICE": "CALIFORNIA",
  "SAN JUAN FIELD OFFICE": "PUERTO RICO", 
  "SEATTLE FIELD OFFICE": "WASHINGTON",
  "SPOKANE SECTOR": "WASHINGTON", 
  "SWANTON SECTOR": "VERMONT",
  "TAMPA FIELD OFFICE": "FLORIDA", 
  "TUCSON FIELD OFFICE": "ARIZONA",
  "TUCSON SECTOR": "ARIZONA", 
  "YUMA SECTOR": "ARIZONA"
};

d3.csv("https://web.ics.purdue.edu/~fannin/CGT370/FinalProject/nationwide-drugs-fy22-fy25-feb.csv").then(data => {
  data.forEach(d => {
    d["Sum Qty (lbs)"] = +d["Sum Qty (lbs)"];
    const aor = d["Area of Responsibility"]?.trim().toUpperCase();
    d.State = aorStateMap[aor] || "Unknown";
  });

  const nested = d3.groups(
    data.filter(d => d.State !== "Unknown" && d["Sum Qty (lbs)"] > 0),
    d => d.State,
    d => d["Drug Type"]
  ).map(([state, drugs]) => ({
    name: state,
    children: drugs.map(([drug, entries]) => ({
      name: drug,
      value: d3.sum(entries, d => d["Sum Qty (lbs)"])
    }))
  }));

  const root = d3.hierarchy({ name: "root", children: nested }).sum(d => d.value);
  const width = 1000;
  const height = 600;
  const color = d3.scaleOrdinal(d3.schemeCategory10);
  const treemapLayout = d3.treemap().size([width, height]).padding(2);

  const svg = d3.select("#graph3").append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  //tooltip
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("padding", "8px")
    .style("background", "#333")
    .style("color", "#fff")
    .style("border-radius", "5px")
    .style("font-size", "12px")
    .style("pointer-events", "none")
    .style("display", "none")
    .text("Click a state to zoom in. Click a drug to return.");

  svg.on("mousemove", (event) => {
    tooltip.style("display", "block")
      .style("left", `${event.pageX + 10}px`)
      .style("top", `${event.pageY - 20}px`);
  }).on("mouseleave", () => {
    tooltip.style("display", "none");
  });

  render(root);

  function render(focusNode) {
    treemapLayout(root); // Layout always from full root
    const nodes = focusNode.children || [];
    const t = svg.transition().duration(750);

    svg.selectAll("*").remove();

    const group = svg.selectAll("g")
      .data(nodes, d => d.data.name)
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.x0},${d.y0})`);

    group.append("rect")
      .attr("fill", d => color(d.data.name))
      .attr("stroke", "#fff")
      .transition(t)
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0);

    group.append("title")
      .text(d => `${d.data.name}\n${d3.format(",.2f")(d.value)} lbs`);

    group.append("text")
      .attr("x", 4)
      .attr("y", 14)
      .style("font-size", "11px")
      .style("fill", "#fff")
      .style("pointer-events", "none")
      .selectAll("tspan")
      .data(d => {
        const name = d.data.name;
        const value = d3.format(",.2f")(d.value);
        return d.depth === 2 ? [name, `${value} lbs`] : [name]; // drug level
      })
      .enter()
      .append("tspan")
      .attr("x", 4)
      .attr("dy", (d, i) => `${i * 1.2}em`)
      .text(d => d);


    group.on("click", (event, d) => {
      if (d.children) {
        render(d);  // Zoom in
      } else {
        render(root);  // Reset
      }
    });
  }
});
