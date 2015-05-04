PrefVis = function(_parentElement, _data, _selectionElement){
    this.parentElement = _parentElement;
    this.selectionElement = _selectionElement;
    this.data = _data;
    this.displayData = [];
    this.filter = {
        wave: null
    };

    this.margin = {top: 50, right: 30, bottom: 100, left: 80},
    this.width = 900 - this.margin.left - this.margin.right,
    this.height = 600 - this.margin.top - this.margin.bottom;

    this.initVis();

}


/**
 * Method that sets up the SVG and the variables
 */
PrefVis.prototype.initVis = function(){

    var that = this;
 
    this.svg = this.parentElement.append("svg")
        .attr("width", this.width + this.margin.left + this.margin.right)
        .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
        .attr("transform", "translate(" + this.margin.left + "," + this.margin.top + ")");

    this.x0 = d3.scale.ordinal()
    	.rangeRoundBands([0, this.width], .1);

    this.x1 = d3.scale.ordinal();

    this.y = d3.scale.linear()
      .range([this.height, 0]);

    this.xAxis = d3.svg.axis()
      .scale(this.x0)
      .orient("bottom");

    this.yAxis = d3.svg.axis()
      .scale(this.y)
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
PrefVis.prototype.wrangleData= function(_filterFunction){

    // displayData should hold the data which is visualized
    this.displayData = this.filterAndAggregate(_filterFunction);

}

/**
 * the drawing function - should use the D3 selection, enter, exit
 */
PrefVis.prototype.updateVis = function(){

    var that = this;

    var headers = d3.keys(this.displayData[0]).filter(function(key) { return key !== "attribute"; });

    var categories = ["what men THINK women want", "what women ACTUALLY want", 
        "what women THINK men want", "what men ACTUALLY want"];

    var color = d3.scale.ordinal()
                        .domain(headers)
                        .range(["pink", "red", "#87CEFA", "blue"]);

    this.displayData.forEach(function(d) {
      d.ratings = headers.map(function(name) { return {name: name, value: +d[name]}; });
    });               

    this.x0.domain(this.displayData.map(function(d) { return d.attribute; }));
    this.x1.domain(headers).rangeRoundBands([0, this.x0.rangeBand()]);

    var ymax = d3.max(this.displayData, function(d) { return d3.max(d.ratings, function(c) { return c.value; }); })

    if (ymax > 50)
      this.y.domain([0, ymax]);
    else 
      this.y.domain([0, 50]);

    this.svg.select(".x_axis")
        .call(this.xAxis)
        .selectAll("text")
        .attr("class", "textname")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-60)");

    this.svg.select(".y_axis")
        .call(this.yAxis)
        .append("text")//SAM: keep in mind that you will add a text element per updateVis call
        .attr("transform", "rotate(-90)")
        .attr({"x": -110, "y": -70})
        .attr("dy", ".75em")
        .style("text-anchor", "end")
        .text("# of Points");

    var attr = this.svg.selectAll(".attr")
                   .data(this.displayData)
                   
    var attr_enter = attr.enter().append("g");

    attr.attr("class", "attr")
        .attr("transform", function(d) { return "translate(" + that.x0(d.attribute) + ",0)"; });

    attr.exit().remove();

    var bar = attr.selectAll(".bar")
                  .data(function(d) { return d.ratings; });

    var bar_enter = bar.enter()
                       .append("rect")
                       .attr("class", "bar");

    bar.attr("width", this.x1.rangeBand())
       .attr("x", function(d) { return that.x1(d.name); })
       .style("fill", function(d) {return color(d.name); });

    bar.exit().remove();

    //SAM a selectAll creates a nested data-join. which may be initialized implicitly but not updated
    bar.transition()
       .duration(500)
       .attr("y", function(d) { return that.y(d.value); })
       .attr("height", function(d) { return that.height - that.y(d.value); });

    var legend = this.svg.selectAll(".legend")
                     .data(categories)
                     .enter().append("g")
                     .attr("class", "legend")
                     .attr("transform", function(d, i) { 
                        return "translate(-20,"+i*20+")"; 
                      });

    legend.append("rect")
          .attr("x", this.width - 18)
          .attr("width", 18)
          .attr("height", 18)
          .style("fill", color);

    legend.append("text")
          .attr("x", this.width - 24)
          .attr("y", 9)
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
PrefVis.prototype.onSelectionChange= function (wave){

    this.filter.wave = wave;
    this.refilter();
}

PrefVis.prototype.onRaceChange= function (races){

    this.filter.races = [];
    for (var i = 0; i < races.length; i++)
      if (races[i] != "")
        this.filter.races.push(races[i]);
    this.refilter();
}

PrefVis.prototype.onCareerChange= function (careers){

    this.filter.careers = [];
    for (var i = 0; i < careers.length; i++)
      if (careers[i] != "")
        this.filter.careers.push(careers[i]); 
    this.refilter();
}

PrefVis.prototype.onGoalChange= function (goals){

    this.filter.goals = [];
    for (var i = 0; i < goals.length; i++)
      if (goals[i] != "")
        this.filter.goals.push(goals[i]); 
    this.refilter();
}

PrefVis.prototype.refilter = function() {
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
PrefVis.prototype.filterAndAggregate = function(_filter){

    var filter = function(){return true;}
    if (_filter != null){
        filter = _filter;
    }

    var that = this;

    var attr = {
        attribute: "Attractive",
        perc_women: 0.,
        real_women: 0.,
        perc_men: 0.,
        real_men: 0,
    };

    var sinc = {
        attribute: "Sincere",
        perc_women: 0.,
        real_women: 0.,
        perc_men: 0.,
        real_men: 0,
    };

    var intel = {
        attribute: "Intelligent",
        perc_women: 0.,
        real_women: 0.,
        perc_men: 0.,
        real_men: 0,
    };

    var fun = {
        attribute: "Fun",
        perc_women: 0.,
        real_women: 0.,
        perc_men: 0.,
        real_men: 0,
    };

    var amb = {
        attribute: "Ambitious",
        perc_women: 0.,
        real_women: 0.,
        perc_men: 0.,
        real_men: 0,
    };

    var shar = {
        attribute: "Shared Interests",
        perc_women: 0.,
        real_women: 0.,
        perc_men: 0.,
        real_men: 0,
    };

    var count_women = 0;
    var count_men = 0;

    var attrs = ['attr','sinc','intel','fun','amb','shar'];
    var data = [attr, sinc, intel, fun, amb, shar];

    function copy(source, category, prefix, suffix) {
      attrs.forEach(function(attr, i) {
        var key = attr+prefix+'_'+suffix;
        if (!isNaN(parseFloat(source[key]))) {
          data[i][category] += parseFloat(source[key]);
        }
      })
    };

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
                                 .filter(filter_goal)

    filtered_data
        .forEach(function(c) {
          if (c.wave < 6 || c.wave > 9) {
            // female
            if (c.gender == 0) {
              count_women++;
              // what she wants
              copy(c.start_pref, "real_women", 1, 1);
              // what she thinks he wants
              copy(c.start_pref, "perc_men", 2, 1);
            }
            // male 
            else if (c.gender == 1) {
              count_men++;
              // what he wants
              copy(c.start_pref, "real_men", 1, 1);
              // what he thinks she wants
              copy(c.start_pref, "perc_women", 2, 1);
            }
          }
        })

    var women_categories = ["real_women", "perc_men"];
    var men_categories = ["real_men", "perc_women"];
    data.forEach(function(attr) {
      women_categories.forEach(function(d) {
        attr[d] = attr[d]/count_women;
      });
      men_categories.forEach(function(d) {
        attr[d] = attr[d]/count_men;
      });
    });

    console.log(filtered_data)

    this.selectionElement.html(count_men+count_women+" out of 449 people");

    return data;

}