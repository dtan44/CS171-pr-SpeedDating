
NodeVis = function(_parentElement, _data, _eventHandler){
    this.parentElement = _parentElement;
    this.data = _data;
    this.eventHandler = _eventHandler;
    this.displayData = [];


    this.width = 650;
    this.height = 330;
    this.graph = {nodes: [], links: []};
    this.nb_nodes = this.data.length;
    this.wave = 1 - 1;

    this.tick = function(e) {
        that.graph_update(10);
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

    this.getID = function(id) {
        for (i=0,j=that.displayData.length; i<j; i++){
            if (that.displayData[i]['iid'] == id){
                return i;
            }
        }
    }

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
                    .attr('style', "background-color: lightblue");
    
    this.force = d3.layout.force()
        .size([that.width, that.height])
        .on("tick", this.tick)
        .on("start", function(d) {})
        .on("end", function(d) {})
        .linkDistance(that.width/4)
        .linkStrength(0.1)
        .start();
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
    this.graph.nodes = this.displayData;

    this.graph.nodes.forEach(function(d, i) {
        for (c=0,e=d.people.length;c<e;c++){
            if (d.people[c].match == "1") {
                that.graph.links.push({"source": +i, "target": that.getID(d.people[c].pid)});
            }
        }
    })

    // links not removing for some reason
    d3.selectAll(".link").style('display', 'none')


    // add and bind links
   this.link = this.svg.selectAll(".link")
        .data(that.graph.links);

    this.link.enter().append("line")
        .attr("class", "link")
        .style('stroke', 'white')

    this.link.exit()
        .remove()

    // add and bind nodes
    this.node = this.svg.selectAll(".node")
        .data(that.graph.nodes)
    
    this.node.enter()
        .append("g").attr("class", "node")

    // append node points
    this.node.append("circle")
        .attr('r', 3)
        .style("fill", function(d) {if (d.gender == 0){return "DeepPink"} else {return "blue"} } )
    
    this.node.exit()
        .remove()

    this.link.attr('x1', function(d) { return d.source.x; })
        .attr('y1', function(d) { return d.source.y; })
        .attr('x2', function(d) { return d.target.x; })
        .attr('y2', function(d) { return d.target.y; });


    this.force
        .stop()
        .nodes(this.graph.nodes)
        .links(this.graph.links)
        .start()
    
    that.node.classed("fixed", true)

    this.graph.nodes.forEach(function(d, i){
        d.x = i*20
        if (d.gender == '0') {
            d.y = 300
        }
        else {
            d.y = 100
        }
    })
    this.tick()
}

/**
 * the drawing function - should use the D3 selection, enter, exit
 * @param _options -- only needed if different kinds of updates are needed
 */
NodeVis.prototype.filter = function(wave){
    return this.data[wave]['values'];
}

/**
 * Gets called by event handler and should create new aggregated data
 * aggregation is done by the function "aggregate(filter)". Filter has to
 * be defined here.
 * @param selection
 */
NodeVis.prototype.onSelectionChange= function (selectionStart, selectionEnd){

    // TODO: call wrangle function

    // do nothing -- no update when brushing


}

/**
 * Helper Functions
**/


