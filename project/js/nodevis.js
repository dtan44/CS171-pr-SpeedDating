
NodeVis = function(_parentElement, _data, _eventHandler){
    this.parentElement = _parentElement;
    this.data = _data;
    this.eventHandler = _eventHandler;
    this.displayData = [];


    this.width = 800;
    this.height = 450;
    this.smallwidth = 200;
    this.smallheight = 200;
    this.graph = {nodes: [], links: []};
    this.nb_nodes = this.data.length;
    this.wave = 1 - 1;
    this.widthScale = d3.scale.linear().range([40, this.width*.95])
    this.posMale = [];
    this.posFemale = [];
    this.info = ['ID', 'Age', 'Sex', 'Race', 'Occupation', 'Goal', 'Alma-Mater']
    this.race = ['African American', 'Caucasian', 'Latino/Hispanic', 'Asian', 'Native American', 'Other']
    this.occupation = ["Lawyer", 'Academic/Research', 'Psychologist', 'Doctor/Medicine', 'Engineer', 'Entertainment', 'Finance/Business', 'Real Estate', 'Humanitarian Affairs', 'Undecided', 'Social Work', 'Speech Pathology', 'Politics', 'Pro sports', 'Other', 'Journalism', 'Architecture']
    this.goal = ['Seemed like a fun night out', 'To meet new people', 'To get a date', 'Looking for a serious relationship', 'To say I did it', 'Other']
    this.update_race = []
    this.update_occupation = []
    this.update_goal = []
    this.race_check = false;
    this.occupation_check = false;
    this.goal_check = false;
    this.gSize = 40;
    this.bSize = 40;

    this.tick = function(e) {
        that.graph_update(40);
    }
    
    this.graph_update = function(duration) {
        
        that.link.transition().duration(duration)
            .attr("x1", function(d) { return d.target.x; })
            .attr("y1", function(d) { return d.target.y; })
            .attr("x2", function(d) { return d.source.x; })
            .attr("y2", function(d) { return d.source.y; });
        
        that.node.attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
        
        that.node.transition().duration(duration)
            .attr("transform", function(d) { 
                return "translate("+d.x+","+d.y+")"; 
          });
    }

    // run when node is mouse-overed
    this.mouseover = function(d) {
        that.node
            .each(function(n) { n.target = n.source = false; });

        that.link
            .classed("link--target", function(l) { if (l.target === d) return true; })
            .classed("link--source", function(l) { if (l.source === d) return true; })

        if (d.gender == '0') {
            that.link
                .transition()
                .style("stroke-opacity", function(l) { if (l.target !== d) return 0.5; })
        }
        else {
            that.link
                .transition()
                .style("stroke-opacity", function(l) { if (l.source !== d) return 0.5; })
        }

        that.node
            .classed("node--target", function(n) { return n.target; })
            .classed("node--source", function(n) { return n.source; });
    }

    // run when node is mouse-outed
    this.mouseout = function(d) {
        that.link
          .classed("link--target", false)
          .classed("link--source", false)
          .style("stroke-opacity", 1)

        that.node
          .classed("node--target", false)
          .classed("node--source", false);
    }

    // run when node clicked
    this.nodeclick = function(node) {
        var pass = [node.iid, that.displayData, node];
        $(that.eventHandler).trigger('nodeclick', pass);

        var array = (node.gender=='1'?that.posFemale:that.posMale);
        
        var girl_index = parseInt(node.positin);

        var boy_index = 0;

        if (node.gender == '0') {
            for (i=0,j=node.people.length;i<j;i++){
                if (node.people[i].order == '1'){
                    that.graph.nodes.forEach(function(e, f){
                        if ((e.gender == '1') && (e.iid == node.people[i].pid)) {
                            boy_index = parseInt(e.positin);
                        }
                    })
                }
            }
        }

        that.graph.nodes.forEach(function(d){
            if (node.gender == '1') {
                if (d.gender == '0') {
                    var pos = d.positin;
                    if (pos == girl_index){d.x = that.widthScale(1)}
                    else {
                        var dex = that.posFemale.indexOf(pos) - that.posFemale.indexOf(girl_index);
                        if (dex < 0) {
                            d.x = that.widthScale(that.posFemale.length + dex + 1);
                        }
                        else {
                            d.x = that.widthScale(dex + 1);
                        }
                    }
                }
            }
            else {
                if (d.gender == '1') {
                    var pos = parseInt(d.positin);
                    if (pos == boy_index){d.x = that.widthScale(1)}
                    else {
                        var dex = that.posMale.indexOf(pos) - that.posMale.indexOf(boy_index)
                        if (dex < 0) {
                            d.x = that.widthScale(that.posMale.length + dex + 1);
                        }
                        else {
                            d.x = that.widthScale(dex + 1);
                        }
                    }

                }
            }
        });

        that.graph_update(500)
    };

    this.getID = function(id) {
        for (i=0,j=that.displayData.length; i<j; i++){
            if (that.displayData[i]['iid'] == id){
                return i;
            }
        }
    };


    this.toolover = function(d) {
        var links = 0;
        for (i=0,j=that.graph.links.length;i<j;i++){
            if (that.graph.links[i].source.iid == d.iid){
                links += 1;
            }
        }
        that.div.transition()        
            .duration(200)      
            .style("opacity", .9);      
        that.div 
            .html('# of Matches: ' + links + "<br/>")  
            .style("left", (d3.event.pageX) + "px")     
            .style("top", (d3.event.pageY - 28) + "px");   
    };

    this.toolout = function(d) {
        that.div.transition()        
            .duration(500)      
            .style("opacity", 0); 
    };

    this.initVis();

}
/**
 * Method that sets up the SVG and the variables
 */
NodeVis.prototype.initVis = function(){

    that = this; // read about the this

    this.svg = this.parentElement.append('svg')
                    .attr('width', that.width)
                    .attr('height', that.height)

    this.force = d3.layout.force()
        .size([that.width, that.height])
        .on("tick", that.tick)
        .on("start", function(d) {})
        .on("end", function(d) {})
        .linkDistance(that.width/4)
        .charge(-80)
        .linkStrength(0.01)
        .friction(0.4)
        .start();
    
    this.div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 1e-6);

    this.smallsvg = d3.select('#personalbox').append('svg')
        .attr('width', that.smallwidth)
        .attr('height', that.smallheight);
    
    this.toptext = that.smallsvg.append("text")
      .attr('fill', 'white')
      .text('Information')
      .attr('y', 20)
      .attr('x', that.smallwidth/2)
      .attr('text-anchor', "middle")

    this.smallsvg.selectAll(".text")
        .data(that.info)
        .enter()
        .append('text')
            .attr('fill', 'white')
            .text(function(d){return d})
            .attr('y', function(d, i){return i*30+80})
            .attr('x', 16)
            .attr('text-anchor', "start")
            .attr('id', function(d){return d})
            .attr('font-size', 9)


    // filter, aggregate, modify data
    this.wrangleData(that.wave);

    // call the update method
    this.updateVis();
}



/**
 * Method to wrangle the data. In this case it takes an options object
  */
NodeVis.prototype.wrangleData= function(wave){
    this.displayData = this.filter(wave);

}



/**
 * the drawing function - should use the D3 selection, enter, exit
 * @param _options -- only needed if different kinds of updates are needed
 */
NodeVis.prototype.updateVis = function(){

    this.posMale.length = 0;
    this.posFemale.length = 0;

    this.force
        .stop()

    this.graph.nodes = this.displayData;

    this.graph.links.length = 0
    this.graph.nodes.forEach(function(d, i) {
        for (c=0,e=d.people.length;c<e;c++){
            if (d.people[c].match == "1") {
                that.graph.links.push({"source": +i, "target": that.getID(d.people[c].pid)});
            }
        }
    })

    // add and bind links
    this.link = this.svg.selectAll(".link")
        .data(that.graph.links);

    this.link.enter()
        .insert("line", ".node")
        .attr("class", "link")

    this.link.exit()
        .remove()

    // add and bind nodes
    this.node = this.svg.selectAll(".node")
        .data(that.graph.nodes)

    
    this.node.enter()
        .append("g")    
        .attr("class", "node")
        .on("mouseover", function(d) {that.mouseover(d); that.toolover(d)})
        .on("mouseout", function(d) {that.mouseout(d); that.toolout(d)})
        .on("click", that.nodeclick)
        
    d3.selectAll('image').remove()

    this.maleNodes = d3.selectAll('.node').filter(function(d,i) {if (d.gender == '1') {return true}})
        
    this.maleNodes
        .append('image')
        .attr("xlink:href", "image/boy.png")
        .attr("x", -18)
        .attr("y", -30)
        .attr("width", that.bSize)
        .attr("height", that.bSize);

    this.femaleNodes = d3.selectAll('.node').filter(function(d,i) {if (d.gender == '0') {return true}})
        
    this.femaleNodes
        .append('image')
        .attr("xlink:href", "image/girl.png")
        .attr("x", -18)
        .attr("y", 0)
        .attr("width", that.gSize)
        .attr("height", that.gSize);

    // append node points
    /*this.node.append("circle")
        .attr('r', 6)
        .style("fill", function(d) {if (d.gender == 0){return "DeepPink"} else {return "blue"} } )
*/

    this.node.exit()
        .remove()

    this.link.attr('x1', function(d) { return d.source.x; })
        .attr('y1', function(d) { return d.source.y; })
        .attr('x2', function(d) { return d.target.x; })
        .attr('y2', function(d) { return d.target.y; });


    this.force
        .nodes(this.graph.nodes)
        .links(this.graph.links)
        .start()

    this.force.stop()

    this.position = 0;

    this.graph.nodes.forEach(function(d, i) {
        if (parseInt(d.id) > that.position) {
            that.position = parseInt(d.id);
        }
    })
    this.widthScale.domain([0, that.position])

    this.graph.nodes.forEach(function(d, k){
        if (d.gender == '1') {
            var positin = 0;
            for (i=0,j=d.people.length;i<j;i++){
                if (d.people[i].order == '1'){
                        that.graph.nodes.forEach(function(e, f){
                            if ((e.gender == '0') && (e.iid == d.people[i].pid)) {
                                positin = parseInt(e.position);
                            }
                        })
                }
            }

            if (that.posMale.indexOf(positin) >= 0) {
                that.posMale.push(parseInt(positin) - 1)
                d.positin = positin - 1
            }
            else {
                that.posMale.push(parseInt(positin))
                d.positin = positin
            }
            d.y = that.height/4;
            d.x = that.widthScale(d.positin);
        }
        else {
            that.posFemale.push(parseInt(d.position))
            d.positin = parseInt(d.position)
            d.y = that.height/4*3;
            d.x = that.widthScale(parseInt(d.position));
        }
    })
    this.posMale.sort(function(a,b){return a-b})
    this.posFemale.sort(function(a,b){return a-b})

    d3.selectAll('.position').remove()

    this.maleNodes        
        .append('text').attr("font-size", "12px")
        .attr('class', 'position')
        .attr('x', '-3.5')
        .attr('y', '-37')
        .text(function(d){return d.positin;})

    this.femaleNodes        
        .append('text').attr("font-size", "12px")
        .attr('class', 'position')
        .attr('x', '-3.5')
        .attr('y', '58')
        .text(function(d){return d.positin;})
    
    this.graph_update(300)

    this.updateNode()

}

NodeVis.prototype.updateInfo = function(node){
    var gender = (node.gender == '0') ? 'Female' : 'Male';
    var race = that.race[node.race - 1];
    var occupation = (node.career_c != '') ? that.occupation[node.career_c - 1]: 'Undisclosed';
    var goal = (node.goal != '') ? that.goal[node.goal - 1]: 'Undisclosed';
    var undergraduate = (node.undergra != '') ? node.undergra: 'Undisclosed';

    this.smallsvg.select('#ID').text('ID: ' + node.iid)
    this.smallsvg.select('#Age').text('Age: ' + node.age)
    this.smallsvg.select('#Sex').text('Sex: ' + gender)
    this.smallsvg.select('#Race').text('Race: ' + race)
    this.smallsvg.select('#Occupation').text('Occupation: ' + occupation)
    this.smallsvg.select('#Goal').text('Goal: ' + goal)
    this.smallsvg.select('#Alma-Mater').text('Alma Mater: ' + undergraduate)

}

NodeVis.prototype.onRaceChange = function(races){

    that.race_check = false;

    races.forEach(function(d){
        if (d != "") {
            that.race_check = true;
        }
    })
    
    that.update_race = races;

    this.updateNode();

}

NodeVis.prototype.onCareerChange = function(careers){

    that.occupation_check = false;

    careers.forEach(function(d){
        if (d != "") {
            that.occupation_check = true;
        }
    })
    
    that.update_occupation = careers;
    
    this.updateNode();

}

NodeVis.prototype.onGoalChange = function(goals){

    that.goal_check = false;

    goals.forEach(function(d){
        if (d != "") {
            that.goal_check = true;
        }
    })
    
    that.update_goal = goals;
    
    this.updateNode();

}

NodeVis.prototype.updateNode = function(selector){

    var filter = d3.selectAll('.node')
        .classed('filter', false)

    if (that.race_check == true) {
        filter = filter
            .filter(function(d, i) {if (that.update_race.indexOf(d.race)>=0){return true}})
    }
    if (that.occupation_check == true) {
        filter = filter
            .filter(function(d, i) {if (that.update_occupation.indexOf(d.career_c)>=0){
                if (d.career_c != "") {
                    return true
                }
            }})
    }
    if (that.goal_check == true) {
        filter = filter
            .filter(function(d, i) {if (that.update_goal.indexOf(d.goal)>=0){return true}})
    }
    
    var filtered = d3.selectAll('.node')

    if ((that.race_check == true) || (that.occupation_check == true) || (that.goal_check == true)) {
        filter
            .filter(function(d) {if (d.gender == '0'){return true}})
            .classed('filter', true)
            .select('image')
            .attr("xlink:href", "image/girl_glow.png")
            .attr("width", that.gSize)
            .attr("height", that.gSize)
            filtered = d3.selectAll('.node:not(.filter)')
        filter
            .filter(function(d) {if (d.gender == '1'){return true}})
            .classed('filter', true)
            .select('image')
            .attr("xlink:href", "image/boy_glow.png")
            .attr("width", that.bSize)
            .attr("height", that.bSize)
            filtered = d3.selectAll('.node:not(.filter)')
    }

    filtered
        .filter(function(d) {if (d.gender == '0'){return true}})
        .select('image')
        .attr("xlink:href", "image/girl.png")
        .attr("width", that.gSize)
        .attr("height", that.gSize)

    filtered
        .filter(function(d) {if (d.gender == '1'){return true}})
        .select('image')
        .attr("xlink:href", "image/boy.png")
        .attr("width", that.bSize)
        .attr("height", that.bSize)

    if (typeof selector !== 'undefined') {
        console.log(selector[0][0])
        selector
            .select('image')
            .attr("xlink:href", "image/female.png")
    }
}

/**
 * the drawing function - should use the D3 selection, enter, exit
 * @param _options -- only needed if different kinds of updates are needed
 */
NodeVis.prototype.filter = function(wave){
    this.wave = wave
    return this.data[wave]['values'];
}

NodeVis.prototype.linkClick = function(iid){
    var selector = d3.selectAll('.node')
        .filter(function(d) {if (parseInt(d.iid) == iid){return true}})

    this.updateNode(selector)

}

/**
 * Helper Functions
**/


