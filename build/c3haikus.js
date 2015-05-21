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
  "select": "Select",


});

if (i18n.locale() == "es") i18n.extend({
  //Spanish
  "from": "Desde",
  "to": "Hasta",
   "select": "Selecione",

});
;//Este modulo es dependiente de, D3,C3,Polyglot
var StockTools = function (raiz, periodos) {
    'use strict';

    //actual simbolo que se esta comparando
    var current_selected_value = "";
    var ids = [];

    //Crea los componentes y sus eventos
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
            .style("text-align", "center")
            .attr("name", "inicio")
            .attr("id", "inicio")
            .attr('value', datos.columns[0][1]);

        // Crea el texto y el input para la fecha final
        intervalos.append("span").text(i18n.t("to"));
        intervalos.append("input")
            .attr("type", "text")
            .style("text-align", "center")
            .attr("name", "fin")
            .attr("id", "fin")
            .attr('value', datos.columns[0][datos.columns[0].length - 1]);

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
            .attr("class", function (p) {
                return p.seleccionado ? "button selected" : "button";
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

        //Estableciendo la fecha inicial acorde con el periodo seleccionado
        m_establecer_fecha_inicial();

        function m_establecer_fecha_inicial() {
            var p = d3.select(".c3-periodos .selected");
            if (p[0][0] != null) {
                var tipo = p.attr('data-tipo');
                var cantidad = p.attr('data-value');
                var fechaInicio = m_getFechaInicio(tipo, cantidad);
                d3.select("#inicio").attr("value",formatDate(fechaInicio));
            }
        }

        //Evento click  en un boton del periodo
        function e_click_periodo() {

            //Valor del periodo clickeado
            var cantidad = d3.select(this).attr("data-value");

            //Tipo de periodo
            var tipo = d3.select(this).attr("data-tipo");

            //Ultima fecha de los datos a graficar
            var posLastDate = datos.columns[0].length - 1;
            var fechaFin = parseDate(datos.columns[0][posLastDate]);
            var fechaInicio = m_getFechaInicio(tipo, cantidad);
            if (m_intervalo_Correcto(fechaInicio, fechaFin))
                m_updateGrafica(fechaInicio, fechaFin);
            else
                throw new Error("No hay datos para este intervalo");
        }

        //Obtiene la fecha de inicio segun el tipo del periodo y la cantidad que se le pase
        function m_getFechaInicio(tipo, cantidad) {

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
                    fechaInicio = new Date(fechaFin.getFullYear(), 0, 1);
                    break;
            }
            return fechaInicio;
        }

        function e_update_click() {
            var fechaInicio = parseDate(document.getElementById("inicio").value);
            var fechaFin = parseDate(document.getElementById("fin").value);
            if (m_intervalo_Correcto(fechaInicio, fechaFin))
                m_updateGrafica(fechaInicio, fechaFin);
            else
                throw new Error("No hay datos para este intervalo");
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
                        result.push(null);
                    }
                }
            });
            return result;
        }

        //Restaura la grafica completamente
        function m_restaurar_grafica() {

            //Si  estan comparando
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
        function e_comparar_click() {

            var last = "";
            if (current_selected_value != "") {
                last = current_selected_value;
            }

            var empresa = this.options[this.selectedIndex].value;
            console.info("Seleccionado: " + empresa);
            var fechaInicio = parseDate(document.getElementById("inicio").value);
            var fechaFin = parseDate(document.getElementById("fin").value);

            var datos_a_cargar = [];

            if (m_intervalo_Correcto(fechaInicio, fechaFin)) {

                // Si se selecciona cualquier opcion menos (Seleccione)
                if (this.selectedIndex != 0) {
                    comparando = true;
                    current_selected_value = empresa;

                    //esta es los datos de comparacion de la 1ra empresa, que es la que se compara con las demas
                    var r1 = m_calcular_comparacion(datos.columns[1][0], 1, document.getElementById("inicio").value, document.getElementById("fin").value);

                    var r2 = m_calcular_comparacion(empresa, (this.selectedIndex + 1), document.getElementById("inicio").value, document.getElementById("fin").value);
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
                    m_restaurar_grafica(fechaInicio, fechaFin);
                    current_selected_value = "";
                    comparando = false;
                }
            } else
                throw new Error("Intervalo incorrecto");

        }
    }
};

//Dev true si las fechas estan en el intervalo de los datos
//si no se especifica la fechaFin se entiende que es hasta la ultima fecha de los datos
function m_intervalo_Correcto(fechaInicio, fechaFin) {

    var posLastDate = datos.columns[0].length - 1;
    var inicioDatos = parseDate(datos.columns[0][1]);
    var finDatos = parseDate(datos.columns[0][posLastDate]);
    fechaFin || (fechaFin = finDatos);
    console.info(fechaInicio, fechaFin);
    console.info(inicioDatos, finDatos);

    return fechaInicio >= inicioDatos && fechaFin <= finDatos;
}

function m_updateGrafica(fechaInicio, fechaFin) {

    console.log("fecha fin" + fechaFin);
    var dominio = [fechaInicio, fechaFin];
    chart.zoom(dominio);
    chart2.zoom(dominio);
    //actualiza el brush si existe
    chart3.internal.brush.extent(dominio).update();
    d3.select("#inicio").attr('value', formatDate(fechaInicio));
    d3.select("#fin").attr('value', formatDate(fechaFin));
}
