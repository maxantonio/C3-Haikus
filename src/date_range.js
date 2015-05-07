//Este modulo es dependiente de, D3,C3,Polyglot
var StockTools = function (raiz, periodos) {
    'use strict';

    //actual simbolo que se esta comparando
    var current_selected_value = "";
    var ids = [];

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
        intervalos.append("span").text(i18n.t("from"));
        intervalos.append("input")
            .attr("type", "text")
            .attr("name", "inicio")
            .attr("id", "inicio");

        // Crea el texto y el input para la fecha final
        intervalos.append("span").text(i18n.t("to"));
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
            .on('click', e_update_click);

        // Botones para comparar
        datos.columns.forEach(function (d, i) {
            if (i > 0) {
                ids.push(datos.columns[i][0]);
            }
        });
        ids[0] = i18n.t("select");

        var select = botones.append("select")
            .attr("class", "c3_cmp");

        select.selectAll("opciones")
            .data(ids)
            .enter()
            .append("option")
            .attr('class', 'opciones')
            .attr('data-id', function (d) {
                return d;
            })
            .attr('value', function (d) {
                return d;
            })
            .text(function (d) {
                return d;
            });

        select.on("change", e_comparar_click);

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
            }).on('click', e_click_periodo);


        //Evento click  en un boton del periodo
        function e_click_periodo() {

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

            if (m_intervalo_Correcto(fechaInicio, fechaFin)) {
                m_updateGrafica(fechaInicio, fechaFin);
                document.getElementById("inicio").value = formatDate(fechaInicio);
                document.getElementById("fin").value = formatDate(fechaFin);
            }
            else
                throw new Error("No hay datos para este intervalo");
        }

        function m_updateGrafica(fechaInicio, fechafin) {
            chart.axis.min({x: formatDate(fechaInicio)});
            chart.axis.max({x: formatDate(fechafin)});
        }

        function e_update_click() {
            var fechaInicio = parseDate(document.getElementById("inicio").value);
            var fechaFin = parseDate(document.getElementById("fin").value);
            m_updateGrafica(fechaInicio, fechaFin);
        }

        //Dev true si las fechas estan en el intervalo de los datos
        //si no se especifica la fechaFin se entiende que es hasta la ultima fecha de los datos
        function m_intervalo_Correcto(fechaInicio, fechaFin) {
            var posLastDate = datos.columns[0].length - 1;
            var inicioDatos = parseDate(datos.columns[0][1]);
            var finDatos = parseDate(datos.columns[0][posLastDate]);
            fechaFin || (fechaFin = finDatos);

            return fechaInicio >= inicioDatos && fechaFin <= finDatos;
        }

        function Ajustar_grids_X() {

        }

        //return la pos donde se encuentra esta fecha en los datos originales
        function m_buscarFecha(fecha) {
            return datos.columns[0].indexOf(fecha);
        }

        function m_calcular_comparacion(empresa, posEmpresa, fechaInicio, fechaFin) {
            var result = [empresa];
            var posStart = m_buscarFecha(fechaInicio);
            var posEnd = m_buscarFecha(fechaFin);

            var baseValue = +datos.columns[posEmpresa][posStart];
            datos.columns[posEmpresa].forEach(function (d, i) {
                if (i > 0) {
                    if (i >= posStart && i <= posEnd) {
                        var currentValue = +d;
                        var t = (currentValue / baseValue) - 1;
                        t = +t.toFixed(2);
                        result.push(t);
                    } else {
                        result.push(0);
                    }
                }
            });
            return result;
        }

        function e_comparar_click() {

            if (current_selected_value != "") {
                console.info("Quitar: " + current_selected_value);
                chart.unload(current_selected_value);
                //chart.unload({
                //    ids: [current_selected_value]
                //});

                //chart.hide({
                //    ids: ids.slice(1)
                //});
            }

            var empresa = this.options[this.selectedIndex].value;
            console.info("Seleccionado: " + empresa);
            var fechaInicio = parseDate(document.getElementById("inicio").value);
            var fechaFin = parseDate(document.getElementById("fin").value);

            var datos_a_cargar = [];

            if (m_intervalo_Correcto(fechaInicio, fechaFin)) {

                // Si se selecciona cualquier opcion menos (Seleccione)
                if (this.selectedIndex != 0) {
                    current_selected_value = empresa;

                    //esta es los datos de comparacion de la 1ra empresa, que es la que se compara con las demas
                    var r1 = m_calcular_comparacion(datos.columns[1][0], 1, document.getElementById("inicio").value, document.getElementById("fin").value);

                    var r2 = m_calcular_comparacion(empresa, (this.selectedIndex + 1), document.getElementById("inicio").value, document.getElementById("fin").value);
                    datos_a_cargar.push(r1);
                    datos_a_cargar.push(r2);
                    chart.load({columns: datos_a_cargar});
                } else {
                    current_selected_value = "";
                    //TODO restaurar la grafica a los datos que tenia antes de comparar
                    //alert("Restaurar la grafica, No esta implementado todavia")
                }


            } else
                throw new Error("Intervalo incorrecto");


        }
    }

};
