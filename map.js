//load CSV and map, then draw arcs
let statePaths; // to reference and manipulate state paths

Promise.all([
  d3.csv("https://web.ics.purdue.edu/~fannin/CGT370/FinalProject/nationwide-encounters-fy22-fy25-feb-aor.csv"),
  d3.json("https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json"),
  d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
]).then(([data, usStates, world]) => {
  console.log("CSV Headers:", Object.keys(data[0]));

  const width = 1200, height = 600;
  const svg = d3.select("#map-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height)

  svg.append("text")
    .attr("x", width / 1.75)
    .attr("y", 550)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("fill", "#555")
    .style("font-weight", "bold")
    .text("Hover over a country to explore migration flow");


  const g = svg.append("g");

  const projection = d3.geoMercator()
    .scale(150)
    .translate([width / 2, height / 1.4])

  const path = d3.geoPath().projection(projection);

  const originCoords = {
    "MEXICO": [-102.5528, 23.6345],
    "GUATEMALA": [-90.2308, 15.7835],
    "HONDURAS": [-86.2419, 15.1999],
    "EL SALVADOR": [-88.8965, 13.7942],
    "VENEZUELA": [-66.5897, 6.4238],
    "COLOMBIA": [-74.2973, 4.5709],
    "CHINA, PEOPLES REPUBLIC OF": [104.1954, 35.8617],
    "HAITI": [-72.2852, 18.9712],
    "BRAZIL": [-51.9253, -14.2350],
    "INDIA": [78.9629, 20.5937],
    "NICARAGUA": [-85.2072, 12.8654],
    "CUBA": [-77.7812, 21.5218],
    "ECUADOR": [-78.1834, -1.8312],
    "PERU": [-75.0152, -9.1899],
    "PHILIPPINES": [121.7740, 12.8797],
    "ROMANIA": [24.9668, 45.9432],
    "RUSSIA": [105.3188, 61.5240],
    "TURKEY": [35.2433, 38.9637],
    "UKRAINE": [31.1656, 48.3794],
    "MYANMAR (BURMA)": [95.9560, 21.9162],
    "CANADA": [-106.3468, 56.1304],
    "CHILE": [-71.542969, -35.675147],
    "IRAN": [53.6880, 32.4279]
  };

  const aorCoords = {
    "MICHIGAN": [-84.5361, 44.3148],
    "WASHINGTON": [-120.7401, 47.7511],
    "ARIZONA": [-111.0937, 34.0489],
    "GEORGIA": [-82.9001, 32.1656],
    "NEW YORK": [-74.0059, 40.7128],
    "MONTANA": [-110.3626, 46.8797],
    "OREGON": [-120.5542, 43.8041],
    "PUERTO RICO": [-66.5901, 18.2208],
    "MASSACHUSETTS": [-71.3824, 42.4072],
    "FLORIDA": [-81.5158, 27.6648],
    "TEXAS": [-99.9018, 31.9686],
    "CALIFORNIA": [-119.4179, 36.7783],
    "ILLINOIS": [-89.3985, 40.6331],
    "LOUISIANA": [-91.9623, 30.9843],
    "INTERNATIONAL": [0, 0],
    "MARYLAND": [-76.6413, 39.0458],
    "NORTH DAKOTA": [-101.0020, 47.5515],
    "VERMONT": [-72.5778, 44.5588],
    "MAINE": [-69.4455, 45.2538]
  };

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

  const countryAliasMap = {
    "CHINA, PEOPLES REPUBLIC OF": "CHINA"
  };

  function normalizeCountry(name) {
    return countryAliasMap[name] || name;
  }

  const validCountrySet = new Set();
  const validStateSet = new Set();

  const flows = d3.rollup(
    data.filter(d => {
      const area = d["Area of Responsibility"]?.trim().toUpperCase();
      const country = normalizeCountry(d["Citizenship"]?.trim().toUpperCase());
      if (+d["Fiscal Year"] < 2025 && aorStateMap[area]) {
        validCountrySet.add(country);
        validStateSet.add(aorStateMap[area]);
        return true;
      }
      return false;
    }),
    v => d3.sum(v, d => +d["Encounter Count"]),
    d => normalizeCountry(d["Citizenship"]?.trim().toUpperCase()),
    d => d["Area of Responsibility"]?.trim().toUpperCase()
  );

  const geoCountryCentroids = {};
  world.features.forEach(f => {
    const name = f.properties.name?.toUpperCase();
    if (name && name !== "UNITED STATES") {
      geoCountryCentroids[name] = path.centroid(f);
    }
  });

  const mapLayer = g.append("g")
    .selectAll("path")
    .data(world.features.filter(f => f.properties.name !== "Antarctica"))
    .enter()
    .append("path")
    .attr("fill", d => validCountrySet.has(normalizeCountry(d.properties.name?.toUpperCase())) ? "#508f67" : "#e5e7eb") //world map colors for active and inactive
    .attr("stroke", "#047857")
    .attr("d", path)
    .style("cursor", "pointer");

  statePaths = g.append("g")
    .selectAll("path.state")
    .data(usStates.features)
    .enter()
    .append("path")

    .attr("fill", d => validStateSet.has(d.properties.name?.toUpperCase()) ? "#508f67" : "none")
    .attr("stroke", "#444")
    .attr("stroke-width", 0.5)
    .attr("d", path)
    .style("cursor", "pointer");

  function getOriginCoord(citizenship) {
    const clean = normalizeCountry(citizenship?.trim().toUpperCase());
    if (geoCountryCentroids[clean]) {
      return projection.invert(geoCountryCentroids[clean]);
    }
    const candidates = Object.entries(geoCountryCentroids);
    const rand = candidates[Math.floor(Math.random() * candidates.length)];
    return projection.invert(rand[1]);
  }

  const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
    .domain([...new Set(Array.from(flows.keys()))]);

  const arcData = [];
  flows.forEach((aorMap, origin) => {
    aorMap.forEach((count, aor) => {
      const state = aorStateMap[aor];
      const originCoord = getOriginCoord(origin);
      if (originCoord) {
        arcData.push({ origin, aor, state, count, originCoord });
      }
    });
  });

  const arcWidth = d3.scaleLinear()
    .domain(d3.extent(arcData, d => d.count))
    .range([1, 6]);

  const arcsLayer = g.append("g")
    .selectAll("path.arc")
    .data(arcData)
    .enter()
    .append("path")
    .attr("class", "arc")
    .attr("fill", "none")
    .attr("stroke", d => colorScale(d.origin))
    .attr("stroke-opacity", 0.7)
    .attr("stroke-width", d => arcWidth(d.count))
    .attr("d", d => {
      const [sx, sy] = projection(d.originCoord);
      const [tx, ty] = projection(aorCoords[d.state]);
      const mx = (sx + tx) / 2;
      const my = (sy + ty) / 2 - 40;
      return `M${sx},${sy} Q${mx},${my} ${tx},${ty}`;
    })
    .style("visibility", "hidden");

  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("text-align", "left")
    .style("padding", "6px")
    .style("font", "12px sans-serif")
    .style("background", "rgba(255,255,255,0.9)")
    .style("border", "1px solid #999")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("display", "none");

  const tableContainer = d3.select("body").append("div")
    .attr("id", "table-container")
    .style("margin", "20px")
    .style("max-width", "800px")
    .style("overflow-x", "auto")
    .style("font", "14px sans-serif");

  mapLayer.on("mouseover", function (event, d) {
    const rawName = d.properties.name?.toUpperCase();
    const countryName = normalizeCountry(rawName);
    const otherFlows = flows.get("OTHER");
    const destinationStates = new Set();
    const [sx, sy] = geoCountryCentroids[countryName] || projection.invert([event.pageX, event.pageY]);

    // Clear previous arcs and state highlights
    arcsLayer.style("visibility", "hidden");
    g.selectAll(".temp-arc").remove();
    g.selectAll(".state")
      .attr("fill", d => validStateSet.has(d.properties.name?.toUpperCase()) ? "#99ccff" : "none");

    let total = 0;

    if (flows.has(countryName)) {
      const filteredArcs = arcData.filter(d => d.origin === countryName);
      total = d3.sum(filteredArcs, d => d.count);

      filteredArcs.forEach(d => {
        destinationStates.add(d.state);

        const [tx, ty] = projection(aorCoords[d.state]);
        const [ox, oy] = projection(d.originCoord);
        const mx = (ox + tx) / 2;
        const my = (oy + ty) / 2 - 40;

        const pathString = `M${ox},${oy} Q${mx},${my} ${tx},${ty}`;
        const arcPath = g.append("path")
          .attr("class", "temp-arc")
          .attr("fill", "none")
          .attr("stroke", d => colorScale(countryName))
          .attr("stroke-opacity", 0.6)
          .attr("stroke-width", arcWidth(d.count))
          .attr("d", pathString);

        const totalLength = arcPath.node().getTotalLength();
        arcPath
          .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
          .attr("stroke-dashoffset", totalLength)
          .transition()
          .duration(800)
          .ease(d3.easeLinear)
          .attr("stroke-dashoffset", 0);
      });
    } else if (otherFlows) {
      total = d3.sum(Array.from(otherFlows.values()));

      Object.entries(otherFlows).forEach(([aor, count]) => {
        const state = aorStateMap[aor];
        destinationStates.add(state);

        const [tx, ty] = projection(aorCoords[state]);
        const mx = (sx + tx) / 2;
        const my = (sy + ty) / 2 - 40;

        const pathString = `M${sx},${sy} Q${mx},${my} ${tx},${ty}`;
        const arcPath = g.append("path")
          .attr("class", "temp-arc")
          .attr("fill", "none")
          .attr("stroke", d => colorScale(countryName) || "#999")
          .attr("stroke-opacity", 0.6)
          .attr("stroke-width", arcWidth(count))
          .attr("d", pathString);

        const totalLength = arcPath.node().getTotalLength();
        arcPath
          .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
          .attr("stroke-dashoffset", totalLength)
          .transition()
          .duration(800)
          .ease(d3.easeLinear)
          .attr("stroke-dashoffset", 0);
      });
    }

    //highlight destination states
    statePaths.attr("fill", d => {
      const stateName = d.properties.name?.toUpperCase();
      if (destinationStates.has(stateName)) {
        return colorScale(countryName) || "#2563eb";  // fallback if color undefined
      }
      return validStateSet.has(stateName) ? "#a7f3d0" : "none";
    });


    //tooltip
    tooltip.style("display", null)
      .style("left", `${event.pageX + 10}px`)
      .style("top", `${event.pageY - 28}px`)
      .html(`
        <strong>Country:</strong> ${flows.has(countryName) ? countryName : "OTHER"}<br>
        <strong>Encounters:</strong> ${d3.format(",")(total)}<br>
        <em>Click for detailed graphs</em>
      `);

  });


  mapLayer.on("mouseout", function () {
    arcsLayer.style("visibility", "hidden");
    g.selectAll(".temp-arc").remove();
    tooltip.style("display", "none");

    //reset state fill
    statePaths.attr("fill", d =>
      validStateSet.has(d.properties.name?.toUpperCase()) ? "#a7f3d0" : "none"
    );
  });

  mapLayer.on("click", function (event, d) {
    const countryName = normalizeCountry(d.properties.name?.toUpperCase());

    //filter dataset for this country
    const countryData = data.filter(row =>
      normalizeCountry(row["Citizenship"]?.trim().toUpperCase()) === countryName &&
      +row["Fiscal Year"] < 2025 &&
      aorStateMap[row["Area of Responsibility"]?.trim().toUpperCase()]
    );

    d3.select("#demographic-chart").selectAll("*").remove();
    d3.select("#destination-chart").selectAll("*").remove();

    if (countryData.length === 0) return;

    const years = Array.from(new Set(countryData.map(d => +d["Fiscal Year"]))).sort();
    const demographics = Array.from(new Set(countryData.map(d => d["Demographic"]))).sort();

    const nested = d3.rollups(
      countryData,
      v => d3.rollup(v, vv => d3.sum(vv, d => +d["Encounter Count"]), d => +d["Fiscal Year"]),
      d => d["Demographic"]
    );

    const formatted = nested.map(([demo, yearMap]) => {
      const obj = { demographic: demo };
      years.forEach(y => obj[y] = yearMap.get(y) || 0);
      return obj;
    });

    //grouped Bar: Demographics
    const margin = { top: 50, right: 30, bottom: 50, left: 60 };
    const width = 700, height = 400;

    const svg = d3.select("#demographic-chart")
      .append("svg")
      .attr("id", "demographic-chart")
      .attr("width", width)
      .attr("height", height)
      .style("margin", "30px");

    const x0 = d3.scaleBand().domain(demographics).range([margin.left, width - margin.right]).paddingInner(0.2);
    const x1 = d3.scaleBand().domain(years).range([0, x0.bandwidth()]).padding(0.1);
    const y = d3.scaleLinear().domain([0, d3.max(formatted, d => d3.max(years, y => d[y]))]).nice().range([height - margin.bottom, margin.top]);
    const color = d3.scaleOrdinal().domain(years).range(d3.schemeCategory10);

    svg.append("g")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(x0));

    svg.append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y));

    svg.append("g")
      .selectAll("g")
      .data(formatted)
      .enter()
      .append("g")
      .attr("transform", d => `translate(${x0(d.demographic)}, 0)`)
      .selectAll("rect")
      .data(d => years.map(yVal => ({ year: yVal, value: d[yVal] })))
      .enter()
      .append("rect")
      .attr("x", d => x1(d.year))
      .attr("y", y(0))
      .attr("width", x1.bandwidth())
      .attr("height", 0)
      .attr("fill", d => color(d.year))
      .transition()
      .duration(800)
      .attr("y", d => y(d.value))
      .attr("height", d => y(0) - y(d.value));

    svg.append("g")
      .selectAll("g")
      .data(formatted)
      .enter()
      .append("g")
      .attr("transform", d => `translate(${x0(d.demographic)}, 0)`)
      .selectAll("text")
      .data(d => years.map(yVal => ({ year: yVal, value: d[yVal] })))
      .enter()
      .append("text")
      .attr("x", d => x1(d.year) + x1.bandwidth() / 2)
      .attr("y", d => y(d.value) - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "11px")
      .style("fill", "#333")
      .text(d => d.value > 0 ? d3.format(",")(d.value) : "");

    svg.append("text")
      .attr("x", width / 2)
      .attr("y", margin.top - 25)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text(`Encountered Demographics from ${countryName}`);

    const legend = svg.append("g")
      .attr("transform", `translate(${width - margin.right - 100}, ${margin.top})`);

    years.forEach((year, i) => {
      const row = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
      row.append("rect").attr("width", 12).attr("height", 12).attr("fill", color(year));
      row.append("text").attr("x", 16).attr("y", 10).style("font-size", "12px").text(year);
    });

    //DESTINATION BAR CHART
    const destWidth = 500;
    const destHeight = 400;

    // summarize destination counts
    const destSummary = d3.rollups(
      countryData,
      v => d3.sum(v, d => +d["Encounter Count"]),
      d => aorStateMap[d["Area of Responsibility"]?.trim().toUpperCase()] || "Unknown"
    ).map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count);

    // clear and create destination SVG
    const svg2 = d3.select("#destination-chart")
      .append("svg")
      .attr("width", destWidth)
      .attr("height", destHeight)
      .style("margin", "30px");

    // scales for vertical layout
    const yDest = d3.scaleBand()
      .domain(destSummary.map(d => d.state))
      .range([50, destHeight - 40])
      .padding(0.2);

    const xDest = d3.scaleLinear()
      .domain([0, d3.max(destSummary, d => d.count)])
      .nice()
      .range([80, destWidth - 20]);

    // axes
    svg2.append("g")
      .attr("transform", `translate(0, ${destHeight - 40})`)
      .call(d3.axisBottom(xDest).ticks(5));

    svg2.append("g")
      .attr("transform", `translate(80, 0)`)
      .call(d3.axisLeft(yDest));

    //bars
    svg2.selectAll(".bar")
      .data(destSummary)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("y", d => yDest(d.state))
      .attr("x", xDest(0))
      .attr("height", yDest.bandwidth())
      .attr("width", 0)
      .attr("fill", d => color(d.year))
      .transition()
      .duration(800)
      .attr("width", d => xDest(d.count) - xDest(0));

    // value labels
    svg2.selectAll(".label")
      .data(destSummary)
      .enter()
      .append("text")
      .attr("x", d => xDest(d.count) + 4)
      .attr("y", d => yDest(d.state) + yDest.bandwidth() / 2)
      .attr("alignment-baseline", "middle")
      .style("font-size", "11px")
      .text(d => d.count > 0 ? d3.format(",")(d.count) : "");

    // title
    svg2.append("text")
      .attr("x", destWidth / 2)
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text(`Destination States and Encounter Total from ${countryName}`);

  });

  const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", ({ transform }) => {
      g.attr("transform", transform);
    });

  svg.call(zoom);

  d3.select("#map-wrapper")
    .append("button")
    .text("Reset Zoom")
    .attr("id", "reset-zoom-btn")
    .style("position", "absolute")
    .style("top", "10px")
    .style("right", "10px")
    .style("padding", "6px 12px")
    .style("z-index", 10)
    .on("click", () => {
      svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
    });

});

