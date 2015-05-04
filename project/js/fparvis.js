/**
 * mparVis object for Speed Dating Final Project of CS171
 * @param _parentElement -- the HTML or SVG element (D3 node) to which to attach the vis
 * @param _data -- the data array
 * @param _eventHandler -- the Eventhandling Object to emit data to
 */

FParVis = function(_parentElement, _data, _eventHandler){
    this.parentElement = _parentElement;
    this.data = _data;
    this.eventHandler = _eventHandler;
    this.displayData = [];
    this.highlightData;

    this.cats = ["Attractive", "Sincere", "Intelligent", "Fun", "Ambitious", "Shared Interests"];

    this.margin = {top: 30, right: 10, bottom: 10, left: 10};
    this.width = 500;
    this.height = 250;

    this.initVis();
};

/**
 * Method that sets up the SVG and the variables
 */
FParVis.prototype.initVis = function(){

    var that = this; // read about the this

    // Constructs SVG layout
    this.svg = this.parentElement.append("svg")
        .attr("width", that.width + that.margin.left + that.margin.right)
        .attr("height", that.height + that.margin.top + that.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + that.margin.left + "," + that.margin.top + ")");

    // Creates axis and scales
    this.x = d3.scale.ordinal().domain(that.cats).rangePoints([0, that.width], 1);
    this.y = {};

    // Creates lines and axises
    this.line = d3.svg.line();
    this.axis = d3.svg.axis().orient("left");

    // filter, aggregate, modify data
    this.wrangleData();

    // call the update method
    this.updateVis();
};

/**
 * Method to set up the initial visualization data.
 */
FParVis.prototype.wrangleData= function (filter) {

    var that = this;

    // displayData should hold the data which is visualized
    // pretty simple in this case -- no modifications needed

    that.displayData = [
        {"iid": 1, "gender": 0, "attractive": 5, "sincere": 10, "intelligent": 6, "fun": 7, "ambitious": 10, "share_int": 9},
        {"iid": 2, "gender": 1, "attractive": 10, "sincere": 7, "intelligent": 8, "fun": 4, "ambitious": 5, "share_int": 2},
        {"iid": 3, "gender": 1, "attractive": 5, "sincere": 3, "intelligent": 6, "fun": 9, "ambitious": 8, "share_int": 5},
        {"iid": 4, "gender": 0, "attractive": 10, "sincere": 4, "intelligent": 7, "fun": 3, "ambitious": 2, "share_int": 8}
    ];

    that.highlightData = {"iid": 2, "gender": 1, "attractive": 10, "sincere": 7, "intelligent": 8, "fun": 4, "ambitious": 5, "share_int": 2}

};

/**
 * The drawing function, updates the parallel coordinate graph to new data
 */
FParVis.prototype.updateVis = function() {

    var that = this;

    // Extract the list of dimensions and create a scale for each
    that.x.domain(dimensions = d3.keys(that.displayData[0]).filter(function(d) {
        return d != "iid" && d != "gender" && (that.y[d] = d3.scale.linear()
                .domain([0,10]))
                .range([that.height, 0]);
    }));

    // Removes all old paths and axis
    that.svg.selectAll("path").remove();
    that.svg.selectAll(".dimension").remove();

    // Add lines representing each individual person
    this.peeplines = that.svg.append("g")
        .selectAll("path")
        .data(that.displayData);

    this.peeplines.enter()
        .append("path")
        .attr("d", path)
        .attr("class", "foreground")
        .attr("stroke", function (d) {
            if (d.iid == that.highlightData.iid) {
                if (d.gender == 1) {
                    return "midnightblue"
                }
                else return "crimson"
            }
            else {
                if (d.gender == 1) {
                    return "powderblue"
                }
                else return "lightpink"
            }})
        .attr("stroke-opacity", function (d) {
            if (d.iid == that.highlightData.iid) {
                return 1
            }
            else return .4
        })
        .attr("fill", "none")
        .attr("stroke-width", 3);

    // Sends out event to update nodes when clicked
    this.peeplines.on("click", function (d) {
        $(that.eventHandler).trigger("lineclick", [d.iid])
    });

    // Add a group element for each dimension.
    this.g = that.svg.selectAll(".dimension")
        .data(dimensions)
        .enter().append("g")
        .attr("class", "dimension")
        .attr("transform", function(d) { return "translate(" + that.x(d) + ")"; });

    // Add an axis and title.
    this.g.append("g")
        .attr("class", "axis")
        .each(function(d) { d3.select(this).call(that.axis.scale(that.y[d])); })
        .append("text")
        .style("text-anchor", "middle")
        .attr("y", -9)
        .text(function(d) {return d;});

    // Returns the path for a given line
    function path (d) {
        return that.line(dimensions.map(function(p) {return [that.x(p), that.y[p](d[p])]}));
    }
};

/**
 * Gets called by event handler and should create new displayData
 * @param node_id -- the ID of the node clicked
 * @param wave_peep -- data for the entire wave
 */
FParVis.prototype.onSelectionChange= function (node_id, wave_peep){

    var that = this;

    // Clears the old data from memory
    this.displayData = [];
    var person;

    // Creates line data for each person
    for (var i = 0; i < wave_peep.length; i++) {
        for (var j = 0; j < wave_peep[i]["people"].length; j++) {
            if (node_id == wave_peep[i]["people"][j]["pid"]) {
                person = {
                    "iid": wave_peep[i]["iid"],
                    "gender": wave_peep[i]["gender"],
                    "attractive": wave_peep[i]["people"][j]["attr"],
                    "sincere": wave_peep[i]["people"][j]["sinc"],
                    "intelligent": wave_peep[i]["people"][j]["intel"],
                    "fun": wave_peep[i]["people"][j]["fun"],
                    "ambitious": wave_peep[i]["people"][j]["amb"],
                    "shared_interests": wave_peep[i]["people"][j]["shar"]
                };

                that.displayData.push(person)
            }
        }
    }

    // Creates line data for the selected node
    for (var i = 0; i <wave_peep.length; i++) {
        if (wave_peep[i]["iid"] == node_id) {
            that.highlightData = {
                "iid": wave_peep[i]["iid"],
                "gender": wave_peep[i]["gender"],
                "attractive": wave_peep[i]["start_pref"]["attr3_1"],
                "sincere": wave_peep[i]["start_pref"]["sinc3_1"],
                "intelligent": wave_peep[i]["start_pref"]["intel3_1"],
                "fun": wave_peep[i]["start_pref"]["fun3_1"],
                "ambitious": wave_peep[i]["start_pref"]["amb3_1"],
                "shared_interests": wave_peep[i]["start_pref"]["shar3_1"]
            };

            that.displayData.push(that.highlightData)
        }
    }

    console.log(that.displayData, that.highlightData);

    this.updateVis();
};