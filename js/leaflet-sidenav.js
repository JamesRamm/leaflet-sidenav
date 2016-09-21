L.Control.Sidenav = L.Control.extend({
    includes: L.Mixin.Events,

    options: {
        position: 'left'
    },

    /**
     * Create a new sidenav on this object.
     *
     * @constructor
     * @param {string} id - The id of the sidenav element (without the # character)
     * @param {Object} [options] - Optional options object
     * @param {string} [options.position=left] - Position of the sidenav: 'left' or 'right'
     */
    initialize: function(id, options) {
        var i, j, child, tabContainers, newContainer;

        L.setOptions(this, options);

        // Find sidenav HTMLElement, create it if none was found
        this._sidenav = L.DomUtil.get(id);
        if (this._sidenav === null)
            this._sidenav = L.DomUtil.create('div', 'sidenav collapsed', document.body);

        // Attach .sidenav-left/right class
        L.DomUtil.addClass(this._sidenav, 'sidenav-' + this.options.position);

        // Attach touch styling if necessary
        if (L.Browser.touch)
            L.DomUtil.addClass(this._sidenav, 'leaflet-touch');

        // Find paneContainer in DOM & store reference
        this._paneContainer = this._sidenav.querySelector('div.sidenav-content');

        // If none is found, create it
        if (this._paneContainer === null)
            this._paneContainer = L.DomUtil.create('div', 'sidenav-content', this._sidenav);

        // Find tabContainerTop & tabContainerBottom in DOM & store reference
        tabContainers = this._sidenav.querySelectorAll('ul.sidenav-tabs, div.sidenav-tabs > ul');
        this._tabContainerTop    = tabContainers[0] || null;
        this._tabContainerBottom = tabContainers[1] || null;

        // If no container was found, create it
        if (this._tabContainerTop === null) {
            newContainer = L.DomUtil.create('div', 'sidenav-tabs', this._sidenav);
            this._tabContainerTop = L.DomUtil.create('ul', '', newContainer);
        }
        if (this._tabContainerBottom === null) {
            newContainer = this._tabContainerTop.parentNode;
            this._tabContainerBottom = L.DomUtil.create('ul', '', newContainer);
        }

        // Store Tabs in Collection for easier iteration
        this._tabitems = [];
        for (i = 0; i < this._tabContainerTop.children.length; i++) {
            child = this._tabContainerTop.children[i];
            child._sidenav = this;
            this._tabitems.push(child);
        }
        for (i = 0; i < this._tabContainerBottom.children.length; i++) {
            child = this._tabContainerBottom.children[i];
            child._sidenav = this;
            this._tabitems.push(child);
        }

        // Store Panes in Collection for easier iteration
        this._panes = [];
        this._closeButtons = [];
        for (i = 0; i < this._paneContainer.children.length; i++) {
            child = this._paneContainer.children[i];
            if (child.tagName === 'DIV' &&
                L.DomUtil.hasClass(child, 'sidenav-pane')) {
                this._panes.push(child);

                // Save references to close buttons
                var closeButtons = child.querySelectorAll('.sidenav-close');
                for (j = 0, len = closeButtons.length; j < len; j++) {
                    this._closeButtons.push(closeButtons[j]);
                }
            }
        }
    },

    /**
     * Add this sidenav to the specified map.
     *
     * @param {L.Map} map
     * @returns {L.Control.Sidenav}
     */
    addTo: function(map) {
        var i;

        this._map = map;

        // Add click listeners for tab & close buttons
        for (i = 0; i < this._tabitems.length; i++)
            this._tabClick(this._tabitems[i], 'on');

        for (i = 0; i < this._closeButtons.length; i++)
            this._closeClick(this._closeButtons[i], 'on');

        return this;
    },

    /**
     * Remove this sidenav from the map.
     *
     * @param {L.Map} map
     * @returns {L.Control.Sidenav}
     */
    removeFrom: function(map) {
        var i;

        this._map = null;

        // Remove click listeners for tab & close buttons
        for (i = 0; i < this._tabitems.length - 1; i++)
            this._tabClick(this._tabitems[i], 'off');

        for (i = 0; this._closeButtons.length; i++)
            this._closeClick(this._closeButtons[i], 'off');

        return this;
    },

    /**
     * Open sidenav (if it's closed) and show the specified tab.
     *
     * @param {string} id - The ID of the tab to show (without the # character)
     * @returns {L.Control.Sidenav}
     */
    open: function(id) {
        var i, child, tab;

        // If panel is disabled, stop right here
        tab = this._getTab(id);
        if (L.DomUtil.hasClass(tab, 'disabled'))
            return this;

        // Hide old active contents and show new content
        for (i = 0; i < this._panes.length; i++) {
            child = this._panes[i];
            if (child.id === id)
                L.DomUtil.addClass(child, 'active');
                child.querySelector('a').tooltip("hide")
            else if (L.DomUtil.hasClass(child, 'active'))
                L.DomUtil.removeClass(child, 'active');
        }

        // Remove old active highlights and set new highlight
        for (i = 0; i < this._tabitems.length; i++) {
            child = this._tabitems[i];
            if (child.querySelector('a').hash === '#' + id)
                L.DomUtil.addClass(child, 'active');
            else if (L.DomUtil.hasClass(child, 'active'))
                L.DomUtil.removeClass(child, 'active');
        }

        this.fire('content', { id: id });

        // Open sidenav if it's closed
        if (L.DomUtil.hasClass(this._sidenav, 'collapsed')) {
            this.fire('opening');
            L.DomUtil.removeClass(this._sidenav, 'collapsed');
        }

        return this;
    },

    /**
     * Close the sidenav (if it's open).
     *
     * @returns {L.Control.Sidenav}
     */
    close: function() {
        var i;

        // Remove old active highlights
        for (i = 0; i < this._tabitems.length; i++) {
            var child = this._tabitems[i];
            if (L.DomUtil.hasClass(child, 'active'))
                L.DomUtil.removeClass(child, 'active');
        }

        // close sidenav, if it's opened
        if (!L.DomUtil.hasClass(this._sidenav, 'collapsed')) {
            this.fire('closing');
            L.DomUtil.addClass(this._sidenav, 'collapsed');
        }

        return this;
    },

    /**
     * Add a panel to the sidenav
     *
     * @example
     * sidenav.addPanel({
     *     id: 'userinfo',
     *     tab: '<i class="fa fa-gear"></i>',
     *     pane: someDomNode.innerHTML,
     *     position: 'bottom'
     * });
     *
     * @param {Object} [data] contains the data for the new Panel:
     * @param {String} [data.id] the ID for the new Panel, must be unique for the whole page
     * @param {String} [data.position='top'] where the tab will appear:
     *                                       on the top or the bottom of the sidenav. 'top' or 'bottom'
     * @param {HTMLString} {DOMnode} [data.tab]  content of the tab item, as HTMLstring or DOM node
     * @param {HTMLString} {DOMnode} [data.pane] content of the panel, as HTMLstring or DOM node
     * @param {String} [data.title] The title of the panel. If not set, no header will be created.
     *
     * @returns {L.Control.Sidenav}
     */
    addPanel: function(data) {
        var i, pane, tab, tabHref, closeButtons;
        
        // Create header node
        if (typeof data.title !== "undefined"){
            header = L.DomUtil.create('h1', 'sidenav-header', pane);
            header.innerHTML = data.title + '<div class="sidenav-close"><i class="fa fa-caret-left"></i></div>'
        }

        // Create pane node
        pane = L.DomUtil.create('DIV', 'sidenav-pane', this._paneContainer);
        pane.appendChild(header);
        if (typeof data.pane === 'string') {
            // pane is given as HTML string
            pane.innerHTML = pane.innerHTML + data.pane;
            pane.id = data.id;
        } else {
            // pane is given as DOM object
            pane.appendChild(data.pane);
            this._paneContainer.appendChild(pane);
            if (typeof pane.id == "undefined")
            {
                pane.id = data.id;
            }
        }
        
        // Create tab node
        tab     = L.DomUtil.create('li', '');
        tab.setAttribute("id", data.id);

        tabHref = L.DomUtil.create('a', '', tab);
        $(tabHref).tooltip({placement: 'right', title: data.title});
        tabHref.href = '#' + pane.id;
        tabHref.role = 'tab';
        tabHref.innerHTML = data.tab;
        tab._sidenav = this;

        if (data.position === 'bottom')
            this._tabContainerBottom.appendChild(tab);
        else
            this._tabContainerTop.appendChild(tab);

        // append new content to internal collections
        this._panes.push(pane);
        this._tabitems.push(tab);

        // Register click listeners, if the sidenav is on the map
        this._tabClick(tab, 'on');

        // Save references to close buttons & register click listeners
        closeButtons = pane.querySelectorAll('.sidenav-close');
        for (i = 0; i < closeButtons.length; i++) {
            this._closeButtons.push(closeButtons[i]);
            this._closeClick(closeButtons[i], 'on');
        }

        return this;
    },

    /**
     * Removes a panel from the sidenav
     *
     * @example
     * sidenav.remove('userinfo');
     *
     * @param {String} [id] the ID of the panel that is to be removed
     * @returns {L.Control.Sidenav}
     */
    removePanel: function(id) {
        var i, j, pane, closeButtons;

        // find the panel by ID
        for (i = 0; i < this._panes.length; i++) {
            if (this._panes[i].id === id) {
                pane = this._panes[i];

                // Remove click listeners
                this._tabClick(this.tabitems[i], 'off');

                closeButtons = pane.querySelectorAll('.sidenav-close');
                for (j = 0; i < closeButtons.length; i++) {
                    this._closeClick(closeButtons[j], 'off');
                }

                // remove both tab and panel, ASSUMING they have the same index!
                pane.remove();
                this._panes.slice(i, 1);
                this._tabitems[i].remove();
                this._tabitems.slice(i, 1);

                break;
            }
        }

        return this;
    },

    /**
     * enables a disabled tab/panel
     *
     * @param {String} [id] ID of the panel to enable
     * @returns {L.Control.Sidenav}
     */
    enablePanel: function(id) {
        var tab = this._getTab(id);
        L.DomUtil.removeClass(tab, 'disabled');

        return this;
    },

    /**
     * disables an enabled tab/panel
     *
     * @param {String} [id] ID of the panel to disable
     * @returns {L.Control.Sidenav}
     */
    disablePanel: function(id) {
        var tab = this._getTab(id);
        L.DomUtil.addClass(tab, 'disabled');

        return this;
    },

    /**
     * (un)registers the onclick event for the given tab,
     * depending on the second argument.
     * @private
     *
     * @param {DOMelement} [tab]
     * @param {String} [on] 'on' or 'off'
     */
    _tabClick: function(tab, on) {

        var onTabClick = function() {
            if (L.DomUtil.hasClass(this, 'active'))
                this._sidenav.close();
            else if (!L.DomUtil.hasClass(this, 'disabled'))
                this._sidenav.open(this.querySelector('a').hash.slice(1));
        };

        if (on === 'on') {
            L.DomEvent
                .on(tab.querySelector('a'), 'click', L.DomEvent.preventDefault)
                .on(tab.querySelector('a'), 'click', onTabClick, tab);
        } else {
            L.DomEvent.off(tab.querySelector('a'), 'click', onTabClick);
        }
    },

    /**
     * (un)registers the onclick event for the given close button
     * depending on the second argument
     * @private
     *
     * @param {DOMelement} [closeButton]
     * @param {String} [on] 'on' or 'off'
     */
    _closeClick: function(closeButton, on) {

        var onCloseClick = function() {
            this.close();
        };

        if (on === 'on') {
            L.DomEvent.on(closeButton, 'click', onCloseClick, this);
        } else {
            L.DomEvent.off(closeButton, 'click', onCloseClick, this);
        }
    },

    /**
     * Finds & returns the DOMelement of a tab
     *
     * @param {String} [id] the id of the tab
     * @returns {DOMelement} the tab specified by id, null if not found
     */
    _getTab: function(id) {
        var i, tab;

        for (i = 0; i < this._tabitems.length; i++) {
            tab = this._tabitems[i];
            if (tab.querySelector('a').hash === '#' + id)
                return tab;
        }

        return null;
    }
});

/**
 * Create a new sidenav.
 *
 * @example
 * var sidenav = L.control.sidenav('sidenav').addTo(map);
 *
 * @param {string} id - The id of the sidenav element (without the # character)
 * @param {Object} [options] - Optional options object
 * @param {string} [options.position=left] - Position of the sidenav: 'left' or 'right'
 * @returns {L.Control.Sidenav} A new sidenav instance
 */
L.control.sidenav = function(id, options) {
    return new L.Control.Sidenav(id, options);
};
