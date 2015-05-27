//actual simbolo que se esta comparando
var current_selected_value = "";

//Este modulo es dependiente de, D3,C3,Polyglot
var StockTools = function (raiz, periodos) {
    'use strict';

    var ids = [];
    var self = this;


    function init() {

        var header = d3.select(raiz).append("div")
            .attr("class", "c3-header");

        // Crea el contenedor de los periodos
        var p = header.append("div")
            .attr('class', 'c3-periodos-contenedor')
            .append("ul")
            .attr('class', 'c3-periodos');

        // Crea el contenedor de los intervalos (input para las fechas)
        var intervalos = header.append("div")
            .attr('class', 'c3-intervalos-contenedor')
            .append("ul")
            .attr('class', '');

        var li = intervalos.append("li");

        li.append("a").attr('href', '#').text("Fechas");
        var divFechas = li.append('ul').append('li').append('div').attr("class", 'form-intervalos-fechas');

        var inicio = divFechas.append("div").attr('class', 'divFechas');
        inicio.html('<span>' + i18n.t("from") + ':</span><input type="text" name="inicio" id="inicio" value="' + datos.columns[0][1] + '">');

        var fin = divFechas.append("div").attr('class', 'divFechas');
        fin.html('<span>' + i18n.t("to") + ':</span><input type="text" name="fin" id="fin" value="' + datos.columns[0][datos.columns[0].length - 1] + '">');

        var botonActualizar = divFechas.append("div").attr('class', 'btn-Actualizar-contenedor');
        botonActualizar.html('<input id="btn-actualizar" type="button" value="OK">');

        divFechas.append('div').style('clear', 'both');

        // Div contenedor de los botones
        var botones = header.append("div")
            .attr('class', 'c3-botones')
            .append("ul")
            .attr('class', 'c3-botones');

        botonActualizar.select("input").on('click', self.e_update_click);

        // Boton Actualizar
        //botones.append("li")
        //    .attr("id", "update")
        //    .on('click', self.e_update_click)
        //    .append("a")
        //    .attr('href', '#')
        //    .text("Actualizar");

        // Botones para comparar
        datos.columns.forEach(function (d, i) {
            if (i > 0) {
                ids.push(datos.columns[i][0]);
            }
        });
        ids[0] = i18n.t("cmp");

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

        select.on("change", self.e_comparar_click);

        header.append("div")
            .attr('class', 'c3-clear-header')
            .style('clear', 'both');

        // Crea todos los botones de los periodos
        p.selectAll("botones")
            .data(periodos)
            .enter()
            .append("li")
            //.attr("type", "button")
            .attr("class", function (p) {
                return p.seleccionado ? "button selected" : "button";
            })
            .attr("data-value", function (p) {
                return p.cantidad;
            })
            .attr("data-tipo", function (p) {
                return p.tipo;
            })
            .on('click', self.e_click_periodo)
            .append("a")
            .attr("href", "#")
            .attr("class", function (p) {
                return p.seleccionado ? "activo" : "";
            })
            .text(function (d) {
                return d.texto;
            });

        //Estableciendo la fecha inicial acorde con el periodo seleccionado
        self.m_establecer_fecha_inicial();
    }

    self.m_establecer_fecha_inicial = function () {
        var p = d3.select(".c3-periodos .selected");
        if (p[0][0] != null) {
            var tipo = p.attr('data-tipo');
            var cantidad = p.attr('data-value');
            var fechaInicio = self.m_getFechaInicio(tipo, cantidad);
            document.getElementById("inicio").value = formatDate(fechaInicio);
        }
    }

    //Evento click  en un boton del periodo
    self.e_click_periodo = function () {

        //Si da click en el que tengo activo entonces no hago nada
        var a = d3.select(this).select('a.activo');
        if (a[0][0] != null)
            return;

        //Valor del periodo clickeado
        var cantidad = d3.select(this).attr("data-value");

        //Tipo de periodo
        var tipo = d3.select(this).attr("data-tipo");

        //Ultima fecha de los datos a graficar
        var posLastDate = datos.columns[0].length - 1;
        var fechaFin = parseDate(datos.columns[0][posLastDate]);
        var fechaInicio = self.m_getFechaInicio(tipo, cantidad);

        if (m_intervalo_Correcto(fechaInicio, fechaFin)) {

            //Actualizo las fechas en los campos de texto
            document.getElementById("inicio").value = formatDate(fechaInicio);
            document.getElementById("fin").value = formatDate(fechaFin);

            //Desactivo el periodo que estaba seleccionado y Activo el nuevo
            d3.select('.c3-periodos a.activo').classed("activo", false);
            d3.select(this).select('a').classed("activo", true);

            //Si estamos comparando, enteonces recalcular y graficar cargar los nuevos datos
            if (comparando) {
                var datos_a_cargar = [];

                //esta es los datos de comparacion de la 1ra empresa, que es la que se compara con las demas
                var r1 = self.m_calcular_comparacion(datos.columns[1][0], 1, formatDate(fechaInicio), formatDate(fechaFin));

                var index = document.getElementsByClassName("c3_cmp")[0].selectedIndex;
                var r2 = self.m_calcular_comparacion(current_selected_value, (index + 1), formatDate(fechaInicio), formatDate(fechaFin));
                datos_a_cargar.push(r1);
                datos_a_cargar.push(r2);
                var dominio = [fechaInicio, fechaFin];
                chart.zoom(dominio);
                chart2.zoom(dominio);
                chart3.internal.brush.extent(dominio).update();
                chart.load({columns: datos_a_cargar});
            } else {
                //Actualizo la grafica
                m_updateGrafica(fechaInicio, fechaFin);
            }
        }
        else
            throw new Error("No hay datos para este intervalo");
    }

    //Obtiene la fecha de inicio segun el tipo del periodo y la cantidad que se le pase
    self.m_getFechaInicio = function (tipo, cantidad) {

        //Ultima fecha de los datos a graficar
        var posLastDate = datos.columns[0].length - 1;
        var fechaFin = parseDate(datos.columns[0][posLastDate]);

        var fechaInicio = new Date(fechaFin.getTime());

        switch (tipo) {
            case "dia":
                fechaInicio.setDate(fechaFin.getDate() - cantidad);
                break;
            case "mes":
                fechaInicio.setMonth(fechaFin.getMonth() - cantidad);
                break;
            case "anno":
                fechaInicio.setYear(fechaFin.getFullYear() - cantidad);
                break;
            case "hasta_la_fecha":
                var ano = new Date().getFullYear();

                //1er dia del ano
                var dia_uno = new Date(fechaFin.getFullYear(), 0, 1);
                var pos = bisect(datos.columns[0], dia_uno);
                fechaInicio = parseDate(datos.columns[0][pos]);
                break;
        }
        return fechaInicio;
    }

    self.e_update_click = function () {
        var fechaInicio = parseDate(document.getElementById("inicio").value);
        var fechaFin = parseDate(document.getElementById("fin").value);
        if (m_intervalo_Correcto(fechaInicio, fechaFin)) {

            //Desactivo el periodo que estaba seleccionado y Activo el nuevo
            d3.select('.c3-periodos a.activo').classed("activo", false);
            //d3.select(this).select('a').classed("activo", true);

            if (comparando) {

                var datos_a_cargar = [];

                //esta es los datos de comparacion de la 1ra empresa, que es la que se compara con las demas
                var r1 = self.m_calcular_comparacion(datos.columns[1][0], 1, formatDate(fechaInicio), formatDate(fechaFin));

                var index = document.getElementsByClassName("c3_cmp")[0].selectedIndex;
                var r2 = self.m_calcular_comparacion(current_selected_value, (index + 1), formatDate(fechaInicio), formatDate(fechaFin));
                datos_a_cargar.push(r1);
                datos_a_cargar.push(r2);
                var dominio = [fechaInicio, fechaFin];
                chart.zoom(dominio);
                chart2.zoom(dominio);
                chart3.internal.brush.extent(dominio).update();
                chart.load({columns: datos_a_cargar});
            } else
                m_updateGrafica(fechaInicio, fechaFin);
        }
        else
            throw new Error("No hay datos para este intervalo");
    }

    //return la pos donde se encuentra esta fecha en los datos originales
    self.m_buscarFecha = function (fecha) {
        return datos.columns[0].indexOf(fecha);
    }

    self.m_calcular_comparacion = function (empresa, posEmpresa, fechaInicio, fechaFin) {
        var result = [empresa];
        var posStart = self.m_buscarFecha(fechaInicio);
        var posEnd = self.m_buscarFecha(fechaFin);

        var baseValue = +datos.columns[posEmpresa][posStart];
        datos.columns[posEmpresa].forEach(function (d, i) {
            if (i > 0) {
                if (i >= posStart && i <= posEnd) {
                    var currentValue = +d;
                    var t = (currentValue / baseValue) - 1;
                    t = +t.toFixed(2);
                    result.push(t);
                } else {
                    result.push(null);
                }
            }
        });
        return result;
    }

    //Restaura la grafica completamente
    self.m_restaurar_grafica = function () {

        //Si estan comparando
        if (comparando) {
            chart.load({
                columns: [
                    datos.columns[1]
                ],
                unload: [current_selected_value]
            });
        } else {
            alert("no estas comparando");
        }
    }

    //Click en el select para comparar
    self.e_comparar_click = function () {

        var last = "";
        if (current_selected_value != "") {
            last = current_selected_value;
        }

        var empresa = this.options[this.selectedIndex].value;
        //console.info("Seleccionado: " + empresa);
        var fechaInicio = parseDate(document.getElementById("inicio").value);
        var fechaFin = parseDate(document.getElementById("fin").value);

        var datos_a_cargar = [];

        if (m_intervalo_Correcto(fechaInicio, fechaFin)) {

            // Si se selecciona cualquier opcion menos (Seleccione)
            if (this.selectedIndex != 0) {
                comparando = true;
                current_selected_value = empresa;

                //esta es los datos de comparacion de la 1ra empresa, que es la que se compara con las demas
                var r1 = self.m_calcular_comparacion(datos.columns[1][0], 1, formatDate(fechaInicio), formatDate(fechaFin));

                var r2 = self.m_calcular_comparacion(empresa, (this.selectedIndex + 1), formatDate(fechaInicio), formatDate(fechaFin));
                datos_a_cargar.push(r1);
                datos_a_cargar.push(r2);
                if (last != "") {
                    chart.load({
                        columns: datos_a_cargar,
                        unload: [last]
                    });
                } else {
                    chart.load({columns: datos_a_cargar});
                }
            } else {
                self.m_restaurar_grafica(fechaInicio, fechaFin);
                current_selected_value = "";
                comparando = false;
            }
        } else
            throw new Error("Intervalo incorrecto");
    }

    //Crea los componentes y sus eventos
    init();
};

//Dev true si las fechas estan en el intervalo de los datos
//si no se especifica la fechaFin se entiende que es hasta la ultima fecha de los datos
function m_intervalo_Correcto(fechaInicio, fechaFin) {

    var posLastDate = datos.columns[0].length - 1;
    var inicioDatos = parseDate(datos.columns[0][1]);
    var finDatos = parseDate(datos.columns[0][posLastDate]);
    fechaFin || (fechaFin = finDatos);
    //console.info(fechaInicio, fechaFin);
    //console.info(inicioDatos, finDatos);

    return fechaInicio >= inicioDatos && fechaFin <= finDatos;
}

//Metodo auxiliar hacer algunas y luego actualizar
function m_aux_Update(obj_stock, fechaInicio, fechaFin) {
    document.getElementById("inicio").value = formatDate(fechaInicio);
    document.getElementById("fin").value = formatDate(fechaFin);
    obj_stock.e_update_click();
}

function m_updateGrafica(fechaInicio, fechaFin) {
    //console.log("fecha fin" + fechaFin);
    var dominio = [fechaInicio, fechaFin];
    chart.zoom(dominio);
    chart2.zoom(dominio);

    //actualiza el brush si existe
    chart3.internal.brush.extent(dominio).update();
    //
    //d3.select("#inicio").attr('value', formatDate(fechaInicio));
    //d3.select("#fin").attr('value', formatDate(fechaFin));
}
