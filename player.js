(function () {
	"use strict";
	var GLS = function () {

		/* 
		* Set default settings
		*/

		this.page = 1;
		this.lastPage = 10;
		this.firstPage = 1;
		this.replay = 'TRUE';
		this.referenceDocument = document;
		this.currentElement = null;
		this.guideSrc = null;
		this.guideType = null;
		this.guide = {
			title: 'DEFAULT TITLE',
			content: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.'

		}
		this.guideWindow = null;
	};

	GLS.prototype = {
		init: function (settings = {}, guid, referenceDocument) {

			/*
			* Init methrd to initilaze GLS player.
			* Override settings.
			*/

			this.replay = settings.replay || this.replay;
			this.page = settings.page || this.page;
			this.referenceDocument = referenceDocument || this.referenceDocument;

			this.navigator.apply(this, []);
			this.element.apply(this, []);
			this.errorHandler.apply(this, []);
			this.player.apply(this, []);
			this.ui.apply(this, []);
		},
		navigator: function () {

			/*
			* Navigator will handle all navigation related logics.
			*/

			this.next = function () {
				if (this.page < this.lastPage) {
					this.page++;
					this.goto();
				} else {
					this.throwError({ type: 'last-page', msg: 'You are already reached Last page ' + this.page });
				}
			};
			this.previous = function () {
				if (this.page > 1) {
					this.page--;
					this.goto();
				} else {
					this.throwError({ type: 'first-page', msg: 'You are already on page ' + this.page });
				}
			};
			this.goto = function (page = null) {
				this.page = page || this.page;
				console.log('Got to page: ', this.page);
			};
			this.skip = function () {
				console.log('Next page skipped current page : ', this.page);
			};
		},
		player: function () {
			this.play = function (guide, guideWindow = false) {

				/*
				* Play guid
				*/

				if (!guideWindow) {
					this.createGuideWindow();
				} else {
					this.guideWindow = guideWindow;
				}

				this.guideType = typeof guide;
				this.guideSrc = guide;

				if (guide && this.guideType == 'object') {
					this.guide = guide;
				} else if (guide && this.guideType == 'string') {
					// get json from guideSrc
				} else {
					this.throwError({ type: 'invalid guid type ', msg: this.guideType });
				}
				this.show();
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
					default:
						this.throwError({ type: 'unsupported', msg: 'Not supported reference ' + identifier });
						break;
				}
			};

			this.byId = function (id) {
				this.currentElement = this.referenceDocument.querySelector(id) || this.throwError({ type: 'no-ref', msg: 'no reference found with Id ' + id });
				return this.currentElement;
			};
			this.byClass = function (className) {
				this.currentElement = this.referenceDocument.querySelector(className) || this.throwError({ type: 'no-ref', msg: 'no reference found with Class Name ' + className });
				return this.currentElement;

			};
			this.byXpath = function (xpath) {
				// '/html/body/div'
				this.currentElement = this.referenceDocument.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue ||
					this.throwError({ type: 'no-ref', msg: 'no reference found with Xpath ' + xpath });
				return this.currentElement;

			};
			this.groom = function (element) {
				this.guideWindow.style.left = '20px';
			};
			this.getReference = function (selector) {
				this.reference = {
					identifier: selector,
					type: selector.includes(".") ? 'CLASS' : selector.includes("#") ? 'ID' : selector.includes(":") ? 'XPATH' : ''
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
			this.markup =
				`<div id="guide">
						<div class="guide-close" onclick="GLSPlayer.hide()">X</div>
					<div class="guide-tip">
						${this.guide.content}
					</div>
					<div class="button-wrap">
						<a class="button" onclick="GLSPlayer.previous()">Previous</a>
						<a class="button" onclick="GLSPlayer.next()">Next</a>
					</div>
				</div>`;

			this.css = `#guide{
					background-color: rgba(0,0,0,0.2);
					position: absolute;
					border-radius: 50px;
					padding: 4px;
				}
				.guide-title{
					text-align: center;
					padding: 4px;
					border-bottom: 1px solid bisque;
				}
				.guide-tip {
					padding: 4px;
					text-align: unset;
					font-family: none;
					font-style: italic;
					overflow: auto;
					display: block;
					margin-top: 8px
				}
				.guide-close {
						float: right;
						margin-right: 20px;
						cursor: pointer;
						display:inline-block;
				
				}
				.button-wrap{
				text-align: right;
					padding: 2px;
				}
				
				.button {
					margin-right: 18px;
					cursor: pointer;
				}
				.button:hover {
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
				this.guideWindow.innerHTML = this.markup;
				this.referenceDocument.body.appendChild(this.guideWindow);
			};
			this.hide = function () {
				this.guideWindow.style.visibility = 'hidden';
			};
			this.show = function () {
				this.guideWindow.style.visibility = 'visible';
			};
		}
	};
	window.GLSPlayer = new GLS();
})();



/*
IMPLEMENTATION
*/
GLSPlayer.init({ replay: 'FALSE' }, document);
