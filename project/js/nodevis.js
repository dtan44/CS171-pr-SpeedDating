
NodeVis = function(_parentElement, _data, _eventHandler){
    this.parentElement = _parentElement;
    this.data = _data;
    this.eventHandler = _eventHandler;
    this.displayData = [];


    this.width = 800;
    this.height = 450;
    this.graph = {nodes: [], links: []};
    this.nb_nodes = this.data.length;
    this.wave = 1 - 1;
    this.widthScale = d3.scale.linear().range([0, this.width*.9])

    this.tick = function(e) {

        var k = .1 * e.alpha;

        that.graph.nodes.forEach(function(o, i) {
            if (o.gender == '1') {
                o.y += (60 - o.y) * k;
                o.x += (i*20 - o.x) * k * .1;
            }
            else {
                o.y += (450 - o.y) * k;
                o.x += (i*80 - o.x) * k * .1;
            }
        });

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

        that.node
            .classed("node--target", function(n) { return n.target; })
            .classed("node--source", function(n) { return n.source; });
    }

    // run when node is mouse-outed
    this.mouseout = function(d) {
        that.link
          .classed("link--target", false)
          .classed("link--source", false);

        that.node
          .classed("node--target", false)
          .classed("node--source", false);
    }

    // run when node clicked
    this.nodeclick = function(node) {
        $(that.eventHandler).trigger('nodeclick', node);
    }

    this.getID = function(id) {
        for (i=0,j=that.displayData.length; i<j; i++){
            if (that.displayData[i]['iid'] == id){
                return i;
            }
        }
    }


    this.toolover = function(d) {
        that.div.transition()        
            .duration(200)      
            .style("opacity", .9);      
        that.div 
            .html(d.id + "<br/>")  
            .style("left", (d3.event.pageX) + "px")     
            .style("top", (d3.event.pageY - 28) + "px");   
    }

    this.toolout = function(d) {
        that.div.transition()        
            .duration(500)      
            .style("opacity", 0); 
    }

    this.initVis();

}
/**
 * Method that sets up the SVG and the variables
 */
NodeVis.prototype.initVis = function(){
console.log(this.data)
    that = this; // read about the this

    this.svg = this.parentElement.append('svg')
                    .attr('width', that.width)
                    .attr('height', that.height)
                    .attr('style', "background-color: lightblue");
    
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
        .on("click", that.nodeclick);
        
    d3.selectAll('image').remove()

    this.maleNodes = d3.selectAll('.node').filter(function(d,i) {if (d.gender == '1') {return true}})
        
    this.maleNodes
        .append('image')
        .attr("xlink:href", "../image/male.png")
        .attr("x", -15)
        .attr("y", -15)
        .attr("width", 30)
        .attr("height", 30);

    this.femaleNodes = d3.selectAll('.node').filter(function(d,i) {if (d.gender == '0') {return true}})
        
    this.femaleNodes
        .append('image')
        .attr("xlink:href", "../image/female.png")
        .attr("x", -8)
        .attr("y", -8)
        .attr("width", 16)
        .attr("height", 16);

    // append node points
    /*this.node.append("circle")
        .attr('r', 6)
        .style("fill", function(d) {if (d.gender == 0){return "DeepPink"} else {return "blue"} } )
*/

    this.node.exit()
        .remove()


    this.force
        .nodes(this.graph.nodes)
        .links(this.graph.links)
        .start()

    this.force.stop()

    var position = 0;
    this.graph.nodes.forEach(function(d, i){
        if (parseInt(d.id) > position) {
            position = parseInt(d.id);
        }
    })

    this.widthScale.domain([0, position])

    this.graph.nodes.forEach(function(d, i){
        if (d.gender == '1') {
            d.y = that.height/4;
            d.x = that.widthScale(d.id);
        }
        else {
            d.y = that.height/4*3;
            d.x = that.widthScale(d.id);
        }
    })

    this.graph_update(500)
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


