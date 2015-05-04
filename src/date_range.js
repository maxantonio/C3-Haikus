////test
//var tiempo = ['x', '2013-01-01', '2013-01-02', '2013-01-03', '2013-01-04', '2013-01-05', '2013-01-06'];
//tiempo = tiempo.slice(1, tiempo.length);
//
////Selecciona el periodo
//function todo() {
//    chart.axis.min({x: tiempo[0]});
//};
//
//function tresdias() {
//    chart.axis.min({x: tiempo[tiempo.length - 3]});
//};


var M = function (raiz, periodos) {

    init();

    function init() {
        var header = d3.select(raiz).append("div")
            .attr("class", "c3-header");

        var p = header.append("div")
            .attr('class', 'c3-periodos')
            .style('float', 'left');

        var intervalos = header.append("div")
            .attr('class', 'c3-intervalos')
            .style('float', 'left');

        intervalos.append("span").text("Desde: ");

        intervalos.append("input")
            .attr("type", "text")
            .attr("name", "inicio")
            .attr("id", "inicio");

        intervalos.append("span").text("Hasta: ");
        intervalos.append("input")
            .attr("type", "text")
            .attr("name", "fin")
            .attr("id", "fin");


        var botones = header.append("div")
            .attr('class', 'c3-botones')
            .style('float', 'left');

        botones.append("button")
            .attr("id", "update")
            .attr("type", "button")
            .text("Update")
            .on('click', update_click);

        header.append("div")
            .attr('class', 'c3-clear-header')
            .style('clear', 'both');

        p.selectAll("botones")
            .data(periodos)
            .enter()
            .append("button")
            .attr("type", "button")
            .attr("class", function (p, i) {
                return "button" + i;
            })
            .attr("data-value", function (p) {
                return p.cantidad;
            })
            .attr("data-tipo", function (p) {
                return p.tipo;
            })
            .text(function (d) {
                return d.texto;
            }).on('click', click_periodo);


        function click_periodo() {

            var cantidad = d3.select(this).attr("data-value");
            var tipo = d3.select(this).attr("data-tipo");

            var posLastDate = datos.columns[0].length - 1;
            var lastDate = parseDate(datos.columns[0][posLastDate]);
            var fechaInicio = null, fechaFin = null;

            if (tipo == "dia") {
                fechaInicio = new Date(lastDate.getTime());
                fechaInicio.setDate(lastDate.getDate() - cantidad);
                fechaFin = lastDate;
                document.getElementById("inicio").value = formatDate(fechaInicio);
                document.getElementById("fin").value = formatDate(fechaFin);

            }

            updateGrafica(fechaInicio, fechaFin);

        }

        function updateGrafica(fechaInicio, fechafin) {
            chart.axis.min({x: formatDate(fechaInicio)});
            chart.axis.max({x: formatDate(fechafin)});
        }

        function update_click() {
            var fechaInicio = parseDate(document.getElementById("inicio").value);
            var fechaFin = parseDate(document.getElementById("fin").value);
            updateGrafica(fechaInicio, fechaFin);
        }
    }


};