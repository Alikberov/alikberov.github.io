class OmniWindow extends HTMLElement {
	static #ListFor = null;
	static #Order = null;
	static isClone = null;
	constructor() {
		super();
		var	x1, y1;	// Координаты курсора относительно перемещаемого окна
		this.root = this.attachShadow({mode: "open"});
		this.wrapper = document.createElement("slot");
		// Создаём элемент заголовка окна (CAPTION)
		this.header = document.createElement("header");
		this.header.className = "omni-window-header";
		this.root.appendChild(this.header);
		this.root.appendChild(this.wrapper);
		this.root.append(
			document.getElementById('tmpl').content.cloneNode(true));
		if(OmniWindow.isClone) {
			return;
		}
		this.header.addEventListener("pointerdown",
			(function(evt) {
				document.body.setPointerCapture(evt.pointerId);
				document.body.onpointermove = onMouseMove.bind(this);
				x1 = evt.clientX - this.offsetLeft;
				y1 = evt.clientY - this.offsetTop;
				evt.preventDefault();
			}).bind(this)
		);
		// Добавляем обработчик события отпускания заголовка окна
		document.body.addEventListener("pointerup",
			(function(evt) {
				document.body.onpointermove = null;
				document.body.releasePointerCapture(evt.pointerId);
			}).bind(this)
		);
		setTimeout((function() {
			this.style.left = `${this.offsetLeft}px`;
			this.style.top = `${this.offsetTop}px`;
		}).bind(this), 0);
		this.addEventListener("pointerdown", this.bringToTop);
		if(OmniWindow.Order)
			OmniWindow.Order.push(this);
		else
			OmniWindow.Order = [this];
		function onMouseMove(evt) {
			const	x = evt.clientX - x1;
			const	y = evt.clientY - y1;
			this.style.left = `${x}px`;
			this.style.top = `${y}px`;
			evt.preventDefault();
		}
	}
	adoptedCallback() {
		alert(this);
	}
	connectedCallback() {
		this.className = "OmniWindow";
		this.enumerate();
	}
	disconnectedCallback() {
		for(const i in OmniWindow.Order) {
			if(OmniWindow.Order[i] == this) {
				OmniWindow.Order.splice(i, 1);
				return;
			}
		}
	}
	static get observedAttributes() {
		return "for title".split(/\s+/);
	}
	attributeChangedCallback(name, oldValue, newValue) {
		// вызывается при изменении одного из перечисленных выше атрибутов
		switch(name) {
		case "for":
			// Если имеется ссылка на элемент стека окон, регистрируем
			if(OmniWindow.isClone)
				return;
			OmniWindow.ListFor = newValue;
			this.enumerate();
			break;
		case "title":
			this.header.textContent = this.title;
			break;
		}
	}
	getStyle(styleProp) {
		if(window.getComputedStyle)
			return document.defaultView.getComputedStyle(this, null).getPropertyValue(styleProp);
		else
		if(this.currentStyle)
			return this.currentStyle[styleProp];
	}
	getZIndex(el) {
		if(!el.style)
			return 0;
		var z = document.defaultView.getComputedStyle(el, null).getPropertyValue("z-index");
		if(isNaN(z) && el.parentNode)
			return this.getZIndex(el.parentNode);
		return z;
	}
	bringToTop() {
		if(!this.hasAttribute("active")) {
			var j;
			for(var i = 0; i < OmniWindow.Order.length; ++ i) {
				if(this == OmniWindow.Order[i])
					j = i;
			}
			if(isNaN(j))
				return;
			OmniWindow.Order.push(OmniWindow.Order.splice(j, 1)[0]);
			j = 100 - OmniWindow.Order.length;
			for(var el of OmniWindow.Order) {
				el.style.zIndex = ++ j;
				el.removeAttribute("active");
			}
			this.setAttribute("active", null);
			this.enumerate();
		}
	}
	enumerate() {
		if(OmniWindow.ListFor) {
			var	hList = document.getElementById(OmniWindow.ListFor);
			if(hList) {
				hList.length = 0;
				for(const el of OmniWindow.Order) {
					const hOption = document.createElement("option");
					hOption.textContent = el.title;
					hOption.value = el.title;
					hList.appendChild(hOption);
				}
				hList.size = hList.length;
			}
		}
	}
	arrange() {
		var	boxes = [];
		//
		for(const el of [...OmniWindow.Order]) {
			boxes.push({el: el, w: el.offsetWidth, h: el.offsetHeight});
		}
		const	{h, w, fill} = potpack(boxes);
		for(const box of boxes) {
			var	el = box.el;
			el.style.left = `${box.x}px`;
			el.style.top = `${box.y}px`;
		}
	}
	arranger() {
		var	hFlag = document.getElementById("DoFloating");
		var	flag = hFlag.checked;
		var	hSlot = document.createElement("div");
		hSlot.style.position = "absolute";
		hSlot.style.left = "0px";
		hSlot.style.top = "0px";
		OmniWindow.isClone = true;
		for(const el of [...OmniWindow.Order]) {
			var	hClone = el.cloneNode();
			hClone.innerHTML = el.innerHTML;
			for(const chld of hClone.children)
				chld.id = "";//`${el.id}__clone`;
			hSlot.appendChild(hClone);
		}
		hFlag.checked = false;
		document.body.appendChild(hSlot);
		OmniWindow.isClone = false;
		var i = 0;
		for(const el of hSlot.getElementsByTagName("omni-window")) {
			var box = el.getBoundingClientRect();
			var org = OmniWindow.Order[i ++];
			org.style.left = `${box.x}px`;
			org.style.top = `${box.y}px`;
		}
		hSlot.remove();
		hFlag.checked = flag;
	}
}

customElements.define("omni-window", OmniWindow);