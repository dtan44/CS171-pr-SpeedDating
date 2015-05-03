PrefVis = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.data = _data;
    this.displayData = [];
    this.filter = {
        wave: null
    };

    this.margin = {top: 20, right: 30, bottom: 200, left: 120},
    this.width = 800 - this.margin.left - this.margin.right,
    this.height = 500 - this.margin.top - this.margin.bottom;

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

    this.y.domain([0, ymax]);

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

PrefVis.prototype.refilter = function() {
    var that = this;
    this.wrangleData(function(d) {
        //check all filter properties if they are set and if the value doesn't abort and return false
        if (that.filter.wave != null && d.key != that.filter.wave) {
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
        attribute: "Shared Interests/Hobbies",
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

    this.data
        .filter(filter)
        .forEach(function(d) {
          d.values.forEach(function(c) {

            function gender_copy() {
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

            var races = that.filter.races;
            var careers = that.filter.careers;


            if (c.wave < 6 || c.wave > 9) {
              if ((races == null || races.length == 0) && 
                  (careers == null || careers.length == 0)) {
                gender_copy();
              }
              else if (races != null && 
                      (careers == null || careers.length == 0)) {
                for (var i = 0; i < races.length; i++) {
                  if (c.race == races[i]) {
                    gender_copy();
                  }
                }
              }
              else if ((races == null || races.length == 0) &&
                        careers != null) {
                for (var i = 0; i < careers.length; i++) {
                  if (c.career_c == careers[i]) {
                    gender_copy();
                  }
                }
              }
              else
                for (var i = 0; i < careers.length; i++) {
                  if (c.career_c == careers[i]) {
                    for (var j = 0; j < races.length; i++) {
                      if (c.race == races[j]) {
                        gender_copy();
                      }
                    }
                  }
                }
            }  
          })
        }); 

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

    return data;

}