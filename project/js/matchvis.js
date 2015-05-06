MatchVis = function(_parentElement, _data, _matchElement){
    this.parentElement = _parentElement;
    this.matchElement = _matchElement
    this.data = _data;
    this.displayData = [];
    this.filter = {
        wave: null
    };

    this.w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
    this.h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
    this.margin = {top: 50, right: 30, bottom: 100, left: 80},
    this.width = this.w*.25 - this.margin.left - this.margin.right,
    this.height = 550 - this.margin.top - this.margin.bottom;

    this.initVis();

}


/**
 * Method that sets up the SVG and the variables
 */
MatchVis.prototype.initVis = function(){

    var that = this;
 
    this.svg = this.parentElement.append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    this.x = d3.scale.linear()
      .range([0, this.width]);

    this.y0 = d3.scale.ordinal()
    	.rangeRoundBands([0, this.height], .25);

    this.y1 = d3.scale.ordinal();

    this.xAxis = d3.svg.axis()
      .scale(this.x)
      .orient("bottom");

    this.yAxis = d3.svg.axis()
      .scale(this.y0)
      .orient("left");

    this.svg.append("g")
      .attr("class", "x_axis")
      .attr("transform", "translate(0," + this.height + ")");

    this.svg.append("g")
        .attr("class", "y_axis")
        .attr("transform", "translate(0,0)");

    // filter, aggregate, modify data
    this.wrangleData(null);

    // call the update method
    this.updateVis();
}


/**
 * Method to wrangle the data. In this case it takes an options object
 * @param _filterFunction - a function that filters data or "null" if none
 */
MatchVis.prototype.wrangleData= function(_filterFunction){

    // displayData should hold the data which is visualized
    this.displayData = this.filterAndAggregate(_filterFunction);

}

/**
 * the drawing function - should use the D3 selection, enter, exit
 */
MatchVis.prototype.updateVis = function(){

    var that = this;

    var headers = d3.keys(this.displayData[0]).filter(function(key) { return key !== "match"; });

    var categories = ["Women", "Men"]

    var color = d3.scale.ordinal()
        .domain(headers)
        .range(["crimson", "midnightblue"]);
    
    this.displayData.forEach(function(d) {
      d.count = headers.map(function(name) { return {name: name, value: +d[name]}; });
    }); 

    console.log(this.displayData)

    var xmax = d3.max(this.displayData, function(d) { return d3.max(d.count, function(c) { return c.value; }); })

    this.x.domain([0, xmax]);

    this.y0.domain(this.displayData.map(function(d) { return d.match; }));
    this.y1.domain(headers).rangeRoundBands([0, this.y0.rangeBand()]);

    var match = this.svg.selectAll(".match")
                       .data(this.displayData);

    var match_enter = match.enter().append("g");

    match.attr("class", "match")
         .attr("transform", function(d) { return "translate(0," + that.y0(d.match) + ")"; });

    match.exit().remove();

    var text = match.selectAll(".text")
        .data(function(d) { return d.count; });

    var text_enter = text.enter()
        .append("text")
        .attr("class", "text");

    text.exit().remove();

    var bar = match.selectAll(".bar")
        .data(function(d) { return d.count; });

    var bar_enter = bar.enter()
        .append("rect")
        .attr("class", "bar")
        .style("stroke", function(d) {return color(d.name)})
        .style("stroke-width", 2)
        .style("stroke-opacity", 1);

    bar.attr("height", this.y1.rangeBand())
        .attr("y", function(d) { return that.y1(d.name); })
        .style("fill", function(d) {return color(d.name); })
        .style("fill-opacity", .5);

    bar.exit().remove();

    // Creates axises
    this.svg.select(".y_axis")
        .call(this.yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr({"x": -110, "y": -70})
        .attr("dy", ".75em")
        .style("text-anchor", "end")
        .text("# of Matches");

    bar.transition()
       .duration(500)
       .attr("x", function(d) { return 0; })
       .attr("width", function(d) { return that.x(d.value); });

    text.transition()
        .duration(500)
        .attr("x", function(d) { return that.x(d.value)+5; })
        .attr("y", function(d) { return that.y1(d.name)+9; })
        .attr("fill", "black")
        .text(function(d) { if (d.value != 0) return d.value; })

    // Create legend
    var legend = this.svg.selectAll(".legend")
        .data(categories)
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) {
            return "translate(-20,"+i*20+")";
        });

    legend.append("rect")
        .attr("x", this.width - 18)
        .attr("y", this.height - 60)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color)
        .style("fill-opacity", .5)
        .style("stroke", color)
        .style("stroke-width", 2);

    legend.append("text")
          .attr("x", this.width - 24)
          .attr("y", this.height - 50)
          .attr("dy", ".35em")
          .style("text-anchor", "end")
          .text(function(d) { return d; });

}


/**
 * Gets called by event handler and should create new aggregated data
 * aggregation is done by the function "aggregate(filter)". Filter has to
 * be defined here.
 * @param selection
 */
MatchVis.prototype.onSelectionChange= function (wave){

    this.filter.wave = wave;
    this.refilter();
}

MatchVis.prototype.onRaceChange= function (races){
    this.filter.races = [];
    for (var i = 0; i < races.length; i++)
      if (races[i] != "")
        this.filter.races.push(races[i]);
    this.refilter();
}

MatchVis.prototype.onCareerChange= function (careers){

    this.filter.careers = [];
    for (var i = 0; i < careers.length; i++)
      if (careers[i] != "")
        this.filter.careers.push(careers[i]); 
    this.refilter();
}

MatchVis.prototype.onGoalChange= function (goals){

    this.filter.goals = [];
    for (var i = 0; i < goals.length; i++)
      if (goals[i] != "")
        this.filter.goals.push(goals[i]); 
    this.refilter();
}

MatchVis.prototype.refilter = function() {
    var that = this;
    this.wrangleData(function(d) {

      if (that.filter.wave == "0") {
        return true;
      }
      //check all filter properties if they are set and if the value doesn't abort and return false
      if (that.filter.wave != null && d.wave != that.filter.wave) {
        return false;
      }
      //looks like a good item: no filter said no
      return true;
    });

    this.updateVis();

}


/*
*
* ==================================
* From here on only HELPER functions
* ==================================
*
* */



/**
 * The aggregate function that creates the counts for each age for a given filter.
 * @param _filter - A filter can be, e.g.,  a function that is only true for data of a given time range
 * @returns {Array|*}
 */
MatchVis.prototype.filterAndAggregate = function(_filter){

    var filter = function(){return true;}
    if (_filter != null){
        filter = _filter;
    }

    var that = this;

    function filter_race(d) {
      if (that.filter.races == null || that.filter.races.length == 0)
        return true;
      else if (that.filter.races != null && that.filter.races.length > 0) {
        if (that.filter.races.indexOf(d.race) != -1)
          return true;
      }
      return false;
    }

    function filter_career(d) {
      if (that.filter.careers == null || that.filter.careers.length == 0)
        return true;
      else if (that.filter.careers != null && that.filter.careers.length > 0) {
        if (that.filter.careers.indexOf(d.career_c) != -1)
          return true;
      }
      return false;
    }

    function filter_goal(d) {
      if (that.filter.goals == null || that.filter.goals.length == 0)
        return true;
      else if (that.filter.goals != null && that.filter.goals.length > 0) {
        if (that.filter.goals.indexOf(d.goal) != -1)
          return true;
      }
      return false;
    }

    var filtered_data = this.data.filter(filter)
                                 .filter(filter_race)
                                 .filter(filter_career)
                                 .filter(filter_goal);

    var data = [];
    for (var i = 0; i < 15; i++) {
      var temp = {
        match: i,
        matches_women: 0,
        matches_men: 0
      }

      data.push(temp);
    }

    var people = 0;
    var num_matches = 0;

    filtered_data
        .forEach(function(c) {
          if (c.wave < 6 || c.wave > 9) {
            // female
            if (c.gender == 0) {
              var temp = 0;
              c.people.forEach(function(d) {
                if (d.match == 1)
                  temp++;
              })
              if (temp != 0) 
                num_matches++;
              people++;
              data[temp]["matches_women"]++;
            }
            // male
            else if (c.gender == 1) {
              var temp = 0;
              c.people.forEach(function(d) {
                if (d.match == 1) 
                  temp++;
              })
              data[temp]["matches_men"]++;
            }
          }
        })

    this.matchElement.html(num_matches+"/"+people+" people got a least one match"+"\n("+d3.round(num_matches/people*100,1)+"%)");

    return data;
}