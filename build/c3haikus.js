;
;//     (c) 2012 Airbnb, Inc.
//
//     polyglot.js may be freely distributed under the terms of the BSD
//     license. For all licensing information, details, and documention:
//     http://airbnb.github.com/polyglot.js
//
//
// Polyglot.js is an I18n helper library written in JavaScript, made to
// work both in the browser and in Node. It provides a simple solution for
// interpolation and pluralization, based off of Airbnb's
// experience adding I18n functionality to its Backbone.js and Node apps.
//
// Polylglot is agnostic to your translation backend. It doesn't perform any
// translation; it simply gives you a way to manage translated phrases from
// your client- or server-side JavaScript application.
//

!function(root) {
  'use strict';

  // ### Polyglot class constructor
  function Polyglot(options) {
    options = options || {};
    this.phrases = {};
    this.extend(options.phrases || {});
    this.currentLocale = options.locale || 'en';
    this.allowMissing = !!options.allowMissing;
    this.warn = options.warn || warn;
  }

  // ### Version
  Polyglot.VERSION = '0.4.2';

  // ### polyglot.locale([locale])
  //
  // Get or set locale. Internally, Polyglot only uses locale for pluralization.
  Polyglot.prototype.locale = function(newLocale) {
    if (newLocale) this.currentLocale = newLocale;
    return this.currentLocale;
  };

  // ### polyglot.extend(phrases)
  //
  // Use `extend` to tell Polyglot how to translate a given key.
  //
  //     polyglot.extend({
  //       "hello": "Hello",
  //       "hello_name": "Hello, %{name}"
  //     });
  //
  // The key can be any string.  Feel free to call `extend` multiple times;
  // it will override any phrases with the same key, but leave existing phrases
  // untouched.
  //
  // It is also possible to pass nested phrase objects, which get flattened
  // into an object with the nested keys concatenated using dot notation.
  //
  //     polyglot.extend({
  //       "nav": {
  //         "hello": "Hello",
  //         "hello_name": "Hello, %{name}",
  //         "sidebar": {
  //           "welcome": "Welcome"
  //         }
  //       }
  //     });
  //
  //     console.log(polyglot.phrases);
  //     // {
  //     //   'nav.hello': 'Hello',
  //     //   'nav.hello_name': 'Hello, %{name}',
  //     //   'nav.sidebar.welcome': 'Welcome'
  //     // }
  //
  // `extend` accepts an optional second argument, `prefix`, which can be used
  // to prefix every key in the phrases object with some string, using dot
  // notation.
  //
  //     polyglot.extend({
  //       "hello": "Hello",
  //       "hello_name": "Hello, %{name}"
  //     }, "nav");
  //
  //     console.log(polyglot.phrases);
  //     // {
  //     //   'nav.hello': 'Hello',
  //     //   'nav.hello_name': 'Hello, %{name}'
  //     // }
  //
  // This feature is used internally to support nested phrase objects.
  Polyglot.prototype.extend = function(morePhrases, prefix) {
    var phrase;

    for (var key in morePhrases) {
      if (morePhrases.hasOwnProperty(key)) {
        phrase = morePhrases[key];
        if (prefix) key = prefix + '.' + key;
        if (typeof phrase === 'object') {
          this.extend(phrase, key);
        } else {
          this.phrases[key] = phrase;
        }
      }
    }
  };

  // ### polyglot.clear()
  //
  // Clears all phrases. Useful for special cases, such as freeing
  // up memory if you have lots of phrases but no longer need to
  // perform any translation. Also used internally by `replace`.
  Polyglot.prototype.clear = function() {
    this.phrases = {};
  };

  // ### polyglot.replace(phrases)
  //
  // Completely replace the existing phrases with a new set of phrases.
  // Normally, just use `extend` to add more phrases, but under certain
  // circumstances, you may want to make sure no old phrases are lying around.
  Polyglot.prototype.replace = function(newPhrases) {
    this.clear();
    this.extend(newPhrases);
  };


  // ### polyglot.t(key, options)
  //
  // The most-used method. Provide a key, and `t` will return the
  // phrase.
  //
  //     polyglot.t("hello");
  //     => "Hello"
  //
  // The phrase value is provided first by a call to `polyglot.extend()` or
  // `polyglot.replace()`.
  //
  // Pass in an object as the second argument to perform interpolation.
  //
  //     polyglot.t("hello_name", {name: "Spike"});
  //     => "Hello, Spike"
  //
  // If you like, you can provide a default value in case the phrase is missing.
  // Use the special option key "_" to specify a default.
  //
  //     polyglot.t("i_like_to_write_in_language", {
  //       _: "I like to write in %{language}.",
  //       language: "JavaScript"
  //     });
  //     => "I like to write in JavaScript."
  //
  Polyglot.prototype.t = function(key, options) {
    var phrase, result;
    options = options == null ? {} : options;
    // allow number as a pluralization shortcut
    if (typeof options === 'number') {
      options = {smart_count: options};
    }
    if (typeof this.phrases[key] === 'string') {
      phrase = this.phrases[key];
    } else if (typeof options._ === 'string') {
      phrase = options._;
    } else if (this.allowMissing) {
      phrase = key;
    } else {
      this.warn('Missing translation for key: "'+key+'"');
      result = key;
    }
    if (typeof phrase === 'string') {
      options = clone(options);
      result = choosePluralForm(phrase, this.currentLocale, options.smart_count);
      result = interpolate(result, options);
    }
    return result;
  };


  // #### Pluralization methods
  // The string that separates the different phrase possibilities.
  var delimeter = '||||';

  // Mapping from pluralization group plural logic.
  var pluralTypes = {
    chinese:   function(n) { return 0; },
    german:    function(n) { return n !== 1 ? 1 : 0; },
    french:    function(n) { return n > 1 ? 1 : 0; },
    russian:   function(n) { return n % 10 === 1 && n % 100 !== 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2; },
    czech:     function(n) { return (n === 1) ? 0 : (n >= 2 && n <= 4) ? 1 : 2; },
    polish:    function(n) { return (n === 1 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2); },
    icelandic: function(n) { return (n % 10 !== 1 || n % 100 === 11) ? 1 : 0; }
  };

  // Mapping from pluralization group to individual locales.
  var pluralTypeToLanguages = {
    chinese:   ['fa', 'id', 'ja', 'ko', 'lo', 'ms', 'th', 'tr', 'zh'],
    german:    ['da', 'de', 'en', 'es', 'fi', 'el', 'he', 'hu', 'it', 'nl', 'no', 'pt', 'sv'],
    french:    ['fr', 'tl', 'pt-br'],
    russian:   ['hr', 'ru'],
    czech:     ['cs'],
    polish:    ['pl'],
    icelandic: ['is']
  };

  function langToTypeMap(mapping) {
    var type, langs, l, ret = {};
    for (type in mapping) {
      if (mapping.hasOwnProperty(type)) {
        langs = mapping[type];
        for (l in langs) {
          ret[langs[l]] = type;
        }
      }
    }
    return ret;
  }

  // Trim a string.
  function trim(str){
    var trimRe = /^\s+|\s+$/g;
    return str.replace(trimRe, '');
  }

  // Based on a phrase text that contains `n` plural forms separated
  // by `delimeter`, a `locale`, and a `count`, choose the correct
  // plural form, or none if `count` is `null`.
  function choosePluralForm(text, locale, count){
    var ret, texts, chosenText;
    if (count != null && text) {
      texts = text.split(delimeter);
      chosenText = texts[pluralTypeIndex(locale, count)] || texts[0];
      ret = trim(chosenText);
    } else {
      ret = text;
    }
    return ret;
  }

  function pluralTypeName(locale) {
    var langToPluralType = langToTypeMap(pluralTypeToLanguages);
    return langToPluralType[locale] || langToPluralType.en;
  }

  function pluralTypeIndex(locale, count) {
    return pluralTypes[pluralTypeName(locale)](count);
  }

  // ### interpolate
  //
  // Does the dirty work. Creates a `RegExp` object for each
  // interpolation placeholder.
  function interpolate(phrase, options) {
    for (var arg in options) {
      if (arg !== '_' && options.hasOwnProperty(arg)) {
        // We create a new `RegExp` each time instead of using a more-efficient
        // string replace so that the same argument can be replaced multiple times
        // in the same phrase.
        phrase = phrase.replace(new RegExp('%\\{'+arg+'\\}', 'g'), options[arg]);
      }
    }
    return phrase;
  }

  // ### warn
  //
  // Provides a warning in the console if a phrase key is missing.
  function warn(message) {
    root.console && root.console.warn && root.console.warn('WARNING: ' + message);
  }

  // ### clone
  //
  // Clone an object.
  function clone(source) {
    var ret = {};
    for (var prop in source) {
      ret[prop] = source[prop];
    }
    return ret;
  }


  // Export for Node, attach to `window` for browser.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Polyglot;
  } else {
    root.Polyglot = Polyglot;
  }

}(this);
;//core translations Eng - ES
var i18n = new Polyglot();
i18n.locale(locale);

i18n.extend({
  //English
  "from": "From",
  "to": "To",
  "cmp": "Compare with",
  "date_range": "Date Range",
  "export": "Export to",
});

if (i18n.locale() == "es") i18n.extend({
  //Spanish
  "from": "Desde",
  "to": "Hasta",
   "cmp": "Comparar con",
   "date_range": "Rango de Fechas",
   "export": "Exportar a",
});
;//actual simbolo que se esta comparando
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
            .append("ul");

        var li = intervalos.append("li");

        li.append("a").attr('href', '#').text(i18n.t('date_range'));
        var divFechas = li.append('ul').append('li').append('div').attr("class", 'form-intervalos-fechas');

        var inicio = divFechas.append("div").attr('class', 'divFechas');
        inicio.html('<span>' + i18n.t("from") + ':</span><input type="text" name="inicio" id="inicio" value="' + datos.columns[0][1] + '">');
        inicio.select("input").on("keypress", self.e_input_enter);

        var fin = divFechas.append("div").attr('class', 'divFechas');
        fin.html('<span>' + i18n.t("to") + ':</span><input type="text" name="fin" id="fin" value="' + datos.columns[0][datos.columns[0].length - 1] + '">');
        fin.select("input").on("keypress", self.e_input_enter);

        var botonActualizar = divFechas.append("div").attr('class', 'btn-Actualizar-contenedor');
        botonActualizar.html('<input id="btn-actualizar" type="button" value="OK">');

        divFechas.append('div').style('clear', 'both');

        // Div contenedor de los botones
        var botones = header.append("div")
            .attr('class', 'c3-botones')
            .append("ul")
            .attr('class', 'c3-botones');

        botonActualizar.select("input").on('click', self.m_update);

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

        var formatos = [i18n.t("export"), 'png', 'jpeg', 'bmp'];

        var select_export = botones.append("select")
            .attr("class", "c3_export");

        select_export.selectAll("opciones")
            .data(formatos)
            .enter()
            .append("option")
            .attr('class', 'export_options')
            .attr('data-id', function (d) {
                return d;
            })
            .attr('value', function (d) {
                return d;
            })
            .text(function (d) {
                return d;
            });

        select_export.on("change", self.e_exportar_click);

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


    self.m_update = function () {
        if (self.m_fecha_correcta(document.getElementById("inicio").value) && self.m_fecha_correcta(document.getElementById("fin").value)) {
            self.e_update_click();
        }
    }

    self.e_input_enter = function () {
        if (d3.event.keyCode == 13) {
            self.m_update();
        }
        return false;
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

    //Click para exportar
    self.e_exportar_click = function () {
        var export_format = this.options[this.selectedIndex].value;

        if(export_format==i18n.t("export"))
            return;
        //arreglando propiedades que no funcionan en canvas
       d3.selectAll('.c3 path').attr('fill','transparent').attr('stroke','#000000');
       d3.selectAll('.tick line').attr('stroke','#000000');
       d3.selectAll('line.c3-xgrid').attr('stroke','#aaaaaa').attr('stroke-dasharray','3 3');
       d3.selectAll('line.c3-ygrid').attr('stroke','#aaaaaa').attr('stroke-dasharray','3 3');
       d3.selectAll('.c3-axis-x .tick text').attr('transform','translate(0,10)');
       d3.selectAll('.extent').attr('fill-opacity','0.1');
       d3.selectAll('.c3-chart').each(function(){
           var str = d3.select(this).attr('clip-path');
           var strquitar = str.substring(4, str.indexOf('#'));
           d3.select(this).attr('clip-path',str.replace(strquitar,''));
       });

        html2canvas(document.getElementById('my-c3-chart'), {
            onrendered: function (canvas) {

                var MIME_TYPE = "image/" + export_format;
                var imgURL = canvas.toDataURL(MIME_TYPE);
                var dlLink = document.createElement('a');
                dlLink.download = "chart." + export_format;
                dlLink.href = imgURL;
                dlLink.dataset.downloadurl = [MIME_TYPE, dlLink.download, dlLink.href].join(':');

                document.body.appendChild(dlLink);
                console.info(dlLink);
                dlLink.click();
                document.body.removeChild(dlLink);
            }
        });
        //restaurando posicion de los textos
        d3.selectAll('.c3-axis-x .tick text').attr('transform','translate(0,0)');
    };

    //Comprueba que la fecha sea correcta
    self.m_fecha_correcta = function (fecha) {
        return isValidDate(fecha);
        function isValidDate(str) {
            var parms = str.split('-');
            var yyyy = parseInt(parms[0], 10);
            var mm = parseInt(parms[1], 10);
            var dd = parseInt(parms[2], 10);
            var date = new Date(yyyy, mm - 1, dd, 0, 0, 0, 0);
            return mm === (date.getMonth() + 1) && dd === date.getDate() && yyyy === date.getFullYear();
        }
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
    return fechaFin > fechaInicio && fechaInicio >= inicioDatos && fechaFin <= finDatos;
}

//Metodo auxiliar hacer algunas y luego actualizar
function m_aux_Update(obj_stock, fechaInicio, fechaFin) {
    document.getElementById("inicio").value = formatDate(fechaInicio);
    document.getElementById("fin").value = formatDate(fechaFin);
    obj_stock.e_update_click();
}

function m_updateGrafica(fechaInicio, fechaFin) {

    var dominio = [fechaInicio, fechaFin];

    //calculando los tickValues para el rango actual
    var ticks = m_generateTicks(fechaInicio, fechaFin);

    //cambiando los tickValues y dando zoom para el 1er Grafico
    chart.internal.config.axis_x_tick_values = ticks;
    chart.zoom(dominio);

    //cambiando los tickValues y dando zoom para el 2do Grafico
    chart2.internal.config.axis_x_tick_values = ticks;
    chart2.zoom(dominio);
    chart3.internal.brush.extent(dominio).update();

}

function m_generateTicks(fechaInicio, fechaFin) {
    var paso = m_calcularPaso(fechaInicio, fechaFin);
    var cant_ticks_posibles = m_cantTicksPosibles() - 1; // -1 porque el 1ro siempre se pone

    var diferencia = fechaFin - fechaInicio;
    diferencia = diferencia / 86400000;

    var cant_ticks_actual = diferencia / paso;
    cant_ticks_actual = +cant_ticks_actual.toFixed();
    cant_ticks_actual += 1;

    //Recalculando el PASO
    var cant_dias = 1;
    var control = cant_ticks_actual;
    if (cant_ticks_actual > cant_ticks_posibles) { // si no hay espacio para los actuales
        control = cant_ticks_posibles;
        cant_dias = diferencia / cant_ticks_posibles;
        cant_dias = +cant_dias.toFixed();
        paso = cant_dias;
    }

    //console.info(paso, cant_ticks_actual, cant_ticks_posibles, cant_dias);

    var tickss = [];
    var primero = fechaInicio * 1;
    var ultimo = fechaFin * 1;
    var dia = 86400000;
    var iterator = primero;
    tickss.push(primero);
    //while (iterator < ultimo) {
    while (control > 0) {
        iterator = iterator + dia * paso;
        tickss.push(iterator);
        control = control - 1;
    }
    return tickss;
}

//Dev la cant de ticks posibles segun el ancho de la grafica
function m_cantTicksPosibles() {
    var width = +d3.select('#' + chart2.element.id + " svg .c3-zoom-rect").attr("width");
    width = +width.toFixed();

    var dateWidth = 85; // 85 es aproximadamente por exceso el ancho que toma una fecha
    // c3-axis c3-axis-x tener estas clases en cuanta para tomar el tamano de la fecha generico

    var cant_ticks = width / dateWidth;
    return +cant_ticks.toFixed();
}

function m_calcularPaso(fechaInicio, fechaFin) {
    var paso = 1;
    var diferencia = fechaFin - fechaInicio;
    diferencia = diferencia / 86400000;

    if (diferencia < 15)
        paso = 1;
    else if (diferencia > 15 && diferencia < 31)
        paso = 2;
    else if (diferencia > 30 && diferencia <= 120) // mas de 1 mes y menos de 4 meses
        paso = 7;
    else if (diferencia > 120 && diferencia <= 365) // mas de 5 meses hasta 1 ano
        paso = 15;
    else //mas de 1 ano
        paso = 30;
    return paso;
}