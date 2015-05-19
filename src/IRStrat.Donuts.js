/**
 * Usa d3.layout.customPie
 */
IDonuts = function(source,config ) {
    'use strict';
    var valores = config.values;
    //colores por defecto de los arcos
    var colores = ['#787879','#24528A','#AFB0B0'];

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

        //seteo colores si se pasa por configuracion
        if(config.colors){
            colores = config.colors;
        }

        var chart = d3.select(source).append("div").attr("class", "d3-chart");
        //agrego titulo del grafico si se pasa por configuracion
        if(config.title)
            chart.append("div")
                .attr("class","title")
                .append("text")
                .text(config.title)
                .style("margin-left",function(){
                     return ((width / 2)-(config.title.length*5))+"px"
                 }).style("color","rgb(120,120,121);");
        //agrego titulo del grafico si se pasa por configuracion
        if(config.subtitle)
            chart.append("div").attr("class","subtitle").append("text").text(config.subtitle).style("margin-left", function(){
               return ((width / 2)-(config.subtitle.length*5))+"px";
            });
        //seteo valor por defecto tamaño grafico

//
        var outerRadius = height/2 , innerRadius = outerRadius -40;
        var outerRadiuss = [outerRadius,outerRadius-25,outerRadius-50] ;
        var innerRadiuss = [innerRadius,innerRadius-25,innerRadius-50] ;

        var svg = chart.append("div").append("svg").attr("width", width).attr("height", height)
            .append("g").attr("transform", "translate(" + width / 2 + "," + ((height / 2)-13) + ")");

        var arcs = [];
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
            d.outerRadius = outerRadiuss[i] - 23;
        })
        .attr("d", arcs[i])
        .attr("fill",colores[i])
        //.attr("class",function(){
        //    return "arc0"+i;
        //})
        .on('mouseover', function(d){
            tooltip.select('.label').html(d.key);
            tooltip.select('.count').html(d.value+ '%');
            tooltip.style('display', 'block');
        }).on('mousemove', function() {
        tooltip.style('top', (d3.event.pageY + 10) + 'px')
            .style('left', (d3.event.pageX + 10) + 'px');
    }).on('mouseout', function() {
            tooltip.style('display', 'none');
        });

    g.append("text")
        .attr("transform", function() { return "translate(-30,"+(-(outerRadius-30)+i*25)+")"; })
        .attr("dy", ".35em")
        .style("text-anchor", "middle")
        .style("color","red")
        .attr('font-family','Arial')
        .attr('font-size',15)
        .attr('font-weight',900)
        .attr('fill','#484748')
        .attr("class","textValue")
        .text(valores[i].value+"%");
}
        if(config.save){
            if(!config.save.text){
                config.save.text = 'SAVE AS PNG';
            }
            console.log(  config.save.text);
            chart.append('input').attr('type','button').attr('id','save').attr('value',config.save.text);
            d3.select("#save").on("click", function(){
                var html = d3.select("svg")
                    .attr("version", 1.1)
                    .attr("xmlns", "http://www.w3.org/2000/svg")
                    .node().parentNode.innerHTML;
                //console.log(html);
                var imgsrc = 'data:image/svg+xml;base64,'+ btoa(html);
                var img = '<img src="'+imgsrc+'" >';

                d3.select("#svgdataurl").style('display','none').html(img);
                chart.append('canvas').attr("width", width).attr("height", height).style('display','none');
                var canvas = document.querySelector("canvas"),
                    context = canvas.getContext("2d");
                console.log(canvas);
                var image = new Image();
                image.src = imgsrc;
                image.onload = function() {
                    context.drawImage(image, 0, 0);
                    var canvasdata = canvas.toDataURL("image/png");
                    var pngimg = '<img src="'+canvasdata+'">';
                    d3.select("#pngdataurl").style('display','none').html(pngimg);
                    var a = document.createElement("a");
                    a.download = "sample.png";
                    a.href = canvasdata;
                    a.click();
                    console.log("salvando");
                };
            });
        }
        else{
            console.log("NO TIENE SAVE");
        }
    }


}