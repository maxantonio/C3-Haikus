var StockTools = function (raiz, periodos) {
    'use strict';

    //Crea los componentes
    init();

    function init() {

        var header = d3.select(raiz).append("div")
            .attr("class", "c3-header");

        // Crea el contenedor de los periodos
        var p = header.append("div")
            .attr('class', 'c3-periodos')
            .style('float', 'left');

        // Crea el contenedor de los intervalos (input para las fechas)
        var intervalos = header.append("div")
            .attr('class', 'c3-intervalos')
            .style('float', 'left');

        // Crea el texto y el input para la fecha inicial
        intervalos.append("span").text("Desde: ");
        intervalos.append("input")
            .attr("type", "text")
            .attr("name", "inicio")
            .attr("id", "inicio");

        // Crea el texto y el input para la fecha final
        intervalos.append("span").text("Hasta: ");
        intervalos.append("input")
            .attr("type", "text")
            .attr("name", "fin")
            .attr("id", "fin");

        // Div contenedor de los botones
        var botones = header.append("div")
            .attr('class', 'c3-botones')
            .style('float', 'left');

        // Boton Actualizar
        botones.append("button")
            .attr("id", "update")
            .attr("type", "button")
            .text("Actualizar")
            .on('click', update_click);

        header.append("div")
            .attr('class', 'c3-clear-header')
            .style('clear', 'both');

        // Crea todos los botones de los periodos
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


        //Evento click  en un boton del periodo
        function click_periodo() {

            //Valor del periodo clickeado
            var cantidad = d3.select(this).attr("data-value");

            //Tipo de periodo
            var tipo = d3.select(this).attr("data-tipo");

            //Ultima fecha de los datos a graficar
            var posLastDate = datos.columns[0].length - 1;

            var fechaFin = parseDate(datos.columns[0][posLastDate]);
            var fechaInicio = new Date(fechaFin.getTime());

            // Inicio y fin de los datos
            var inicioDatos = parseDate(datos.columns[0][1]);
            var finDatos = fechaFin;

            switch (tipo) {
                case "dia":
                    fechaInicio.setDate(fechaFin.getDate() - cantidad);
                    break;
                case "mes":
                    fechaInicio.setMonth(fechaFin.getMonth() - cantidad);
                    break;
                case "anno":
                    fechaInicio.setYear(fechaFin.getFullYear() - cantidad); //Le resta 2 años
                    break;
                case "hasta_la_fecha":
                    fechaInicio = new Date(fechaFin.getFullYear(), 0, 1);
                    break;
            }

            if (Intervalo_Correcto(inicioDatos, finDatos, fechaInicio, fechaFin)) {
                updateGrafica(fechaInicio, fechaFin);
                document.getElementById("inicio").value = formatDate(fechaInicio);
                document.getElementById("fin").value = formatDate(fechaFin);
            }
            else
                throw new Error("No hay datos para este intervalo");
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

        //Dev true si las fechas estan en el intervalo de los datos
        function Intervalo_Correcto(inicioDatos, finDatos, fechaInicio, fechaFin) {
            return fechaInicio >= inicioDatos && fechaFin <= finDatos;
        }
    }

};