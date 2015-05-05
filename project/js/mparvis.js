/**
 * mparVis object for Speed Dating Final Project of CS171
 * @param _parentElement -- the HTML or SVG element (D3 node) to which to attach the vis
 * @param _data -- the data array
 * @param _eventHandler -- the Eventhandling Object to emit data to
 */

MParVis = function(_parentElement, _data, _eventHandler){
    this.parentElement = _parentElement;
    this.data = _data;
    this.eventHandler = _eventHandler;
    this.displayData = [];
    this.highlightData;
    this.wavenum = 0;

    this.selected_races = [];
    this.selected_careers = [];
    this.selected_goals = [];

    this.cats = ["Attractive", "Sincere", "Intelligent", "Fun", "Ambitious", "Shared Interests"];

    this.w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
    this.h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
    this.margin = {top: 50, right: 5, bottom: 10, left: 10};
    this.width = this.w/3;
    this.height = 250;


    this.initVis();
};

/**
 * Method that sets up the SVG and the variables
 */
MParVis.prototype.initVis = function(){

    var that = this; // read about the this

    // Constructs SVG layout
    this.svg = this.parentElement.append("svg")
        .attr("width", that.width + that.margin.left + that.margin.right)
        .attr("height", that.height + that.margin.top + that.margin.bottom)
        .attr("display", "block")
        .attr("margin", "auto")
        .attr("align", "center")
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
MParVis.prototype.wrangleData= function () {

    var that = this;

    // displayData should hold the data which is visualized
    // pretty simple in this case -- no modifications needed

    that.displayData = [
        {"iid": 1, "gender": 0, "attractive": 25, "sincere": 38, "intelligent": 26, "fun": 14, "ambitious": 13, "share_int": 10},
        {"iid": 2, "gender": 1, "attractive": 16, "sincere": 45, "intelligent": 18, "fun": 25, "ambitious": 40, "share_int": 5},
        {"iid": 3, "gender": 1, "attractive": 50, "sincere": 13, "intelligent": 36, "fun": 32, "ambitious": 30, "share_int": 50},
        {"iid": 4, "gender": 0, "attractive": 10, "sincere": 40, "intelligent": 40, "fun": 30, "ambitious": 20, "share_int": 28}
    ];

    that.highlightData = {"iid": 2, "gender": 1, "attractive": 16, "sincere": 45, "intelligent": 18, "fun": 25, "ambitious": 40, "share_int": 5}

};

/**
 * The drawing function, updates the parallel coordinate graph to new data
 */
MParVis.prototype.updateVis = function() {

    var that = this;

    // Extract the list of dimensions and create a scale for each
    that.x.domain(dimensions = d3.keys(that.displayData[0]).filter(function(d) {
        return d != "iid" && d != "gender" && d != "race" && d != "career" && d != "goal" && (that.y[d] = d3.scale.linear()
                .domain(d3.extent(that.displayData, function(p) { return +p[d]; }))
                .range([that.height, 0]));
    }));

    // Removes all old paths and axis
    that.svg.selectAll("path").remove();
    that.svg.selectAll(".dimension").remove();

    // Add lines representing each individual person
    this.peeplines = that.svg.append("g")
        .selectAll("path");

    this.path_enter = this.peeplines.data(that.displayData)
        .enter()
        .append("path")

    this.path_enter.attr("d", path)
        .attr("class", "foreground")
        .attr("stroke", function (d) {
            if ((that.selected_races.indexOf(d.race) != -1 || that.selected_careers.indexOf(d.career) != -1 ||
                that.selected_goals.indexOf(d.goal) != -1) && d.iid != that.highlightData.iid) {
                return "greenyellow"
            }
            else {
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
                }
            }
        })
        .attr("stroke-opacity", function (d) {
            if (d.iid == that.highlightData.iid) {
                return 1;
            }
            else return .5
        })
        .attr("fill", "none")
        .attr("stroke-width", 4)

    this.path_enter.on("click", function (d) {
            $(that.eventHandler).trigger("lineclick", d.iid);
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
 * @param wave_num -- number of the wave
 */
MParVis.prototype.onSelectionChange= function (node_id, wave_peep, wave_num){

    var that = this;

    // Clears the old data from memory
    this.displayData = [];

    that.wavenum = wave_num;

    // Stores the relevant data for selected node
    for (var i = 0; i <wave_peep.length; i++) {
        if (wave_peep[i]["iid"] == node_id) {
            that.highlightData = {
                "iid": wave_peep[i]["iid"],
                "gender": wave_peep[i]["gender"],
                "race": wave_peep[i]["race"],
                "career": wave_peep[i]["career_c"],
                "goal": wave_peep[i]["goal"],
                "attractive": wave_peep[i]["start_pref"]["attr1_1"],
                "sincere": wave_peep[i]["start_pref"]["sinc1_1"],
                "intelligent": wave_peep[i]["start_pref"]["intel1_1"],
                "fun": wave_peep[i]["start_pref"]["fun1_1"],
                "ambitious": wave_peep[i]["start_pref"]["amb1_1"],
                "share_interests": wave_peep[i]["start_pref"]["shar1_1"]
            }
        }
    }

    // Creates line data for each person
    for (var i = 0; i < wave_peep.length; i++) {
        var person = {
            "iid": wave_peep[i]["iid"],
            "gender": wave_peep[i]["gender"],
            "race": wave_peep[i]["race"],
            "career": wave_peep[i]["career_c"],
            "goal": wave_peep[i]["goal"],
            "attractive": wave_peep[i]["start_pref"]["attr1_1"],
            "sincere": wave_peep[i]["start_pref"]["sinc1_1"],
            "intelligent": wave_peep[i]["start_pref"]["intel1_1"],
            "fun": wave_peep[i]["start_pref"]["fun1_1"],
            "ambitious": wave_peep[i]["start_pref"]["amb1_1"],
            "shared_interests": wave_peep[i]["start_pref"]["shar1_1"]
        };

        // Pushes relevant line data into data array
        if (person.gender == that.highlightData.gender) {
            that.displayData.push(person)
        }
    }

    that.displayData.push(that.highlightData);

    console.log(that.displayData, that.highlightData);

    this.updateVis();
};

/*
 * Updates selected races and parcoords chart
 * @param races -- array of the selected races
 */
MParVis.prototype.onRaceChange= function (races) {

    var that = this;

    that.selected_races = races;

    this.updateVis();
};

/*
 * Updates selected careers and parcoords chart
 * @param careers -- array of the selected careers
 */
MParVis.prototype.onCareerChange= function (careers) {

    var that = this;

    that.selected_careers = careers;

    this.updateVis();
};

/*
 * Updates selected goals and parcoords chart
 * @param goals -- array of selected goals
 */
MParVis.prototype.onGoalChange= function (goals) {

    var that = this;

    that.selected_goals = goals;

    this.updateVis();
};

/*
 * Updates parcoords when a wave changes
 * @param wave_num -- index of selected wave
 */
MParVis.prototype.onWaveChange= function (wave_num) {

    var that = this;

    that.wavenum = wave_num;

};