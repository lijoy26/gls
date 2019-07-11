(function () {
	"use strict";
	var GLS = function () {

		/* 
		* Set default settings
		*/

		this.page = 0;
		this.canNavigate = true;
		this.firstPage = 1;
		this.replay = 'TRUE';
		this.keyboardEvents = true;
		this.referenceDocument = document;
		this.currentElement = null;
		this.guideSrc = null;
		this.guideType = null;
		this.tipArrow = null;
		this.guide = [
			{
				title: 'DEFAULT TITLE',
				content: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.'

			}
		]
		this.guideWindow = null;
	};

	GLS.prototype = {
		init: function (settings = {}, guide, referenceDocument) {

			/*
			* Init methrd to initilaze GLS player.
			* Override settings.
			*/

			this.replaySettings = settings.replay || this.replaySettings;
			this.page = settings.page || this.page;
			this.referenceDocument = referenceDocument || this.referenceDocument;
			this.guideSrc = guide;
			this.keyboardEvents = settings.keyboardEvents || this.keyboardEvents;

			this.navigator.apply(this, []);
			this.element.apply(this, []);
			this.errorHandler.apply(this, []);
			this.player.apply(this, []);
			this.ui.apply(this, []);
			this.operations.apply(this, []);
			this.keyboard.apply(this, []);

			this.initGuide = function (guide) {
				this.guideType = typeof guide;
				if (guide && this.guideType == 'object') {
					this.guide = guide;
					this.firstPage = this.getFirstPage();
					this.page = this.firstPage;
					this.renderTip();
					this.show();

				} else if (guide && this.guideType == 'string') {
					this.getguideFromPath(this.guideSrc);

				} else {
					this.throwError({
						type: 'invalid guid type ',
						msg: this.guideType
					});
				}
				if (this.keyboardEvents) {
					this.referenceDocument.onkeydown = this.addKeyboardEvents;
				}
			};
			this.getguideFromPath = function (path) {
				var xhttp = new XMLHttpRequest();
				xhttp.onreadystatechange = function () {
					if (this.readyState == 4 && this.status == 200) {
						GLSPlayer.guide = JSON.parse(xhttp.responseText).steps;
						GLSPlayer.firstPage = GLSPlayer.getFirstPage();
						GLSPlayer.page = GLSPlayer.firstPage;
						GLSPlayer.renderTip();
						GLSPlayer.show();
					}
				};
				xhttp.open("GET", path, true);
				xhttp.send();
			};


		},
		navigator: function () {

			/*
			* Navigator will handle all navigation related logics.
			*/

			this.next = function () {
				if (this.canNavigate) {
					// this.page = this.getIndexwitId(this.guide[this.page].next);
					this.goto(this.guide[this.page].next);
				} else {
					this.throwError({
						type: 'last-page',
						msg: 'You are already reached Last page ' + this.page
					});
				}
			};
			this.previous = function () {
				if (this.page > this.firstPage) {
					this.goto(this.guide[this.page].id - 1);
				} else {
					this.throwError({
						type: 'first-page',
						msg: 'You are already on page ' + this.page
					});
				}
			};
			this.goto = function (id = null) {
				this.page = this.getIndexwitId(id);
				this.renderTip();
				this.canNavigate = this.guide[this.page].next;
			};
			this.skip = function () {
				console.log('Next page skipped current page : ', this.page);
			};
			this.getFirstPage = function () {
				return this.getIndexwitId(this.getFirstId());
			};
		},
		player: function () {
			this.play = function (guideWindow = false) {

				/*
				* Play guid
				*/
				if (!guideWindow) {
					this.createGuideWindow();
				} else {
					this.guideWindow = guideWindow;
					this.guideWindow.style.position = 'absolute';
					this.tipArrow = this.referenceDocument.querySelector('.gls-arrow');
					this.nextButton = this.referenceDocument.querySelector('.gls-next');
					this.previousButton = this.referenceDocument.querySelector('.gls-previous');
				}
				this.initGuide(this.guideSrc);

			};
			this.stop = function () {

				/*
				* stop guid
				*/
				this.reset();
				this.hide();
			};
			this.replay = function () {

				/*
				* replay guid
				*/
				this.reset();
				this.play(this.guide);
			};
			this.reset = function () {

				/*
				* reset guid
				*/
				this.page = this.firstPage;

			};
		},
		element: function () {

			this.getElement = function (identifier) {
				this.reference = this.getReference(identifier);
				switch (this.reference.type) {
					case "ID":
						return this.byId(this.reference.identifier);
					case "CLASS":
						return this.byClass(this.reference.identifier);
					case "XPATH":
						return this.byXpath(this.reference.identifier);
					case "JQEQ":
						this.reference.identifier = this.fromXpathFromJqueryEq(this.reference.identifier);
						return this.byXpath(this.reference.identifier);
					default:
						this.throwError({
							type: 'unsupported',
							msg: 'Not supported reference ' + identifier
						});
						break;
				}
			};

			this.byId = function (id) {
				this.currentElement = this.referenceDocument.querySelector(id) ||
					this.throwError({
						type: 'no-ref',
						msg: 'no reference found with Id ' + id
					});
				return this.currentElement;
			};
			this.byClass = function (className) {
				this.currentElement = this.referenceDocument.querySelector(className) ||
					this.throwError({
						type: 'no-ref',
						msg: 'no reference found with Class Name ' + className
					});
				return this.currentElement;

			};
			this.byXpath = function (xpath) {
				// '/html/body/div'
				this.currentElement = this.referenceDocument.evaluate(
					xpath,
					document,
					null,
					XPathResult.FIRST_ORDERED_NODE_TYPE,
					null).singleNodeValue ||
					this.throwError({
						type: 'no-ref',
						msg: 'no reference found with Xpath ' + xpath
					});
				return this.currentElement;

			};
			this.groomTo = function (selector) {
				this.guideWindow.style.top = this.getElement(selector).offsetTop + this.getElement(selector).offsetHeight + 4 + 'px';
				this.guideWindow.style.left = this.getElement(selector).getBoundingClientRect().left + (this.getElement(selector).offsetWidth / 2) - this.guideWindow.offsetWidth / 2 + 'px';
				if (this.guideWindow.offsetTop >= this.referenceDocument.body.parentElement.scrollHeight - this.guideWindow.offsetHeight) {
					this.guideWindow.style.top = this.referenceDocument.body.parentElement.scrollHeight - this.getElement(selector).offsetHeight - (this.guideWindow.offsetHeight * 2) - 8 + 'px';
					this.tipArrow.style.bottom = '-8px';
					this.tipArrow.style.borderBottom = 'unset';
					this.tipArrow.style.borderTop = '8px solid rgba(0,0,0,0.2)';
				} else {

					this.tipArrow.style.bottom = '100%';
					this.tipArrow.style.borderTop = 'unset';
					this.tipArrow.style.borderBottom = '8px solid rgba(0,0,0,0.2)';
				}

			};
			this.getReference = function (selector) {
				this.reference = {
					identifier: selector,
					type: selector.includes(".") ?
						'CLASS' :
						selector.includes("#") ?
							'ID' :
							selector.includes("/") ?
								'XPATH' :
								selector.includes(":") ?
									'JQEQ' :
									''
				}
				return this.reference;
			};
		},
		errorHandler: function () {
			this.throwError = function (error) {
				console.log(error);
			};
		},
		ui: function () {
			this.markup = `
				<div id="guide">
				<div class="gls-arrow"></div>
						<div class="guide-close" onclick="GLSPlayer.hide()">X</div>
					<div class="guide-tip" id="gls-tip">
						${this.guide[this.page].content}
					</div>
					<div class="button-wrap">
						<a class="button gls-previous" onclick="GLSPlayer.previous()">Previous</a>
						<a class="button gls-next" onclick="GLSPlayer.next()">Next</a>
					</div>
				</div>`;

			this.css = `#guide{
					background-color: rgba(0,0,0,0.2);
					border-radius: 20px;
					padding: 4px;
				}
				.guide-tip {
					padding: 4px;
					font-style: italic;
					overflow: auto;
					margin-top: 8px;
					text-align: center;
					width: 100%;
				}
				.guide-close {
						float: right;
						margin-right: 20px;
						cursor: pointer;
				}
				.button-wrap{
					text-align: right;
					padding: 2px;
				}
				.gls-arrow {
					width: 0;
					height: 0;
					border-left: 4px solid transparent;
					border-right: 4px solid transparent;
					border-bottom: 8px solid rgba(0,0,0,0.2);
					left: 50%;
					text-align: center;
					position: absolute;
					bottom: 100%;
				}
				a.button {
					margin-right: 14px;
					cursor: pointer;
				}
				a.button:hover {
					color: #88c999;
				}`;
			this.addStyle = function () {
				this.defaultStyle = this.referenceDocument.createElement('style');
				this.defaultStyle.type = 'text/css';
				if (this.defaultStyle.styleSheet) {
					this.defaultStyle.styleSheet.cssText = this.css;
				}
				else {
					this.defaultStyle.appendChild(this.referenceDocument.createTextNode(this.css));
				}
				this.referenceDocument.getElementsByTagName("head")[0].appendChild(this.defaultStyle);
			};
			this.createGuideWindow = function () {

				this.addStyle();

				this.guideWindow = this.referenceDocument.createElement('DIV');
				this.guideWindow.style.position = 'absolute';
				this.guideWindow.innerHTML = this.markup;
				this.referenceDocument.body.appendChild(this.guideWindow);
				this.tipArrow = this.referenceDocument.querySelector('.gls-arrow');
				this.nextButton = this.referenceDocument.querySelector('.gls-next');
				this.previousButton = this.referenceDocument.querySelector('.gls-previous');

			};
			this.hide = function () {
				this.guideWindow.style.visibility = 'hidden';
			};
			this.show = function () {
				this.guideWindow.style.visibility = 'visible';
			};
			this.renderTip = function () {
				this.referenceDocument.getElementById('gls-tip').innerHTML = this.guide[this.page].content;
				this.groomTo(this.guide[this.page].selector);

			}
		},
		operations: function () {
			this.getSortedNumberIds = function (tipIds) {
				return tipIds.sort(this.sortIds);
			};
			this.sortIds = function (a, b) {
				return a - b;
			};
			Array.prototype.getLastItem = function () {
				return this[this.length - 1];
			};
			this.getFirstId = function () {

				return (this.getSortedNumberIds(
					this.guide.map(
						function (tip) {
							return tip.id;
						})
				))[0];
			};
			this.getIndexwitId = function (id) {
				for (var index = 0; index < this.guide.length; index++) {
					if (this.guide[index].id == id) {
						return index;
					} else if (index == this.guide.length) {
						return -1;
					}
				}
			};
			this.fromXpathFromJqueryEq = function (eqSelector) {
				/*
				* + 1 to match the index jquery eq starts with index 0
				* supports negative values 
				*/
				eqSelector = '//' + eqSelector.split(':')[0] + '[' + (parseInt(eqSelector.match(/\d+/g).map(Number)[0]) + 1) + ']';
				return eqSelector;
			};
			this.windowResize = function () {
				this.renderTip();
			}
		},
		keyboard: function () {
			this.addKeyboardEvents = function (event) {
				if (GLSPlayer.referenceDocument.all) {
					if (!event) {
						event = GLSPlayer.referenceDocument.window.event;
						event['which'] = event.keyCode;
					}
				}
				else if (event.which) {
					event = event;
				}
				switch (event.which) {
					case 39: // rigth arrow for next tip
						GLSPlayer.next();
						break;
					case 37: // left arrow for previous tip
						GLSPlayer.previous();
						break;
				}
			};
		}
	};
	window.GLSPlayer = new GLS();
})();



/*
IMPLEMENTATION
*/
GLSPlayer.init({ replay: 'FALSE' }, [{
	"id": "1",
	"content": "tip on first div",
	"selector": "#id_1",
	"next": "2"
},
{
	"id": "3",
	"content": "tip on third div.",
	"selector": "div:eq(2)",
	"next": null,
},
{
	"id": "2",
	"content": "tip on second div",
	"selector": ".myClass2",
	"next": "3",
}], document);
