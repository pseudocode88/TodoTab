(function(window,document) {

    'use strict';

    function Store(name, postSave) {
        this.postSave = (postSave) ? postSave: function(){};
        this.name = name;
        this._get();
    }

    Store.prototype = {
        _save: function(data) {
            this.postSave();
            localStorage.setItem(this.name, JSON.stringify(this.data));
        },

        _get: function() {
            this.data = JSON.parse(localStorage.getItem(this.name)) || [];
        },

        add: function(data) {
            if (data) {
                this.data.unshift(data)
                this._save();
            }
        },

        addMultiple: function(data) {
            if(data) {
                this.data = this.data.concat(data);
                this._save();
            }
        },

        delete: function(id) {
            var index = find(this.data, 'id', id).index;
            if (index > -1) {
                this.data.splice(index, 1);
                this._save();
            }
        },
        edit: function(id, data) {
            if (+id > -1 && data) {
                var index = find(this.data, 'id', id).index;
                if (index > -1) {
                    this.data[index] = data;
                    this._save();
                }
            }
        },

        update: function(id, changes) {
            var index = find(this.data, 'id', id).index;
            if (index > -1) {
                for(var attr in changes)    {
                    this.data[index][attr] = changes[attr];
                }
                this._save();
            }
        },

        get: function(value, attr) {
            if(value)  {
                attr = (attr) ? attr : 'id';
                return find(this.data, attr, value).data;
            }
            return this.data;
        },

        move: function(oIdx, nIdx) {
          var elm = this.data[oIdx];
          var fArray = this.data.filter(function (e) {
            return e !== elm;
          });

          this.data = fArray.slice(0, nIdx).concat(elm).concat(fArray.slice(nIdx));
          this._save();
        }
    }

    function find(data, prop, value) {
        // var t;
        for (var i = 0, l = data.length; i < l; i++) {
            if (data[i][prop] === value) {
                return {
                    data: data[i],
                    index: i
                };
                break;
            }
        }

        return {
            data: [],
            index: -1
        }
    }

    window.Store = Store;
})(window, document);
