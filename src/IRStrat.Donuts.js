/**
 * Usa d3.layout.customPie
 */
IDonuts = function(source,config ) {
    'use strict';
    var valores = config.values;
    //actual simbolo que se esta comparando
    var current_selected_value = "";
    var ids = [];

    //Crea los componentes
    init();

    function init() {
        var width = 400, height = 400;
        //seteo ancho grafico si se pasa por configuracion
        if(config.width){
            width = config.width;
        }
        //seteo alto grafico si se pasa por configuracion
        if(config.height){
            height = config.height;
        }

        var header = d3.select(source).append("div").attr("class", "d3-chart");
        //agrego titulo del grafico si se pasa por configuracion
        if(config.title)
            header.append("div")
                .attr("class","title")
                .append("text")
                .text(config.title)
                .style("margin-left",function(d){
                     return ((width / 2)-(config.title.length*5))+"px"
                 }).style("color","rgb(120,120,121);");

            ;

        if(config.subtitle)
            header.append("div").attr("class","subtitle").append("text").text(config.subtitle).style("margin-left", function(d){
               return ((width / 2)-(config.subtitle.length*5))+"px";
            });
        //seteo valor por defecto tamaño grafico

//
        var outerRadius = height/2 , innerRadius = outerRadius -40, cornerRadius = 100;
        var outerRadiuss = [outerRadius,outerRadius-25,outerRadius-50] ;
        var innerRadiuss = [innerRadius,innerRadius-25,innerRadius-50] ;

        var svg = header.append("div").append("svg").attr("width", width).attr("height", height)
            .append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

        var arcs = new Array();
        var pie = d3.layout.customPie();

    //      agrego div para tooltip
        var tooltip = d3.select(source)
            .append('div')
            .attr('class', 'tooltip');
    //      agrego div que muestra categoria
        tooltip.append('div')
            .attr('class', 'label');
    //agrego div que muestra cantidad
        tooltip.append('div')
            .attr('class', 'count');



for (var i=0; i < valores.length; i++){
    arcs.push(d3.svg.arc().padRadius(outerRadiuss[i]).innerRadius(innerRadiuss[i]));

    var g = svg.selectAll()
        .data(pie(valores[i]))
        .enter().append("g")
        .attr("class", "arc");

    g.append("path")
        .each(function(d) {
            d.outerRadius = outerRadiuss[i] - 20;
        })
        .attr("d", arcs[i])
        .attr("class",function(d,j){
            return "arc0"+i;
        }).on('mouseover', function(d){
            tooltip.select('.label').html(d.key);
            tooltip.select('.count').html(d.value+ '%');
            tooltip.style('display', 'block');
        }).on('mousemove', function(d) {
        tooltip.style('top', (d3.event.pageY + 10) + 'px')
            .style('left', (d3.event.pageX + 10) + 'px');
    }).on('mouseout', function() {
            tooltip.style('display', 'none');
        });

    g.append("text")
        .attr("transform", function(d) { return "translate(-25,"+(-(outerRadius-30)+i*25)+")"; })
        .attr("dy", ".35em")
        .style("text-anchor", "middle")
        .style("foreground","red")
        .attr("class","textValue")
        .text(valores[i].value+"%");
}
    }}