PrefVis = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.data = _data;
    this.displayData = [];

    this.margin = {top: 20, right: 30, bottom: 200, left: 120},
    this.width = 700 - this.margin.left - this.margin.right,
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

    this.x = d3.scale.ordinal()
    	.rangeRoundBands([0, this.width], .1);

    this.y = d3.scale.linear()
      .range([this.height, 0]);

    this.xAxis = d3.svg.axis()
      .scale(this.x)
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

    //// you might be able to pass some options,
    //// if you don't pass options -- set the default options
    //// the default is: var options = {filter: function(){return true;} }
    //var options = _options || {filter: function(){return true;}};





}



/**
 * the drawing function - should use the D3 selection, enter, exit
 */
PrefVis.prototype.updateVis = function(){

    var that = this;

    var headers = ["perc_women", "real_women", "perc_men", "real_men"];

    var categories = ["what men THINK women want", "what women ACTUALLY want", 
        "what women THINK men want", "what men ACTUALLY want"];

    var color = d3.scale.ordinal()
                        .domain(categories)
                        .range(["pink", "red", "#87CEFA", "blue"]);

    var layers = d3.layout.stack()(headers.map(function(d) {
        return that.displayData.map(function(c) {
            return {
                x: c.attribute,
                y: +c[d]
            };
        });
    }));

    var yGroupMax = d3.max(layers, function(layer) { 
        return d3.max(layer, function(d) { 
            return d.y; 
        }); 
    });

    this.x.domain(layers[0].map(function(d) { return d.x; }));

    this.y.domain([0, yGroupMax]);

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
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr({"x": -110, "y": -70})
        .attr("dy", ".75em")
        .style("text-anchor", "end")
        .text("# of Points");    

    var layer = this.svg.selectAll(".layer")
                    .data(layers)
                    .enter()
                    .append("g")
                    .attr("class", "layer")
                    .style("fill", function(d, i) { return color(i); });

    var rect = layer.selectAll("rect")
        .data(function(d) { return d; })
        .enter()
        .append("rect")
        .attr("x", function(d) { return that.x(d.x); })
        .attr("y", this.height)
        .attr("width", that.x.rangeBand())
        .attr("height", 0);

    rect.transition()
        .duration(500)
        .delay(function(d, i) { return i * 10; })
        .attr("x", function(d, i, j) { return that.x(d.x) + that.x.rangeBand() / 4 * j; })
        .attr("width", that.x.rangeBand() / 4)
        .transition()
        .attr("y", function(d) { return that.y(d.y); })
        .attr("height", function(d) { return that.height - that.y(d.y); });

    var legend = this.svg.selectAll(".legend")
                     .data(categories.slice().reverse())
                     .enter().append("g")
                     .attr("class", "legend")
                     .attr("transform", function(d, i) { 
                        return "translate(-20,"+i*20+")"; });

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

    // TODO: call wrangle function
    this.wrangleData(function(d) { return d.key == wave; });

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

    // start_pref, half_pref, day_pref, week_pref
    // what men think women want, what women want, what women think men want, what men want

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

    this.data
        .filter(filter)
        .forEach(function(d) {
            // don't include waves 6-9
            if (parseInt(d.key) < 6 || parseInt(d.key) > 9) {
                d.values.forEach(function(c) {
                    // female
                    if (c.gender == 0) {
                        // what she wants
                        if (!isNaN(parseFloat(c.start_pref.attr1_1))) {
                            attr["real_women"] += parseFloat(c.start_pref.attr1_1);
                            count_women += 1;
                        }
                        if (!isNaN(parseFloat(c.start_pref.sinc1_1))){
                            sinc["real_women"] += parseFloat(c.start_pref.sinc1_1);
                        }
                        if (!isNaN(parseFloat(c.start_pref.intel1_1))) {
                            intel["real_women"] += parseFloat(c.start_pref.intel1_1);
                        }
                        if (!isNaN(parseFloat(c.start_pref.fun1_1))) {
                            fun["real_women"] += parseFloat(c.start_pref.fun1_1);
                        }
                        if (!isNaN(parseFloat(c.start_pref.amb1_1))) {
                            amb["real_women"] += parseFloat(c.start_pref.amb1_1);
                        }
                        if (!isNaN(parseFloat(c.start_pref.shar1_1))) {
                            shar["real_women"] += parseFloat(c.start_pref.shar1_1);
                        }
                        // what she thinks he wants
                        if (!isNaN(parseFloat(c.start_pref.attr2_1))) {
                            attr["perc_men"] += parseFloat(c.start_pref.attr2_1);
                        }
                        if (!isNaN(parseFloat(c.start_pref.sinc2_1))) {
                            sinc["perc_men"] += parseFloat(c.start_pref.sinc2_1);
                        }
                        if (!isNaN(parseFloat(c.start_pref.intel2_1))) {
                            intel["perc_men"] += parseFloat(c.start_pref.intel2_1);
                        }
                        if (!isNaN(parseFloat(c.start_pref.fun2_1))) {
                            fun["perc_men"] += parseFloat(c.start_pref.fun2_1);
                        }
                        if (!isNaN(parseFloat(c.start_pref.amb2_1))) {
                            amb["perc_men"] += parseFloat(c.start_pref.amb2_1);
                        }
                        if (!isNaN(parseFloat(c.start_pref.shar2_1))) {
                            shar["perc_men"] += parseFloat(c.start_pref.shar2_1);
                        }
                    }
                    // male 
                    else if (c.gender == 1) {
                        // what he wants
                        if (!isNaN(parseFloat(c.start_pref.attr1_1))) {
                            attr["real_men"] += parseFloat(c.start_pref.attr1_1);
                            count_men += 1;
                        }
                        if (!isNaN(parseFloat(c.start_pref.sinc1_1))){
                            sinc["real_men"] += parseFloat(c.start_pref.sinc1_1);
                        }
                        if (!isNaN(parseFloat(c.start_pref.intel1_1))) {
                            intel["real_men"] += parseFloat(c.start_pref.intel1_1);
                        }
                        if (!isNaN(parseFloat(c.start_pref.fun1_1))) {
                            fun["real_men"] += parseFloat(c.start_pref.fun1_1);
                        }
                        if (!isNaN(parseFloat(c.start_pref.amb1_1))) {
                            amb["real_men"] += parseFloat(c.start_pref.amb1_1);
                        }
                        if (!isNaN(parseFloat(c.start_pref.shar1_1))) {
                            shar["real_men"] += parseFloat(c.start_pref.shar1_1);
                        }
                        // what he thinks she wants
                        if (!isNaN(parseFloat(c.start_pref.attr2_1))) {
                            attr["perc_women"] += parseFloat(c.start_pref.attr2_1);
                        }
                        if (!isNaN(parseFloat(c.start_pref.sinc2_1))) {
                            sinc["perc_women"] += parseFloat(c.start_pref.sinc2_1);
                        }
                        if (!isNaN(parseFloat(c.start_pref.intel2_1))) {
                            intel["perc_women"] += parseFloat(c.start_pref.intel2_1);
                        }
                        if (!isNaN(parseFloat(c.start_pref.fun2_1))) {
                            fun["perc_women"] += parseFloat(c.start_pref.fun2_1);
                        }
                        if (!isNaN(parseFloat(c.start_pref.amb2_1))) {
                            amb["perc_women"] += parseFloat(c.start_pref.amb2_1);
                        }
                        if (!isNaN(parseFloat(c.start_pref.shar2_1))) {
                            shar["perc_women"] += parseFloat(c.start_pref.shar2_1);
                        }
                    }
                    
                })
            }
        });

    // find averages
    attr["perc_women"] = attr["perc_women"]/count_women;
    sinc["perc_women"] = sinc["perc_women"]/count_women;
    intel["perc_women"] = intel["perc_women"]/count_women;
    fun["perc_women"] = fun["perc_women"]/count_women;
    amb["perc_women"] = amb["perc_women"]/count_women;
    shar["perc_women"] = shar["perc_women"]/count_women;

    attr["real_women"] = attr["real_women"]/count_women;
    sinc["real_women"] = sinc["real_women"]/count_women;
    intel["real_women"] = intel["real_women"]/count_women;
    fun["real_women"] = fun["real_women"]/count_women;
    amb["real_women"] = amb["real_women"]/count_women;
    shar["real_women"] = shar["real_women"]/count_women;

    attr["perc_men"] = attr["perc_men"]/count_men;
    sinc["perc_men"] = sinc["perc_men"]/count_men;
    intel["perc_men"] = intel["perc_men"]/count_men;
    fun["perc_men"] = fun["perc_men"]/count_men;
    amb["perc_men"] = amb["perc_men"]/count_men;
    shar["perc_men"] = shar["perc_men"]/count_men;

    attr["real_men"] = attr["real_men"]/count_men;
    sinc["real_men"] = sinc["real_men"]/count_men;
    intel["real_men"] = intel["real_men"]/count_men;
    fun["real_men"] = fun["real_men"]/count_men;
    amb["real_men"] = amb["real_men"]/count_men;
    shar["real_men"] = shar["real_men"]/count_men;

    var res = [];
    res.push(attr, sinc, intel, fun, amb, shar);

    console.log(res);
    return res;

}