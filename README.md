# leaflet-sidenav

A responsive sidenav for [Leaflet](#leaflet)

<a href="https://flattr.com/submit/auto?user_id=turbo&url=https%3A%2F%2Fgithub.com%2FTurbo87%2Fsidenav-v2" target="_blank"><img src="https://api.flattr.com/button/flattr-badge-large.png" alt="Flattr this" title="Flattr this" border="0"></a>

![Demo](doc/sidenav-v2.gif)


## [Leaflet](http://leafletjs.com/)

![sidenav collapsed](doc/leaflet-1.png) ![sidenav extended](doc/leaflet-2.png)

Example code at [`examples/index.html`](examples/index.html) ([Preview](http://turbo87.github.io/sidenav-v2/examples/index.html))

## Usage

### API
sidenav provides a simple API to dynamically modify the sidenav. All functions may be chained.

#### creation
```js
var sidenav = L.control.sidenav('sidenav').addTo(map);
```

#### modification

```js
/* add a new panel */
var panelContent = {
    id: 'userinfo',                     // UID, used to access the panel
    tab: '<i class="fa fa-gear"></i>',  // content can be passed as HTML string,
    pane: someDomNode.innerHTML,        // DOM elements can be passed, too
    position: 'bottom'                  // vertical alignment, 'top' or 'bottom'
};
sidenav.addPanel(panelContent);

/* remove a panel */
sidenav.removePanel('userinfo');

/* en- / disable a panel */
sidenav.disablePanel('userinfo');
sidenav.enablePanel('userinfo');
```

#### open / close / show content
```js
/* open a panel */
sidenav.open('userinfo');

/* close the sidenav */
sidenav.close();
```

### markup
If you use the sidenav with static content only, you can predefine content in HTML:

```html
<div id="sidenav" class="sidenav collapsed">
    <!-- Nav tabs -->
    <div class="sidenav-tabs">
        <ul role="tablist"> <!-- top aligned tabs -->
            <li><a href="#home" role="tab"><i class="fa fa-bars"></i></a></li>
            <li class="disabled"><a href="#messages" role="tab"><i class="fa fa-envelope"></i></a></li>
            <li><a href="#profile" role="tab"><i class="fa fa-user"></i></a></li>
        </ul>

        <ul role="tablist"> <!-- bottom aligned tabs -->
            <li><a href="#settings" role="tab"><i class="fa fa-gear"></i></a></li>
        </ul>
    </div>

    <!-- Tab panes -->
    <div class="sidenav-content">
        <div class="sidenav-pane" id="home">
            <h1 class="sidenav-header">
                sidenav-v2
                <div class="sidenav-close"><i class="fa fa-caret-left"></i></div>
            </h1>
            <p>A responsive sidenav for mapping libraries</p>
        </div>

        <div class="sidenav-pane" id="messages">
            <h1 class="sidenav-header">Messages<div class="sidenav-close"><i class="fa fa-caret-left"></i></div></h1>
        </div>

        <div class="sidenav-pane" id="profile">
            <h1 class="sidenav-header">Profile<div class="sidenav-close"><i class="fa fa-caret-left"></i></div></h1>
        </div>
    </div>
</div>
```

You still need to initialize the sidenav (see API.creation)

### Events

The sidenav fires 3 types of events:
`opening`, `closing`, and `content`.
The latter has a payload including the id of the activated content div.

You can listen for them like this:
```js
sidenav.on('content', function(e) {
    // e.id contains the id of the opened panel
})
```


## License

sidenav is free software, and may be redistributed under the [MIT license](LICENSE).
