/* global Virastar, ClipboardJS, Diff, syncscroll */

(function (w) {
  var virastar;
  var clipboard;
  var app = {
    settings: undefined,
    storage: typeof (Storage) !== 'undefined',

    input: document.getElementById('input'),
    output: document.getElementById('output'),
    diff: document.getElementById('diff'),
    reset: document.getElementById('settings-reset'),

    // demo default options
    options: {
      // skip_markdown_ordered_lists_numbers_conversion: false,
      // preserve_brackets: false,
      // preserve_braces: false
    },

    // @REF: https://remysharp.com/2010/07/21/throttling-function-calls
    debounce: function (fn, delay) {
      var timer = null;
      return function () {
        var context = this;
        var args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () {
          fn.apply(context, args);
        }, delay);
      };
    },

    // @REF: https://stackoverflow.com/a/5574446
    toProperCase: function (txt) {
      return txt.replace(/\w\S*/g, function (str) {
        return str.charAt(0).toUpperCase() + str.substr(1).toLowerCase();
      });
    },

    renderSettings: function (defaults) {
      var options = this.getStorage(this.options, 'options');
      var ul = document.getElementById('options');
      ul.innerHTML = ''; // list must be empty!

      for (var option in defaults) {
        var row = document.createElement('li');
        var checkbox = document.createElement('input');
        var label = document.createElement('label');

        var name = this.toProperCase(option.replace(new RegExp(/_/, 'g'), ' '));

        checkbox.type = 'checkbox';
        checkbox.checked = options.hasOwnProperty(option) ? options[option] : defaults[option]; // eslint-disable-line no-prototype-builtins
        checkbox.name = 'opt[]';
        checkbox.value = option;
        checkbox.id = option;
        checkbox.setAttribute('class', 'option');

        label.htmlFor = option;
        label.appendChild(document.createTextNode(name));

        row.appendChild(checkbox);
        row.appendChild(label);

        ul.appendChild(row);
      }

      this.settings = document.querySelectorAll('.option');
    },

    getStorage: function (def, key) {
      if (!this.storage) {
        return def;
      }

      var stored = w.localStorage.getItem(key);
      return stored ? JSON.parse(stored) : def;
    },

    setStorage: function (data, key) {
      if (this.storage) {
        w.localStorage.setItem(key, JSON.stringify(data));
      }
    },

    removeStorage: function (key) {
      if (this.storage) {
        w.localStorage.removeItem(key);
      }
    },

    getOptions: function () {
      var options = {};

      this.settings.forEach(function (option) {
        options[option.value] = option.checked;
      });

      return options;
    },

    doVirastar: function (input, options) {
      this.output.innerHTML = virastar.cleanup(input, options);
      this.diff.innerHTML = '';
      this.diff.appendChild(this.renderDiff());
    },

    doChange: function () {
      var input = this.input.value;
      var options = this.getOptions();
      this.doVirastar(input, options);
      this.setStorage(options, 'options');
      this.setStorage(input, 'text');
      syncscroll.reset();
    },

    renderDiff: function () {
      // @REF: https://github.com/kpdecker/jsdiff
      var diff = Diff.diffChars(this.input.value, this.output.value, { ignoreWhitespace: false });
      var fragment = document.createDocumentFragment();
      var pre = document.createElement('pre');
      var newLine = new RegExp(/[^\n]/, 'g');
      var span = null;
      var status = '';

      diff.forEach(function (part) {
        span = document.createElement('span');

        status = part.added ? '-added' : part.removed ? '-removed' : '-none';
        span.classList.add(status);

        // skip if new-lines removed
        if (part.removed) {
          if (!newLine.test(part.value)) {
            return;
          }

          part.value = part.value.replace(/\n/g, '');
        }

        // zwnj
        if (part.value === '‌') {
          span.classList.add('-zwnj');
          part.value = '⋅';
        } else {
          // extra zwnj for better visibility
          // part.value = part.value + '‌';
        }

        span.appendChild(document.createTextNode(part.value));
        fragment.appendChild(span);
      });

      pre.appendChild(fragment);
      return pre;
    },

    showDifferences: function () {
      const inputTextarea = document.getElementById("input");
      const outputTextarea = document.getElementById("output");
      const differences = Diff.diffChars(inputTextarea.value, outputTextarea.value, { ignoreWhitespace: false });

      const differencesDiv = document.createElement("div");
      differencesDiv.className = "column-diff syncscroll";
      differencesDiv.name = "synctarget";
      differencesDiv.id = "diff-wrapper";
      differencesDiv.innerHTML = `<div id="diff" class="wrapper-diff">تفاوت&hellip;</div>`;
      differencesDiv.querySelector("#diff").innerHTML = Diff.diffPrettyHtml(differences);

      const triggerDiffLink = document.getElementById("trigger-diff");
  triggerDiffLink.parentNode.insertBefore(differencesDiv, triggerDiffLink.nextSibling);
},
