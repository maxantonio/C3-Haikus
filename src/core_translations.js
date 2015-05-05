//core translations Eng - ES
var i18n = new Polyglot();
i18n.locale(locale);

i18n.extend({
  //English
  "from": "From",
  "to": "To",

});

if (i18n.locale() == "es") i18n.extend({
  //Spanish
  "from": "Desde",
  "to": "Hasta",

});
